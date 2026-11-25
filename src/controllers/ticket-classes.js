
import {
  getAllTicketClasses as findAllTicketClasses,
  getTicketClassesForDay as findTicketClassesForDay,
} from "../models/ticket-classes.js";

const validDays = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

export async function getAllTicketClasses(req, res) {
  try {
    const ticketClasses = await findAllTicketClasses();

    return res.status(200).json(ticketClasses);
  } catch (error) {
    console.error("Failed to retrieve ticket classes:", error);

    return res.status(500).json({
      message: "Failed to fetch ticket classes",
    });
  }
}

export async function getTicketClassesForDay(req, res) {
  try {
    const day = req.query.day?.trim().toLowerCase();

    if (!day || !validDays.includes(day)) {
      return res.status(400).json({
        message: "A valid weekday is required.",
        validDays,
      });
    }

    const ticketClasses = await findTicketClassesForDay(day);

    return res.status(200).json(ticketClasses);
  } catch (error) {
    console.error("Failed to retrieve ticket classes for day:", error);

    return res.status(500).json({
      message: "Failed to fetch ticket classes",
    });
  }
}
