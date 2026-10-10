const fs = require("fs");
const path = require("path");

const sourceDir = path.resolve("data");
const outputDir = path.resolve("data/import_ready");

const collections = [
  "users", "masterData", "buses", "drivers", "routes",
  "trips", "maintenance", "fuelRecords",
  "transactions", "activities"
];

function convertDates(value) {
  if (Array.isArray(value)) {
    return value.map(convertDates);
  }

  if (value && typeof value === "object") {
    // Keep existing Extended JSON dates unchanged.
    if (
      Object.keys(value).length === 1 &&
      value.$date &&
      typeof value.$date === "string"
    ) {
      return value;
    }

    const result = {};
    for (const [key, item] of Object.entries(value)) {
      result[key] = convertDates(item);
    }
    return result;
  }

  if (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value) &&
    !Number.isNaN(Date.parse(value))
  ) {
    return { $date: value };
  }

  return value;
}

for (const name of collections) {
  const inputPath = path.join(sourceDir, `${name}.json`);
  const outputPath = path.join(outputDir, `${name}.json`);

  const input = JSON.parse(fs.readFileSync(inputPath, "utf8"));
  if (!Array.isArray(input)) {
    throw new Error(`${name}.json is not a JSON array`);
  }

  const output = convertDates(input);
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2) + "\n");

  console.log(`${name}: prepared ${output.length} documents`);
}
