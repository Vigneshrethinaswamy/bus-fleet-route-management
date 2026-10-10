# Bus Fleet & Route Management

A MongoDB and Node.js academic project for managing a synthetic bus fleet, drivers, routes, trips, maintenance, fuel records, transactions, and activities.

## Project overview

- **Database:** MongoDB 8.x
- **Runtime:** Node.js
- **MongoDB shell:** mongosh
- **Advanced feature:** RDBMS-style data migration into MongoDB
- **Dataset:** 2,010 synthetic documents across 10 collections

## Collections

`users`, `masterData`, `buses`, `drivers`, `routes`, `trips`, `maintenance`, `fuelRecords`, `transactions`, and `activities`.

The design demonstrates referenced documents, embedded arrays, validation, unique and supporting indexes, CRUD operations, 16 analytical aggregation pipelines, and atomic transaction handling.

## Requirements

- MongoDB 8.x
- Node.js
- `mongosh`
- `mongoimport` (MongoDB Database Tools)
- A local MongoDB replica set named `rs0` for the transaction demonstration

Install the Node.js dependency from the repository root:

```powershell
npm install
```

## Setup and import

Run commands from the repository root.

1. Start MongoDB and configure the local `rs0` replica set if you intend to run transaction examples.
2. Create the database and collections:

   ```powershell
   mongosh --file database/01_database_setup.js
   ```

3. Create the synthetic dataset if you want to regenerate it:

   ```powershell
   node database/generate_data.js
   ```

   **Note:** Regenerating data may replace the checked-in synthetic JSON files. Review the changes before committing.

4. Prepare the JSON arrays for import. This converts ISO date strings to MongoDB Extended JSON date values:

   ```powershell
   node prepare_import.js
   ```

5. Print the import commands:

   ```powershell
   mongosh --file database/03_import_data.js
   ```

6. Run the printed `mongoimport` commands from the repository root. Import into a clean database or clear existing collections first to avoid duplicate documents.
7. Create indexes:

   ```powershell
   mongosh --file database/02_indexes.js
   ```

The generated `data/import_ready/` directory is intentionally excluded from Git because its files can be regenerated from `data/`.

## Demonstrations and verification

Run the scripts applicable to your local MongoDB setup:

```powershell
mongosh bus_fleet_management --file validate_database.js
mongosh bus_fleet_management --file crud_demo.js
mongosh bus_fleet_management --file query_operators_demo.js
mongosh bus_fleet_management --file aggregation_demo.js
node transaction_demo.cjs
node migration_demo.cjs
mongosh final_project_audit.js
```

The transaction example uses the official MongoDB Node.js driver. It selects an eligible bus, driver, scheduled trip, and active user; commits the status/assignment updates and transaction/audit records together; then tests rollback and restores the original test records and operational state. Transactions require replica-set support. Re-run it locally after pulling changes to verify the current version.

The migration demonstration uses relational-style JSON source tables and reconstructs MongoDB documents with embedded route stops. It is a **simulated export-and-migration workflow**, not a live migration from a running SQL Server or MySQL database. Each successful run creates a new timestamped target database. Run `node migration_demo.cjs` before `mongosh final_project_audit.js`; the audit locates the latest timestamped migration target automatically.

## Indexing evidence

The project benchmarks a compound index against a collection scan for a trip-status and scheduled-start query. In the recorded test, documents examined fell from 600 to 128. Execution time can vary by run and environment, so examined-document counts are the stronger comparison.

## Documentation and presentation

- [Final project report](docs/final_report.md) — polished report with verified results and limitations
- [Architecture and schema diagram](docs/architecture.md)
- [Requirement matrix](docs/requirement_matrix.md)
- [Database comparison, CAP, replication, sharding, and migration](docs/database_comparison_cap_migration.md)
- [Evidence and validation](docs/EVIDENCE.md)
- [Aggregation results and interpretation](docs/aggregation_results_and_interpretation.md)
- `migration/source_tables/` — relational-style JSON extracts used by the migration demonstration

## Verified results and scope

Latest reported local results: database validation **55 passed, 0 failed, 0 warnings**; aggregation demonstration **16 passed, 0 failed**; query-operator demonstration **12 passed, 0 failed**. The primary dataset contains 2,010 synthetic documents.

The tested deployment is a **single-member** replica set named `rs0`. The migration demonstration uses JSON extracts, not a live SQL database. Multi-node failover, network-partition experiments, and a live sharded cluster have not been tested. These limitations are intentional and documented in the report.

## Data and privacy

All included project datasets are synthetic. Do not add credentials, `.env` files, private keys, database dumps containing personal information, or other secrets to the repository.
