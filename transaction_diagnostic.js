const database = db;
let total = 0;

print("=== TRANSACTION FAILURE DIAGNOSTIC ===");

const hello = database.adminCommand({ hello: 1 });
print("Replica set: " + (hello.setName || "not reported"));
print("Writable primary: " + (hello.isWritablePrimary === true));

print("\n=== COLLECTION COUNTS ===");
for (const name of database.getCollectionNames().sort()) {
  const coll = database.getCollection(name);
  const count = coll.countDocuments();
  total += count;
  print(name + ": " + count);
}

print("TOTAL DOCUMENTS: " + total);

print("\n=== TRANSACTION TEST RECORD AUDIT ===");
for (const name of ["activities", "transactions"]) {
  const coll = database.getCollection(name);
  const matches = coll.find({
    $or: [
      { action: "TRANSACTION_TEST" },
      { transactionType: "TRANSACTION_TEST" },
      { "metadata.runId": { $regex: "^TXNTEST_" } }
    ]
  }).limit(10).toArray();

  print(name + " matching test records: " + matches.length);
  matches.forEach(doc => printjson({
    _id: doc._id,
    activityId: doc.activityId,
    transactionId: doc.transactionId,
    entityId: doc.entityId,
    metadata: doc.metadata
  }));
}

print("\n=== RESULT ===");
if (total === 2010 && hello.isWritablePrimary === true) {
  print("PASS: Expected document total and writable primary confirmed.");
} else {
  print("WARN: Review the counts or replica-set state before proceeding.");
}
