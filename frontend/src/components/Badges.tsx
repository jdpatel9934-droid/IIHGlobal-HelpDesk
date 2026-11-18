import type { TicketPriority, TicketStatus } from "../types";

const statusStyles: Record<TicketStatus, string> = {
  open: "bg-sky-50 text-sky-700 ring-sky-200",
  in_progress: "bg-amber-50 text-amber-700 ring-amber-200",
  resolved: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  closed: "bg-slate-100 text-slate-600 ring-slate-200",
};

const priorityStyles: Record<TicketPriority, string> = {
  low: "bg-slate-100 text-slate-600 ring-slate-200",
  medium: "bg-violet-50 text-violet-700 ring-violet-200",
  high: "bg-rose-50 text-rose-700 ring-rose-200",
};

function formatLabel(value: string) {
  return value.replace("_", " ");
}

export function StatusBadge({ status }: { status: TicketStatus }) {
  return (
    <span className={`badge ${statusStyles[status]}`}>
      {formatLabel(status)}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: TicketPriority }) {
  return (
    <span className={`badge ${priorityStyles[priority]}`}>{priority}</span>
  );
}
