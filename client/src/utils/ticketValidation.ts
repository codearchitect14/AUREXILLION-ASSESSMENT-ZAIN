import type { NewTicket } from "../types";

export type TicketFormErrors = Partial<Record<keyof NewTicket, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateTicketForm(values: NewTicket): TicketFormErrors {
  const errors: TicketFormErrors = {};
  if (!values.title.trim()) errors.title = "Title is required.";
  if (!values.description.trim()) errors.description = "Description is required.";
  if (!values.customerName.trim()) errors.customerName = "Customer name is required.";
  if (!values.customerEmail.trim()) {
    errors.customerEmail = "Customer email is required.";
  } else if (!EMAIL_PATTERN.test(values.customerEmail.trim())) {
    errors.customerEmail = "Enter a valid email address.";
  }
  return errors;
}
