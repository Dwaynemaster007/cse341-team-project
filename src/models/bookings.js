import booking from "./schemas/bookings.js";

export async function getBookingById(id) {
  return booking.findOne({ id }).lean();
}

export async function getAllBookings() {
  return booking.find({}).lean();
}

export async function createBooking(data) {
  return booking.create(data);
}

