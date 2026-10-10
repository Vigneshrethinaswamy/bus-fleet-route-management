const names = ["activities", "transactions"];

print("=== COLLECTION VALIDATORS AND SAMPLE DOCUMENTS ===");

for (const name of names) {
  print("\n--- " + name + " ---");

  const info = db.getCollectionInfos({ name })[0];

  if (!info) {
    print("FAIL: Collection not found.");
    continue;
  }

  print("Validator:");
  printjson(info.options?.validator || { note: "No validator reported" });

  print("Validation level: " + (info.options?.validationLevel || "unspecified"));
  print("Validation action: " + (info.options?.validationAction || "unspecified"));

  const sample = db.getCollection(name).findOne();

  print("Existing document:");
  printjson(sample);
}

print("\n=== END READ-ONLY INSPECTION ===");
