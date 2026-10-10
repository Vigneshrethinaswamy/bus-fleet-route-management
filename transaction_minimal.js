const runId = "TXN_MIN_" + new ObjectId().toString();
const uri = "mongodb://127.0.0.1:27017/bus_fleet_management";
const expectedTotal = 2010;

const client = new Mongo(uri);
const session = client.startSession();
const baseDB = db;
let started = false;
let failure = null;

try {
  const hello = baseDB.adminCommand({ hello: 1 });
  if (!hello.setName || hello.isWritablePrimary !== true) {
    throw new Error("No writable replica-set primary.");
  }

  const before = baseDB.getCollectionNames().reduce(
    (sum, name) => sum + baseDB.getCollection(name).countDocuments(), 0
  );
  if (before !== expectedTotal) {
    throw new Error("Expected 2010 documents, found " + before);
  }

  const sessionDB = session.getDatabase("bus_fleet_management");
  const coll = sessionDB.getCollection("activities");

  print("Starting minimal transaction...");
  session.startTransaction();
  started = true;

  coll.insertOne({
    activityId: runId,
    userId: "TXN_MIN_TEST",
    action: "TXN_MIN_TEST",
    entityType: "TEST",
    entityId: runId,
    description: "Temporary minimal transaction test",
    timestamp: new Date(),
    metadata: { runId: runId }
  }, { session: session });

  session.commitTransaction();
  started = false;
  print("PASS: Transaction committed.");

  const found = baseDB.getCollection("activities").countDocuments({
    activityId: runId
  });
  if (found !== 1) throw new Error("Committed document not visible.");
  print("PASS: Committed document is visible.");

} catch (e) {
  failure = e;
  print("FAIL: " + e.message);

  if (started) {
    try {
      session.abortTransaction();
      started = false;
      print("Transaction aborted.");
    } catch (abortError) {
      print("Abort warning: " + abortError.message);
    }
  }
} finally {
  try { session.endSession(); } catch (e) {}
  try { client.close(); } catch (e) {}

  try {
    baseDB.getCollection("activities").deleteOne({ activityId: runId });
  } catch (cleanupError) {
    print("Cleanup warning: " + cleanupError.message);
    failure = failure || cleanupError;
  }
}

const after = baseDB.getCollectionNames().reduce(
  (sum, name) => sum + baseDB.getCollection(name).countDocuments(), 0
);
print("Final document total: " + after);

if (after !== expectedTotal) {
  print("FAIL: Document count changed unexpectedly.");
  quit(1);
}

if (failure) quit(1);
print("MINIMAL TRANSACTION TEST PASSED.");
