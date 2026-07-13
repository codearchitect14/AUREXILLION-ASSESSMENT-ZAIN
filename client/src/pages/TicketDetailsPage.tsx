import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchTicket, ApiError } from "../api";
import type { Ticket } from "../types";
import { PriorityBadge, StatusBadge } from "../components/Badges";
import StatusSelect from "../components/StatusSelect";
import { formatDateTime } from "../utils/format";

export default function TicketDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ticketId = Number(id);
    if (!Number.isInteger(ticketId) || ticketId <= 0) {
      setError("Invalid ticket id.");
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchTicket(ticketId);
        if (!cancelled) setTicket(data);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError && err.status === 404
              ? "This ticket does not exist."
              : "Could not load the ticket."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) return <p className="state-message">Loading ticket…</p>;

  if (error || !ticket) {
    return (
      <div className="state-message state-error">
        <p>{error ?? "Could not load the ticket."}</p>
        <Link to="/" className="btn">
          Back to tickets
        </Link>
      </div>
    );
  }

  return (
    <section className="ticket-details">
      <Link to="/" className="back-link">
        ← Back to tickets
      </Link>

      <div className="card">
        <div className="card-header">
          <div>
            <h1>{ticket.title}</h1>
            <p className="muted">
              Ticket #{ticket.id} · Created {formatDateTime(ticket.createdAt)}
            </p>
          </div>
          <div className="card-badges">
            <StatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
          </div>
        </div>

        <div className="detail-grid">
          <div>
            <h2>Description</h2>
            <p className="description">{ticket.description}</p>
          </div>
          <aside>
            <h2>Customer</h2>
            <p>{ticket.customerName}</p>
            <p>
              <a href={`mailto:${ticket.customerEmail}`}>{ticket.customerEmail}</a>
            </p>

            <h2>Update status</h2>
            <StatusSelect ticket={ticket} onUpdated={setTicket} />
          </aside>
        </div>
      </div>
    </section>
  );
}
