/*
 * Required index design.
 * Run after 01_database_setup.js and data generation.
 */

const dbx = db.getSiblingDB("bus_fleet_management");

function ensureIndex(collection, keys, options = {}) {
  print(`Creating index on ${collection}: ${JSON.stringify(keys)}`);
  printjson(dbx.getCollection(collection).createIndex(keys, options));
}

// UNIQUE: registration number must be unique.
ensureIndex("buses", { registrationNumber: 1 }, { unique: true, name: "uq_bus_registration" });

// UNIQUE: business identifiers should be unique.
ensureIndex("drivers", { employeeCode: 1 }, { unique: true, name: "uq_driver_employee" });
ensureIndex("routes", { routeNumber: 1 }, { unique: true, name: "uq_route_number" });

// SPARSE: optional GPS device IDs do not exist on every bus.
ensureIndex("buses", { gpsDeviceId: 1 }, { sparse: true, name: "sparse_gps_device" });

// COMPOUND: common operational lookup.
ensureIndex(
  "trips",
  { status: 1, scheduledStart: 1 },
  { name: "idx_trip_status_schedule" }
);

// COMPOUND: bus operational history.
ensureIndex(
  "trips",
  { busId: 1, scheduledStart: -1 },
  { name: "idx_trip_bus_schedule" }
);

// MULTIKEY: routes.stops is an embedded array.
ensureIndex(
  "routes",
  { "stops.name": 1 },
  { name: "multikey_route_stop_name" }
);

// Additional useful indexes.
ensureIndex("trips", { routeId: 1 }, { name: "idx_trip_route" });
ensureIndex("trips", { driverId: 1 }, { name: "idx_trip_driver" });
ensureIndex("maintenance", { busId: 1, serviceDate: -1 }, { name: "idx_maintenance_bus_date" });
ensureIndex("fuelRecords", { busId: 1, date: -1 }, { name: "idx_fuel_bus_date" });
ensureIndex("activities", { entityType: 1, entityId: 1, timestamp: -1 }, { name: "idx_activity_entity_time" });

print("\nIndex inventory:");
for (const name of ["buses", "drivers", "routes", "trips", "maintenance", "fuelRecords", "activities"]) {
  print(`\n${name}`);
  printjson(dbx.getCollection(name).getIndexes());
}

print("\nIndex setup complete.");
