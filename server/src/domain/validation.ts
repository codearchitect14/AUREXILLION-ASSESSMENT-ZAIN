import { z } from "zod";
import { TICKET_PRIORITIES, TICKET_STATUSES } from "./types.js";

export const createTicketSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200, "Title must be 200 characters or fewer"),
  description: z.string().trim().min(1, "Description is required").max(5000, "Description must be 5000 characters or fewer"),
  customerName: z.string().trim().min(1, "Customer name is required").max(100, "Customer name must be 100 characters or fewer"),
  customerEmail: z.string().trim().email("A valid customer email is required"),
  priority: z.enum(TICKET_PRIORITIES, {
    errorMap: () => ({ message: "Priority must be one of: low, medium, high" }),
  }),
}).strict();

export const updateTicketSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    description: z.string().trim().min(1).max(5000).optional(),
    customerName: z.string().trim().min(1).max(100).optional(),
    customerEmail: z.string().trim().email().optional(),
    priority: z.enum(TICKET_PRIORITIES).optional(),
    status: z.enum(TICKET_STATUSES, {
      errorMap: () => ({ message: "Status must be one of: open, in_progress, resolved" }),
    }).optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export const listTicketsQuerySchema = z.object({
  status: z.enum(TICKET_STATUSES).optional(),
  priority: z.enum(TICKET_PRIORITIES).optional(),
});

export const loginSchema = z
  .object({
    email: z.string().trim().email("A valid email is required"),
    password: z.string().min(1, "Password is required"),
  })
  .strict();

export const ticketIdParamsSchema = z.object({
  id: z.coerce
    .number({ errorMap: () => ({ message: "Ticket id must be a positive integer" }) })
    .int("Ticket id must be a positive integer")
    .positive("Ticket id must be a positive integer"),
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;
export type ListTicketsQuery = z.infer<typeof listTicketsQuerySchema>;
export type TicketIdParams = z.infer<typeof ticketIdParamsSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
