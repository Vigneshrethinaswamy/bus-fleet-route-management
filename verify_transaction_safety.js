let total = 0;
for (const name of db.getCollectionNames()) {
  total += db.getCollection(name).countDocuments();
}
print("Total documents: " + total);
print(total === 2010 ? "PASS: Expected count preserved." : "FAIL: Unexpected document count.");
if (total !== 2010) quit(1);
