# Project Evidence and Validation

## Verified results

The following results were observed during project validation. Re-run the relevant scripts in your own environment to reproduce them.

- The primary database, `bus_fleet_management`, contains **2,010 synthetic documents across 10 collections**.
- The latest recorded final audit completed **42 checks with 0 failures** against the source database and migration target. A separate fresh database validation reported **55 passed, 0 failed, and 0 warnings**. Rerun these checks after relevant database or code changes.
- Unique business-key indexes were checked by the final audit.
- Trip, maintenance, and fuel-record references to buses, drivers, and routes were checked.
- The revised Node.js transaction demonstration passed its recorded commit, rollback, and cleanup checks. It verifies atomic updates to bus, driver, and trip state, including that aborted writes do not persist.
- The migration demonstration passed its count and reference-integrity checks.
- All **709 route-stop rows** were preserved when stops were embedded into route documents.
- The compound-index benchmark reduced documents examined from **600 to 128** for the tested trip-status/scheduled-start query. Execution time varies by run and environment.

## Reproduce the evidence

Run these from the repository root after completing the database setup and import described in `README.md`:

| Evidence | Command |
|---|---|
| Database validation | `mongosh bus_fleet_management --file validate_database.js` |
| CRUD operations | `mongosh bus_fleet_management --file crud_demo.js` |
| Query operators | `mongosh bus_fleet_management --file query_operators_demo.js` |
| Aggregation pipelines (16 current pipelines) | `mongosh bus_fleet_management --file aggregation_demo.js` |
| Aggregation screenshot/interpretation guide | `docs/aggregation_results_and_interpretation.md` |
| Atomic assignment transaction and rollback | `node transaction_demo.cjs` |
| Simulated relational-style JSON migration | `node migration_demo.cjs` |
| Final database audit | `mongosh bus_fleet_management --file final_project_audit.js` |

The migration demonstration creates a new timestamped target database on each successful run. The final audit checks the latest matching migration target, so run the migration demonstration before the final audit. The current recorded aggregation and transaction runs passed their checks. The repository contains captured screenshots under `screenshots/`; verify visually that each required question is supported before final submission. Local verification logs are kept under `reports/verification/` and are excluded from Git by the repository ignore rules.

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
