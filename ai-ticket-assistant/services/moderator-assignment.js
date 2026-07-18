import mongoose from "mongoose";
import { NonRetriableError } from "inngest";
import Ticket from "../models/ticket.js";
import User from "../models/user.js";
import { normalizeSkills } from "../utils/skills.js";

const publicModerator = (moderator) =>
  moderator
    ? {
        _id: moderator._id.toString(),
        email: moderator.email,
        skills: moderator.skills,
        activeTicketCount: moderator.activeTicketCount,
        capacity: moderator.capacity,
      }
    : null;

const rankCandidates = (requiredSkills, session) =>
  User.aggregate([
    {
      $match: {
        role: "moderator",
        $or: [{ isAvailable: true }, { isAvailable: { $exists: false } }],
      },
    },
    {
      $addFields: {
        currentLoad: { $ifNull: ["$activeTicketCount", 0] },
        maxCapacity: { $ifNull: ["$capacity", 5] },
        normalizedSkills: {
          $map: {
            input: { $ifNull: ["$skills", []] },
            as: "skill",
            in: {
              $toLower: {
                $trim: {
                  input: "$$skill",
                },
              },
            },
          },
        },
      },
    },
    {
      $addFields: {
        matchingSkills: {
          $setIntersection: ["$normalizedSkills", requiredSkills],
        },
      },
    },
    {
      $addFields: {
        matchCount: { $size: "$matchingSkills" },
      },
    },
    {
      $match: {
        matchCount: { $gt: 0 },
        $expr: { $lt: ["$currentLoad", "$maxCapacity"] },
      },
    },
    {
      $sort: {
        matchCount: -1,
        currentLoad: 1,
        lastAssignedAt: 1,
        _id: 1,
      },
    },
    { $limit: 10 },
    { $project: { _id: 1 } },
  ]).session(session);

export const assignModeratorToTicket = async (ticketId, skills) => {
  console.log("========== ASSIGN MODERATOR START ==========");
  console.log("Ticket ID:", ticketId);
  console.log("Incoming Skills:", skills);

  const requiredSkills = normalizeSkills(skills);
  console.log("Normalized Skills:", requiredSkills);

  const session = await mongoose.startSession();
  console.log("Mongo Session Started");

  let selectedModerator = null;
  let finalStatus = "WAITING_FOR_ASSIGNMENT";

  try {
    console.log("Starting MongoDB Transaction...");

    await session.withTransaction(async () => {
      console.log("Inside Transaction");

      const ticket = await Ticket.findById(ticketId).session(session);

      console.log("Ticket Found:", !!ticket);

      if (!ticket) {
        console.log("Ticket NOT Found");
        throw new NonRetriableError("Ticket not found during assignment");
      }

      console.log("Current Ticket Status:", ticket.status);
      console.log("Already Assigned:", ticket.assignedTo);

      if (ticket.assignedTo) {
        console.log("Ticket already assigned");

        selectedModerator = await User.findById(ticket.assignedTo)
          .session(session)
          .lean();

        console.log("Assigned Moderator:", selectedModerator);

        finalStatus = ticket.status;
        return;
      }

      if (requiredSkills.length > 0) {
        console.log("Searching for matching moderators...");

        const candidates = await rankCandidates(requiredSkills, session);

        console.log("Candidates Found:", candidates);

        for (const candidate of candidates) {
          console.log("Trying Candidate:", candidate._id);

          selectedModerator = await User.findOneAndUpdate(
            {
              _id: candidate._id,
              role: "moderator",
              $or: [
                { isAvailable: true },
                { isAvailable: { $exists: false } },
              ],
              $expr: {
                $lt: [
                  { $ifNull: ["$activeTicketCount", 0] },
                  { $ifNull: ["$capacity", 5] },
                ],
              },
            },
            {
              $inc: { activeTicketCount: 1 },
              $set: { lastAssignedAt: new Date() },
            },
            {
              new: true,
              session,
            }
          ).lean();

          console.log("Selected Moderator:", selectedModerator);

          if (selectedModerator) {
            console.log("Moderator Assigned");
            break;
          }
        }
      } else {
        console.log("No required skills detected.");
      }

      if (!selectedModerator) {
        console.log("No Moderator Found. Trying Admin Fallback...");

        selectedModerator = await User.findOneAndUpdate(
          {
            role: "admin",
            $or: [
              { isAvailable: true },
              { isAvailable: { $exists: false } },
            ],
            $expr: {
              $lt: [
                { $ifNull: ["$activeTicketCount", 0] },
                { $ifNull: ["$capacity", 5] },
              ],
            },
          },
          {
            $inc: { activeTicketCount: 1 },
            $set: { lastAssignedAt: new Date() },
          },
          {
            new: true,
            session,
          }
        ).lean();

        console.log("Admin Fallback Result:", selectedModerator);
      }

      if (!selectedModerator) {
        console.log("No Moderator/Admin Available");

        ticket.status = "WAITING_FOR_ASSIGNMENT";
        ticket.processingStage = "COMPLETED";

        console.log("Saving ticket with WAITING_FOR_ASSIGNMENT...");
        await ticket.save({ session });

        console.log("Ticket Saved");

        finalStatus = ticket.status;
        return;
      }

      console.log("Assigning Ticket to:", selectedModerator.email);

      ticket.assignedTo = selectedModerator._id;
      ticket.status = "ASSIGNED";
      ticket.assignedAt = new Date();
      ticket.processingStage = "NOTIFICATION";

      console.log("Saving Assigned Ticket...");
      await ticket.save({ session });

      console.log("Ticket Saved Successfully");

      finalStatus = ticket.status;
    });

    console.log("Transaction Committed Successfully");
  } catch (err) {
    console.error("Transaction Failed");
    console.error(err);
    throw err;
  } finally {
    console.log("Ending Mongo Session");
    await session.endSession();
    console.log("Mongo Session Ended");
  }

  console.log("Returning Result:", {
    moderator: publicModerator(selectedModerator),
    status: finalStatus,
  });

  console.log("========== ASSIGN MODERATOR END ==========");

  return {
    moderator: publicModerator(selectedModerator),
    status: finalStatus,
  };
};