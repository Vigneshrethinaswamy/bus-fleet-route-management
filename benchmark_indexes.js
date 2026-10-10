const trips = db.getCollection("trips");
const sample = trips.findOne(
  { status: { $exists: true }, scheduledStart: { $type: "date" } }
);

if (!sample) {
  print("FAIL: No trip with a status and BSON Date scheduledStart was found.");
  quit(2);
}

const query = {
  status: sample.status,
  scheduledStart: {
    $gte: new Date("2020-01-01T00:00:00Z"),
    $lt: new Date("2035-01-01T00:00:00Z")
  }
};

function summarize(label, explain) {
  const stats = explain.executionStats;
  print("\n--- " + label + " ---");
  print("Returned documents: " + stats.nReturned);
  print("Documents examined: " + stats.totalDocsExamined);
  print("Index keys examined: " + stats.totalKeysExamined);
  print("Execution time (ms): " + stats.executionTimeMillis);
  print("Winning plan:");
  printjson(explain.queryPlanner.winningPlan);
}

print("=== QUERY PERFORMANCE COMPARISON ===");
print("Query status: " + sample.status);
print("Index: idx_trip_status_schedule");
print("Same query and date range used for both tests.");

const baseline = trips.find(query)
  .hint({ $natural: 1 })
  .explain("executionStats");

const indexed = trips.find(query)
  .hint("idx_trip_status_schedule")
  .explain("executionStats");

summarize("BASELINE: FORCED COLLECTION SCAN", baseline);
summarize("INDEXED: COMPOUND INDEX", indexed);

print("\n=== INTERPRETATION ===");
print("Baseline docs examined: " + baseline.executionStats.totalDocsExamined);
print("Indexed docs examined: " + indexed.executionStats.totalDocsExamined);
print("Baseline keys examined: " + baseline.executionStats.totalKeysExamined);
print("Indexed keys examined: " + indexed.executionStats.totalKeysExamined);

if (indexed.executionStats.nReturned !== baseline.executionStats.nReturned) {
  print("FAIL: Results differ between the two query plans.");
  quit(3);
}

if (indexed.executionStats.totalDocsExamined <
    baseline.executionStats.totalDocsExamined) {
  print("PASS: The index reduced documents examined for this query.");
} else {
  print("INFO: The index did not reduce documents examined for this query; inspect selectivity and the winning plan.");
}

print("PASS: Both plans returned the same number of documents.");
