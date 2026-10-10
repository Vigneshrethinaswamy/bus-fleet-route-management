print("=== MONGODB DEPLOYMENT DIAGNOSTIC ===");

const admin = db.getSiblingDB("admin");
const hello = admin.runCommand({ hello: 1 });
const build = admin.runCommand({ buildInfo: 1 });

print("\n--- Server ---");
print("MongoDB version: " + build.version);
print("Replica set: " + (hello.setName || "Not configured"));
print("Writable primary: " + (hello.isWritablePrimary === true));
print("Connected through mongos: " + (hello.msg === "isdbgrid"));

print("\n--- Replica Set ---");
if (hello.setName) {
  try {
    const status = admin.runCommand({ replSetGetStatus: 1 });

    if (status.ok === 1) {
      print("Replica-set status: " + status.myState);
      status.members.forEach(member => {
        print(
          member.name +
          " | state=" + member.stateStr +
          " | health=" + member.health
        );
      });
    } else {
      print("Replica-set status unavailable:");
      printjson(status);
    }
  } catch (e) {
    print("Replica-set diagnostic: " + e.message);
  }
} else {
  print("No replica set reported by hello.");
}

print("\n--- Sharding ---");
try {
  const shards = admin.runCommand({ listShards: 1 });
  if (shards.ok === 1) {
    print("Sharding metadata is available.");
    printjson(shards.shards);
  } else {
    print("Sharding metadata is not available from this connection.");
    printjson(shards);
  }
} catch (e) {
  print("Sharding diagnostic: " + e.message);
}

print("\n--- Project Database ---");
const projectDB = db.getSiblingDB("bus_fleet_management");
let total = 0;

projectDB.getCollectionNames().sort().forEach(name => {
  const count = projectDB.getCollection(name).countDocuments();
  total += count;
  print(name + ": " + count);
});

print("Total documents: " + total);
print(total === 2010 ? "PASS: Source database unchanged." : "WARN: Expected 2010 documents.");

print("\n=== END DIAGNOSTIC ===");
