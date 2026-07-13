import type { TicketRepository } from "../repositories/ticketRepository.js";
import type { Ticket } from "../domain/types.js";
import type { CreateTicketInput, ListTicketsQuery, UpdateTicketInput } from "../domain/validation.js";
import { HttpError, NotFoundError } from "../domain/errors.js";

/**
 * Business logic for tickets. Controllers call this layer; it never touches
 * HTTP concerns, and data access is delegated to the repository.
 */
export class TicketService {
  constructor(private repository: TicketRepository) {}

  listTickets(query: ListTicketsQuery): Ticket[] {
    return this.repository.list(query);
  }

  getTicket(id: number): Ticket {
    const ticket = this.repository.findById(id);
    if (!ticket) throw new NotFoundError(`Ticket ${id} not found`);
    return ticket;
  }

  createTicket(input: CreateTicketInput): Ticket {
    // New tickets always start as "open"; the repository enforces this on insert.
    return this.repository.create(input);
  }

  updateTicket(id: number, input: UpdateTicketInput): Ticket {
    const existing = this.repository.findById(id);
    if (!existing) throw new NotFoundError(`Ticket ${id} not found`);

    // Workflow rule: a ticket can only be resolved from "in_progress".
    // (Setting "resolved" on an already-resolved ticket is an idempotent no-op.)
    if (
      input.status === "resolved" &&
      existing.status !== "in_progress" &&
      existing.status !== "resolved"
    ) {
      throw new HttpError(422, "Only tickets that are in progress can be resolved");
    }

    return this.repository.update(id, input)!;
  }
}
