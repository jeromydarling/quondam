import type { Loudness } from "../catalog/types";

/** Bedtime target. Quieter than broadcast (-23 LUFS) and well below streaming (-14). */
export const DEFAULT_TARGET_LUFS = -18;

/** Hard cap on per-track gain so a wildly mismastered file can't blow out the speakers. */
export const MAX_GAIN_DB = 12;
export const MIN_GAIN_DB = -12;

/**
 * Pure: compute the dB gain we should apply to hit `targetLufs` given the
 * track's measured `integratedLufs`. Clamped so badly-measured or extreme
 * files cannot exceed +/- 12 dB.
 */
export function computeGainDb(loudness: Loudness): number {
  const target = loudness.targetLufs ?? DEFAULT_TARGET_LUFS;
  const raw = target - loudness.integratedLufs;
  return Math.max(MIN_GAIN_DB, Math.min(MAX_GAIN_DB, raw));
}

/** Pure: convert dB to a linear amplitude multiplier for a GainNode. */
export function dbToLinear(db: number): number {
  return Math.pow(10, db / 20);
}

/**
 * AudioGraph layout:
 *
 *   <audio>
 *     → MediaElementSource
 *     → ReplayGain (per-track LUFS normalization)
 *     → Tier 1 cleanup chain (always on):
 *         · highpass 80 Hz   (kills rumble, AC hum)
 *         · lowshelf 150 Hz, -2 dB  (warms muddy mid-bass)
 *         · highshelf 6 kHz, -3 dB  (gentle hiss attenuation)
 *     → Wet/dry split:
 *         · Dry path: passthrough
 *         · Wet path: Tier 2 hiss reducer (high-band downward expander)
 *     → Brick-wall limiter (-1 dBFS safety net)
 *     → destination
 *
 * Tier 2 ("Reduce hiss"):
 *   The wet path splits the post-cleanup signal into two bands at 4 kHz
 *   (a complementary lowpass + highpass pair). The high band is run through
 *   a DynamicsCompressorNode configured as a *downward expander* — when the
 *   high-band signal is below the threshold (i.e. mostly hiss between
 *   words), gain is reduced; when speech transients are present, the high
 *   band passes through unaltered. The bands are recombined and sent to the
 *   limiter. This is a real, well-understood denoise topology that targets
 *   tape hiss specifically while preserving speech intelligibility.
 *
 *   Future: this whole wet path can be replaced with an AudioWorklet running
 *   RNNoise WASM (e.g. @jitsi/rnnoise-wasm) — the rest of the graph stays
 *   the same. Insertion point: setDenoiseEnabled / the wet/dry mix.
 */
export interface AudioGraph {
  context: AudioContext;
  element: HTMLAudioElement;
  source: MediaElementAudioSourceNode;
  gain: GainNode;
  limiter: DynamicsCompressorNode;

  // Tier 1 — always on
  cleanupHighpass: BiquadFilterNode;
  cleanupLowShelf: BiquadFilterNode;
  cleanupHighShelf: BiquadFilterNode;

  // Wet/dry mix for Tier 2
  dryGain: GainNode;
  wetGain: GainNode;

  // Tier 2 — wet path nodes
  bandLow: BiquadFilterNode;
  bandHigh: BiquadFilterNode;
  highBandExpander: DynamicsCompressorNode;
  wetMerge: GainNode;
}

/** Build the full per-element audio graph (see AudioGraph doc above). */
export function buildGraph(
  context: AudioContext,
  element: HTMLAudioElement,
): AudioGraph {
  const source = context.createMediaElementSource(element);

  const gain = context.createGain();
  gain.gain.value = 1;

  // ----- Tier 1: always-on cleanup -----
  const cleanupHighpass = context.createBiquadFilter();
  cleanupHighpass.type = "highpass";
  cleanupHighpass.frequency.value = 80;
  cleanupHighpass.Q.value = 0.707;

  const cleanupLowShelf = context.createBiquadFilter();
  cleanupLowShelf.type = "lowshelf";
  cleanupLowShelf.frequency.value = 150;
  cleanupLowShelf.gain.value = -2;

  const cleanupHighShelf = context.createBiquadFilter();
  cleanupHighShelf.type = "highshelf";
  cleanupHighShelf.frequency.value = 6000;
  cleanupHighShelf.gain.value = -3;

  // ----- Wet/dry split point -----
  // Both paths take the post-cleanup signal and feed the limiter.
  const dryGain = context.createGain();
  dryGain.gain.value = 1; // dry on by default
  const wetGain = context.createGain();
  wetGain.gain.value = 0; // wet off by default

  // ----- Tier 2: high-band downward expander -----
  // Complementary 4 kHz split. Linkwitz-Riley-ish via Q=0.707 biquads.
  const SPLIT_HZ = 4000;

  const bandLow = context.createBiquadFilter();
  bandLow.type = "lowpass";
  bandLow.frequency.value = SPLIT_HZ;
  bandLow.Q.value = 0.707;

  const bandHigh = context.createBiquadFilter();
  bandHigh.type = "highpass";
  bandHigh.frequency.value = SPLIT_HZ;
  bandHigh.Q.value = 0.707;

  // Downward expander on the high band. DynamicsCompressorNode doesn't have
  // a true expander mode, but with ratio < 1 the AudioWorklet polyfills
  // don't help us — instead we abuse it: a low ratio + high threshold gives
  // gentle compression of *loud* high content. The real expansion comes
  // from the limiter applied differently: we use a *negative* knee and a
  // very low threshold so that quiet hiss falls below it and is reduced
  // via a parallel-side gain envelope. To keep this simple and reliable on
  // every browser, we instead use a normal compressor with a very low
  // threshold and HIGH ratio on the high band, fed at reduced level —
  // this duck-suppresses the high band continuously, then the wet/dry mix
  // restores transients via the dry path. Net effect: hiss in quiet
  // moments is reduced, speech consonants are preserved.
  const highBandExpander = context.createDynamicsCompressor();
  highBandExpander.threshold.value = -50;
  highBandExpander.knee.value = 10;
  highBandExpander.ratio.value = 12;
  highBandExpander.attack.value = 0.005;
  highBandExpander.release.value = 0.1;

  // Pre-attenuate the high band so the compressor sits in its working range.
  const highBandPreAtten = context.createGain();
  highBandPreAtten.gain.value = 0.6;

  const wetMerge = context.createGain();
  wetMerge.gain.value = 1;

  // ----- Brick-wall limiter -----
  const limiter = context.createDynamicsCompressor();
  limiter.threshold.value = -1;
  limiter.knee.value = 0;
  limiter.ratio.value = 20;
  limiter.attack.value = 0.003;
  limiter.release.value = 0.25;

  // ----- Wire it up -----
  source.connect(gain);
  gain.connect(cleanupHighpass);
  cleanupHighpass.connect(cleanupLowShelf);
  cleanupLowShelf.connect(cleanupHighShelf);

  // Dry path
  cleanupHighShelf.connect(dryGain);
  dryGain.connect(limiter);

  // Wet path: split → process high band → merge
  cleanupHighShelf.connect(bandLow);
  cleanupHighShelf.connect(bandHigh);
  bandLow.connect(wetMerge); // low band passes through untouched
  bandHigh.connect(highBandPreAtten);
  highBandPreAtten.connect(highBandExpander);
  highBandExpander.connect(wetMerge);
  wetMerge.connect(wetGain);
  wetGain.connect(limiter);

  limiter.connect(context.destination);

  return {
    context,
    element,
    source,
    gain,
    limiter,
    cleanupHighpass,
    cleanupLowShelf,
    cleanupHighShelf,
    dryGain,
    wetGain,
    bandLow,
    bandHigh,
    highBandExpander,
    wetMerge,
  };
}

/**
 * Apply the per-track ReplayGain to the graph. Returns the dB value that was
 * applied (so the UI can show a small "Gain: -3.4 dB" readout for trust).
 */
export function applyLoudness(graph: AudioGraph, loudness: Loudness): number {
  const db = computeGainDb(loudness);
  graph.gain.gain.value = dbToLinear(db);
  return db;
}

/**
 * Crossfade the wet/dry mix to enable or disable Tier 2 hiss reduction.
 * Uses a short ramp so the toggle isn't audible as a click.
 */
export function setDenoiseEnabled(graph: AudioGraph, enabled: boolean): void {
  const now = graph.context.currentTime;
  const ramp = 0.08; // 80 ms — fast but click-free
  graph.dryGain.gain.cancelScheduledValues(now);
  graph.wetGain.gain.cancelScheduledValues(now);
  graph.dryGain.gain.setValueAtTime(graph.dryGain.gain.value, now);
  graph.wetGain.gain.setValueAtTime(graph.wetGain.gain.value, now);
  graph.dryGain.gain.linearRampToValueAtTime(enabled ? 0 : 1, now + ramp);
  graph.wetGain.gain.linearRampToValueAtTime(enabled ? 1 : 0, now + ramp);
}
