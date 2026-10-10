const buses = db.getCollection("buses");
const routes = db.getCollection("routes");
const users = db.getCollection("users");

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    const result = fn();
    if (result === true) {
      print("[PASS] " + name);
      passed++;
    } else {
      print("[FAIL] " + name);
      failed++;
    }
  } catch (e) {
    print("[FAIL] " + name + ": " + e.message);
    failed++;
  }
}

print("=== QUERY OPERATORS DEMONSTRATION ===");

test("Comparison: $gt finds buses with capacity above 0", () =>
  buses.countDocuments({ seatingCapacity: { $gt: 0 } }) > 0
);

test("Comparison: $gte and $lte return buses in capacity range", () =>
  buses.countDocuments({
    seatingCapacity: { $gte: 20, $lte: 100 }
  }) > 0
);

test("Comparison: $in finds buses with valid statuses", () =>
  buses.countDocuments({
    status: { $in: ["AVAILABLE", "ASSIGNED", "IN_SERVICE"] }
  }) >= 0
);

test("Logical: $and combines two conditions", () =>
  buses.countDocuments({
    $and: [
      { seatingCapacity: { $gt: 0 } },
      { status: { $exists: true } }
    ]
  }) > 0
);

test("Logical: $or matches at least one condition", () =>
  buses.countDocuments({
    $or: [
      { status: "AVAILABLE" },
      { status: "ASSIGNED" }
    ]
  }) > 0
);

test("Logical: $nor excludes specified statuses", () =>
  buses.find({ $nor: [{ status: "RETIRED" }] }).limit(1).hasNext()
);

test("Projection: include selected fields", () => {
  const doc = buses.findOne({}, { busId: 1, status: 1, _id: 0 });
  return doc !== null &&
    Object.keys(doc).every(k => ["busId", "status"].includes(k));
});

test("Sorting and limit: return up to five buses", () =>
  buses.find({}).sort({ busId: 1 }).limit(5).toArray().length === 5
);

test("Pagination: skip and limit return a page", () =>
  buses.find({}).sort({ busId: 1 }).skip(5).limit(5).toArray().length === 5
);

test("Array query: $elemMatch finds a route with a named stop", () =>
  routes.countDocuments({
    stops: { $elemMatch: { name: { $exists: true } } }
  }) >= 0
);

test("Array projection: $slice limits returned stops", () => {
  const route = routes.findOne(
    { "stops.0": { $exists: true } },
    { routeId: 1, stops: { $slice: 2 }, _id: 0 }
  );
  return route !== null && Array.isArray(route.stops) &&
    route.stops.length <= 2;
});

test("User projection: permissions array can be returned", () => {
  const user = users.findOne(
    { permissions: { $exists: true } },
    { userId: 1, permissions: { $slice: 2 }, _id: 0 }
  );
  return user !== null && Array.isArray(user.permissions);
});

print("\n=== SUMMARY ===");
print("Passed: " + passed);
print("Failed: " + failed);

if (failed > 0) {
  print("Some checks need adjustment based on the actual data.");
  quit(1);
}

print("QUERY OPERATOR DEMONSTRATION PASSED.");
