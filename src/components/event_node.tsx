import { useEffect, useState } from "react";
import { Handle, Position } from "@xyflow/react";

type EventNodeProps = {
  data: {
    label: string;
    index: number;
    total: number;
  };
};

export function EventNode({ data }: EventNodeProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const isOutcome = data.index === data.total - 1;

  return (
    <div
      style={{ transitionDelay: `${data.index * 40}ms` }}
      className={[
        "min-w-[260px] rounded-2xl border px-4 py-3",
        "transition-all duration-300 ease-out",
        mounted ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
        isOutcome
          ? "border-zinc-900 bg-zinc-900 shadow-lg"
          : "border-zinc-200 bg-white shadow-sm",
      ].join(" ")}
    >
      {data.index > 0 && (
        <Handle type="target" position={Position.Top} className="!border-zinc-300 !bg-white" />
      )}
      <div className="flex items-start gap-3">
        <span
          className={[
            "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold",
            isOutcome ? "bg-white text-zinc-900" : "bg-zinc-100 text-zinc-500",
          ].join(" ")}
        >
          {data.index + 1}
        </span>
        <div>
          <p className={["text-sm font-medium leading-snug", isOutcome ? "text-white" : "text-zinc-900"].join(" ")}>
            {data.label}
          </p>
          <p className="mt-0.5 text-xs text-zinc-400">
            {isOutcome ? "outcome" : `step ${data.index + 1}`}
          </p>
        </div>
      </div>
      {data.index < data.total - 1 && (
        <Handle type="source" position={Position.Bottom} className="!border-zinc-300 !bg-white" />
      )}
    </div>
  );
}