const names = [
  "users", "masterData", "buses", "drivers", "routes",
  "trips", "maintenance", "fuelRecords", "transactions", "activities"
];

print("=== COLLECTION AND INDEX DIAGNOSTIC ===");

for (const name of names) {
  const coll = db.getCollection(name);
  const count = coll.countDocuments();
  const sample = coll.findOne();
  const indexes = coll.getIndexes();

  print("\nCOLLECTION: " + name);
  print("Document count: " + count);
  print("Sample exists: " + (sample !== null));

  if (sample) {
    print("Sample fields: " + Object.keys(sample).join(", "));
  }

  print("Indexes:");
  for (const idx of indexes) {
    printjson({
      name: idx.name,
      key: idx.key,
      unique: idx.unique === true,
      sparse: idx.sparse === true,
      multikeyCandidate: Object.keys(idx.key).some(k => k.includes("."))
    });
  }
}

print("\n=== MASTERDATA DIAGNOSTIC ===");
const md = db.getCollection("masterData");
print("Namespace: " + db.getName() + "." + md.getName());
print("Count: " + md.countDocuments());
print("First document:");
printjson(md.findOne());
print("Sample of up to 3 documents:");
md.find().limit(3).forEach(printjson);
