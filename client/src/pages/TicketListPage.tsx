import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchTickets, type TicketFilters } from "../api";
import {
  PRIORITY_LABELS,
  STATUS_LABELS,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  type Ticket,
  type TicketPriority,
  type TicketStatus,
} from "../types";
import { PriorityBadge } from "../components/Badges";
import StatusSelect from "../components/StatusSelect";
import { formatDate } from "../utils/format";

export default function TicketListPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<TicketStatus | "">("");
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | "">("");

  const loadTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
    const filters: TicketFilters = {};
    if (statusFilter) filters.status = statusFilter;
    if (priorityFilter) filters.priority = priorityFilter;
    try {
      setTickets(await fetchTickets(filters));
    } catch {
      setError("Could not load tickets. Make sure the API server is running.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, priorityFilter]);

  useEffect(() => {
    void loadTickets();
  }, [loadTickets]);

  function handleTicketUpdated(updated: Ticket) {
    setTickets((prev) =>
      prev
        .map((t) => (t.id === updated.id ? updated : t))
        // keep the list consistent with an active status filter
        .filter((t) => !statusFilter || t.status === statusFilter)
    );
  }

  const hasFilters = statusFilter !== "" || priorityFilter !== "";

  return (
    <section>
      <div className="page-heading">
        <h1>Tickets</h1>
        <div className="filters">
          <label>
            Status
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as TicketStatus | "")}
            >
              <option value="">All</option>
              {TICKET_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </label>
          <label>
            Priority
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as TicketPriority | "")}
            >
              <option value="">All</option>
              {TICKET_PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_LABELS[p]}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {loading && <p className="state-message">Loading tickets…</p>}

      {!loading && error && (
        <div className="state-message state-error">
          <p>{error}</p>
          <button className="btn" onClick={() => void loadTickets()}>
            Retry
          </button>
        </div>
      )}

      {!loading && !error && tickets.length === 0 && (
        <p className="state-message">
          {hasFilters
            ? "No tickets match the selected filters."
            : "No tickets yet. Create the first one!"}
        </p>
      )}

      {!loading && !error && tickets.length > 0 && (
        <div className="table-wrapper">
          <table className="ticket-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Customer</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket) => (
                <tr key={ticket.id}>
                  <td data-label="Title">
                    <Link to={`/tickets/${ticket.id}`} className="ticket-link">
                      {ticket.title}
                    </Link>
                  </td>
                  <td data-label="Customer">{ticket.customerName}</td>
                  <td data-label="Status">
                    <StatusSelect ticket={ticket} onUpdated={handleTicketUpdated} />
                  </td>
                  <td data-label="Priority">
                    <PriorityBadge priority={ticket.priority} />
                  </td>
                  <td data-label="Created">{formatDate(ticket.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
