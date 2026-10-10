/*
 * CRUD + comparison/logical operators + projection + limit/skip
 */

const dbx = db.getSiblingDB("bus_fleet_management");

// INSERT ONE
dbx.buses.insertOne({
  busId: "BUS_DEMO_001",
  registrationNumber: "KA99ZZ9999",
  fleetNumber: "DEMO-001",
  busType: "AC_DIESEL",
  manufacturer: "Demo Manufacturer",
  model: "Demo Bus",
  manufacturingYear: 2025,
  seatingCapacity: 50,
  status: "AVAILABLE",
  depot: {
    depotId: "DEP001",
    name: "Electronic City Depot",
    city: "Bengaluru"
  },
  features: ["GPS", "CCTV"],
  totalDistanceKm: 0,
  totalTrips: 0,
  createdAt: new Date(),
  updatedAt: new Date()
});

// INSERT MANY
dbx.masterData.insertMany([
  {
    category: "DEMO_CATEGORY",
    code: "DEMO_A",
    name: "Demo A",
    description: "CRUD demonstration",
    attributes: { demo: true },
    status: "ACTIVE"
  },
  {
    category: "DEMO_CATEGORY",
    code: "DEMO_B",
    name: "Demo B",
    description: "CRUD demonstration",
    attributes: { demo: true },
    status: "ACTIVE"
  }
]);

// FIND
dbx.buses.find({ status: "AVAILABLE" });

// FIND ONE
dbx.buses.findOne({ busId: "BUS_DEMO_001" });

// COMPARISON OPERATORS
dbx.buses.find({
  seatingCapacity: { $gte: 40, $lte: 60 }
});

dbx.trips.find({
  revenue: { $gt: 2000 }
});

dbx.buses.find({
  busType: { $in: ["AC_DIESEL", "ELECTRIC"] }
});

// LOGICAL OPERATORS
dbx.buses.find({
  $or: [
    { status: "AVAILABLE" },
    { status: "ASSIGNED" }
  ]
});

dbx.trips.find({
  $and: [
    { status: "COMPLETED" },
    { passengerCount: { $gte: 30 } }
  ]
});

// PROJECTION
dbx.buses.find(
  { status: "AVAILABLE" },
  {
    _id: 0,
    busId: 1,
    registrationNumber: 1,
    busType: 1,
    status: 1
  }
).limit(10);

// LIMIT + SKIP
dbx.buses.find({}).sort({ totalDistanceKm: -1 }).limit(10);
dbx.buses.find({}).sort({ totalDistanceKm: -1 }).skip(10).limit(10);

// $elemMatch: embedded incident array
dbx.trips.find({
  incidents: {
    $elemMatch: {
      severity: "HIGH",
      type: "ACCIDENT"
    }
  }
});

// $slice: first 3 route stops
dbx.routes.find(
  {},
  {
    _id: 0,
    routeId: 1,
    routeName: 1,
    stops: { $slice: 3 }
  }
).limit(5);

// UPDATE ONE
dbx.buses.updateOne(
  { busId: "BUS_DEMO_001" },
  {
    $set: {
      status: "ASSIGNED",
      updatedAt: new Date()
    }
  }
);

// UPDATE MANY
dbx.buses.updateMany(
  { status: "INACTIVE" },
  { $set: { updatedAt: new Date() } }
);

// DELETE ONE
dbx.buses.deleteOne({ busId: "BUS_DEMO_001" });

// DELETE MANY: only synthetic demo records
dbx.masterData.deleteMany({ category: "DEMO_CATEGORY" });

print("CRUD demonstration complete.");
