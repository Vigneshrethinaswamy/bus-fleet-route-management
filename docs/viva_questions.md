# Viva Preparation — Bus Fleet & Route Management

Use these questions to explain the implementation honestly. The dataset is synthetic, and the recorded results describe local tests.

## A. Project overview

### 1. What is the aim of this project?
To design a MongoDB database for bus fleet and route management and demonstrate document modeling, CRUD, queries, aggregation, indexing, transactions, and a relational-style data migration simulation.

### 2. Why did you choose MongoDB?
MongoDB stores records as BSON documents and supports embedded data, references, indexes, flexible queries, and aggregation. These features fit a dataset with buses, drivers, routes, trips, maintenance, and fuel records.

### 3. What are the main collections?
There are 10: `users`, `masterData`, `buses`, `drivers`, `routes`, `trips`, `maintenance`, `fuelRecords`, `transactions`, and `activities`.

### 4. How many records does the main database contain?
The verified dataset contains 2,010 synthetic documents across the 10 collections.

### 5. What are the main technologies?
MongoDB 8.3.7, mongosh 2.9.2, Node.js v24.14.0, and MongoDB Node.js driver 7.7.0 were recorded in the local test environment.

## B. Data modeling

### 6. What is embedding?
Embedding stores related values inside a parent document. This project embeds route stops and operating days in routes, features and depot information in buses, incidents in trips, parts in maintenance records, and permissions in users.

### 7. What is referencing?
Referencing stores an identifier that points to another entity. For example, trips reference buses, drivers, and routes. This avoids duplicating all the fields of shared entities.

### 8. How did you decide between embedding and referencing?
Embedding is used for bounded information usually read with its parent. Referencing is used for shared entities that are independently updated or used by multiple records.

### 9. Why are route stops embedded?
Route stops are ordered child data that belong to a route. Embedding them makes route details available with the route document and supports array analysis such as `$unwind`.

### 10. Why is there no separate reports collection?
Reports are calculated on demand through aggregation pipelines. A persistent collection is unnecessary for the current demonstration and could store stale copies unless refreshed.

## C. CRUD and query operations

### 11. What does CRUD stand for?
Create, Read, Update, and Delete.

### 12. How did you verify the CRUD demo?
The demo performs operations on temporary records, checks the results, deletes the temporary records, and verifies that the original total document count is restored.

### 13. Which query features are demonstrated?
Comparison and logical operators, projections, array matching, slicing, sorting, and pagination. The recorded query-operator run passed 12 checks with zero failures.

### 14. What is pagination?
Pagination returns a bounded portion of a larger result set. The example sorts trips, skips the first 10 records, and returns the next 10 using `$skip` and `$limit`.

## D. Aggregation

### 15. What is an aggregation pipeline?
It processes documents through ordered stages to filter, group, transform, sort, join, and summarize data.

### 16. Which aggregation stages are demonstrated?
Examples include `$match`, `$group`, `$sum`, `$avg`, `$min`, `$max`, `$sort`, `$limit`, `$skip`, `$lookup`, `$unwind`, `$push`, and `$addToSet`.

### 17. What is the difference between `$push` and `$addToSet`?
`$push` appends each value to an array, including duplicates. `$addToSet` collects distinct values.

### 18. What does `$lookup` do in this project?
It joins trip documents with matching bus documents so a report can show bus details alongside trip details. One recorded example joins trip TRP000004 with bus BUS0133 and registration KA22DJ1133.

### 19. What is `$unwind` used for?
It converts each element of an array into a separate pipeline document. The route-stop pipeline then groups stop-name occurrences across route arrays.

### 20. What is one result from the aggregation tests?
The recorded trip-status counts include CANCELLED 135, ASSIGNED 128, and SCHEDULED 121. The recorded aggregation demonstration passed 16 pipelines with zero failures.

### 21. Does the highest cancellation count explain why trips were cancelled?
No. The pipeline counts status values only; it does not identify causes of cancellation.

## E. Indexing and validation

### 22. Why are indexes useful?
Indexes can reduce the number of documents MongoDB must examine for supported queries. They also have storage and write-maintenance costs, so they should be chosen for actual query patterns.

### 23. What did the index benchmark show?
For the tested trip-status and scheduled-start query, the collection scan examined 600 documents while the compound-index plan examined 128.

### 24. Does that mean all queries are faster?
No. This result applies to the tested query and dataset. Performance depends on query shape, data distribution, indexes, cache, and environment.

### 25. What are unique indexes used for?
They prevent duplicate values for the indexed business keys. The project defines 13 unique business-key indexes.

### 26. What was the latest database validation result?
The latest reported validation completed with 55 passed, 0 failed, and 0 warnings, with 2,010 documents in the main database.

## F. Transactions

### 27. Why use a transaction?
A multi-document assignment operation should not leave only some changes applied. A transaction groups related writes so they commit together or abort together.

### 28. What happens in the commit path?
The demonstration updates bus, driver, and trip assignment/status data and inserts a transaction record and an audit activity within a session transaction.

### 29. What happens in the rollback path?
The script performs test writes and aborts the transaction, then checks that the aborted writes did not persist. It also cleans up and checks the original test state.

### 30. What is required for MongoDB transactions in this demo?
The script uses a replica-set connection. The tested local configuration is a single-member replica set named `rs0`.

### 31. Does the project prove high availability?
No. A single-member replica set does not provide multi-node redundancy. Secondary replication and failover were not tested.

## G. Migration and distributed database concepts

### 32. What does the migration demo do?
It reads relational-style JSON extracts for BUS, DRIVER, ROUTE, ROUTE_STOP, and TRIP, transforms them into MongoDB documents, embeds route stops, and checks target counts and references.

### 33. Is it a live SQL migration?
No. The source is simulated through JSON files; no running MySQL or SQL Server database is migrated.

### 34. How many route stops were preserved?
The recorded migration validation checked that all 709 source route-stop records were embedded in the target route documents.

### 35. Was a sharded cluster implemented?
No. Sharding is discussed as an architecture option, but a live sharded cluster and shard-key benchmark were not performed.

### 36. Was a CAP network-partition experiment performed?
No. CAP is discussed conceptually; no multi-node network-partition experiment was performed.

### 37. How do MongoDB, Cassandra, and Neo4j differ at a high level?
MongoDB is document-oriented and supports flexible documents and aggregation. Cassandra is commonly suited to distributed workloads designed around partition keys and query patterns. Neo4j is graph-oriented and useful for relationship traversal. The best choice depends on the workload.

## H. Limitations and closing

### 38. What are the main limitations?
The dataset is synthetic; migration uses JSON extracts rather than a live SQL database; only a single-member replica set was tested; and live failover, network partitioning, and sharding were not tested.

### 39. What would you improve next?
Connect a real SQL source if migration is required, test a multi-member replica set, expand performance testing, and add an application/API layer if the project scope requires it.

### 40. What is your conclusion?
The project demonstrates a validated local MongoDB workflow for synthetic fleet-management data, including document modeling, queries, aggregation, indexes, transaction commit/rollback, and a JSON-based migration simulation. Claims are limited to the features actually tested.

## Quick demo commands

Run these from the repository root in PowerShell. Paste and run each command as a complete line.

```powershell
mongosh bus_fleet_management --quiet --file validate_database.js
mongosh bus_fleet_management --quiet --file query_operators_demo.js
mongosh bus_fleet_management --quiet --file aggregation_demo.js
node transaction_demo.cjs
node migration_demo.cjs
mongosh final_project_audit.js
```

Run migration before the final audit because the audit checks the latest timestamped migration target. The transaction demo needs the local replica set and should be run only when you are ready for its test-state changes and cleanup.

## Viva tips

- Explain one example each for embedding, referencing, `$lookup`, `$unwind`, `$push`, and `$addToSet`.
- Quote the index result as **documents examined** (600 versus 128), not as a guaranteed speedup percentage.
- Say “simulated migration from relational-style JSON extracts,” not “live SQL migration.”
- Say “single-member replica set tested,” not “high availability implemented.”
- Use the recorded test counts and be clear that the data is synthetic.
