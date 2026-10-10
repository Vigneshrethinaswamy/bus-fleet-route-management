# Bus Fleet & Route Management
## Final Project Report

**Project type:** MongoDB and Node.js academic database project  
**Repository:** [bus-fleet-route-management](https://github.com/VigneshRethinaswamy/bus-fleet-route-management)  
**Database:** `bus_fleet_management`  
**Test environment:** MongoDB 8.3.7, `mongosh` 2.9.2, Node.js v24.14.0, MongoDB Node.js driver 7.7.0  
**Dataset:** Synthetic; 2,010 documents across 10 collections

---

## Abstract

The Bus Fleet & Route Management project implements a document-oriented database for managing buses, drivers, routes, trips, maintenance, fuel records, users, transactions, and audit activities. It demonstrates MongoDB schema design through embedding and referencing, data validation, CRUD operations, query operators, aggregation pipelines, indexes, multi-document transaction behavior, and a simulated relational-to-document migration.

The latest recorded local validation reported **55 passed, 0 failed, and 0 warnings** across the database checks. The aggregation demonstration reported **16 passed and 0 failed**. The transaction demonstration passed its recorded commit, rollback, and cleanup checks. These results describe the tested local environment and synthetic dataset; they do not imply production deployment or untested high-availability behavior.

## 1. Problem statement

Fleet operations involve related data about vehicles, drivers, routes, trips, servicing, fuel usage, and business activity. A database for this domain must preserve important relationships while supporting operational updates and useful summaries.

The project addresses this need by implementing a MongoDB data model and demonstrating how document storage, references, indexes, transactions, and aggregation can support a fleet-management workload.

## 2. Objectives

- Model core fleet and operational records in MongoDB.
- Use embedded subdocuments for bounded data owned by a parent document.
- Use references for shared entities that are updated independently.
- Demonstrate create, read, update, and delete operations.
- Demonstrate query operators, projections, array queries, sorting, and pagination.
- Build analytical reports using aggregation stages and joins.
- Enforce unique business identifiers and compare query plans.
- Demonstrate transaction commit and rollback behavior.
- Simulate migration from relational-style JSON extracts to MongoDB documents.
- Document design trade-offs, limitations, and possible future improvements.

## 3. Technologies and environment

| Component | Tested or used version |
|---|---|
| Database | MongoDB 8.3.7 |
| Shell | mongosh 2.9.2 |
| Runtime | Node.js v24.14.0 |
| Driver | MongoDB Node.js driver 7.7.0 |
| Deployment | Local single-member replica set, `rs0` |
| Data | Synthetic JSON dataset |

The transaction example requires replica-set transaction support. The local `rs0` configuration has one member and one writable primary.

## 4. Database contents

The primary database contains 2,010 documents across 10 collections.

| Collection | Documents |
|---|---:|
| `users` | 60 |
| `masterData` | 60 |
| `buses` | 160 |
| `drivers` | 120 |
| `routes` | 120 |
| `trips` | 600 |
| `maintenance` | 180 |
| `fuelRecords` | 360 |
| `transactions` | 200 |
| `activities` | 150 |
| **Total** | **2,010** |

The dataset is synthetic and is intended for academic demonstration, not as a record of real bus operations.

## 5. Schema design: embedding and referencing

### Embedding

The model embeds bounded data that is normally read with its parent:

- Bus depot information and features
- Route stops and operating days
- Trip incidents
- Maintenance parts
- User permissions

Embedding reduces the need to fetch separate documents for these closely related values.

### Referencing

The model uses business identifiers to connect shared entities:

- Trips reference buses, routes, and drivers.
- Maintenance and fuel records reference buses.
- Transactions retain relevant bus, trip, driver, and actor identifiers.
- Activities reference users.

These records can be maintained independently without duplicating all fields of the referenced entity. The complete relationship diagram and rationale are in [architecture.md](architecture.md).

## 6. CRUD and query operations

The CRUD demonstration exercises create, read, update, and delete operations using temporary records. It verifies the expected changes, removes the temporary records, and checks that the original total document count is restored.

The query-operator demonstration covers comparison and logical filters, projections, array matching, slicing, sorting, and pagination. The latest recorded run completed with **12 passed and 0 failed**.

Run scripts with the intended database name explicitly to avoid accidentally operating on the default `test` database.

## 7. Aggregation and reporting

The project includes 16 aggregation pipelines. They demonstrate grouping, filtering, sorting, limiting, arithmetic summaries, array operations, array unwinding, pagination, and `$lookup` joins.

Examples of recorded results:

| Analysis | Recorded result |
|---|---|
| Trips grouped by status | CANCELLED: 135; ASSIGNED: 128; SCHEDULED: 121 |
| Average passengers by trip type | REGULAR: 28.50; CHARTER: 27.51; SPECIAL: 26.13 |
| Total revenue in the analysed records | 859,322 |
| Average revenue in the analysed records | 1,432.20 |
| Revenue range | Minimum 150; maximum 4,730 |
| Top displayed route by revenue | RT0068: 32,594 across 11 trips |
| Maintenance with highest total cost | PREVENTIVE: 754,371 across 86 records |
| Highest average maintenance cost | CORRECTIVE: 9,012.66 per record |
| Page-two pagination example | 10 documents returned |
| Route-stop occurrence example | Silk Board: 43; Electronic City: 42; Banashankari: 42 |
| `$push` / `$addToSet` example | RT0054: 12 trips and 5 distinct statuses |

Revenue and maintenance values are shown in the dataset's recorded units; no specific currency unit is asserted. Route-stop figures count occurrences in embedded arrays and do not necessarily represent unique physical locations. The route ranking above describes the recorded output, not a universal business-performance conclusion.

The latest recorded aggregation run passed **16 of 16 pipelines**. Detailed pipeline interpretations and the screenshot checklist are in [aggregation_results_and_interpretation.md](aggregation_results_and_interpretation.md).

## 8. Indexing and query-plan comparison

The project creates **13 unique business-key indexes**, along with supporting indexes. For a query filtering on trip status and scheduled start, the recorded explain-plan comparison showed:

| Query plan | Documents examined |
|---|---:|
| Collection scan | 600 |
| Compound-index plan | 128 |

This demonstrates fewer examined documents for the tested query and dataset. It is not a guarantee that every query will be faster, and elapsed execution time can vary with the environment and data distribution.

## 9. Multi-document transaction demonstration

The transaction script selects eligible bus, driver, trip, and user records, then performs related changes within a MongoDB session. The commit path updates assignment/status fields and inserts transaction and audit records together. The rollback path performs test writes and aborts them, then verifies that the aborted changes did not persist.

The script also restores the original test state and checks cleanup. The recorded local run passed its commit, rollback, and cleanup checks with zero failed checks.

This demonstrates transaction behavior on the configured single-member replica set. It does **not** demonstrate multi-node replication, failover, or production resilience.

## 10. Relational-to-document migration simulation

The migration demonstration uses relational-style JSON extracts representing `BUS`, `DRIVER`, `ROUTE`, `ROUTE_STOP`, and `TRIP` source tables. It transforms the extracts into MongoDB documents, embeds route stops within route documents, retains references to shared entities, and validates counts and relationships in a separate timestamped target database.

The recorded migration checked:

- 160 buses
- 120 drivers
- 120 routes
- 600 trips
- 709 route-stop records preserved as embedded stops

**Scope limitation:** The workflow is a simulated export-and-migration process using JSON files. It is not a live migration from a running MySQL, SQL Server, or other relational database.

## 11. Validation and evidence

The latest recorded verification results are:

| Verification | Result |
|---|---|
| Database validation | **55 passed, 0 failed, 0 warnings** |
| Aggregation demonstration | **16 passed, 0 failed** |
| Query-operator demonstration | **12 passed, 0 failed** |
| Final audit record | **42 checks, 0 failed** |
| Source database size | **2,010 documents** |
| Unique business-key indexes | **13** |
| Indexed-query benchmark | **600 vs. 128 documents examined** |
| Transaction demonstration | Commit, rollback, and cleanup checks passed |
| Migration demonstration | Expected collection counts and 709 embedded stops checked |

The validation, aggregation, and Git synchronization were run locally; the latest reported Git status was `main...origin/main` with a clean working tree. These are recorded test results, not an assertion that all scripts were rerun after every future code or dataset change. See [EVIDENCE.md](EVIDENCE.md) for the evidence map and verification notes.

## 12. Replication, CAP, and sharding

The tested MongoDB deployment uses a **single-member replica set named `rs0`** with one writable primary. A multi-member replica set, secondary replication, and failover behavior were not tested.

CAP is discussed conceptually in the project documentation; no network-partition experiment was performed. Sharding is described as a possible architecture, but a live sharded cluster and shard-key benchmark are not implemented or verified.

## 13. Comparison with Cassandra and Neo4j

MongoDB suits this demonstration because the records combine document-shaped entities, bounded embedded arrays, references, flexible queries, and aggregation.

Cassandra is discussed as a possible fit for high-volume distributed event or telemetry workloads where partition-key and query-driven modeling are important. Neo4j is discussed as a possible fit for graph-centric relationship analysis, such as route connectivity and relationship exploration among vehicles, drivers, trips, and incidents. The choice depends on workload and requirements; neither alternative is universally better.

## 14. Limitations and future work

1. Connect a real relational source and validate an actual SQL export/import if live migration is required.
2. Test a multi-member replica set before claiming high availability or failover.
3. Configure and test a sharded cluster only if the target requirements call for live sharding.
4. Add application/API and authentication layers if the project is extended beyond database demonstrations.
5. Add performance tests across larger and varied datasets, and measure both execution statistics and elapsed time.
6. Persist reports only if saved report definitions or historical snapshots become a requirement; currently reports are generated through aggregation rather than stored in a separate `reports` collection.

## Conclusion

The project delivers a tested local MongoDB implementation for a synthetic bus fleet and route-management dataset. It demonstrates document modeling, CRUD and query operations, 16 analytical aggregation pipelines, business-key indexing, transaction commit/rollback behavior, and a validated JSON-based migration simulation. The evidence supports these implemented and recorded results while keeping the untested areas explicit: live SQL migration, multi-node failover, network-partition testing, and live sharding.

## Repository references

- [Project README](../README.md)
- [Architecture and schema diagram](architecture.md)
- [Requirement matrix](requirement_matrix.md)
- [Aggregation results and interpretation](aggregation_results_and_interpretation.md)
- [Database comparison, CAP, replication, sharding, and migration](database_comparison_cap_migration.md)
- [Evidence and validation](EVIDENCE.md)
- [Viva preparation](viva_questions.md)
- [Presentation outline](presentation_outline.md)
