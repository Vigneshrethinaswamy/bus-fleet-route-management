const coll = db.getCollection("activities");
const expectedTotal = 2010;
const runId = "CRUDTEST_" + new ObjectId().toString();
const testIds = [runId + "_1", runId + "_2", runId + "_3"];

function assert(condition, message) {
  if (!condition) throw new Error("ASSERTION FAILED: " + message);
  print("PASS: " + message);
}

const before = db.getCollectionNames().reduce(
  (sum, name) => sum + db.getCollection(name).countDocuments(), 0
);

assert(before === expectedTotal, "Initial total is 2010");

try {
  print("\n=== CREATE ===");

  const one = coll.insertOne({
    activityId: testIds[0],
    userId: "CRUD_TEST_USER",
    action: "CRUD_TEST",
    entityType: "TEST",
    entityId: runId,
    description: "Temporary CRUD test",
    timestamp: new Date(),
    metadata: { testRun: runId, batch: 1 }
  });
  assert(one.acknowledged, "insertOne acknowledged");

  const many = coll.insertMany([
    {
      activityId: testIds[1],
      userId: "CRUD_TEST_USER",
      action: "CRUD_TEST",
      entityType: "TEST",
      entityId: runId,
      description: "Temporary CRUD test",
      timestamp: new Date(),
      metadata: { testRun: runId, batch: 2 }
    },
    {
      activityId: testIds[2],
      userId: "CRUD_TEST_USER",
      action: "CRUD_TEST",
      entityType: "TEST",
      entityId: runId,
      description: "Temporary CRUD test",
      timestamp: new Date(),
      metadata: { testRun: runId, batch: 2 }
    }
  ]);

  const insertedCount = Object.keys(many.insertedIds).length;
  assert(many.acknowledged && insertedCount === 2,
    "insertMany inserted two records");

  print("\n=== READ ===");
  assert(coll.find({ activityId: testIds[0] }).hasNext(),
    "find locates a record");
  assert(coll.findOne({ activityId: testIds[1] }) !== null,
    "findOne locates a record");
  assert(coll.countDocuments({ entityId: runId }) === 3,
    "All three test records exist");

  print("\n=== UPDATE ===");
  const updateOne = coll.updateOne(
    { activityId: testIds[0] },
    { $set: { description: "Updated by updateOne" } }
  );
  assert(updateOne.modifiedCount === 1, "updateOne modified one record");

  const updateMany = coll.updateMany(
    { entityId: runId },
    { $set: { "metadata.reviewed": true } }
  );
  assert(updateMany.modifiedCount === 3, "updateMany modified three records");

  print("\n=== DELETE ===");
  const deleteOne = coll.deleteOne({ activityId: testIds[0] });
  assert(deleteOne.deletedCount === 1, "deleteOne removed one record");

  const deleteMany = coll.deleteMany({ entityId: runId });
  assert(deleteMany.deletedCount === 2, "deleteMany removed two records");

  assert(coll.countDocuments({ entityId: runId }) === 0,
    "No test records remain");

} finally {
  coll.deleteMany({ activityId: { $in: testIds } });
}

const after = db.getCollectionNames().reduce(
  (sum, name) => sum + db.getCollection(name).countDocuments(), 0
);

assert(after === before, "Original document total restored");
assert(after === expectedTotal, "Final database total remains 2010");

print("\nCRUD DEMONSTRATION PASSED.");
