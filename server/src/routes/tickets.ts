import { Router } from "express";
import type { TicketController } from "../controllers/ticketController.js";
import { validate } from "../middlewares/validate.js";
import {
  createTicketSchema,
  listTicketsQuerySchema,
  ticketIdParamsSchema,
  updateTicketSchema,
} from "../domain/validation.js";

export function createTicketsRouter(controller: TicketController): Router {
  const router = Router();

  router.get("/", validate({ query: listTicketsQuerySchema }), controller.list);
  router.get("/:id", validate({ params: ticketIdParamsSchema }), controller.getById);
  router.post("/", validate({ body: createTicketSchema }), controller.create);
  router.patch(
    "/:id",
    validate({ params: ticketIdParamsSchema, body: updateTicketSchema }),
    controller.update
  );

  return router;
}
