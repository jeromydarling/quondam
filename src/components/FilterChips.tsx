import {
  ALL_AGE_BANDS,
  ALL_LENGTH_BUCKETS,
  ALL_MOODS,
  LENGTH_BUCKET_LABEL,
  type AgeBand,
  type LengthBucket,
  type Mood,
} from "../catalog/types";
import { toggle, type FilterCriteria } from "../catalog/filter";

interface Props {
  value: FilterCriteria;
  onChange: (next: FilterCriteria) => void;
}

export default function FilterChips({ value, onChange }: Props) {
  return (
    <div className="space-y-4">
      <ChipRow label="Age">
        {ALL_AGE_BANDS.map((b) => (
          <Chip
            key={b}
            on={value.ageBands.includes(b)}
            onClick={() =>
              onChange({ ...value, ageBands: toggle<AgeBand>(value.ageBands, b) })
            }
          >
            {b}
          </Chip>
        ))}
      </ChipRow>
      <ChipRow label="Length">
        {ALL_LENGTH_BUCKETS.map((l) => (
          <Chip
            key={l}
            on={value.lengthBuckets.includes(l)}
            onClick={() =>
              onChange({
                ...value,
                lengthBuckets: toggle<LengthBucket>(value.lengthBuckets, l),
              })
            }
          >
            {LENGTH_BUCKET_LABEL[l]}
          </Chip>
        ))}
      </ChipRow>
      <ChipRow label="Mood">
        {ALL_MOODS.map((m) => (
          <Chip
            key={m}
            on={value.moods.includes(m)}
            onClick={() =>
              onChange({ ...value, moods: toggle<Mood>(value.moods, m) })
            }
          >
            {m}
          </Chip>
        ))}
      </ChipRow>
    </div>
  );
}

function ChipRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-cream-500 mb-2">
        {label}
      </div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Chip({
  on,
  onClick,
  children,
}: {
  on: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className={on ? "chip-on" : "chip"}
      onClick={onClick}
      aria-pressed={on}
    >
      {children}
    </button>
  );
}
