import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface QuondamState {
  /** Story IDs the parent has favorited. */
  favorites: string[];
  /** Story IDs in tonight's shortlist, in order. */
  tonight: string[];
  /** Last playback position per story ID, in seconds. */
  resumeMap: Record<string, number>;
  /**
   * Per-story user override of the "Reduce hiss" toggle. When a story has
   * `restoration.suggestDenoise: true` we auto-engage Tier 2 denoise; the
   * user can flip it off and we remember that here. Absent = follow catalog.
   */
  denoiseOverrides: Record<string, boolean>;
  /**
   * Has the user dismissed the "Welcome to quondam / brought to you by
   * CROS Schola" card on the Library? One-shot, device-local until
   * Lovable moves it to the user record.
   */
  welcomeDismissed: boolean;

  toggleFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;

  addToTonight: (id: string) => void;
  removeFromTonight: (id: string) => void;
  reorderTonight: (from: number, to: number) => void;
  isInTonight: (id: string) => boolean;

  setResume: (id: string, sec: number) => void;
  clearResume: (id: string) => void;

  setDenoiseOverride: (id: string, on: boolean) => void;
  clearDenoiseOverride: (id: string) => void;

  dismissWelcome: () => void;
  resetWelcome: () => void;
}

export const useStore = create<QuondamState>()(
  persist(
    (set, get) => ({
      favorites: [],
      tonight: [],
      resumeMap: {},
      denoiseOverrides: {},
      welcomeDismissed: false,

      toggleFavorite: (id) =>
        set((s) => ({
          favorites: s.favorites.includes(id)
            ? s.favorites.filter((x) => x !== id)
            : [...s.favorites, id],
        })),
      isFavorite: (id) => get().favorites.includes(id),

      addToTonight: (id) =>
        set((s) =>
          s.tonight.includes(id) ? s : { tonight: [...s.tonight, id] },
        ),
      removeFromTonight: (id) =>
        set((s) => ({ tonight: s.tonight.filter((x) => x !== id) })),
      reorderTonight: (from, to) =>
        set((s) => {
          if (
            from === to ||
            from < 0 ||
            to < 0 ||
            from >= s.tonight.length ||
            to >= s.tonight.length
          )
            return s;
          const next = s.tonight.slice();
          const [moved] = next.splice(from, 1);
          next.splice(to, 0, moved);
          return { tonight: next };
        }),
      isInTonight: (id) => get().tonight.includes(id),

      setResume: (id, sec) =>
        set((s) => {
          // Drop tiny positions and end-of-track positions; they're not useful.
          if (sec < 5) {
            const { [id]: _drop, ...rest } = s.resumeMap;
            return { resumeMap: rest };
          }
          return { resumeMap: { ...s.resumeMap, [id]: sec } };
        }),
      clearResume: (id) =>
        set((s) => {
          const { [id]: _drop, ...rest } = s.resumeMap;
          return { resumeMap: rest };
        }),

      setDenoiseOverride: (id, on) =>
        set((s) => ({
          denoiseOverrides: { ...s.denoiseOverrides, [id]: on },
        })),
      clearDenoiseOverride: (id) =>
        set((s) => {
          const { [id]: _drop, ...rest } = s.denoiseOverrides;
          return { denoiseOverrides: rest };
        }),

      dismissWelcome: () => set({ welcomeDismissed: true }),
      resetWelcome: () => set({ welcomeDismissed: false }),
    }),
    {
      name: "quondam-state-v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        favorites: s.favorites,
        tonight: s.tonight,
        resumeMap: s.resumeMap,
        denoiseOverrides: s.denoiseOverrides,
        welcomeDismissed: s.welcomeDismissed,
      }),
    },
  ),
);
