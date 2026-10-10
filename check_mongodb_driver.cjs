try {
  const mongodb = require("mongodb");
  console.log("MongoDB driver: AVAILABLE");
  console.log("MongoClient:", typeof mongodb.MongoClient);
  console.log("Driver version:", require("mongodb/package.json").version);
} catch (error) {
  console.log("MongoDB driver: NOT AVAILABLE in this project directory");
  console.log(error.message);
}
