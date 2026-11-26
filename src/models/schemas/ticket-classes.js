
import mongoose from "mongoose";

const ticketClassSchema = new mongoose.Schema({
  class: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  pricePerKm: {
    type: Number,
    required: true,
    min: 0,
  },
  availableDays: {
    type: [String],
    required: true,
    validate: {
      validator: (days) =>
        days.length > 0 &&
        days.every((day) =>
          [
            "monday",
            "tuesday",
            "wednesday",
            "thursday",
            "friday",
            "saturday",
            "sunday",
          ].includes(day)
        ),
      message: "Available days must contain valid weekdays.",
    },
  },
  amenities: {
    type: [String],
    required: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
});

const ticketClass = mongoose.model(
  "TicketClass",
  ticketClassSchema,
  "ticketClasses"
);

export default ticketClass;