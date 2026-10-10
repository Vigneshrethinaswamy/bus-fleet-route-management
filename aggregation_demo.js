const trips = db.getCollection("trips");
const buses = db.getCollection("buses");
const routes = db.getCollection("routes");
const drivers = db.getCollection("drivers");
const maintenance = db.getCollection("maintenance");
const fuel = db.getCollection("fuelRecords");

let passed = 0;
let failed = 0;

function runPipeline(name, collection, pipeline) {
  try {
    const result = db.getCollection(collection).aggregate(pipeline).toArray();
    print("\n=== " + name + " ===");
    print("Result documents: " + result.length);
    result.slice(0, 3).forEach(printjson);
    print("[PASS] " + name);
    passed++;
  } catch (e) {
    print("[FAIL] " + name + ": " + e.message);
    failed++;
  }
}

print("=== AGGREGATION PIPELINE DEMONSTRATION ===");

// 1. Count trips by status
runPipeline("1. Trips grouped by status", "trips", [
  { $group: { _id: "$status", tripCount: { $sum: 1 } } },
  { $sort: { tripCount: -1 } }
]);

// 1b. Identify the single largest trip-status group
runPipeline("1b. Largest trip-status group", "trips", [
  { $group: {
      _id: "$status",
      tripCount: { $sum: 1 }
  }},
  { $sort: { tripCount: -1, _id: 1 } },
  { $limit: 1 },
  { $project: { status: "$_id", tripCount: 1, _id: 0 } }
]);

// 2. Average passenger count by trip type
runPipeline("2. Average passengers by trip type", "trips", [
  { $group: {
      _id: "$tripType",
      averagePassengers: { $avg: "$passengerCount" },
      tripCount: { $sum: 1 }
  }},
  { $sort: { averagePassengers: -1 } }
]);

// 3. Top routes by revenue
runPipeline("3. Top routes by revenue", "trips", [
  { $group: {
      _id: "$routeId",
      totalRevenue: { $sum: "$revenue" },
      tripCount: { $sum: 1 }
  }},
  { $sort: { totalRevenue: -1 } },
  { $limit: 5 },
  { $project: { routeId: "$_id", totalRevenue: 1, tripCount: 1, _id: 0 } }
]);

// 4. Revenue statistics
runPipeline("4. Revenue min, max, average", "trips", [
  { $group: {
      _id: null,
      totalRevenue: { $sum: "$revenue" },
      averageRevenue: { $avg: "$revenue" },
      minimumRevenue: { $min: "$revenue" },
      maximumRevenue: { $max: "$revenue" }
  }}
]);

// 5. Join trips with buses
runPipeline("5. Trips joined with buses", "trips", [
  { $lookup: {
      from: "buses",
      localField: "busId",
      foreignField: "busId",
      as: "bus"
  }},
  { $unwind: "$bus" },
  { $project: {
      tripId: 1, status: 1, routeId: 1,
      busId: 1, busRegistration: "$bus.registrationNumber"
  }},
  { $limit: 5 }
]);

// 6. Join trips with routes
runPipeline("6. Trips joined with routes", "trips", [
  { $lookup: {
      from: "routes",
      localField: "routeId",
      foreignField: "routeId",
      as: "route"
  }},
  { $unwind: "$route" },
  { $project: {
      tripId: 1, routeId: 1, routeName: "$route.routeName",
      source: "$route.source", destination: "$route.destination"
  }},
  { $limit: 5 }
]);

// 7. Join trips with drivers
runPipeline("7. Trips joined with drivers", "trips", [
  { $lookup: {
      from: "drivers",
      localField: "driverId",
      foreignField: "driverId",
      as: "driver"
  }},
  { $unwind: "$driver" },
  { $project: {
      tripId: 1, driverId: 1, driverName: "$driver.name",
      status: 1
  }},
  { $limit: 5 }
]);

// 8. Bus utilization summary
runPipeline("8. Bus trip and distance summary", "trips", [
  { $group: {
      _id: "$busId",
      totalTrips: { $sum: 1 },
      totalDistanceKm: { $sum: "$distanceTravelledKm" },
      averagePassengers: { $avg: "$passengerCount" }
  }},
  { $sort: { totalTrips: -1 } },
  { $limit: 5 }
]);

// 9. Fuel cost by bus
runPipeline("9. Fuel cost by bus", "fuelRecords", [
  { $group: {
      _id: "$busId",
      totalFuelLitres: { $sum: "$quantityLitres" },
      totalFuelCost: { $sum: "$totalCost" },
      averagePricePerLitre: { $avg: "$pricePerLitre" }
  }},
  { $sort: { totalFuelCost: -1 } },
  { $limit: 5 }
]);

// 10. Maintenance cost by type
runPipeline("10. Maintenance cost by type", "maintenance", [
  { $group: {
      _id: "$maintenanceType",
      totalCost: { $sum: "$totalCost" },
      averageCost: { $avg: "$totalCost" },
      minimumCost: { $min: "$totalCost" },
      maximumCost: { $max: "$totalCost" },
      records: { $sum: 1 }
  }},
  { $sort: { totalCost: -1 } }
]);

// 11. Collect unique trip statuses and trip IDs by route
runPipeline("11. Unique statuses and trip IDs by route", "trips", [
  { $group: {
      _id: "$routeId",
      statuses: { $addToSet: "$status" },
      tripIds: { $push: "$tripId" },
      tripCount: { $sum: 1 }
  }},
  { $sort: { tripCount: -1 } },
  { $limit: 5 },
  { $project: {
      tripCount: 1, statuses: 1,
      sampleTripIds: { $slice: ["$tripIds", 5] }
  }}
]);

// 12b. Paginated trip report: page 2, 10 records per page
runPipeline("12b. Paginated trip report (page 2)", "trips", [
  { $sort: { scheduledStart: 1, tripId: 1 } },
  { $skip: 10 },
  { $limit: 10 },
  { $project: {
      _id: 0,
      tripId: 1,
      routeId: 1,
      busId: 1,
      driverId: 1,
      scheduledStart: 1,
      status: 1
  }}
]);

// 12. Unwind route stops and count routes per stop name
runPipeline("12. Route stops grouped by name", "routes", [
  { $unwind: "$stops" },
  { $group: {
      _id: "$stops.name",
      routeCount: { $sum: 1 }
  }},
  { $sort: { routeCount: -1 } },
  { $limit: 10 }
]);

print("\n=== AGGREGATION SUMMARY ===");
print("Passed: " + passed);
print("Failed: " + failed);

if (failed > 0) {
  print("Some pipelines need adjustment.");
  quit(1);
}

print("AGGREGATION DEMONSTRATION PASSED.");
