const users = db.getCollection("users");

print("Total user documents: " + users.countDocuments());
print("Unique user IDs: " + users.distinct("userId").length);
print("Documents without userId: " + users.countDocuments({userId: {$exists: false}}));

print("\nDuplicate user IDs:");
users.aggregate([
  {$group: {_id: "$userId", count: {$sum: 1}}},
  {$match: {count: {$gt: 1}}},
  {$limit: 10}
]).forEach(doc => printjson(doc));
