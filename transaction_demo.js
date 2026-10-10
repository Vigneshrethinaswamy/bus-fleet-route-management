const runId = "TXNTEST_" + new ObjectId().toString();
const expectedTotal = 2010;

const normalDB = db;
const normalActivities = normalDB.getCollection("activities");
const normalTransactions = normalDB.getCollection("transactions");

let passed = 0;
let failed = 0;
let activeSession = null;
let transactionStarted = false;

function assert(condition, message) {
  if (!condition) throw new Error("ASSERTION FAILED: " + message);
  print("PASS: " + message);
  passed++;
}

function totalDocuments() {
  return normalDB.getCollectionNames().reduce(
    (sum, name) => sum + normalDB.getCollection(name).countDocuments(), 0
  );
}

function activity(id, phase) {
  return {
    activityId: id,
    userId: "TXN_TEST_USER",
    action: "TRANSACTION_TEST",
    entityType: "TEST",
    entityId: runId,
    description: "Temporary transaction demonstration record",
    timestamp: new Date(),
    metadata: { runId: runId, phase: phase }
  };
}

function transaction(id, phase) {
  return {
    transactionId: id,
    transactionType: "TRANSACTION_TEST",
    busId: "TXN_TEST_BUS",
    performedBy: "TXN_TEST_USER",
    status: "TEST",
    timestamp: new Date(),
    metadata: { runId: runId, phase: phase }
  };
}

try {
  print("=== PREFLIGHT ===");
  const hello = normalDB.adminCommand({ hello: 1 });
  assert(hello.setName != null && hello.isWritablePrimary === true,
    "Connected to a writable replica-set primary");
  assert(totalDocuments() === expectedTotal,
    "Initial total is 2010 documents");

  const mongo = normalDB.getMongo();
  activeSession = mongo.startSession();
  const sessionDB = activeSession.getDatabase(normalDB.getName());
  const sessionActivities = sessionDB.getCollection("activities");
  const sessionTransactions = sessionDB.getCollection("transactions");

  print("\n=== COMMIT TEST ===");
  activeSession.startTransaction();
  transactionStarted = true;

  sessionActivities.insertOne(activity(runId + "_commit_a", "commit"));
  sessionTransactions.insertOne(transaction(runId + "_commit_t", "commit"));

  activeSession.commitTransaction();
  transactionStarted = false;

  assert(normalActivities.countDocuments({
    activityId: runId + "_commit_a"
  }) === 1, "Committed activity persisted");

  assert(normalTransactions.countDocuments({
    transactionId: runId + "_commit_t"
  }) === 1, "Committed transaction record persisted");

  print("\n=== ABORT / ROLLBACK TEST ===");
  activeSession.startTransaction();
  transactionStarted = true;

  sessionActivities.insertOne(activity(runId + "_abort_a", "abort"));
  sessionTransactions.insertOne(transaction(runId + "_abort_t", "abort"));

  activeSession.abortTransaction();
  transactionStarted = false;

  assert(normalActivities.countDocuments({
    activityId: runId + "_abort_a"
  }) === 0, "Aborted activity was rolled back");

  assert(normalTransactions.countDocuments({
    transactionId: runId + "_abort_t"
  }) === 0, "Aborted transaction record was rolled back");

} catch (e) {
  failed++;
  print("FAIL: " + e.message);

  if (activeSession && transactionStarted) {
    try {
      activeSession.abortTransaction();
      transactionStarted = false;
      print("INFO: Active transaction aborted during error handling.");
    } catch (abortError) {
      print("CLEANUP WARNING: " + abortError.message);
    }
  }
} finally {
  if (activeSession) {
    try { activeSession.endSession(); } catch (e) {
      print("Session close warning: " + e.message);
    }
  }

  // Clean up only this run's uniquely tagged records.
  try {
    normalActivities.deleteMany({ "metadata.runId": runId });
    normalTransactions.deleteMany({ "metadata.runId": runId });
  } catch (cleanupError) {
    failed++;
    print("CLEANUP FAILURE: " + cleanupError.message);
  }
}

try {
  const finalTotal = totalDocuments();
  assert(finalTotal === expectedTotal,
    "Database restored to 2010 documents");
} catch (e) {
  failed++;
  print("FAIL: " + e.message);
}

print("\n=== TRANSACTION SUMMARY ===");
print("Passed checks: " + passed);
print("Failed checks: " + failed);

if (failed > 0) {
  print("TRANSACTION DEMONSTRATION FAILED.");
  quit(1);
}

print("TRANSACTION DEMONSTRATION PASSED.");
