const s = db.getMongo().startSession();
for (const method of [
  "startTransaction",
  "commitTransaction",
  "abortTransaction",
  "withTransaction",
  "inTransaction",
  "endSession"
]) {
  print(method + ": " + typeof s[method]);
}
s.endSession();
