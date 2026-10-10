const users = db.getCollection("users");

const duplicates = users.aggregate([
  { $sort: { _id: 1 } },
  {
    $group: {
      _id: "$userId",
      ids: { $push: "$_id" },
      count: { $sum: 1 }
    }
  },
  { $match: { count: { $gt: 1 } } }
]).toArray();

let deleted = 0;

for (const group of duplicates) {
  const extraIds = group.ids.slice(1);
  deleted += users.deleteMany({
    _id: { $in: extraIds }
  }).deletedCount;
}

print("Duplicate documents removed: " + deleted);
print("Remaining user documents: " + users.countDocuments());
print("Unique user IDs: " + users.distinct("userId").length);
