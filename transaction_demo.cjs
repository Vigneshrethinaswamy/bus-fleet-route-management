const { MongoClient, ObjectId } = require("mongodb");

const URI = "mongodb://127.0.0.1:27017/?replicaSet=rs0";
const DB_NAME = "bus_fleet_management";
const runId = "TXN_DEMO_" + new ObjectId().toHexString();

const committedActivityId = runId + "_ACT_COMMIT";
const committedTransactionId = runId + "_TXN_COMMIT";
const rollbackActivityId = runId + "_ACT_ROLLBACK";

const client = new MongoClient(URI);
let session;
let transactionStarted = false;
let connected = false;
let failures = 0;
let initialCounts = null;

function check(condition, message) {
  if (condition) {
    console.log("PASS: " + message);
  } else {
    failures++;
    console.log("FAIL: " + message);
  }
}

async function getCounts(database) {
  const names = (await database.listCollections({}, { nameOnly: true }).toArray())
    .map(item => item.name)
    .sort();

  const counts = {};
  for (const name of names) {
    counts[name] = await database.collection(name).countDocuments();
  }
  return counts;
}

async function main() {
  try {
    await client.connect();
    connected = true;

    const database = client.db(DB_NAME);
    const hello = await database.admin().command({ hello: 1 });

    if (hello.setName !== "rs0" || hello.isWritablePrimary !== true) {
      throw new Error("Replica-set preflight failed; no test writes attempted.");
    }

    check(true, "Replica set rs0 has a writable primary");

    initialCounts = await getCounts(database);
    const initialTotal = Object.values(initialCounts).reduce((a, b) => a + b, 0);

    if (initialTotal !== 2010) {
      throw new Error("Expected 2010 starting documents; found " + initialTotal);
    }
    check(true, "Starting document total is 2010");

    const activities = database.collection("activities");
    const transactions = database.collection("transactions");

    // Confirm that the reference IDs used by the schema-valid test records exist.
    const [busExists, tripExists, driverExists, userExists] = await Promise.all([
      database.collection("buses").countDocuments({ busId: "BUS0099" }),
      database.collection("trips").countDocuments({ tripId: "TRP000453" }),
      database.collection("drivers").countDocuments({ driverId: "DRV0087" }),
      database.collection("users").countDocuments({ userId: "USR0037" })
    ]);

    if (![busExists, tripExists, driverExists, userExists].every(n => n === 1)) {
      throw new Error("One or more sample reference IDs are missing; no transaction test attempted.");
    }
    check(true, "Sample bus, trip, driver and user references exist");

    session = client.startSession();

    console.log("\n=== TEST 1: COMMIT ===");

    await session.withTransaction(async () => {
      await activities.insertOne({
        activityId: committedActivityId,
        userId: "USR0037",
        action: "TRANSACTION_DEMO_COMMIT",
        entityType: "BUS",
        entityId: "BUS0099",
        description: "Temporary activity created by transaction commit demonstration",
        timestamp: new Date(),
        metadata: { runId, test: "commit" }
      }, { session });

      await transactions.insertOne({
        transactionId: committedTransactionId,
        transactionType: "TRANSACTION_DEMO",
        busId: "BUS0099",
        tripId: "TRP000453",
        driverId: "DRV0087",
        performedBy: "USR0037",
        previousBusStatus: "AVAILABLE",
        newBusStatus: "ASSIGNED",
        status: "COMMITTED",
        timestamp: new Date(),
        metadata: { runId, test: "commit" }
      }, { session });
    });

    check(
      await activities.countDocuments({ activityId: committedActivityId }) === 1,
      "Committed activity is visible"
    );
    check(
      await transactions.countDocuments({ transactionId: committedTransactionId }) === 1,
      "Committed transaction is visible"
    );

    console.log("\n=== TEST 2: ROLLBACK ===");

    session.startTransaction();
    transactionStarted = true;

    await activities.insertOne({
      activityId: rollbackActivityId,
      userId: "USR0037",
      action: "TRANSACTION_DEMO_ROLLBACK",
      entityType: "BUS",
      entityId: "BUS0099",
      description: "Temporary activity that must be rolled back",
      timestamp: new Date(),
      metadata: { runId, test: "rollback" }
    }, { session });

    await session.abortTransaction();
    transactionStarted = false;

    check(
      await activities.countDocuments({ activityId: rollbackActivityId }) === 0,
      "Aborted activity is not persisted"
    );

  } catch (error) {
    failures++;
    console.error("\nERROR:", error.stack || error.message);
  } finally {
    if (session && transactionStarted) {
      try {
        await session.abortTransaction();
        transactionStarted = false;
        console.log("Open transaction aborted.");
      } catch (error) {
        failures++;
        console.error("Abort error:", error.message);
      }
    }

    if (session) {
      try {
        await session.endSession();
      } catch (error) {
        failures++;
        console.error("Session cleanup error:", error.message);
      }
    }

    if (connected) {
      const database = client.db(DB_NAME);

      try {
        // Remove only this run's exact test identifiers.
        await database.collection("activities").deleteMany({
          activityId: { $in: [committedActivityId, rollbackActivityId] }
        });
        await database.collection("transactions").deleteMany({
          transactionId: committedTransactionId
        });

        const finalCounts = await getCounts(database);
        const finalTotal = Object.values(finalCounts).reduce((a, b) => a + b, 0);

        console.log("\n=== FINAL SAFETY CHECK ===");
        check(finalTotal === 2010, "Final total restored to 2010");
        check(
          JSON.stringify(finalCounts) === JSON.stringify(initialCounts),
          "All collection counts match their starting values"
        );

        for (const [name, count] of Object.entries(finalCounts)) {
          console.log(name + ": " + count);
        }
        console.log("TOTAL: " + finalTotal);
      } catch (error) {
        failures++;
        console.error("Final verification/cleanup error:", error.stack || error.message);
      }

      try {
        await client.close();
      } catch (error) {
        failures++;
        console.error("Client close error:", error.message);
      }
    }
  }

  console.log("\n=== TRANSACTION DEMO SUMMARY ===");
  console.log("Failed checks/errors: " + failures);

  if (failures > 0) {
    console.log("RESULT: FAILED — inspect the error before retrying.");
    process.exitCode = 1;
  } else {
    console.log("RESULT: PASSED — commit, rollback and cleanup verified.");
  }
}

main().catch(error => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
