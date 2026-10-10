const { MongoClient } = require("mongodb");
const driverVersion = require("mongodb/package.json").version;

console.log("MongoDB driver: AVAILABLE");
console.log("MongoClient type:", typeof MongoClient);
console.log("Driver version:", driverVersion);

if (typeof MongoClient !== "function") {
  process.exitCode = 1;
}
