import { useState } from "react";

type AddNodeProps = {
  data: {
    onCreate?: (outcome: string) => void;
    loading?: boolean;
  };
};

export function AddNode({ data }: AddNodeProps) {
  const [value, setValue] = useState("");

  const submit = () => {
    const text = value.trim();
    if (!text || !data.onCreate) return;
    data.onCreate(text);
    setValue("");
  };

  return (
    <div className="min-w-[320px] rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-sm">
      <p className="mb-2 text-xs font-medium uppercase tracking-widest text-zinc-400">
        What happened?
      </p>
      <div className="flex items-center gap-2">
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          placeholder="e.g. The company went bankrupt"
          className="flex-1 bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400"
        />
        <button
          type="button"
          onClick={submit}
          disabled={!value.trim()}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-white transition-transform hover:scale-105 active:scale-95 disabled:opacity-30"
          aria-label="Generate timeline"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M6 1v10M6 1L2 5M6 1l4 4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}