import React from "react";

const STEPS = [
  { key: "pending", label: "Confirmed" },
  { key: "provider_assigned", label: "Provider Assigned" },
  { key: "on_the_way", label: "On the Way" },
  { key: "arrived", label: "Arrived" },
  { key: "in_progress", label: "In Progress" },
  { key: "completed", label: "Completed" },
];

export default function StatusStepper({ status }) {
  const idx = STEPS.findIndex((s) => s.key === status);
  return (
    <div className="flex flex-col gap-6 relative pl-1" data-testid="status-stepper">
      <div className="absolute left-[15px] top-3 bottom-3 w-[2px] bg-gray-200" />
      {STEPS.map((s, i) => {
        const done = i < idx;
        const cur = i === idx;
        return (
          <div key={s.key} className={`relative z-10 flex gap-4 items-center ${i > idx ? "opacity-40" : ""}`} data-testid={`stepper-${s.key}`}>
            <div
              className={`w-8 h-8 rounded-full border-[6px] border-white flex items-center justify-center ${
                done ? "bg-success" : cur ? "bg-accent animate-pulse ring-2 ring-accent/30" : "bg-gray-300"
              }`}
            >
              {done && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>}
            </div>
            <div className="flex-1">
              <div className={`font-semibold text-sm ${cur ? "text-accent-dark" : done ? "text-success" : "text-slate"}`}>{s.label}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
