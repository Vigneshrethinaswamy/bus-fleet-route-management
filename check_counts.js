db.getCollectionNames().sort().forEach(function (name) {
    print(name + ": " + db.getCollection(name).countDocuments());
});
