
import { closeDb, connectToDb } from "./src/db/connect.js";
import ticketClasses from "./src/db/seeds/ticket-classes.json" with {
  type: "json",
};

try {
  const db = await connectToDb();
  const collection = db.collection("ticketClasses");

  // Verify that every expected ticket class exists exactly once.
  const classNames = ticketClasses.map((item) => item.class);

  const existingClasses = await collection
    .find({ class: { $in: classNames } })
    .toArray();

  for (const className of classNames) {
    const matches = existingClasses.filter(
      (item) => item.class === className
    );

    if (matches.length !== 1) {
      throw new Error(
        `Expected exactly one record for ${className}, found ${matches.length}. No updates were made.`
      );
    }
  }

  // Update availability only, preserving all other ticket-class fields.
  const operations = ticketClasses.map((ticketClass) => ({
    updateOne: {
      filter: { class: ticketClass.class },
      update: {
        $set: {
          availableDays: ticketClass.availableDays,
        },
      },
    },
  }));

  const result = await collection.bulkWrite(operations);

  console.log(
    `Ticket-class availability update completed. Matched: ${result.matchedCount}, modified: ${result.modifiedCount}.`
  );
} catch (error) {
  console.error("Ticket-class update failed:", error);
  process.exitCode = 1;
} finally {
  await closeDb();
}
