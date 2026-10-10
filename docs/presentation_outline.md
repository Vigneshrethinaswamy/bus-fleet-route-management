# Presentation Outline — Bus Fleet & Route Management

**Suggested duration:** 8–10 minutes  
**Format:** 10 slides  
**Project repository:** https://github.com/VigneshRethinaswamy/bus-fleet-route-management

This is a slide-by-slide content outline. It is not a claim that a PowerPoint file has already been generated.

## Slide 1 — Title

**Bus Fleet & Route Management Using MongoDB**

- Academic NoSQL database project
- Technologies: MongoDB, mongosh, Node.js
- Dataset: 2,010 synthetic documents across 10 collections

**Speaker note:** Introduce the problem and state that the project focuses on database design and verified demonstrations rather than a production deployment.

## Slide 2 — Problem and objectives

- Fleet operations connect buses, drivers, routes, trips, maintenance, and fuel records.
- The database must support consistent operational records and analytical questions.
- Objectives: document modeling, CRUD, queries, aggregation, indexes, transactions, and migration simulation.

**Speaker note:** Explain that the same system needs both operational updates and summary reports.

## Slide 3 — Technology stack and dataset

- MongoDB 8.3.7; mongosh 2.9.2
- Node.js v24.14.0; MongoDB Node.js driver 7.7.0
- Main database: `bus_fleet_management`
- 10 collections, 2,010 documents

Show a table or bar chart with collection counts:

| Collection | Count |
|---|---:|
| users | 60 |
| masterData | 60 |
| buses | 160 |
| drivers | 120 |
| routes | 120 |
| trips | 600 |
| maintenance | 180 |
| fuelRecords | 360 |
| transactions | 200 |
| activities | 150 |

## Slide 4 — Schema design

Explain **embedding versus referencing**.

- Embedded: route stops and operating days, bus depot/features, trip incidents, maintenance parts, user permissions.
- Referenced: trips to buses/drivers/routes; maintenance and fuel records to buses; activities to users.
- Aggregation reports are computed on demand; no persistent `reports` collection is used.

**Visual:** Reuse the schema diagram in [architecture.md](architecture.md).

## Slide 5 — CRUD, queries, and validation

- CRUD demonstration uses temporary records and verifies cleanup.
- Query operators include logical/comparison filters, projections, array queries, sorting, and pagination.
- Latest database validation: **55 passed, 0 failed, 0 warnings**.
- Query-operator demonstration: **12 passed, 0 failed**.

**Visual:** Use genuine terminal screenshots from the repository evidence folder.

## Slide 6 — Aggregation and insights

Mention stages such as `$match`, `$group`, `$sum`, `$avg`, `$lookup`, `$unwind`, `$push`, and `$addToSet`.

Selected recorded results:

- Status counts: CANCELLED 135, ASSIGNED 128, SCHEDULED 121.
- Average passengers: REGULAR 28.50, CHARTER 27.51, SPECIAL 26.13.
- Total recorded revenue: 859,322 units; average 1,432.20 units.
- Aggregation test: **16 passed, 0 failed**.

**Speaker note:** Values are from a synthetic dataset. Revenue units are not identified as a specific currency, and status counts do not explain the reasons behind cancellations.

## Slide 7 — Indexing and transactions

**Indexing**
- 13 unique business-key indexes.
- Tested query: collection scan examined 600 documents; compound-index plan examined 128.

**Transactions**
- Commit path updates bus/driver/trip assignment and inserts transaction/audit records.
- Rollback path verifies aborted writes do not persist.
- Recorded commit, rollback, and cleanup checks passed.

**Speaker note:** The index result concerns documents examined for one query, not a universal speedup. Transactions were tested on a single-member replica set.

## Slide 8 — Migration simulation

- Source tables represented as JSON extracts: BUS, DRIVER, ROUTE, ROUTE_STOP, TRIP.
- Route-stop rows are transformed into embedded route arrays.
- Recorded target checks: 160 buses, 120 drivers, 120 routes, 600 trips, and 709 embedded route stops.

**Important limitation:** This is a simulated migration from relational-style JSON extracts, not a live migration from MySQL or SQL Server.

## Slide 9 — Architecture choices and limitations

- MongoDB: document model, embedding/references, aggregation.
- Cassandra: discussed for distributed workloads designed around partition keys.
- Neo4j: discussed for graph-oriented relationship traversal.
- `rs0` is a single-member replica set.
- No multi-node failover, network-partition experiment, or live sharded cluster was tested.

**Speaker note:** Distinguish design discussion from implementation evidence.

## Slide 10 — Conclusion and future work

**Conclusion**
- Validated local database with 2,010 synthetic documents.
- CRUD, query operators, 16 aggregation pipelines, indexes, transaction behavior, and JSON-based migration simulation demonstrated.

**Future work**
- Live SQL source migration if required.
- Multi-member replica-set and failover testing.
- Live sharding and broader performance tests if required.
- Application/API layer if the project scope expands.

**Closing line:** “The implementation demonstrates the required MongoDB techniques, and the report clearly separates verified features from future work.”

## Demo flow (if time permits)

1. Run `validate_database.js`.
2. Show one aggregation output.
3. Show the index comparison from the recorded evidence.
4. Explain transaction commit/rollback evidence.
5. Describe the migration source and target validation.

Do not attempt every script during a short presentation. Run the demo commands beforehand and use actual screenshots as a fallback. Avoid showing credentials, environment secrets, or private information.
