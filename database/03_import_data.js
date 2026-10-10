/*
 * Prepare and import the synthetic Bus Fleet & Route Management dataset.
 *
 * From the repository root, run:
 *   node prepare_import.js
 *
 * Then execute this file with mongosh to print the mongoimport commands:
 *   mongosh database/03_import_data.js
 *
 * The generated data/import_ready/*.json files use MongoDB Extended JSON
 * date values. The preparation script generates them from data/*.json.
 * Run imports against a clean database, or clear existing collections first
 * to avoid duplicate records.
 */

const collections = [
  "users",
  "masterData",
  "buses",
  "drivers",
  "routes",
  "trips",
  "maintenance",
  "fuelRecords",
  "transactions",
  "activities"
];

print("Prepare the import files first: node prepare_import.js");
print("Then run the following commands from the repository root:");

for (const name of collections) {
  print(
    `mongoimport --db bus_fleet_management --collection ${name} --file data/import_ready/${name}.json --jsonArray`
  );
}
