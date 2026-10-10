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

The design demonstrates referenced documents, embedded arrays, validation, unique and compound indexes, CRUD operations, aggregation, and transaction handling.

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
   mongosh database/01_database_setup.js
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
   mongosh database/03_import_data.js
   ```

6. Run the printed `mongoimport` commands from the repository root. Import into a clean database or clear existing collections first to avoid duplicate documents.

7. Create indexes:

   ```powershell
   mongosh database/02_indexes.js
   ```

The generated `data/import_ready/` directory is intentionally excluded from Git because its files can be regenerated from `data/`.

## Demonstrations and verification

Run the scripts applicable to your local MongoDB setup:

```powershell
mongosh validate_database.js
mongosh crud_demo.js
mongosh query_operators_demo.js
mongosh aggregation_demo.js
node transaction_demo.cjs
node migration_demo.cjs
mongosh final_project_audit.js
```

The transaction example uses the official MongoDB Node.js driver. Transactions require replica-set support.

The migration demonstration uses relational-style JSON source tables and reconstructs MongoDB documents with embedded route stops. It is a **simulated export-and-migration workflow**, not a live migration from a running SQL Server or MySQL database.

## Indexing evidence

The project benchmarks a compound index against a collection scan for a trip-status and scheduled-start query. In the recorded test, documents examined fell from 600 to 128. Execution time can vary by run and environment, so examined-document counts are the stronger comparison.

## Architecture and project evidence

- `docs/architecture.md` — database design
- `docs/requirement_matrix.md` — requirement coverage
- `docs/database_comparison_cap_migration.md` — database comparison, CAP, replica sets, sharding, and migration discussion
- `docs/EVIDENCE.md` — implementation and validation evidence
- `migration/source_tables/` — relational-style JSON exports used by the migration demonstration

## Data and privacy

All included project datasets are synthetic. Do not add credentials, `.env` files, private keys, database dumps containing personal information, or other secrets to the repository.
