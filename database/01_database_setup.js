/*
 * Bus Fleet & Route Management
 * Database foundation: collections + schema validation
 *
 * Run:
 *   mongosh --file database/01_database_setup.js
 */

const DB_NAME = "bus_fleet_management";
const dbx = db.getSiblingDB(DB_NAME);

print(`Using database: ${DB_NAME}`);

// Start clean only if explicitly requested:
// mongosh --eval 'const RESET_DB=true' --file database/01_database_setup.js
if (typeof RESET_DB !== "undefined" && RESET_DB === true) {
  dbx.dropDatabase();
  print("Database reset requested.");
}

const validators = {
  users: {
    $jsonSchema: {
      bsonType: "object",
      required: ["userId", "name", "email", "role", "status", "permissions", "createdAt"],
      properties: {
        userId: { bsonType: "string" },
        name: { bsonType: "string" },
        email: { bsonType: "string" },
        role: { enum: ["ADMIN", "FLEET_MANAGER", "DISPATCHER", "ANALYST"] },
        phone: { bsonType: "string" },
        status: { enum: ["ACTIVE", "INACTIVE"] },
        permissions: {
          bsonType: "array",
          items: { bsonType: "string" }
        },
        createdAt: { bsonType: "date" }
      }
    }
  },

  masterData: {
    $jsonSchema: {
      bsonType: "object",
      required: ["category", "code", "name", "status"],
      properties: {
        category: { bsonType: "string" },
        code: { bsonType: "string" },
        name: { bsonType: "string" },
        description: { bsonType: "string" },
        attributes: { bsonType: "object" },
        status: { enum: ["ACTIVE", "INACTIVE"] }
      }
    }
  },

  buses: {
    $jsonSchema: {
      bsonType: "object",
      required: [
        "busId", "registrationNumber", "fleetNumber", "busType",
        "manufacturer", "model", "manufacturingYear", "seatingCapacity",
        "status", "depot", "features", "totalDistanceKm", "totalTrips",
        "createdAt", "updatedAt"
      ],
      properties: {
        busId: { bsonType: "string" },
        registrationNumber: { bsonType: "string" },
        fleetNumber: { bsonType: "string" },
        busType: { bsonType: "string" },
        manufacturer: { bsonType: "string" },
        model: { bsonType: "string" },
        manufacturingYear: { bsonType: "int", minimum: 2018, maximum: 2030 },
        seatingCapacity: { bsonType: "int", minimum: 10, maximum: 100 },
        status: { enum: ["AVAILABLE", "ASSIGNED", "MAINTENANCE", "INACTIVE"] },
        depot: {
          bsonType: "object",
          required: ["depotId", "name", "city"],
          properties: {
            depotId: { bsonType: "string" },
            name: { bsonType: "string" },
            city: { bsonType: "string" }
          }
        },
        currentLocation: {
          bsonType: "object",
          properties: {
            latitude: { bsonType: ["double", "int", "long", "decimal"] },
            longitude: { bsonType: ["double", "int", "long", "decimal"] }
          }
        },
        features: {
          bsonType: "array",
          items: { bsonType: "string" }
        },
        assignedDriverId: { bsonType: "string" },
        gpsDeviceId: { bsonType: "string" },
        totalDistanceKm: { bsonType: ["double", "int", "long", "decimal"] },
        totalTrips: { bsonType: "int", minimum: 0 },
        createdAt: { bsonType: "date" },
        updatedAt: { bsonType: "date" }
      }
    }
  },

  drivers: {
    $jsonSchema: {
      bsonType: "object",
      required: [
        "driverId", "employeeCode", "name", "licenseNumber",
        "licenseCategory", "experienceYears", "depotId", "status",
        "certifications", "rating", "totalTrips", "joiningDate", "createdAt"
      ],
      properties: {
        driverId: { bsonType: "string" },
        employeeCode: { bsonType: "string" },
        name: { bsonType: "string" },
        licenseNumber: { bsonType: "string" },
        licenseCategory: { enum: ["HEAVY_TRANSPORT", "LIGHT_TRANSPORT"] },
        experienceYears: { bsonType: "int", minimum: 0 },
        phone: { bsonType: "string" },
        depotId: { bsonType: "string" },
        status: { enum: ["AVAILABLE", "ON_DUTY", "LEAVE", "INACTIVE"] },
        certifications: { bsonType: "array", items: { bsonType: "string" } },
        rating: { bsonType: ["double", "int", "decimal"], minimum: 0, maximum: 5 },
        totalTrips: { bsonType: "int", minimum: 0 },
        joiningDate: { bsonType: "date" },
        createdAt: { bsonType: "date" }
      }
    }
  },

  routes: {
    $jsonSchema: {
      bsonType: "object",
      required: [
        "routeId", "routeNumber", "routeName", "category",
        "source", "destination", "totalDistanceKm",
        "estimatedDurationMinutes", "fare", "status",
        "stops", "operatingDays", "createdAt"
      ],
      properties: {
        routeId: { bsonType: "string" },
        routeNumber: { bsonType: "string" },
        routeName: { bsonType: "string" },
        category: { enum: ["CITY", "SUBURBAN", "EXPRESS", "AIRPORT"] },
        source: { bsonType: "object" },
        destination: { bsonType: "object" },
        totalDistanceKm: { bsonType: ["double", "int", "decimal"] },
        estimatedDurationMinutes: { bsonType: "int", minimum: 1 },
        fare: { bsonType: ["double", "int", "decimal"], minimum: 0 },
        status: { enum: ["ACTIVE", "INACTIVE"] },
        stops: {
          bsonType: "array",
          minItems: 2,
          items: {
            bsonType: "object",
            required: ["stopId", "name", "sequence", "distanceFromOriginKm"],
            properties: {
              stopId: { bsonType: "string" },
              name: { bsonType: "string" },
              sequence: { bsonType: "int", minimum: 1 },
              distanceFromOriginKm: { bsonType: ["double", "int", "decimal"] }
            }
          }
        },
        operatingDays: {
          bsonType: "array",
          items: { bsonType: "string" }
        },
        createdAt: { bsonType: "date" }
      }
    }
  },

  trips: {
    $jsonSchema: {
      bsonType: "object",
      required: [
        "tripId", "routeId", "busId", "driverId",
        "scheduledStart", "scheduledEnd", "status",
        "passengerCount", "farePerPassenger", "revenue",
        "distanceTravelledKm", "fuelConsumedLitres", "tripType", "createdAt"
      ],
      properties: {
        tripId: { bsonType: "string" },
        routeId: { bsonType: "string" },
        busId: { bsonType: "string" },
        driverId: { bsonType: "string" },
        scheduledStart: { bsonType: "date" },
        scheduledEnd: { bsonType: "date" },
        actualStart: { bsonType: "date" },
        actualEnd: { bsonType: "date" },
        status: { enum: ["SCHEDULED", "ASSIGNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"] },
        passengerCount: { bsonType: "int", minimum: 0 },
        farePerPassenger: { bsonType: ["double", "int", "decimal"], minimum: 0 },
        revenue: { bsonType: ["double", "int", "decimal"], minimum: 0 },
        distanceTravelledKm: { bsonType: ["double", "int", "decimal"], minimum: 0 },
        fuelConsumedLitres: { bsonType: ["double", "int", "decimal"], minimum: 0 },
        tripType: { enum: ["REGULAR", "SPECIAL", "CHARTER"] },
        incidents: {
          bsonType: "array",
          items: {
            bsonType: "object",
            required: ["type", "severity"],
            properties: {
              type: { bsonType: "string" },
              severity: { enum: ["LOW", "MEDIUM", "HIGH"] },
              description: { bsonType: "string" }
            }
          }
        },
        createdAt: { bsonType: "date" }
      }
    }
  },

  maintenance: {
    $jsonSchema: {
      bsonType: "object",
      required: [
        "maintenanceId", "busId", "maintenanceType",
        "serviceDate", "odometerKm", "description",
        "parts", "totalCost", "workshop", "status", "nextServiceKm"
      ],
      properties: {
        maintenanceId: { bsonType: "string" },
        busId: { bsonType: "string" },
        maintenanceType: { enum: ["PREVENTIVE", "CORRECTIVE", "INSPECTION"] },
        serviceDate: { bsonType: "date" },
        odometerKm: { bsonType: ["double", "int", "long", "decimal"] },
        description: { bsonType: "string" },
        parts: {
          bsonType: "array",
          items: {
            bsonType: "object",
            required: ["partName", "quantity", "unitCost"],
            properties: {
              partName: { bsonType: "string" },
              quantity: { bsonType: "int", minimum: 1 },
              unitCost: { bsonType: ["double", "int", "decimal"], minimum: 0 }
            }
          }
        },
        totalCost: { bsonType: ["double", "int", "decimal"], minimum: 0 },
        workshop: { bsonType: "object" },
        status: { enum: ["SCHEDULED", "IN_PROGRESS", "COMPLETED"] },
        nextServiceKm: { bsonType: ["double", "int", "decimal"] }
      }
    }
  },

  fuelRecords: {
    $jsonSchema: {
      bsonType: "object",
      required: [
        "fuelRecordId", "busId", "date", "fuelType",
        "quantityLitres", "pricePerLitre", "totalCost",
        "odometerKm", "fuelStation", "paymentMode"
      ],
      properties: {
        fuelRecordId: { bsonType: "string" },
        busId: { bsonType: "string" },
        date: { bsonType: "date" },
        fuelType: { enum: ["DIESEL", "CNG", "ELECTRIC"] },
        quantityLitres: { bsonType: ["double", "int", "decimal"], minimum: 0 },
        pricePerLitre: { bsonType: ["double", "int", "decimal"], minimum: 0 },
        totalCost: { bsonType: ["double", "int", "decimal"], minimum: 0 },
        odometerKm: { bsonType: ["double", "int", "long", "decimal"], minimum: 0 },
        fuelStation: { bsonType: "object" },
        paymentMode: { enum: ["FLEET_CARD", "ACCOUNT", "CASH"] }
      }
    }
  },

  transactions: {
    $jsonSchema: {
      bsonType: "object",
      required: [
        "transactionId", "transactionType", "busId",
        "tripId", "driverId", "performedBy",
        "previousBusStatus", "newBusStatus", "status", "timestamp"
      ],
      properties: {
        transactionId: { bsonType: "string" },
        transactionType: { bsonType: "string" },
        busId: { bsonType: "string" },
        tripId: { bsonType: "string" },
        driverId: { bsonType: "string" },
        performedBy: { bsonType: "string" },
        previousBusStatus: { bsonType: "string" },
        newBusStatus: { bsonType: "string" },
        status: { enum: ["COMMITTED", "ABORTED"] },
        timestamp: { bsonType: "date" },
        metadata: { bsonType: "object" }
      }
    }
  },

  activities: {
    $jsonSchema: {
      bsonType: "object",
      required: [
        "activityId", "userId", "action",
        "entityType", "entityId", "description", "timestamp"
      ],
      properties: {
        activityId: { bsonType: "string" },
        userId: { bsonType: "string" },
        action: { bsonType: "string" },
        entityType: { bsonType: "string" },
        entityId: { bsonType: "string" },
        description: { bsonType: "string" },
        timestamp: { bsonType: "date" },
        metadata: { bsonType: "object" }
      }
    }
  }
};

const collectionNames = Object.keys(validators);

for (const name of collectionNames) {
  if (!dbx.getCollectionNames().includes(name)) {
    dbx.createCollection(name, {
      validator: validators[name],
      validationLevel: "strict",
      validationAction: "error"
    });
    print(`Created collection: ${name}`);
  } else {
    dbx.runCommand({
      collMod: name,
      validator: validators[name],
      validationLevel: "strict",
      validationAction: "error"
    });
    print(`Updated validator: ${name}`);
  }
}

print("\nCollections:");
printjson(dbx.getCollectionNames().sort());
print("\nDatabase foundation complete.");
