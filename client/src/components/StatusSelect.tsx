import { useState } from "react";
import { updateTicketStatus, ApiError } from "../api";
import { STATUS_LABELS, TICKET_STATUSES, type Ticket, type TicketStatus } from "../types";
import { useToast } from "./Toast";

interface StatusSelectProps {
  ticket: Ticket;
  onUpdated: (ticket: Ticket) => void;
}

export default function StatusSelect({ ticket, onUpdated }: StatusSelectProps) {
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  async function handleChange(nextStatus: TicketStatus) {
    if (nextStatus === ticket.status) return;
    setSaving(true);
    try {
      const updated = await updateTicketStatus(ticket.id, nextStatus);
      onUpdated(updated);
      showToast(`Ticket #${ticket.id} moved to ${STATUS_LABELS[updated.status]}.`);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Could not update status.";
      showToast(message, "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <select
      className="status-select"
      value={ticket.status}
      disabled={saving}
      aria-label={`Status for ticket ${ticket.title}`}
      onChange={(e) => handleChange(e.target.value as TicketStatus)}
    >
      {TICKET_STATUSES.map((status) => (
        <option
          key={status}
          value={status}
          // Workflow rule (also enforced by the API): only in-progress tickets can be resolved.
          disabled={status === "resolved" && ticket.status === "open"}
        >
          {STATUS_LABELS[status]}
        </option>
      ))}
    </select>
  );
}
