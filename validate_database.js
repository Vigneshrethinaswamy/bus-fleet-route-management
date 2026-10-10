const expectedCounts = {
  users: 60,
  masterData: 60,
  buses: 160,
  drivers: 120,
  routes: 120,
  trips: 600,
  maintenance: 180,
  fuelRecords: 360,
  transactions: 200,
  activities: 150
};

const idCandidates = {
  users: ["userId"],
  masterData: ["category", "code"],
  buses: ["busId"],
  drivers: ["driverId"],
  routes: ["routeId"],
  trips: ["tripId"],
  maintenance: ["maintenanceId", "recordId"],
  fuelRecords: ["fuelRecordId", "fuelId", "recordId"],
  transactions: ["transactionId"],
  activities: ["activityId"]
};

let passed = 0;
let failed = 0;
let warnings = 0;

function report(status, message) {
  print("[" + status + "] " + message);
  if (status === "PASS") passed++;
  else if (status === "FAIL") failed++;
  else warnings++;
}

print("\n=== BUS FLEET DATABASE VALIDATION ===");
print("Database: " + db.getName());

const infos = db.getCollectionInfos();
const infoByName = {};
infos.forEach(info => infoByName[info.name] = info);

const cache = {};

for (const [name, expected] of Object.entries(expectedCounts)) {
  if (!infoByName[name]) {
    report("FAIL", name + ": collection missing");
    continue;
  }

  const coll = db.getCollection(name);
  const count = coll.countDocuments();
  cache[name] = coll.find({}).toArray();

  if (count === expected) {
    report("PASS", name + ": " + count + " documents");
  } else {
    report("FAIL", name + ": expected " + expected + ", found " + count);
  }

  const candidates = idCandidates[name] || [];
  const isCompoundKey = name === "masterData";
  const sample = cache[name][0] || {};
  const idField = candidates.find(field =>
    Object.prototype.hasOwnProperty.call(sample, field)
  );

  if (cache[name].length === 0) {
    report("FAIL", name + ": no documents available to validate");
  } else if (isCompoundKey) {
    const fields = ["category", "code"];
    const missing = cache[name].filter(doc =>
      fields.some(field =>
        doc[field] === undefined || doc[field] === null || doc[field] === ""
      )
    ).length;

    const seen = new Set();
    let duplicates = 0;

    for (const doc of cache[name]) {
      if (fields.some(field =>
        doc[field] === undefined || doc[field] === null || doc[field] === ""
      )) continue;

      const key = JSON.stringify(fields.map(field => doc[field]));
      if (seen.has(key)) duplicates++;
      seen.add(key);
    }

    if (missing === 0) report("PASS", name + ".category+code: no missing business-key values");
    else report("FAIL", name + ".category+code: " + missing + " documents have missing business-key values");

    if (duplicates === 0) report("PASS", name + ".category+code: no duplicate compound keys");
    else report("FAIL", name + ".category+code: " + duplicates + " duplicate compound keys");
  } else if (!idField) {
    report("WARN", name + ": business ID field not recognized; checked _id uniqueness is guaranteed by MongoDB");
  } else {
    const missing = cache[name].filter(doc =>
      doc[idField] === undefined || doc[idField] === null || doc[idField] === ""
    ).length;

    const seen = new Set();
    let duplicates = 0;

    for (const doc of cache[name]) {
      if (doc[idField] === undefined || doc[idField] === null) continue;
      const key = typeof doc[idField] + ":" + String(doc[idField]);
      if (seen.has(key)) duplicates++;
      seen.add(key);
    }

    if (missing === 0) report("PASS", name + "." + idField + ": no missing IDs");
    else report("FAIL", name + "." + idField + ": " + missing + " missing IDs");

    if (duplicates === 0) report("PASS", name + "." + idField + ": no duplicate IDs");
    else report("FAIL", name + "." + idField + ": " + duplicates + " duplicate IDs");
  }

  const validator = infoByName[name].options?.validator;
  if (validator && Object.keys(validator).length > 0) {
    report("PASS", name + ": schema validator configured");
  } else {
    report("WARN", name + ": no schema validator detected");
  }

  const indexes = coll.getIndexes();
  if (indexes.length > 1) {
    report("PASS", name + ": " + indexes.length + " indexes including _id");
  } else {
    report("WARN", name + ": only the default _id index detected");
  }
}

function checkReferences(source, field, target, targetField) {
  if (!cache[source] || !cache[target]) return;

  const targetIds = new Set(
    cache[target]
      .map(doc => doc[targetField])
      .filter(value => value !== undefined && value !== null)
      .map(value => String(value))
  );

  let missing = 0;
  let orphaned = 0;

  for (const doc of cache[source]) {
    const value = doc[field];

    if (value === undefined || value === null || value === "") {
      missing++;
    } else if (!targetIds.has(String(value))) {
      orphaned++;
    }
  }

  if (missing === 0 && orphaned === 0) {
    report("PASS", source + "." + field + " -> " + target + "." + targetField + ": all references valid");
  } else {
    report("FAIL", source + "." + field + " -> " + target + "." + targetField +
      ": " + missing + " missing, " + orphaned + " unmatched references");
  }
}

print("\n=== REFERENCE INTEGRITY ===");
checkReferences("trips", "busId", "buses", "busId");
checkReferences("trips", "routeId", "routes", "routeId");
checkReferences("trips", "driverId", "drivers", "driverId");
checkReferences("maintenance", "busId", "buses", "busId");
checkReferences("fuelRecords", "busId", "buses", "busId");

print("\n=== SUMMARY ===");
print("PASS: " + passed);
print("FAIL: " + failed);
print("WARN: " + warnings);
print("TOTAL DOCUMENTS: " +
  Object.keys(expectedCounts).reduce((sum, name) =>
    sum + (cache[name] ? cache[name].length : 0), 0));

if (failed > 0) {
  print("\nVALIDATION FAILED. Review the failures above before proceeding.");
  quit(1);
} else {
  if (warnings > 0) print("\nVALIDATION PASSED WITH WARNINGS. Review them before proceeding.");
else print("\nVALIDATION PASSED.");
  quit(0);
}
