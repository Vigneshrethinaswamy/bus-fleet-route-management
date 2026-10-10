# Project Evidence and Validation

## Verified results

The following results were observed during project validation. Re-run the relevant scripts in your own environment to reproduce them.

- The primary database, `bus_fleet_management`, contains **2,010 synthetic documents across 10 collections**.
- The final audit completed **41 checks with 0 failures** against the validated source database and migration target.
- Unique business-key indexes were checked by the final audit.
- Trip, maintenance, and fuel-record references to buses, drivers, and routes were checked.
- The Node.js transaction demonstration passed its commit and rollback scenarios.
- The migration demonstration passed its count and reference-integrity checks.
- All **709 route-stop rows** were preserved when stops were embedded into route documents.
- The compound-index benchmark reduced documents examined from **600 to 128** for the tested trip-status/scheduled-start query. Execution time varies by run and environment.

## Reproduce the evidence

Run these from the repository root after completing the database setup and import described in `README.md`:

| Evidence | Command |
|---|---|
| Database validation | `mongosh validate_database.js` |
| CRUD operations | `mongosh crud_demo.js` |
| Query operators | `mongosh query_operators_demo.js` |
| Aggregation pipelines | `mongosh aggregation_demo.js` |
| Transaction commit/rollback | `node transaction_demo.cjs` |
| Simulated relational-style JSON migration | `node migration_demo.cjs` |
| Final database audit | `mongosh final_project_audit.js` |

The migration demonstration creates a new timestamped target database on each successful run. The final audit checks the latest matching migration target, so run the migration demonstration before the final audit. The scripts print their validation results to the terminal; run logs are not required for the project to function.

## Claims and limitations

- The migration is a **simulation using relational-style JSON table extracts**. It is not a live migration from a running SQL Server or MySQL database.
- The local replica set `rs0` has one member.
- A live sharded cluster, multi-node failover, and a network-partition experiment have not been demonstrated.
- The indexing benchmark describes the tested query and dataset only; it should not be generalized to every workload.
- The dataset is synthetic and should not be described as production data.

## Publication hygiene

Before publishing future changes:

- [ ] Review the staged diff for unintended files.
- [ ] Check that secrets, credentials, private keys, personal identifiers, and unnecessary local paths are absent.
- [ ] Confirm any new dataset is synthetic or otherwise appropriate to publish.
- [ ] Verify changed setup commands and script paths.
- [ ] Keep the repository's licensing choice intentional and consistent with the project's intended use.
