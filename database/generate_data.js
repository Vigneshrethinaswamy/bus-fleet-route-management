/*
 * Deterministic synthetic dataset generator.
 * No external packages required.
 *
 * Run:
 *   node database/generate_data.js
 *
 * It writes JSON arrays into data/.
 */

const fs = require("fs");
const path = require("path");

const OUT = path.join(__dirname, "..", "data");
fs.mkdirSync(OUT, { recursive: true });

const COUNTS = {
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

// Deterministic pseudo-random generator.
let seed = 214;
function rand() {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
}
function pick(arr) { return arr[Math.floor(rand() * arr.length)]; }
function int(min, max) { return Math.floor(rand() * (max - min + 1)) + min; }
function fixed(n, digits = 2) { return Number(n.toFixed(digits)); }
function dateFromDaysAgo(maxDays) {
  const now = Date.now();
  return new Date(now - int(0, maxDays) * 86400000 - int(0, 23) * 3600000);
}
function isoDate(d) { return { "$date": d.toISOString() }; }

const cities = [
  "Bengaluru", "Mysuru", "Tumakuru", "Hosur", "Mandya",
  "Chennai", "Hyderabad", "Coimbatore"
];
const depots = [
  ["DEP001", "Electronic City Depot", "Bengaluru"],
  ["DEP002", "Peenya Depot", "Bengaluru"],
  ["DEP003", "Shantinagar Depot", "Bengaluru"],
  ["DEP004", "Mysuru Central Depot", "Mysuru"],
  ["DEP005", "Tumakuru Depot", "Tumakuru"]
];
const busTypes = ["AC_DIESEL", "NON_AC_DIESEL", "CNG", "ELECTRIC"];
const manufacturers = ["Ashok Leyland", "Tata Motors", "Volvo", "Eicher"];
const busStatuses = ["AVAILABLE", "ASSIGNED", "MAINTENANCE", "INACTIVE"];
const tripStatuses = ["SCHEDULED", "ASSIGNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"];
const routeCategories = ["CITY", "SUBURBAN", "EXPRESS", "AIRPORT"];
const names = [
  "Arun Kumar", "Ravi Kumar", "Suresh Babu", "Kiran Raj", "Manoj Kumar",
  "Prakash S", "Vijay Kumar", "Naveen R", "Ajay Rao", "Rahul M",
  "Sanjay P", "Dinesh K", "Mahesh V", "Ramesh T", "Vikram S"
];
const stopNames = [
  "Electronic City", "Silk Board", "BTM Layout", "Jayanagar",
  "Shantinagar", "Majestic", "Yeshwanthpur", "Peenya",
  "Hebbal", "KR Puram", "Whitefield", "Marathahalli",
  "Airport", "Banashankari", "JP Nagar", "Koramangala",
  "Indiranagar", "Domlur", "Rajajinagar", "Mysuru Road"
];
const features = ["GPS", "CCTV", "AC", "USB_CHARGING", "PANIC_BUTTON", "WIFI"];
const certifications = ["DEFENSIVE_DRIVING", "FIRST_AID", "FIRE_SAFETY", "ECO_DRIVING"];

const users = [];
for (let i = 1; i <= COUNTS.users; i++) {
  const role = i <= 3 ? "ADMIN" : pick(["FLEET_MANAGER", "DISPATCHER", "ANALYST"]);
  users.push({
    userId: `USR${String(i).padStart(4, "0")}`,
    name: pick(names),
    email: `user${i}@busfleet.example`,
    role,
    phone: `+9190000${String(i).padStart(5, "0")}`,
    status: i <= 55 ? "ACTIVE" : "INACTIVE",
    permissions: role === "ADMIN"
      ? ["BUS_READ", "BUS_UPDATE", "TRIP_ASSIGN", "REPORT_VIEW", "USER_MANAGE"]
      : role === "FLEET_MANAGER"
        ? ["BUS_READ", "BUS_UPDATE", "TRIP_ASSIGN", "REPORT_VIEW"]
        : role === "DISPATCHER"
          ? ["BUS_READ", "TRIP_ASSIGN", "REPORT_VIEW"]
          : ["BUS_READ", "REPORT_VIEW"],
    createdAt: isoDate(dateFromDaysAgo(500))
  });
}

const masterData = [];
let md = 1;
for (const [category, values] of Object.entries({
  BUS_TYPE: busTypes,
  FUEL_TYPE: ["DIESEL", "CNG", "ELECTRIC"],
  BUS_STATUS: busStatuses,
  TRIP_STATUS: tripStatuses,
  MAINTENANCE_TYPE: ["PREVENTIVE", "CORRECTIVE", "INSPECTION"],
  ROUTE_CATEGORY: routeCategories,
  USER_ROLE: ["ADMIN", "FLEET_MANAGER", "DISPATCHER", "ANALYST"]
})) {
  for (const code of values) {
    masterData.push({
      category,
      code,
      name: code.replaceAll("_", " "),
      description: `Synthetic master-data value for ${category}`,
      attributes: { source: "SYNTHETIC_DATASET", sequence: md++ },
      status: "ACTIVE"
    });
  }
}
// Pad masterData to 60 documents.
while (masterData.length < COUNTS.masterData) {
  masterData.push({
    category: "OPERATIONAL_CODE",
    code: `CODE_${String(masterData.length + 1).padStart(3, "0")}`,
    name: `Operational Code ${masterData.length + 1}`,
    description: "Synthetic operational master data",
    attributes: { source: "SYNTHETIC_DATASET", sequence: md++ },
    status: "ACTIVE"
  });
}

const drivers = [];
for (let i = 1; i <= COUNTS.drivers; i++) {
  drivers.push({
    driverId: `DRV${String(i).padStart(4, "0")}`,
    employeeCode: `EMP${String(i).padStart(5, "0")}`,
    name: pick(names),
    licenseNumber: `KA-LIC-${String(i).padStart(6, "0")}`,
    licenseCategory: "HEAVY_TRANSPORT",
    experienceYears: int(2, 20),
    phone: `+9191000${String(i).padStart(5, "0")}`,
    depotId: pick(depots)[0],
    status: pick(["AVAILABLE", "ON_DUTY", "AVAILABLE", "LEAVE"]),
    certifications: [pick(certifications), pick(certifications)],
    rating: fixed(3.4 + rand() * 1.6, 1),
    totalTrips: int(120, 1200),
    joiningDate: dateFromDaysAgo(2500),
    createdAt: dateFromDaysAgo(1500)
  });
}

const buses = [];
for (let i = 1; i <= COUNTS.buses; i++) {
  const type = pick(busTypes);
  const depot = pick(depots);
  const bus = {
    busId: `BUS${String(i).padStart(4, "0")}`,
    registrationNumber: `KA${String(int(1, 99)).padStart(2, "0")}${String.fromCharCode(65 + (i % 26))}${String.fromCharCode(65 + ((i * 3) % 26))}${String(1000 + i)}`,
    fleetNumber: `BLR-${String(i).padStart(3, "0")}`,
    busType: type,
    manufacturer: pick(manufacturers),
    model: type === "ELECTRIC" ? "Starbus EV" : pick(["Viking", "Starbus", "Ultra", "Skyline"]),
    manufacturingYear: int(2019, 2025),
    seatingCapacity: type === "ELECTRIC" ? int(30, 45) : int(40, 60),
    status: pick(busStatuses),
    depot: { depotId: depot[0], name: depot[1], city: depot[2] },
    currentLocation: {
      latitude: fixed(12.7 + rand() * 0.35, 6),
      longitude: fixed(77.45 + rand() * 0.45, 6)
    },
    features: [
      pick(features),
      pick(features),
      pick(features)
    ].filter((v, idx, a) => a.indexOf(v) === idx),
    totalDistanceKm: fixed(5000 + rand() * 50000, 1),
    totalTrips: int(100, 1400),
    createdAt: dateFromDaysAgo(1500),
    updatedAt: dateFromDaysAgo(30)
  };
  // Optional field deliberately absent for a subset to demonstrate sparse indexing.
  if (i % 4 !== 0) bus.gpsDeviceId = `GPS-${String(i).padStart(6, "0")}`;
  buses.push(bus);
}

const routes = [];
for (let i = 1; i <= COUNTS.routes; i++) {
  const category = pick(routeCategories);
  const source = pick(stopNames);
  let destination = pick(stopNames);
  while (destination === source) destination = pick(stopNames);
  const stopCount = int(4, 8);
  const used = new Set([source, destination]);
  const stops = [{
    stopId: `ST${String(i).padStart(4, "0")}_01`,
    name: source,
    sequence: 1,
    distanceFromOriginKm: 0
  }];
  for (let s = 2; s < stopCount; s++) {
    let name = pick(stopNames);
    let guard = 0;
    while (used.has(name) && guard++ < 20) name = pick(stopNames);
    used.add(name);
    stops.push({
      stopId: `ST${String(i).padStart(4, "0")}_${String(s).padStart(2, "0")}`,
      name,
      sequence: s,
      distanceFromOriginKm: fixed((i % 20) + (s - 1) * (1.5 + rand() * 5), 1)
    });
  }
  stops.push({
    stopId: `ST${String(i).padStart(4, "0")}_${String(stopCount).padStart(2, "0")}`,
    name: destination,
    sequence: stopCount,
    distanceFromOriginKm: fixed(8 + rand() * 55, 1)
  });
  const totalDistanceKm = stops[stops.length - 1].distanceFromOriginKm;
  routes.push({
    routeId: `RT${String(i).padStart(4, "0")}`,
    routeNumber: `${100 + i}`,
    routeName: `${source} - ${destination}`,
    category,
    source: { stopId: stops[0].stopId, name: source },
    destination: { stopId: stops.at(-1).stopId, name: destination },
    totalDistanceKm,
    estimatedDurationMinutes: int(35, 150),
    fare: int(15, 90),
    status: i <= 112 ? "ACTIVE" : "INACTIVE",
    stops,
    operatingDays: ["MON", "TUE", "WED", "THU", "FRI", "SAT"].slice(0, int(4, 6)),
    createdAt: dateFromDaysAgo(900)
  });
}

const trips = [];
for (let i = 1; i <= COUNTS.trips; i++) {
  const route = pick(routes);
  const bus = pick(buses);
  const driver = pick(drivers);
  const status = pick(tripStatuses);
  const passengerCount = int(8, Math.max(10, bus.seatingCapacity));
  const farePerPassenger = route.fare;
  const distance = fixed(route.totalDistanceKm * (0.95 + rand() * 0.15), 1);
  const fuel = bus.busType === "ELECTRIC" ? 0 : fixed(distance / (2.8 + rand() * 2.2), 2);
  const start = dateFromDaysAgo(180);
  const end = new Date(start.getTime() + int(35, 150) * 60000);
  const trip = {
    tripId: `TRP${String(i).padStart(6, "0")}`,
    routeId: route.routeId,
    busId: bus.busId,
    driverId: driver.driverId,
    scheduledStart: isoDate(start),
    scheduledEnd: isoDate(end),
    status,
    passengerCount,
    farePerPassenger,
    revenue: fixed(passengerCount * farePerPassenger, 2),
    distanceTravelledKm: distance,
    fuelConsumedLitres: fuel,
    tripType: pick(["REGULAR", "REGULAR", "REGULAR", "SPECIAL", "CHARTER"]),
    incidents: []
  };
  if (i % 23 === 0) {
    trip.incidents.push({
      type: "TRAFFIC_DELAY",
      severity: "LOW",
      description: "Synthetic traffic delay"
    });
  }
  if (i % 97 === 0) {
    trip.incidents.push({
      type: "ACCIDENT",
      severity: "HIGH",
      description: "Synthetic minor incident for query testing"
    });
  }
  if (status === "COMPLETED") {
    trip.actualStart = isoDate(new Date(start.getTime() + 5 * 60000));
    trip.actualEnd = isoDate(new Date(end.getTime() + 8 * 60000));
  }
  trip.createdAt = isoDate(dateFromDaysAgo(200));
  trips.push(trip);
}

const maintenance = [];
for (let i = 1; i <= COUNTS.maintenance; i++) {
  const bus = pick(buses);
  const parts = [
    { partName: "Engine Oil", quantity: int(4, 10), unitCost: int(600, 1100) },
    { partName: pick(["Oil Filter", "Air Filter", "Brake Pad", "Coolant"]), quantity: int(1, 4), unitCost: int(300, 2200) }
  ];
  const totalCost = parts.reduce((sum, p) => sum + p.quantity * p.unitCost, 0);
  maintenance.push({
    maintenanceId: `MNT${String(i).padStart(5, "0")}`,
    busId: bus.busId,
    maintenanceType: pick(["PREVENTIVE", "PREVENTIVE", "CORRECTIVE", "INSPECTION"]),
    serviceDate: dateFromDaysAgo(365),
    odometerKm: fixed(bus.totalDistanceKm * (0.6 + rand() * 0.4), 1),
    description: "Synthetic fleet maintenance record",
    parts,
    totalCost,
    workshop: { name: pick(["Central Fleet Workshop", "North Fleet Workshop", "South Fleet Workshop"]), city: "Bengaluru" },
    status: pick(["COMPLETED", "COMPLETED", "IN_PROGRESS", "SCHEDULED"]),
    nextServiceKm: fixed(bus.totalDistanceKm + int(3000, 8000), 1)
  });
}

const fuelRecords = [];
for (let i = 1; i <= COUNTS.fuelRecords; i++) {
  const bus = pick(buses);
  const fuelType = bus.busType === "CNG" ? "CNG" : bus.busType === "ELECTRIC" ? "ELECTRIC" : "DIESEL";
  const quantity = fuelType === "ELECTRIC" ? 0 : fixed(25 + rand() * 45, 2);
  const price = fuelType === "DIESEL" ? 91.25 : fuelType === "CNG" ? 78.5 : 0;
  fuelRecords.push({
    fuelRecordId: `FUEL${String(i).padStart(6, "0")}`,
    busId: bus.busId,
    date: dateFromDaysAgo(180),
    fuelType,
    quantityLitres: quantity,
    pricePerLitre: price,
    totalCost: fixed(quantity * price, 2),
    odometerKm: fixed(bus.totalDistanceKm * (0.5 + rand() * 0.5), 1),
    fuelStation: {
      stationId: `FS${String(int(1, 15)).padStart(3, "0")}`,
      name: pick(["BPCL Fleet Station", "HPCL Fleet Station", "IOCL Fleet Station"]),
      city: "Bengaluru"
    },
    paymentMode: pick(["FLEET_CARD", "ACCOUNT"])
  });
}

const transactions = [];
for (let i = 1; i <= COUNTS.transactions; i++) {
  const bus = pick(buses);
  const trip = pick(trips);
  const driver = pick(drivers);
  transactions.push({
    transactionId: `TXN${String(i).padStart(6, "0")}`,
    transactionType: "BUS_TRIP_ASSIGNMENT",
    busId: bus.busId,
    tripId: trip.tripId,
    driverId: driver.driverId,
    performedBy: pick(users).userId,
    previousBusStatus: "AVAILABLE",
    newBusStatus: "ASSIGNED",
    status: i % 20 === 0 ? "ABORTED" : "COMMITTED",
    timestamp: dateFromDaysAgo(120),
    metadata: {
      source: "SYNTHETIC_DATASET",
      reason: "Scheduled trip assignment"
    }
  });
}

const activities = [];
for (let i = 1; i <= COUNTS.activities; i++) {
  const trip = pick(trips);
  activities.push({
    activityId: `ACT${String(i).padStart(6, "0")}`,
    userId: pick(users).userId,
    action: pick(["ASSIGN_BUS", "UPDATE_TRIP", "VIEW_REPORT", "MAINTENANCE_UPDATE", "FUEL_ENTRY"]),
    entityType: pick(["BUS", "TRIP", "ROUTE", "MAINTENANCE", "FUEL"]),
    entityId: pick([trip.tripId, pick(buses).busId, pick(routes).routeId]),
    description: "Synthetic system activity",
    timestamp: dateFromDaysAgo(120),
    metadata: { source: "SYNTHETIC_DATASET" }
  });
}

const datasets = {
  users, masterData, buses, drivers, routes, trips,
  maintenance, fuelRecords, transactions, activities
};

for (const [name, data] of Object.entries(datasets)) {
  fs.writeFileSync(
    path.join(OUT, `${name}.json`),
    JSON.stringify(data, null, 2)
  );
  console.log(`${name}: ${data.length} documents`);
}

fs.writeFileSync(
  path.join(OUT, "dataset_manifest.json"),
  JSON.stringify({
    generatedAt: new Date().toISOString(),
    synthetic: true,
    counts: Object.fromEntries(Object.entries(datasets).map(([k, v]) => [k, v.length]))
  }, null, 2)
);

console.log("\nSynthetic dataset generation complete.");
