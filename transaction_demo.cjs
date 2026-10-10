const { MongoClient, ObjectId } = require("mongodb");

const URI = "mongodb://127.0.0.1:27017/?replicaSet=rs0";
const DB_NAME = "bus_fleet_management";
const runId = "TXN_DEMO_" + new ObjectId().toHexString();
const userId = "USR0037";

const committedActivityId = runId + "_ACT_COMMIT";
const committedTransactionId = runId + "_TXN_COMMIT";
const rollbackActivityId = runId + "_ACT_ROLLBACK";
const rollbackTransactionId = runId + "_TXN_ROLLBACK";

const client = new MongoClient(URI);
let session;
let transactionStarted = false;
let connected = false;
let failures = 0;
let initialCounts = null;
let chosen = null;
let snapshots = null;
let commitApplied = false;

function check(condition, message) {
  if (condition) console.log("PASS: " + message);
  else {
    failures++;
    console.log("FAIL: " + message);
  }
}

async function getCounts(database) {
  const names = (await database.listCollections({}, { nameOnly: true }).toArray())
    .map(item => item.name)
    .sort();
  const counts = {};
  for (const name of names) counts[name] = await database.collection(name).countDocuments();
  return counts;
}

function restoreOptionalField(update, field, value) {
  if (value === undefined) update.$unset[field] = "";
  else update.$set[field] = value;
}

async function restoreOperationalState(database) {
  if (!snapshots || !chosen) return;

  const buses = database.collection("buses");
  const trips = database.collection("trips");
  const drivers = database.collection("drivers");

  const busUpdate = { $set: {}, $unset: {} };
  restoreOptionalField(busUpdate, "status", snapshots.bus.status);
  restoreOptionalField(busUpdate, "assignedDriverId", snapshots.bus.assignedDriverId);
  restoreOptionalField(busUpdate, "updatedAt", snapshots.bus.updatedAt);
  if (Object.keys(busUpdate.$unset).length === 0) delete busUpdate.$unset;
  if (Object.keys(busUpdate.$set).length === 0) delete busUpdate.$set;
  await buses.updateOne({ _id: snapshots.bus._id }, busUpdate);

  const tripUpdate = { $set: {}, $unset: {} };
  for (const field of ["status", "busId", "driverId"]) {
    restoreOptionalField(tripUpdate, field, snapshots.trip[field]);
  }
  if (Object.keys(tripUpdate.$unset).length === 0) delete tripUpdate.$unset;
  if (Object.keys(tripUpdate.$set).length === 0) delete tripUpdate.$set;
  await trips.updateOne({ _id: snapshots.trip._id }, tripUpdate);

  const driverUpdate = { $set: {}, $unset: {} };
  restoreOptionalField(driverUpdate, "status", snapshots.driver.status);
  if (Object.keys(driverUpdate.$unset).length === 0) delete driverUpdate.$unset;
  if (Object.keys(driverUpdate.$set).length === 0) delete driverUpdate.$set;
  await drivers.updateOne({ _id: snapshots.driver._id }, driverUpdate);
}

async function performAssignment(database, session, statusLabel, transactionId, activityId) {
  const buses = database.collection("buses");
  const trips = database.collection("trips");
  const drivers = database.collection("drivers");
  const transactions = database.collection("transactions");
  const activities = database.collection("activities");
  const now = new Date();

  const busResult = await buses.updateOne(
    { _id: snapshots.bus._id, status: "AVAILABLE" },
    { $set: { status: "ASSIGNED", assignedDriverId: chosen.driver.driverId, updatedAt: now } },
    { session }
  );
  if (busResult.modifiedCount !== 1) throw new Error("Bus was no longer AVAILABLE; aborting assignment.");

  const driverResult = await drivers.updateOne(
    { _id: snapshots.driver._id, status: "AVAILABLE" },
    { $set: { status: "ON_DUTY" } },
    { session }
  );
  if (driverResult.modifiedCount !== 1) throw new Error("Driver was no longer AVAILABLE; aborting assignment.");

  const tripResult = await trips.updateOne(
    { _id: snapshots.trip._id, status: "SCHEDULED" },
    { $set: {
      status: "ASSIGNED",
      busId: chosen.bus.busId,
      driverId: chosen.driver.driverId
    }},
    { session }
  );
  if (tripResult.modifiedCount !== 1) throw new Error("Trip was no longer SCHEDULED; aborting assignment.");

  await transactions.insertOne({
    transactionId,
    transactionType: "BUS_TRIP_ASSIGNMENT",
    busId: chosen.bus.busId,
    tripId: chosen.trip.tripId,
    driverId: chosen.driver.driverId,
    performedBy: userId,
    previousBusStatus: snapshots.bus.status,
    newBusStatus: "ASSIGNED",
    status: statusLabel,
    timestamp: now,
    metadata: { runId, demonstration: statusLabel }
  }, { session });

  await activities.insertOne({
    activityId,
    userId,
    action: "BUS_TRIP_ASSIGNMENT",
    entityType: "TRIP",
    entityId: chosen.trip.tripId,
    description: "Temporary bus/driver assignment for transaction demonstration",
    timestamp: now,
    metadata: { runId, demonstration: statusLabel }
  }, { session });
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

    const [bus, driver, trip, user] = await Promise.all([
      database.collection("buses").findOne({ status: "AVAILABLE" }),
      database.collection("drivers").findOne({ status: "AVAILABLE" }),
      database.collection("trips").findOne({ status: "SCHEDULED" }),
      database.collection("users").findOne({ userId, status: "ACTIVE" })
    ]);

    if (!bus || !driver || !trip || !user) {
      throw new Error("Could not find an AVAILABLE bus, AVAILABLE driver, SCHEDULED trip, and ACTIVE user; no transaction writes attempted.");
    }

    chosen = { bus, driver, trip };
    snapshots = {
      bus: { _id: bus._id, status: bus.status, assignedDriverId: bus.assignedDriverId, updatedAt: bus.updatedAt },
      driver: { _id: driver._id, status: driver.status },
      trip: { _id: trip._id, status: trip.status, busId: trip.busId, driverId: trip.driverId }
    };

    console.log("\nSelected temporary assignment:");
    console.log("Bus: " + bus.busId + " (" + bus.status + ")");
    console.log("Driver: " + driver.driverId + " (" + driver.status + ")");
    console.log("Trip: " + trip.tripId + " (" + trip.status + ")");
    check(true, "Eligible bus, driver, scheduled trip, and active user found");

    session = client.startSession();

    console.log("\n=== TEST 1: ATOMIC COMMIT ===");
    await session.withTransaction(async () => {
      await performAssignment(database, session, "COMMITTED", committedTransactionId, committedActivityId);
    });
    commitApplied = true;

    const [committedBus, committedDriver, committedTrip, committedTransaction, committedActivity] = await Promise.all([
      database.collection("buses").findOne({ _id: bus._id }),
      database.collection("drivers").findOne({ _id: driver._id }),
      database.collection("trips").findOne({ _id: trip._id }),
      database.collection("transactions").findOne({ transactionId: committedTransactionId }),
      database.collection("activities").findOne({ activityId: committedActivityId })
    ]);

    check(committedBus.status === "ASSIGNED" && committedBus.assignedDriverId === driver.driverId,
      "Commit updated bus status and assigned driver");
    check(committedDriver.status === "ON_DUTY", "Commit updated driver status");
    check(committedTrip.status === "ASSIGNED" && committedTrip.busId === bus.busId && committedTrip.driverId === driver.driverId,
      "Commit updated trip status and assignment");
    check(Boolean(committedTransaction) && Boolean(committedActivity),
      "Commit created transaction and audit activity in the same transaction");

    // Restore the original operational state before the rollback test.
    await restoreOperationalState(database);
    commitApplied = false;

    console.log("\n=== TEST 2: ATOMIC ROLLBACK ===");
    session.startTransaction();
    transactionStarted = true;
    await performAssignment(database, session, "ABORTED", rollbackTransactionId, rollbackActivityId);
    await session.abortTransaction();
    transactionStarted = false;

    const [rolledBackBus, rolledBackDriver, rolledBackTrip, rollbackTransaction, rollbackActivity] = await Promise.all([
      database.collection("buses").findOne({ _id: bus._id }),
      database.collection("drivers").findOne({ _id: driver._id }),
      database.collection("trips").findOne({ _id: trip._id }),
      database.collection("transactions").findOne({ transactionId: rollbackTransactionId }),
      database.collection("activities").findOne({ activityId: rollbackActivityId })
    ]);

    check(rolledBackBus.status === snapshots.bus.status &&
      rolledBackBus.assignedDriverId === snapshots.bus.assignedDriverId,
      "Rollback restored bus state; no assignment persisted");
    check(rolledBackDriver.status === snapshots.driver.status,
      "Rollback restored driver state");
    check(rolledBackTrip.status === snapshots.trip.status &&
      rolledBackTrip.busId === snapshots.trip.busId &&
      rolledBackTrip.driverId === snapshots.trip.driverId,
      "Rollback restored trip state");
    check(!rollbackTransaction && !rollbackActivity,
      "Rollback discarded transaction record and audit activity");

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

    if (connected) {
      const database = client.db(DB_NAME);
      try {
        if (commitApplied) await restoreOperationalState(database);

        await database.collection("activities").deleteMany({
          activityId: { $in: [committedActivityId, rollbackActivityId] }
        });
        await database.collection("transactions").deleteMany({
          transactionId: { $in: [committedTransactionId, rollbackTransactionId] }
        });

        const finalCounts = await getCounts(database);
        const finalTotal = Object.values(finalCounts).reduce((a, b) => a + b, 0);
        console.log("\n=== FINAL SAFETY CHECK ===");
        check(finalTotal === 2010, "Final total restored to 2010");
        check(JSON.stringify(finalCounts) === JSON.stringify(initialCounts),
          "All collection counts match their starting values");

        for (const [name, count] of Object.entries(finalCounts)) console.log(name + ": " + count);
        console.log("TOTAL: " + finalTotal);
      } catch (error) {
        failures++;
        console.error("Final verification/cleanup error:", error.stack || error.message);
      }
      if (session) {
        try { await session.endSession(); }
        catch (error) { failures++; console.error("Session cleanup error:", error.message); }
      }
      try { await client.close(); }
      catch (error) { failures++; console.error("Client close error:", error.message); }
    }
  }

  console.log("\n=== TRANSACTION DEMO SUMMARY ===");
  console.log("Failed checks/errors: " + failures);
  if (failures > 0) {
    console.log("RESULT: FAILED — inspect the error before retrying.");
    process.exitCode = 1;
  } else {
    console.log("RESULT: PASSED — atomic commit, rollback, and cleanup verified.");
  }
}

main().catch(error => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
