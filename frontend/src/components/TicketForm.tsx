import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { api } from "../api/client";
import type { Ticket, TicketPriority } from "../types";

const ticketSchema = z.object({
  title: z.string().trim().min(5, "Use at least 5 characters").max(120),
  description: z.string().trim().min(1, "Description is required").max(20000),
  priority: z.enum(["low", "medium", "high"]),
});

type TicketValues = z.infer<typeof ticketSchema>;

export function TicketForm({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (ticket: Ticket) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<TicketValues>({
    resolver: zodResolver(ticketSchema),
    defaultValues: { title: "", description: "", priority: "medium" },
  });

  async function submit(values: TicketValues) {
    try {
      const ticket = await api<Ticket>("/tickets", {
        method: "POST",
        body: JSON.stringify(values),
      });
      onCreated(ticket);
    } catch (error) {
      setError("root", {
        message: error instanceof Error ? error.message : "Unable to create ticket",
      });
    }
  }

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-slate-950/30 p-4">
      <div
        aria-labelledby="create-ticket-title"
        aria-modal="true"
        className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl"
        role="dialog"
      >
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 id="create-ticket-title" className="text-lg font-bold text-slate-900">
              Create a ticket
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Tell us what you need help with.
            </p>
          </div>
          <button
            aria-label="Close"
            className="rounded-lg px-2 py-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            onClick={onClose}
            type="button"
          >
            ✕
          </button>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit(submit)}>
          <label className="field-label">
            Title
            <input
              className="field-input"
              maxLength={120}
              placeholder="A short summary of the issue"
              {...register("title")}
            />
            {errors.title && <span className="field-error">{errors.title.message}</span>}
          </label>
          <label className="field-label">
            Description
            <textarea
              className="field-input min-h-32 resize-y"
              maxLength={20000}
              placeholder="Add the details someone will need to help…"
              {...register("description")}
            />
            {errors.description && (
              <span className="field-error">{errors.description.message}</span>
            )}
          </label>
          <label className="field-label">
            Priority
            <select className="field-input" {...register("priority")}>
              {(["low", "medium", "high"] satisfies TicketPriority[]).map((value) => (
                <option key={value} value={value}>
                  {value[0].toUpperCase() + value.slice(1)}
                </option>
              ))}
            </select>
          </label>
          {errors.root && <p className="field-error">{errors.root.message}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <button className="button-secondary" onClick={onClose} type="button">
              Cancel
            </button>
            <button className="button-primary" disabled={isSubmitting} type="submit">
              {isSubmitting ? "Creating…" : "Create ticket"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
