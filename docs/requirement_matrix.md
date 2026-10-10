# Faculty Requirement Matrix

| Requirement | Implementation |
|---|---|
| MongoDB primary DB | `bus_fleet_management` |
| Synthetic data | `database/generate_data.js` |
| Embedded document | `buses.depot` |
| Embedded array | `routes.stops[]` |
| References | Trip/bus/driver/route relationships |
| `$lookup` | Trip operational report |
| CRUD | `crud_demo.js` |
| Comparison operators | `$gt`, `$gte`, `$lt`, `$lte`, `$in` |
| Logical operators | `$and`, `$or` |
| Projection | Bus report |
| limit / skip | Aggregation demo: paginated trip report uses `$skip` + `$limit` |
| `$elemMatch` | Trip incidents |
| `$slice` | Active route first 3 embedded stops; grouped trip-ID preview |
| Aggregations | 16 pipelines in `aggregation_demo.js`; run locally to verify all pass |
| `$match` | Completed trips by route; active route preview |
| `$group` | Fleet/route/trip metrics |
| `$project` | Final report shaping |
| `$sort` | Ranking |
| `$limit` / `$skip` | Top-N ranking, largest status group, and paginated trip report |
| `$sum` | Distance/revenue/cost |
| `$avg` | Passenger/stop/fuel metrics |
| `$min` / `$max` | Revenue/distance ranges |
| `$push` | Grouped route lists |
| `$addToSet` | Unique bus types |
| `$unwind` | Route stops / maintenance parts |
| Unique index | Bus registration |
| Sparse index | Optional GPS device |
| Compound index | Trip status + schedule |
| Multikey index | `routes.stops.name` |
| `explain("executionStats")` | Before/after index study |
| Commit transaction | Bus-trip assignment |
| Rollback | Aborted bus/driver/trip assignment transaction |
| Replica set | `rs0` |
| CAP | Distributed design discussion |
| Sharding | Horizontal scalability design |
| Advanced feature | RDBMS → MongoDB migration |
| Cassandra comparison | Final report |
| Neo4j comparison | Final report |
