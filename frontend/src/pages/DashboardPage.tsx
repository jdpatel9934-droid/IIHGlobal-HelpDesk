import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, ApiError } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { PriorityBadge, StatusBadge } from "../components/Badges";
import { ErrorMessage, InlineLoading } from "../components/States";
import { TicketForm } from "../components/TicketForm";
import type { TicketPage, TicketPriority, TicketStatus } from "../types";

const pageSize = 10;

export function DashboardPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<TicketPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [refresh, setRefresh] = useState(0);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams({
      page: String(page),
      limit: String(pageSize),
    });
    if (search.trim()) params.set("search", search.trim());
    if (status) params.set("status", status);
    if (priority) params.set("priority", priority);
    try {
      setData(await api<TicketPage>(`/tickets?${params.toString()}`));
    } catch (cause) {
      const message =
        cause instanceof ApiError
          ? cause.message
          : "Could not load tickets. Check your connection and try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [page, search, status, priority]);

  useEffect(() => {
    const timeout = window.setTimeout(() => void fetchTickets(), 250);
    return () => window.clearTimeout(timeout);
  }, [fetchTickets, refresh]);

  function resetPage(action: () => void) {
    setPage(1);
    action();
  }

  const roleHeading =
    user?.role === "employee" ? "Your support tickets" : "Support inbox";

  return (
    <>
      <section className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-1 text-sm font-medium text-slate-500">
            {new Intl.DateTimeFormat("en", {
              weekday: "long",
              month: "long",
              day: "numeric",
            }).format(new Date())}
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {roleHeading}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {user?.role === "employee"
              ? "Follow up on the requests you have submitted."
              : "Review and respond to requests from across your team."}
          </p>
        </div>
        <button className="button-primary" onClick={() => setShowForm(true)}>
          <span className="mr-1.5 text-base leading-none">+</span> New ticket
        </button>
      </section>

      <section className="mb-5 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[minmax(220px,1fr)_180px_160px]">
        <label className="sr-only" htmlFor="ticket-search">
          Search tickets by title
        </label>
        <div className="relative">
          <span aria-hidden="true" className="absolute left-3 top-2.5 text-slate-400">
            ⌕
          </span>
          <input
            className="field-input !pl-9"
            id="ticket-search"
            onChange={(event) => resetPage(() => setSearch(event.target.value))}
            placeholder="Search by ticket title…"
            value={search}
          />
        </div>
        <label>
          <span className="sr-only">Filter by status</span>
          <select
            className="field-input"
            onChange={(event) => resetPage(() => setStatus(event.target.value))}
            value={status}
          >
            <option value="">All statuses</option>
            {(["open", "in_progress", "resolved", "closed"] satisfies TicketStatus[]).map(
              (value) => (
                <option key={value} value={value}>
                  {value.replace("_", " ")}
                </option>
              ),
            )}
          </select>
        </label>
        <label>
          <span className="sr-only">Filter by priority</span>
          <select
            className="field-input"
            onChange={(event) => resetPage(() => setPriority(event.target.value))}
            value={priority}
          >
            <option value="">All priorities</option>
            {(["low", "medium", "high"] satisfies TicketPriority[]).map((value) => (
              <option key={value} value={value}>
                {value[0].toUpperCase() + value.slice(1)}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-md font-bold text-slate-800">All tickets</h2>
          <span className="text-xs text-slate-500">
            {data ? `${data.meta.total} total` : " "}
          </span>
        </div>
        {loading ? (
          <InlineLoading label="Loading tickets…" />
        ) : error ? (
          <div className="p-5">
            <ErrorMessage message={error} onRetry={() => setRefresh((value) => value + 1)} />
          </div>
        ) : !data?.data.length ? (
          <div className="px-5 py-16 text-center">
            <span className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-indigo-50 text-xl text-indigo-600">
              ✓
            </span>
            <h3 className="text-sm font-semibold text-slate-800">
              {search || status || priority ? "No tickets match your filters" : "No tickets yet"}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {search || status || priority
                ? "Try changing the search or filters."
                : "Create a ticket and our support team will be in touch."}
            </p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-slate-100">
              {data.data.map((ticket) => (
                <Link
                  className="group grid gap-3 px-5 py-4 transition hover:bg-slate-50 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                  key={ticket._id}
                  to={`/tickets/${ticket._id}`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate text-sm font-semibold text-slate-800 group-hover:text-indigo-700">
                        {ticket.title}
                      </h3>
                      {ticket.comments.length > 0 && (
                        <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500">
                          {ticket.comments.length} replies
                        </span>
                      )}
                    </div>
                    <p className="mt-1 truncate text-xs text-slate-500">
                      {ticket.createdBy?.email} · Created{" "}
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <PriorityBadge priority={ticket.priority} />
                    <StatusBadge status={ticket.status} />
                    <span aria-hidden="true" className="ml-1 text-slate-300">
                      →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-3">
              <p className="text-xs text-slate-500">
                Page {data.meta.page} of {Math.max(data.meta.totalPages, 1)}
              </p>
              <div className="flex gap-2">
                <button
                  className="button-secondary !px-3 !py-1.5"
                  disabled={page <= 1}
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                >
                  Previous
                </button>
                <button
                  className="button-secondary !px-3 !py-1.5"
                  disabled={page >= data.meta.totalPages}
                  onClick={() => setPage((value) => value + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </section>
      {showForm && (
        <TicketForm
          onClose={() => setShowForm(false)}
          onCreated={() => {
            setShowForm(false);
            setSearch("");
            setStatus("");
            setPriority("");
            setPage(1);
            setRefresh((value) => value + 1);
          }}
        />
      )}
    </>
  );
}
