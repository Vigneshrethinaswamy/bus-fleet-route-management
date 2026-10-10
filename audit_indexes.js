const names = [
  "users", "masterData", "buses", "drivers", "routes",
  "trips", "maintenance", "fuelRecords", "transactions", "activities"
];

print("\n=== INDEX AUDIT ===");

for (const name of names) {
  const coll = db.getCollection(name);
  print("\n--- " + name + " ---");

  for (const index of coll.getIndexes()) {
    printjson({
      name: index.name,
      key: index.key,
      unique: index.unique === true,
      sparse: index.sparse === true,
      partialFilterExpression: index.partialFilterExpression || null
    });
  }
}

print("\n=== MASTERDATA SAMPLE ===");
db.getCollection("masterData").findOne();

print("\n=== ARRAY FIELD CANDIDATES ===");
for (const name of names) {
  const sample = db.getCollection(name).findOne();
  if (!sample) continue;

  const arrays = Object.keys(sample).filter(key => Array.isArray(sample[key]));
  if (arrays.length) {
    print(name + ": " + arrays.join(", "));
  }
}
