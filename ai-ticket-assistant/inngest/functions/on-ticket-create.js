import { NonRetriableError } from "inngest";
import Ticket from "../../models/ticket.js";
import { assignModeratorToTicket } from "../../services/moderator-assignment.js";
import analyzeTicket from "../../utils/ai.js";
import { sendMail } from "../../utils/mailer.js";
import { inngest } from "../client.js";

const markPermanentFailure = async ({ event, error, step }) => {
  const ticketId = event.data.event?.data?.ticketId;
  if (!ticketId) return;

  await step.run("record-permanent-failure", async () => {
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) return;

    const errorMessage = String(error?.message || "Ticket processing failed").slice(
      0,
      1000
    );

    if (ticket.processingStage === "AI_ANALYSIS") {
      ticket.status = "AI_ANALYSIS_FAILED";
    } else if (ticket.processingStage !== "NOTIFICATION") {
      ticket.status = "FAILED";
    }

    ticket.processingStage = "FAILED";
    ticket.processingError = errorMessage;
    await ticket.save();
  });
};

export const onTicketCreated = inngest.createFunction(
  {
    id: "on-ticket-created",
    retries: 3,
    singleton: {
      key: "event.data.ticketId",
      mode: "skip",
    },
    onFailure: markPermanentFailure,
  },
  { event: "ticket/created" },
  async ({ event, step }) => {
    const { ticketId } = event.data;

    const claim = await step.run("claim-ticket", async () => {
      const ticket = await Ticket.findOneAndUpdate(
        {
          _id: ticketId,
          status: { $in: ["TODO", "AI_ANALYSIS_FAILED", "FAILED"] },
        },
        {
          $set: {
            status: "PROCESSING",
            processingStage: "AI_ANALYSIS",
            processingError: "",
          },
          $inc: { processingAttempts: 1 },
        },
        { new: true, runValidators: true }
      ).lean();

      if (ticket) {
        return { skip: false, ticket };
      }

      const existingTicket = await Ticket.findById(ticketId).lean();
      if (!existingTicket) {
        throw new NonRetriableError("Ticket not found");
      }

      return { skip: true, ticket: existingTicket };
    });

    if (claim.skip) {
      return {
        success: true,
        skipped: true,
        status: claim.ticket.status,
      };
    }

    const aiResponse = await step.run("analyze-ticket", async () =>
      analyzeTicket({
        title: claim.ticket.title,
        description: claim.ticket.description,
      })
    );

    const relatedSkills = await step.run("store-ai-analysis", async () => {
      await Ticket.findByIdAndUpdate(
        ticketId,
        {
          summary: aiResponse.summary,
          priority: aiResponse.priority,
          helpfulNotes: aiResponse.helpfulNotes,
          relatedSkills: aiResponse.relatedSkills,
          status: "WAITING_FOR_ASSIGNMENT",
          processingStage: "ASSIGNMENT",
        },
        { runValidators: true }
      );

      return aiResponse.relatedSkills;
    });

    const assignment = await step.run("assign-moderator", async () =>
      assignModeratorToTicket(ticketId, relatedSkills)
    );

    await step.run("send-assignment-notification", async () => {
      if (!assignment.moderator) return { sent: false };

      await sendMail(
        assignment.moderator.email,
        "Ticket Assigned",
        `A new ticket has been assigned to you.\n\nTitle: ${claim.ticket.title}`
      );

      return { sent: true };
    });

    await step.run("finish-processing", async () => {
      await Ticket.findByIdAndUpdate(ticketId, {
        processingStage: "COMPLETED",
        processingError: "",
      });
    });

    return {
      success: true,
      status: assignment.status,
      assignedTo: assignment.moderator?._id || null,
    };
  }
);

