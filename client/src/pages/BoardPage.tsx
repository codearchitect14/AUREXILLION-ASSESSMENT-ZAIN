import { useCallback, useEffect, useState, type DragEvent } from "react";
import { Link } from "react-router-dom";
import { fetchTickets, updateTicketStatus, ApiError } from "../api";
import {
  STATUS_LABELS,
  TICKET_STATUSES,
  type Ticket,
  type TicketStatus,
} from "../types";
import { PriorityBadge } from "../components/Badges";
import { useToast } from "../components/Toast";

export default function BoardPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TicketStatus | null>(null);
  const { showToast } = useToast();

  const loadTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setTickets(await fetchTickets());
    } catch {
      setError("Could not load tickets. Make sure the API server is running.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTickets();
  }, [loadTickets]);

  function handleDragStart(e: DragEvent, ticketId: number) {
    e.dataTransfer.setData("text/plain", String(ticketId));
    e.dataTransfer.effectAllowed = "move";
  }

  async function handleDrop(e: DragEvent, status: TicketStatus) {
    e.preventDefault();
    setDragOverColumn(null);

    const ticketId = Number(e.dataTransfer.getData("text/plain"));
    const ticket = tickets.find((t) => t.id === ticketId);
    if (!ticket || ticket.status === status) return;

    // Workflow rule (also enforced by the API): only in-progress tickets can be resolved.
    if (status === "resolved" && ticket.status !== "in_progress") {
      showToast("Only tickets that are in progress can be resolved.", "error");
      return;
    }

    const previous = tickets;
    // Optimistic move; revert if the API call fails.
    setTickets((prev) => prev.map((t) => (t.id === ticketId ? { ...t, status } : t)));
    try {
      const updated = await updateTicketStatus(ticketId, status);
      setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      showToast(`Ticket #${ticketId} moved to ${STATUS_LABELS[status]}.`);
    } catch (err) {
      setTickets(previous);
      const message = err instanceof ApiError ? err.message : "Could not update status.";
      showToast(message, "error");
    }
  }

  if (loading) return <p className="state-message">Loading board…</p>;

  if (error) {
    return (
      <div className="state-message state-error">
        <p>{error}</p>
        <button className="btn" onClick={() => void loadTickets()}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <section>
      <div className="page-heading">
        <h1>Board</h1>
        <p className="muted">Drag a ticket to another column to change its status.</p>
      </div>

      <div className="board">
        {TICKET_STATUSES.map((status) => {
          const columnTickets = tickets.filter((t) => t.status === status);
          return (
            <div
              key={status}
              className={`board-column ${dragOverColumn === status ? "board-column-active" : ""}`}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
              }}
              onDragEnter={() => setDragOverColumn(status)}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverColumn(null);
              }}
              onDrop={(e) => void handleDrop(e, status)}
              aria-label={`${STATUS_LABELS[status]} column`}
            >
              <h2 className={`board-column-title status-${status}`}>
                {STATUS_LABELS[status]}
                <span className="board-count">{columnTickets.length}</span>
              </h2>
              <div className="board-cards">
                {columnTickets.map((ticket) => (
                  <article
                    key={ticket.id}
                    className="board-card"
                    draggable
                    onDragStart={(e) => handleDragStart(e, ticket.id)}
                  >
                    <div className="board-card-top">
                      <span className="muted">#{ticket.id}</span>
                      <PriorityBadge priority={ticket.priority} />
                    </div>
                    <Link to={`/tickets/${ticket.id}`} className="ticket-link">
                      {ticket.title}
                    </Link>
                    <p className="muted">{ticket.customerName}</p>
                  </article>
                ))}
                {columnTickets.length === 0 && <p className="board-empty">No tickets</p>}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
