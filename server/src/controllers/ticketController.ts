import type { RequestHandler } from "express";
import type { TicketService } from "../services/ticketService.js";
import type {
  CreateTicketInput,
  ListTicketsQuery,
  TicketIdParams,
  UpdateTicketInput,
} from "../domain/validation.js";

/**
 * HTTP layer for tickets: reads validated input from the request, calls the
 * service, and shapes the JSON response. Errors are passed to the central
 * error-handling middleware.
 */
export class TicketController {
  constructor(private service: TicketService) {}

  list: RequestHandler = (req, res, next) => {
    try {
      const query = req.validated.query as ListTicketsQuery;
      res.status(200).json(this.service.listTickets(query));
    } catch (err) {
      next(err);
    }
  };

  getById: RequestHandler = (req, res, next) => {
    try {
      const { id } = req.validated.params as TicketIdParams;
      res.status(200).json(this.service.getTicket(id));
    } catch (err) {
      next(err);
    }
  };

  create: RequestHandler = (req, res, next) => {
    try {
      const input = req.validated.body as CreateTicketInput;
      res.status(201).json(this.service.createTicket(input));
    } catch (err) {
      next(err);
    }
  };

  update: RequestHandler = (req, res, next) => {
    try {
      const { id } = req.validated.params as TicketIdParams;
      const input = req.validated.body as UpdateTicketInput;
      res.status(200).json(this.service.updateTicket(id, input));
    } catch (err) {
      next(err);
    }
  };
}
