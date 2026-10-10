# NoSQL Database Comparison and Distributed Database Concepts

**Project:** Bus Fleet & Route Management
**Database:** MongoDB
**Advanced Feature:** RDBMS-to-MongoDB Migration

---

## 1. Comparison of MongoDB, Cassandra, and Neo4j

| Feature | MongoDB | Apache Cassandra | Neo4j |
|---|---|---|---|
| Database model | Document-oriented | Wide-column | Graph-oriented |
| Data representation | BSON documents in collections | Rows organized by partition and clustering keys | Nodes, relationships, and properties |
| Query language | MongoDB Query API and aggregation pipeline | CQL (Cassandra Query Language) | Cypher |
| Main strength | Flexible documents and rich queries | High write throughput and distributed scalability | Traversal of complex relationships |
| Scaling approach | Sharding and replica sets | Distributed partitioning and replication | Graph-oriented scaling and clustering options |
| Relationships | References and embedded documents | Often modeled around query patterns and denormalized | Explicit relationships between nodes |
| Suitable use cases | Fleet management, content platforms, operational applications | High-volume event data, time-series workloads, distributed writes | Social networks, fraud networks, dependency graphs |
| Main consideration | Schema design and indexes require planning | Query design and partition keys are critical | Graph workloads may not suit simple tabular operations |

### Application to Bus Fleet & Route Management

**MongoDB — selected database**

MongoDB is suitable because the project contains structured entities such as buses, drivers, routes, trips, maintenance records, and fuel records. Embedded route stops, references between entities, aggregation pipelines, and indexes support the application's requirements.

**Cassandra — alternative for distributed event workloads**

Cassandra could be considered if the system needed to ingest very large volumes of telemetry or operational events across multiple locations. Its tables should be designed around the application's query patterns and partition keys.

**Neo4j — alternative for relationship analysis**

Neo4j could be useful for analyzing connections between buses, drivers, routes, trips, and incidents. Graph queries could help explore route connectivity or investigate relationships among operational events.

### Conclusion

MongoDB is a reasonable fit for this project's combination of document storage, operational queries, aggregations, and migration requirements. Cassandra and Neo4j are alternatives for different workload priorities, rather than universally better replacements.

---

## 2. CAP Theorem

CAP describes three properties of distributed data systems:

- **Consistency (C):** Reads observe data according to the system's consistency guarantees.
- **Availability (A):** Requests to non-failed nodes receive responses.
- **Partition tolerance (P):** The system continues operating despite network communication failures between nodes.

When a network partition occurs, a distributed system cannot guarantee both full consistency and full availability for every request.

### Application to this project

The local MongoDB deployment uses a replica set named `rs0`, with one member:

- Address: `127.0.0.1:27017`
- Observed state: `PRIMARY`
- Writable primary: `true`
- MongoDB version: `8.3.7`

This confirms replica-set configuration, but a single-member replica set does not demonstrate high availability or failover. It also does not provide a meaningful experiment of the CAP trade-off across multiple nodes.

**Important:** Do not claim that this project experimentally demonstrated a CAP partition scenario. The theorem is discussed conceptually; the current deployment evidence is a single-node replica set.

---

## 3. Replica Sets and Sharding

### Replica sets

A replica set maintains multiple copies of the same data across MongoDB members. Eligible members can participate in primary elections, and a secondary may become primary when the required election conditions are met.

**Project evidence:** `rs0` has one member in `PRIMARY` state. Transactions were successfully demonstrated, but failover across multiple members has not been tested.

### Sharding

Sharding distributes data across multiple shards to support horizontal scaling. A typical sharded deployment includes:

1. Shards that store portions of the data.
2. Config servers that maintain cluster metadata.
3. A `mongos` router that routes application operations.

**Project evidence:** The local connection reported `Connected through mongos: false`, and the `listShards` command was unavailable. A live sharded cluster has therefore not been demonstrated.

### Comparison

| Aspect | Replica set | Sharded cluster |
|---|---|---|
| Primary purpose | Redundancy and availability | Horizontal data distribution and scaling |
| Data placement | Replicated across members | Partitioned across shards |
| Typical components | Replica-set members | Shards, config servers, and `mongos` |
| Project status | Single-member replica set configured | Not configured |

---

## 4. RDBMS-to-MongoDB Migration

The project demonstrates a simulated migration using relational-style JSON table exports.

### Migration workflow

1. **Extract:** Export bus, driver, route, route-stop, and trip records.
2. **Transform:** Reconstruct route documents by embedding their stop records.
3. **Load:** Insert the transformed data into a separate MongoDB database.
4. **Validate:** Check record counts, unique identifiers, references, and preserved route stops.

### Migration results

| Entity | Source rows | Migrated documents |
|---|---:|---:|
| BUS | 160 | 160 |
| DRIVER | 120 | 120 |
| ROUTE | 120 | 120 |
| TRIP | 600 | 600 |
| ROUTE_STOP | 709 | Embedded into route documents |

All 709 route-stop records were preserved as embedded stops, and all migrated trip references resolved to their corresponding bus, driver, and route documents.

**Scope limitation:** The source was simulated using JSON relational-style table extracts. This was not a direct migration from a live MySQL or SQL Server instance.

---

## 5. Implementation Evidence

The project has demonstrated:

- 10 collections containing 2,010 documents in the original database.
- CRUD operations, including insertion, updates, queries, and deletion.
- MongoDB query operators and array queries.
- Aggregation pipelines, including `$group`, `$unwind`, and `$lookup`.
- Unique and supporting indexes.
- An index benchmark showing 600 documents examined by a collection scan versus 128 using a compound index for the tested query.
- A transaction demonstration with successful commit and rollback checks.
- A separate migration database with validated document counts and relationships.

The original database was verified to contain 2,010 documents after the transaction demonstration.

---

## 6. Final Conclusion

The Bus Fleet & Route Management project demonstrates practical MongoDB database design, querying, aggregation, indexing, transactions, and a simulated relational-to-document migration.

The project also examines Cassandra and Neo4j as alternatives and explains CAP, replica sets, and sharding. The current local setup demonstrates a single-member replica set, not a multi-node failover test or a sharded deployment.
