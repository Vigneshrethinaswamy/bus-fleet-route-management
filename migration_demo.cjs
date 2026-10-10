const fs = require("fs");
const path = require("path");
const { MongoClient } = require("mongodb");

const URI = "mongodb://127.0.0.1:27017/?replicaSet=rs0";
const SOURCE_DB = "bus_fleet_management";
const stamp = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
const TARGET_DB = "bus_fleet_migration_demo_" + stamp;
const sourceDir = path.join(__dirname, "migration", "source_tables");

const client = new MongoClient(URI);

function writeTable(name, rows) {
  fs.writeFileSync(
    path.join(sourceDir, name + ".json"),
    JSON.stringify(rows, null, 2),
    "utf8"
  );
  console.log("Exported " + name + ": " + rows.length + " rows");
}

function assert(condition, message) {
  if (!condition) throw new Error("VALIDATION FAILED: " + message);
  console.log("PASS: " + message);
}

async function readAll(db, name) {
  return db.collection(name).find({}, { projection: { _id: 0 } }).toArray();
}

async function main() {
  let targetCreated = false;

  try {
    await client.connect();

    const source = client.db(SOURCE_DB);
    const hello = await source.admin().command({ hello: 1 });

    assert(hello.setName === "rs0" && hello.isWritablePrimary === true,
      "Source database is reachable through writable replica set rs0");

    const originalNames = [
      "buses", "drivers", "routes", "trips"
    ];

    const originalCounts = {};
    for (const name of originalNames) {
      originalCounts[name] = await source.collection(name).countDocuments();
    }

    assert(
      originalCounts.buses === 160 &&
      originalCounts.drivers === 120 &&
      originalCounts.routes === 120 &&
      originalCounts.trips === 600,
      "Source counts match expected bus, driver, route and trip totals"
    );

    // Extract the synthetic source data as relational-style tables.
    const buses = await readAll(source, "buses");
    const drivers = await readAll(source, "drivers");
    const routes = await readAll(source, "routes");
    const trips = await readAll(source, "trips");

    const routeRows = [];
    const routeStopRows = [];

    for (const route of routes) {
      const { stops = [], ...routeColumns } = route;
      routeRows.push(routeColumns);

      stops.forEach((stop, index) => {
        const stopColumns = (
          stop && typeof stop === "object" && !Array.isArray(stop)
        ) ? stop : { name: String(stop) };

        routeStopRows.push({
          routeId: route.routeId,
          stopSequence: index + 1,
          ...stopColumns
        });
      });
    }

    fs.mkdirSync(sourceDir, { recursive: true });

    writeTable("BUS", buses);
    writeTable("DRIVER", drivers);
    writeTable("ROUTE", routeRows);
    writeTable("ROUTE_STOP", routeStopRows);
    writeTable("TRIP", trips);

    // Read the extracted files back: migration uses the extracts, not
    // the in-memory source collections.
    const loadTable = name => JSON.parse(
      fs.readFileSync(path.join(sourceDir, name + ".json"), "utf8")
    );

    const busRows = loadTable("BUS");
    const driverRows = loadTable("DRIVER");
    const routeTable = loadTable("ROUTE");
    const stopTable = loadTable("ROUTE_STOP");
    const tripRows = loadTable("TRIP");

    assert(busRows.length === originalCounts.buses, "BUS extract count verified");
    assert(driverRows.length === originalCounts.drivers, "DRIVER extract count verified");
    assert(routeTable.length === originalCounts.routes, "ROUTE extract count verified");
    assert(tripRows.length === originalCounts.trips, "TRIP extract count verified");

    // Reconstruct embedded route stops from the normalized stop table.
    const stopsByRoute = new Map();

    for (const row of stopTable) {
      const { routeId, stopSequence, ...stop } = row;
      if (!stopsByRoute.has(routeId)) stopsByRoute.set(routeId, []);
      stopsByRoute.get(routeId).push({ stopSequence, stop });
    }

    const migratedRoutes = routeTable.map(route => {
      const orderedStops = (stopsByRoute.get(route.routeId) || [])
        .sort((a, b) => a.stopSequence - b.stopSequence)
        .map(item => item.stop);

      return { ...route, stops: orderedStops };
    });

    // Each run gets a new target database; no existing target is overwritten.
    const target = client.db(TARGET_DB);
    const targetNames = await target.listCollections({}, { nameOnly: true }).toArray();

    if (targetNames.length !== 0) {
      throw new Error("New migration target is not empty; refusing to overwrite it.");
    }

    targetCreated = true;

    if (busRows.length) await target.collection("buses").insertMany(busRows);
    if (driverRows.length) await target.collection("drivers").insertMany(driverRows);
    if (migratedRoutes.length) await target.collection("routes").insertMany(migratedRoutes);
    if (tripRows.length) await target.collection("trips").insertMany(tripRows);

    // Create natural-key uniqueness constraints on the migrated collections.
    await target.collection("buses").createIndex({ busId: 1 }, { unique: true });
    await target.collection("drivers").createIndex({ driverId: 1 }, { unique: true });
    await target.collection("routes").createIndex({ routeId: 1 }, { unique: true });
    await target.collection("trips").createIndex({ tripId: 1 }, { unique: true });

    console.log("\n=== MIGRATION VALIDATION ===");

    for (const [name, expected] of Object.entries(originalCounts)) {
      const actual = await target.collection(name).countDocuments();
      assert(actual === expected, name + " migrated count: " + actual);
    }

    const busIds = new Set((await readAll(target, "buses")).map(x => x.busId));
    const driverIds = new Set((await readAll(target, "drivers")).map(x => x.driverId));
    const routeIds = new Set((await readAll(target, "routes")).map(x => x.routeId));

    const migratedTrips = await readAll(target, "trips");
    const invalidTrips = migratedTrips.filter(t =>
      !busIds.has(t.busId) ||
      !driverIds.has(t.driverId) ||
      !routeIds.has(t.routeId)
    );

    assert(invalidTrips.length === 0,
      "All migrated trip bus, driver and route references resolve");

    const sourceStops = stopTable.length;
    const targetStops = (await readAll(target, "routes"))
      .reduce((sum, route) => sum + (route.stops || []).length, 0);

    assert(sourceStops === targetStops,
      "Route-stop rows preserved after embedding (" + targetStops + " stops)");

    const targetCounts = {};
    for (const name of originalNames) {
      targetCounts[name] = await target.collection(name).countDocuments();
    }

    console.log("\n=== MIGRATION REPORT ===");
    console.log("Source database: " + SOURCE_DB);
    console.log("Migration target: " + TARGET_DB);
    console.log("Source format: JSON relational-style table extracts");
    console.log("Target collections: buses, drivers, routes, trips");
    console.log("Route-stop source rows: " + sourceStops);
    console.log("Embedded route stops: " + targetStops);
    console.log("Target counts:");
    console.log(JSON.stringify(targetCounts, null, 2));
    console.log("Source files: " + sourceDir);
    console.log("RESULT: MIGRATION AND VALIDATION PASSED");

  } catch (error) {
    console.error("\nMIGRATION ERROR:", error.stack || error.message);

    if (targetCreated) {
      try {
        await client.db(TARGET_DB).dropDatabase();
        console.log("Removed this run's incomplete migration target: " + TARGET_DB);
      } catch (cleanupError) {
        console.error("Target cleanup failed:", cleanupError.message);
      }
    }

    process.exitCode = 1;
  } finally {
    await client.close();
  }
}

main().catch(error => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
