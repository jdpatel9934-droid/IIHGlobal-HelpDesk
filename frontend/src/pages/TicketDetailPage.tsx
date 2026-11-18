import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useParams } from "react-router-dom";
import { z } from "zod";
import { api, ApiError } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { PriorityBadge, StatusBadge } from "../components/Badges";
import { ErrorMessage, InlineLoading } from "../components/States";
import type { Ticket, TicketStatus } from "../types";

const commentSchema = z.object({
  text: z.string().trim().min(1, "Write a comment first").max(5000),
});

type CommentValues = z.infer<typeof commentSchema>;

export function TicketDetailPage() {
  const { id = "" } = useParams();
  const { user } = useAuth();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [updating, setUpdating] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const canManage = user?.role === "agent" || user?.role === "admin";
  const {
    register,
    handleSubmit,
    reset,
    setError: setFormError,
    formState: { errors, isSubmitting },
  } = useForm<CommentValues>({
    resolver: zodResolver(commentSchema),
    defaultValues: { text: "" },
  });

  const loadTicket = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setTicket(await api<Ticket>(`/tickets/${encodeURIComponent(id)}`));
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : "Could not load this ticket. Check your connection and try again.",
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadTicket();
  }, [loadTicket, refresh]);

  async function addComment(values: CommentValues) {
    setActionError("");
    try {
      const updated = await api<Ticket>(`/tickets/${encodeURIComponent(id)}/comments`, {
        method: "POST",
        body: JSON.stringify(values),
      });
      setTicket(updated);
      reset();
    } catch (cause) {
      setFormError("root", {
        message: cause instanceof Error ? cause.message : "Unable to add comment",
      });
    }
  }

  async function assignToMe() {
    setUpdating(true);
    setActionError("");
    try {
      setTicket(
        await api<Ticket>(`/tickets/${encodeURIComponent(id)}/assign-to-me`, {
          method: "PATCH",
        }),
      );
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : "Unable to assign ticket");
    } finally {
      setUpdating(false);
    }
  }

  async function changeStatus(status: TicketStatus) {
    setUpdating(true);
    setActionError("");
    try {
      setTicket(
        await api<Ticket>(`/tickets/${encodeURIComponent(id)}/status`, {
          method: "PATCH",
          body: JSON.stringify({ status }),
        }),
      );
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : "Unable to update status");
    } finally {
      setUpdating(false);
    }
  }

  if (loading) return <InlineLoading label="Loading ticket…" />;
  if (error || !ticket) {
    return (
      <div className="space-y-4">
        <Link className="text-sm font-medium text-indigo-700 hover:text-indigo-800" to="/dashboard">
          ← Back to tickets
        </Link>
        <ErrorMessage
          message={error || "Ticket not found"}
          onRetry={() => setRefresh((value) => value + 1)}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        className="mb-5 inline-flex text-sm font-medium text-indigo-700 hover:text-indigo-800"
        to="/dashboard"
      >
        ← Back to tickets
      </Link>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Ticket · {ticket._id.slice(-8).toUpperCase()}
            </p>
            <h1 className="break-words text-2xl font-bold tracking-tight text-slate-900">
              {ticket.title}
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Submitted by {ticket.createdBy?.email ?? "Unknown"} ·{" "}
              {new Date(ticket.createdAt).toLocaleString()}
            </p>
          </div>
          <div className="flex gap-2">
            <PriorityBadge priority={ticket.priority} />
            <StatusBadge status={ticket.status} />
          </div>
        </div>

        <div className="my-6 border-t border-slate-100" />
        <h2 className="mb-2 text-sm font-semibold text-slate-800">Description</h2>
        <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">
          {ticket.description}
        </p>

        <dl className="mt-7 grid gap-5 border-t border-slate-100 pt-5 sm:grid-cols-3">
          <div>
            <dt className="text-xs font-medium text-slate-400">Created by</dt>
            <dd className="mt-1 text-sm text-slate-700">
              {ticket.createdBy?.email ?? "Unknown"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-400">Assigned to</dt>
            <dd className="mt-1 text-sm text-slate-700">
              {ticket.assignedTo?.email ?? "Unassigned"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-400">Last updated</dt>
            <dd className="mt-1 text-sm text-slate-700">
              {new Date(ticket.updatedAt).toLocaleString()}
            </dd>
          </div>
        </dl>

        {canManage ? (
          <div className="mt-6 flex flex-wrap items-center gap-3 rounded-lg bg-slate-50 p-4">
            <button
              className="button-primary"
              disabled={updating || ticket.assignedTo?._id === user?.id}
              onClick={() => void assignToMe()}
            >
              {ticket.assignedTo?._id === user?.id
                ? "Assigned to you"
                : updating
                  ? "Updating…"
                  : "Assign to me"}
            </button>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-600">
              Status
              <select
                className="field-input !w-auto min-w-36"
                disabled={updating}
                onChange={(event) =>
                  void changeStatus(event.target.value as TicketStatus)
                }
                value={ticket.status}
              >
                {(["open", "in_progress", "resolved", "closed"] satisfies TicketStatus[]).map(
                  (status) => (
                    <option key={status} value={status}>
                      {status.replace("_", " ")}
                    </option>
                  ),
                )}
              </select>
            </label>
            {actionError && <p className="basis-full text-sm text-rose-700">{actionError}</p>}
          </div>
        ) : (
          <p className="mt-6 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-500">
            Only support agent can change the status of this ticket.
          </p>
        )}
      </section>

      <section className="mt-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Conversation</h2>
            <p className="mt-1 text-sm text-slate-500">
              {ticket.comments.length}{" "}
              {ticket.comments.length === 1 ? "comment" : "comments"}
            </p>
          </div>
        </div>
        {ticket.comments.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
            No comments yet. Start the conversation below.
          </div>
        ) : (
          <div className="space-y-4">
            {ticket.comments.map((comment) => (
              <article className="flex gap-3" key={comment._id}>
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-semibold uppercase text-indigo-700">
                  {(comment.author?.email?.[0] ?? "?").toUpperCase()}
                </span>
                <div className="min-w-0 flex-1 rounded-xl bg-slate-50 px-4 py-3">
                  <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-sm font-semibold text-slate-800">
                      {comment.author?.email ?? "Unknown user"}
                    </span>
                    <span className="rounded bg-white px-1.5 py-0.5 text-[10px] font-medium capitalize text-slate-500 ring-1 ring-slate-200">
                      {comment.author?.role}
                    </span>
                    <time className="text-xs text-slate-400">
                      {new Date(comment.createdAt).toLocaleString()}
                    </time>
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">
                    {comment.text}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
        <form className="mt-6 border-t border-slate-100 pt-5" onSubmit={handleSubmit(addComment)}>
          <label className="field-label">
            Add a comment
            <textarea
              className="field-input min-h-24 resize-y"
              maxLength={5000}
              placeholder="Write a reply…"
              {...register("text")}
            />
            {errors.text && <span className="field-error">{errors.text.message}</span>}
            {errors.root && <span className="field-error">{errors.root.message}</span>}
          </label>
          <div className="mt-3 flex justify-end">
            <button className="button-primary" disabled={isSubmitting}>
              {isSubmitting ? "Sending…" : "Send comment"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
