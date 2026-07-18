import express from "express";
import {
  createTicket,
  getTicket,
  getTickets,
  updateTicketStatus,
} from "../controllers/ticket.js";
import { authenticate, authorize } from "../middlewares/auth.js";
import { csrfProtection } from "../middlewares/csrf.js";
import { validateBody, validateObjectId } from "../middlewares/validate.js";
import {
  createTicketSchema,
  updateTicketStatusSchema,
} from "../validation/schemas.js";

const router = express.Router();

router.get("/", authenticate, getTickets);
router.get("/:id", authenticate, validateObjectId("id"), getTicket);
router.patch(
  "/:id/status",
  authenticate,
  authorize("moderator", "admin"),
  csrfProtection,
  validateObjectId("id"),
  validateBody(updateTicketStatusSchema),
  updateTicketStatus
);
router.post(
  "/",
  authenticate,
  authorize("user"),
  csrfProtection,
  validateBody(createTicketSchema),
  createTicket
);

export default router;
