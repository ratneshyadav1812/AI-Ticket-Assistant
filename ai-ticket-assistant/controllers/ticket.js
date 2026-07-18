import { inngest } from "../inngest/client.js";
import mongoose from "mongoose";
import Ticket from "../models/ticket.js";
import User from "../models/user.js";

export const createTicket = async (req, res) => {
  const { title, description } = req.validatedBody;

  try {
    const ticket = await Ticket.create({
      title,
      description,
      createdBy: req.user._id,
    });

    try {
      await inngest.send({
        name: "ticket/created",
        data: {
          ticketId: ticket._id.toString(),
          createdBy: req.user._id.toString(),
        },
      });
    } catch (eventError) {
      await Ticket.findByIdAndUpdate(ticket._id, {
        status: "FAILED",
        processingError: "The processing workflow could not be queued",
      });
      throw eventError;
    }

    return res.status(201).json({
      message: "Ticket created and processing started",
      ticket,
    });
  } catch (error) {
    console.error("Ticket creation failed", error.message);
    return res.status(500).json({ message: "Ticket creation failed" });
  }
};

export const getTickets = async (req, res) => {
  try {
    let filter;

    if (req.user.role === "admin") {
      filter = {};
    } else if (req.user.role === "moderator") {
      filter = { assignedTo: req.user._id };
    } else {
      filter = { createdBy: req.user._id };
    }

    const tickets = await Ticket.find(filter)
      .populate("assignedTo", "email _id")
      .sort({ createdAt: -1 });

    return res.status(200).json(tickets);
  } catch (error) {
    console.error("Fetching tickets failed", error.message);
    return res.status(500).json({ message: "Fetching tickets failed" });
  }
};

export const getTicket = async (req, res) => {
  try {
    const accessFilter = { _id: req.params.id };

    if (req.user.role === "user") {
      accessFilter.createdBy = req.user._id;
    } else if (req.user.role === "moderator") {
      accessFilter.assignedTo = req.user._id;
    }

    const ticket = await Ticket.findOne(accessFilter).populate(
      "assignedTo",
      "email _id"
    );

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    return res.status(200).json(ticket);
  } catch (error) {
    console.error("Fetching ticket failed", error.message);
    return res.status(500).json({ message: "Fetching ticket failed" });
  }
};

export const updateTicketStatus = async (req, res) => {
  const { status } = req.validatedBody;
  const session = await mongoose.startSession();
  let updatedTicket = null;
  let failure = null;

  try {
    await session.withTransaction(async () => {
      const filter = { _id: req.params.id };
      if (req.user.role === "moderator") {
        filter.assignedTo = req.user._id;
      }

      const ticket = await Ticket.findOne(filter).session(session);
      if (!ticket) {
        failure = { status: 404, message: "Ticket not found" };
        return;
      }

      const validTransition =
        (status === "IN_PROGRESS" && ticket.status === "ASSIGNED") ||
        (status === "RESOLVED" &&
          ["ASSIGNED", "IN_PROGRESS"].includes(ticket.status));

      if (!validTransition) {
        failure = {
          status: 409,
          message: `Cannot change ticket from ${ticket.status} to ${status}`,
        };
        return;
      }

      ticket.status = status;

      if (status === "RESOLVED") {
        ticket.resolvedAt = new Date();

        if (ticket.assignedTo) {
          await User.updateOne(
            { _id: ticket.assignedTo, activeTicketCount: { $gt: 0 } },
            { $inc: { activeTicketCount: -1 } },
            { session }
          );
        }
      }

      await ticket.save({ session });
      updatedTicket = ticket.toObject();
    });

    if (failure) {
      return res.status(failure.status).json({ message: failure.message });
    }

    return res.status(200).json({ ticket: updatedTicket });
  } catch (error) {
    console.error("Ticket status update failed", error.message);
    return res.status(500).json({ message: "Ticket status update failed" });
  } finally {
    await session.endSession();
  }
};
