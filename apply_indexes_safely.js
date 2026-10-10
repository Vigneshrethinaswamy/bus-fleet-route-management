const expectedTotal = 2010;

const uniqueIndexes = [
  { collection: "users",        keys: { userId: 1 },          name: "uq_users_userId" },
  { collection: "masterData",   keys: { category: 1, code: 1 }, name: "uq_master_category_code" },
  { collection: "buses",        keys: { busId: 1 },            name: "uq_buses_busId" },
  { collection: "drivers",     keys: { driverId: 1 },         name: "uq_drivers_driverId" },
  { collection: "routes",      keys: { routeId: 1 },          name: "uq_routes_routeId" },
  { collection: "trips",       keys: { tripId: 1 },           name: "uq_trips_tripId" },
  { collection: "maintenance", keys: { maintenanceId: 1 },   name: "uq_maintenance_id" },
  { collection: "fuelRecords",  keys: { fuelRecordId: 1 },    name: "uq_fuelRecords_id" },
  { collection: "transactions", keys: { transactionId: 1 },   name: "uq_transactions_id" },
  { collection: "activities",   keys: { activityId: 1 },     name: "uq_activities_id" }
];

const supportingIndexes = [
  { collection: "users", keys: { role: 1, status: 1 }, name: "idx_users_role_status" },
  { collection: "masterData", keys: { category: 1, status: 1 }, name: "idx_master_category_status" },
  { collection: "transactions", keys: { transactionType: 1, timestamp: -1 }, name: "idx_transactions_type_time" }
];

let errors = 0;
const collections = db.getCollectionNames();
const totalBefore = collections.reduce(
  (sum, name) => sum + db.getCollection(name).countDocuments(), 0
);

print("=== INDEX PREFLIGHT ===");
print("Documents before: " + totalBefore);

if (totalBefore !== expectedTotal) {
  print("FAIL: Expected " + expectedTotal + " documents.");
  quit(2);
}

for (const spec of uniqueIndexes) {
  if (!collections.includes(spec.collection)) {
    print("FAIL: Missing collection " + spec.collection);
    errors++;
    continue;
  }

  const coll = db.getCollection(spec.collection);
  const fields = Object.keys(spec.keys);
  const missingQuery = {};
  fields.forEach(field => {
    missingQuery[field] = { $in: [null, ""] };
  });

  const missing = coll.countDocuments({
    $or: fields.map(field => ({
      $or: [
        { [field]: { $exists: false } },
        { [field]: null },
        { [field]: "" }
      ]
    }))
  });

  const duplicatePipeline = [
    { $group: {
        _id: fields.length === 1
          ? "$" + fields[0]
          : fields.reduce((obj, field) => {
              obj[field] = "$" + field;
              return obj;
            }, {}),
        count: { $sum: 1 }
    }},
    { $match: { count: { $gt: 1 } }},
    { $limit: 5 }
  ];

  const duplicates = coll.aggregate(duplicatePipeline).toArray();

  if (missing > 0) {
    print("FAIL: " + spec.collection + " has " + missing + " documents with missing/empty index fields.");
    errors++;
  } else {
    print("PASS: " + spec.collection + " index fields populated.");
  }

  if (duplicates.length > 0) {
    print("FAIL: Duplicate keys in " + spec.collection + ":");
    duplicates.forEach(printjson);
    errors++;
  } else {
    print("PASS: No duplicate keys in " + spec.collection + ".");
  }
}

if (errors > 0) {
  print("\nSTOPPED: No indexes were created because preflight checks failed.");
  quit(2);
}

print("\n=== CREATING UNIQUE INDEXES ===");
for (const spec of uniqueIndexes) {
  db.getCollection(spec.collection).createIndex(
    spec.keys, { unique: true, name: spec.name }
  );
  print("PASS: " + spec.collection + " -> " + spec.name);
}

print("\n=== CREATING SUPPORTING INDEXES ===");
for (const spec of supportingIndexes) {
  db.getCollection(spec.collection).createIndex(
    spec.keys, { name: spec.name }
  );
  print("PASS: " + spec.collection + " -> " + spec.name);
}

print("\n=== VERIFYING RESULTS ===");
let verifyErrors = 0;

for (const spec of uniqueIndexes.concat(supportingIndexes)) {
  const indexes = db.getCollection(spec.collection).getIndexes();
  const found = indexes.some(index =>
    index.name === spec.name &&
    Object.keys(index.key).length === Object.keys(spec.keys).length &&
    Object.keys(spec.keys).every(key => index.key[key] === spec.keys[key]) &&
    (spec.collection === "users" && spec.name === "uq_users_userId"
      ? index.unique === true
      : true)
  );

  if (found) print("PASS: Verified " + spec.name);
  else {
    print("FAIL: Could not verify " + spec.name);
    verifyErrors++;
  }
}

const totalAfter = collections.reduce(
  (sum, name) => sum + db.getCollection(name).countDocuments(), 0
);

print("Documents after: " + totalAfter);

if (totalAfter !== expectedTotal) {
  print("FAIL: Document total changed unexpectedly.");
  verifyErrors++;
}

if (verifyErrors > 0) {
  print("INDEX VERIFICATION FAILED.");
  quit(3);
}

print("SUCCESS: Index creation and verification completed.");
