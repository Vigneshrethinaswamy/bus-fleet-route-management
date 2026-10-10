# Bus Fleet & Route Management — Final Project Report

## Abstract

This project designs and implements a MongoDB-based bus fleet and route management database. It models users, master data, buses, drivers, routes, trips, maintenance, fuel records, transactions, and activities. The implementation demonstrates schema validation, embedding and referencing, CRUD operations, query operators, aggregation pipelines, indexes, a transaction commit/rollback demonstration, and an RDBMS-to-MongoDB migration simulation.

The main database contains 2,010 synthetic documents across 10 collections. The latest recorded final audit completed 42 checks with zero failures, including collection counts, unique indexes, source references, and a timestamped migration target. These are local test results, not a claim of production deployment.

## 1. Problem statement and objectives

The objective is to design a MongoDB-based system that supports core fleet records, operational transactions, analytical reporting, and a scalable data design. The project aims to:
- Model buses, drivers, routes, trips, maintenance, and fuel records.
- Demonstrate embedding for bounded child data and referencing for shared entities.
- Support CRUD and common MongoDB query operators.
- Answer analytical questions using aggregation stages.
- Enforce business-key uniqueness and compare indexed query execution with a collection scan.
- Demonstrate transactional commit and rollback behavior.
- Transform relational-style JSON extracts into a document-oriented MongoDB structure.
- Explain replication, CAP, sharding, and alternative NoSQL database models.

## 2. Technology and dataset

- Database: MongoDB 8.x; the tested local environment used MongoDB 8.3.7.
- Shell: mongosh.
- Runtime and driver: Node.js with the MongoDB Node.js driver.
- Dataset: deterministic synthetic JSON data prepared for MongoDB import.

| Collection | Documents |
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
| **Total** | **2,010** |

The suggested `reports` collection is not persisted separately. Analytical reports are generated on demand through aggregation pipelines to avoid storing duplicate or stale report snapshots. A dedicated collection could be added if saved report definitions or historical snapshots become a requirement.

## 3. Schema design: embedding and referencing

Embedding is used for bounded information that is normally read with its parent, including bus depot/features, route stops/operating days, trip incidents, maintenance parts, and user permissions. Referencing is used for shared entities that are independently updated: trips refer to buses, drivers, and routes; maintenance and fuel records refer to buses; activities refer to users; transactions retain relevant bus, trip, driver, and actor IDs.

The schema diagram and detailed relationship rationale are in [architecture.md](architecture.md).

## 4. CRUD and query operations

The project includes create, read, update, and delete examples, along with query operators and array queries. The CRUD demonstration creates temporary records, verifies reads and updates, deletes the test records, and checks that the original document total is restored. The query examples cover comparison and logical operators, projections, pagination, array matching, and slicing.

## 5. Aggregation and analytical reporting

The aggregation demonstration contains 14 pipelines, including trip counts by status, largest status group, average passengers by trip type, top routes by revenue, revenue statistics, joins with buses/routes/drivers, bus utilization, fuel cost, maintenance cost, grouped lists with `$push` and `$addToSet`, paginated trip reporting with `$skip` and `$limit`, and route-stop analysis with `$unwind`.

The actual outputs and interpretations should be recorded from a local run. See [aggregation_results_and_interpretation.md](aggregation_results_and_interpretation.md) for the rubric mapping and screenshot checklist.

## 6. Indexing and execution statistics

The project defines unique business-key indexes and supporting sparse, compound, and multikey indexes. In the recorded benchmark for a trip-status and scheduled-start query, the collection scan examined 600 documents while the compound-index plan examined 128. This is evidence for that query and dataset only; execution time varies with the environment and should not be generalized to every workload.

## 7. Mandatory business transaction

The revised transaction demonstration uses MongoDB sessions and a replica-set connection to select an available bus, available driver, scheduled trip, and active user. Its commit transaction updates bus status/driver assignment, driver status, and trip status/assignment, and inserts the transaction record and audit activity together. A second transaction performs the same kind of writes and aborts; the script verifies that the updates and inserted records do not persist. It restores the original operational state, removes temporary records, and checks that collection counts return to their initial values. The revised script must be run locally before these results are claimed as freshly verified.

## 8. RDBMS-to-MongoDB migration

The advanced feature simulates a migration from relational-style JSON table extracts. It exports BUS, DRIVER, ROUTE, ROUTE_STOP, and TRIP tables, reconstructs route documents by embedding their stop records, loads a separate timestamped MongoDB target, and checks counts and references. The run validated 160 buses, 120 drivers, 120 routes, 600 trips, and preservation of all 709 route stops.

**Limitation:** This is not a live migration from a running MySQL or SQL Server database. The source is simulated through JSON extracts.

## 9. Replication, CAP, and sharding

The local MongoDB deployment uses a single-member replica set named `rs0`. It supports the demonstrated transaction workflow but does not demonstrate redundancy or multi-node failover. CAP is discussed conceptually; no multi-node network-partition experiment was performed. Sharding architecture is explained conceptually, but a live sharded cluster is not configured.

## 10. Comparison with Cassandra and Neo4j

MongoDB is selected for its document model, embedded data, rich queries, aggregation, and fit for the project's operational records. Cassandra is discussed as an alternative for high-volume distributed event/telemetry workloads, where partition-key and query-oriented design are important. Neo4j is discussed as an alternative for graph relationship analysis, such as route connectivity or connections among buses, drivers, trips, and incidents. The comparison is workload-dependent; neither alternative is universally superior.

## 11. Testing and validation

The recorded final audit checked:
- Replica-set configuration and writable-primary status.
- Expected collection names and document counts.
- 13 unique business-key indexes.
- References from trips, maintenance, and fuel records.
- Presence and counts of the four migration target collections.
- Preservation of 709 embedded route stops.
- Migration trip references.

The latest run reported **42 checks executed, 0 failed**, and 2,010 source documents. Separate prior runs of CRUD, query, aggregation, and migration demonstrations passed. The transaction script has since been strengthened, so its revised version still needs a fresh local run. Re-run the scripts before submission and retain screenshots/logs of the current results.

## 12. Limitations and future work

- Replace the simulated JSON source with an actual SQL export/import if a live RDBMS migration is required.
- Test with a multi-member replica set before claiming failover or high availability.
- Deploy a sharded cluster only if the assignment requires a live sharding demonstration.
- Capture output screenshots and add concise interpretations for the ten required aggregation questions.
- Prepare the final presentation and individual viva separately.
- Add persistent report snapshots only if the application requires historical saved reports.

## Conclusion

The project demonstrates a substantial MongoDB implementation for fleet and route management, including data modeling, query and aggregation operations, indexing, transactions, and a validated simulated relational-to-document migration. Its evidence supports the implemented local features while explicitly documenting that live SQL migration, multi-node failover, and sharding experiments have not been performed.

## References within this repository

- [README](../README.md)
- [Architecture and schema diagram](architecture.md)
- [Faculty requirement matrix](requirement_matrix.md)
- [Aggregation results and interpretation guide](aggregation_results_and_interpretation.md)
- [Database comparison, CAP, replication, sharding, and migration](database_comparison_cap_migration.md)
- [Evidence and validation](EVIDENCE.md)
