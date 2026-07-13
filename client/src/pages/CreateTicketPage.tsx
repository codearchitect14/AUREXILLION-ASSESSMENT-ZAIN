import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createTicket, ApiError } from "../api";
import {
  PRIORITY_LABELS,
  TICKET_PRIORITIES,
  type NewTicket,
  type TicketPriority,
} from "../types";
import { useToast } from "../components/Toast";
import { validateTicketForm, type TicketFormErrors } from "../utils/ticketValidation";

const initialValues: NewTicket = {
  title: "",
  description: "",
  customerName: "",
  customerEmail: "",
  priority: "medium",
};

export default function CreateTicketPage() {
  const [values, setValues] = useState<NewTicket>(initialValues);
  const [errors, setErrors] = useState<TicketFormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { showToast } = useToast();

  function setField<K extends keyof NewTicket>(field: K, value: NewTicket[K]) {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    const validationErrors = validateTicketForm(values);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    try {
      const ticket = await createTicket({
        ...values,
        title: values.title.trim(),
        description: values.description.trim(),
        customerName: values.customerName.trim(),
        customerEmail: values.customerEmail.trim(),
      });
      showToast(`Ticket #${ticket.id} created.`);
      navigate(`/tickets/${ticket.id}`);
    } catch (err) {
      setSubmitError(
        err instanceof ApiError ? err.message : "Could not create the ticket. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="create-ticket">
      <Link to="/" className="back-link">
        ← Back to tickets
      </Link>
      <div className="card">
        <h1>New Ticket</h1>
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-field">
            <label htmlFor="title">Title *</label>
            <input
              id="title"
              type="text"
              value={values.title}
              onChange={(e) => setField("title", e.target.value)}
              aria-invalid={Boolean(errors.title)}
            />
            {errors.title && <p className="field-error">{errors.title}</p>}
          </div>

          <div className="form-field">
            <label htmlFor="description">Description *</label>
            <textarea
              id="description"
              rows={5}
              value={values.description}
              onChange={(e) => setField("description", e.target.value)}
              aria-invalid={Boolean(errors.description)}
            />
            {errors.description && <p className="field-error">{errors.description}</p>}
          </div>

          <div className="form-row">
            <div className="form-field">
              <label htmlFor="customerName">Customer name *</label>
              <input
                id="customerName"
                type="text"
                value={values.customerName}
                onChange={(e) => setField("customerName", e.target.value)}
                aria-invalid={Boolean(errors.customerName)}
              />
              {errors.customerName && <p className="field-error">{errors.customerName}</p>}
            </div>

            <div className="form-field">
              <label htmlFor="customerEmail">Customer email *</label>
              <input
                id="customerEmail"
                type="email"
                value={values.customerEmail}
                onChange={(e) => setField("customerEmail", e.target.value)}
                aria-invalid={Boolean(errors.customerEmail)}
              />
              {errors.customerEmail && <p className="field-error">{errors.customerEmail}</p>}
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="priority">Priority *</label>
            <select
              id="priority"
              value={values.priority}
              onChange={(e) => setField("priority", e.target.value as TicketPriority)}
            >
              {TICKET_PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_LABELS[p]}
                </option>
              ))}
            </select>
          </div>

          {submitError && <p className="field-error submit-error">{submitError}</p>}

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "Creating…" : "Create Ticket"}
            </button>
            <Link to="/" className="btn">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </section>
  );
}
