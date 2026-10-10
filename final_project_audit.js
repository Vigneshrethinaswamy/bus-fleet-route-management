const expected = {
  activities: 150,
  buses: 160,
  drivers: 120,
  fuelRecords: 360,
  maintenance: 180,
  masterData: 60,
  routes: 120,
  transactions: 200,
  trips: 600,
  users: 60
};

let checks = 0;
let failures = 0;

function check(condition, message) {
  checks++;
  if (condition) {
    print("PASS: " + message);
  } else {
    failures++;
    print("FAIL: " + message);
  }
}

function countAll(database) {
  return database.getCollectionNames().reduce(
    (sum, name) => sum + database.getCollection(name).countDocuments(), 0
  );
}

function hasUniqueIndex(database, collectionName, key) {
  return database.getCollection(collectionName).getIndexes().some(index => {
    if (index.unique !== true) return false;
    const actualKeys = Object.keys(index.key);
    const expectedKeys = Object.keys(key);
    return actualKeys.length === expectedKeys.length &&
      expectedKeys.every(k => index.key[k] === key[k]);
  });
}

function auditReference(database, from, field, to, targetField) {
  const targetValues = database.getCollection(to).distinct(targetField);
  const targetSet = new Set(targetValues.map(value => String(value)));

  let invalid = 0;
  const examples = [];

  database.getCollection(from).find({}, { [field]: 1 }).forEach(doc => {
    if (doc[field] == null || !targetSet.has(String(doc[field]))) {
      invalid++;
      if (examples.length < 3) {
        examples.push({
          sourceId: doc._id,
          fieldValue: doc[field],
          fieldType: typeof doc[field]
        });
      }
    }
  });

  if (invalid > 0) {
    print("Reference failure examples for " + from + "." + field + ":");
    printjson(examples);
  }

  check(
    invalid === 0,
    from + "." + field + " -> " + to + "." + targetField +
      " (unresolved: " + invalid + ")"
  );
}

print("=== CORRECTED FINAL DATABASE AUDIT ===");

const admin = db.getSiblingDB("admin");
const hello = admin.runCommand({ hello: 1 });
const source = db.getSiblingDB("bus_fleet_management");

check(hello.setName === "rs0", "Replica set rs0 configured");
check(hello.isWritablePrimary === true, "Replica-set primary writable");

const names = source.getCollectionNames().sort();
check(
  JSON.stringify(names) === JSON.stringify(Object.keys(expected).sort()),
  "Original database has expected 10 collections"
);

for (const [name, count] of Object.entries(expected)) {
  check(
    source.getCollection(name).countDocuments() === count,
    name + " expected count " + count
  );
}
check(countAll(source) === 2010, "Original database total is 2010");

print("\n=== UNIQUE INDEXES ===");

const indexes = [
  ["users", { userId: 1 }],
  ["masterData", { category: 1, code: 1 }],
  ["buses", { busId: 1 }],
  ["buses", { registrationNumber: 1 }],
  ["drivers", { driverId: 1 }],
  ["drivers", { employeeCode: 1 }],
  ["routes", { routeId: 1 }],
  ["routes", { routeNumber: 1 }],
  ["trips", { tripId: 1 }],
  ["maintenance", { maintenanceId: 1 }],
  ["fuelRecords", { fuelRecordId: 1 }],
  ["transactions", { transactionId: 1 }],
  ["activities", { activityId: 1 }]
];

for (const [name, key] of indexes) {
  check(
    hasUniqueIndex(source, name, key),
    name + " unique index " + JSON.stringify(key)
  );
}

print("\n=== SOURCE REFERENCE INTEGRITY ===");

[
  ["trips", "busId", "buses", "busId"],
  ["trips", "routeId", "routes", "routeId"],
  ["trips", "driverId", "drivers", "driverId"],
  ["maintenance", "busId", "buses", "busId"],
  ["fuelRecords", "busId", "buses", "busId"]
].forEach(args => auditReference(source, ...args));

print("\n=== MIGRATION DATABASE ===");

const databaseNames = admin.runCommand({ listDatabases: 1, nameOnly: true })
  .databases.map(item => item.name);
const migrationTargets = databaseNames
  .filter(name => /^bus_fleet_migration_demo_[0-9]{14}$/.test(name))
  .sort()
  .reverse();
const migrationTargetName = migrationTargets[0];

check(
  Boolean(migrationTargetName),
  "A timestamped migration demo database exists"
);

const migration = db.getSiblingDB(
  migrationTargetName || "bus_fleet_migration_demo_unavailable"
);
print("Auditing migration target: " + (migrationTargetName || "not found"));
const migrationNames = migration.getCollectionNames().sort();

check(
  migrationNames.length === 4 &&
  ["buses", "drivers", "routes", "trips"].every(n => migrationNames.includes(n)),
  "Migration target contains expected four collections"
);

for (const [name, count] of Object.entries({
  buses: 160, drivers: 120, routes: 120, trips: 600
})) {
  check(
    migration.getCollection(name).countDocuments() === count,
    "Migrated " + name + " count is " + count
  );
}

const migratedRoutes = migration.getCollection("routes")
  .find({}, { stops: 1 }).toArray();

const stopCount = migratedRoutes.reduce(
  (sum, route) => sum + (Array.isArray(route.stops) ? route.stops.length : 0), 0
);
check(stopCount === 709, "All 709 route stops preserved");

[
  ["trips", "busId", "buses", "busId"],
  ["trips", "routeId", "routes", "routeId"],
  ["trips", "driverId", "drivers", "driverId"]
].forEach(args => auditReference(migration, ...args));

print("\n=== FINAL SUMMARY ===");
print("Checks executed: " + checks);
print("Failed checks: " + failures);
print("Original database documents: " + countAll(source));

if (failures === 0) {
  print("RESULT: ALL FINAL AUDIT CHECKS PASSED");
} else {
  print("RESULT: AUDIT FAILED — inspect the specific failures above");
  quit(1);
}
