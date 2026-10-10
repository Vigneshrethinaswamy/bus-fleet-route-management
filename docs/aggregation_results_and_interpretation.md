# Aggregation Results and Interpretation Guide

## Verification

The recorded aggregation demonstration completed with **16 passed and 0 failed**. Results below are taken from the captured run in `reports/verification/aggregation_demo.log`. The dataset is synthetic; values may change if the dataset is regenerated.

Run from the repository root:

```powershell
mongosh bus_fleet_management --quiet --file aggregation_demo.js
```

## Faculty Questions and Actual Results

### 1. Top bus-related records by business measure

Pipeline: `8. Bus trip and distance summary`

- `BUS0062`: 10 trips, 406 km total distance, 22.7 average passengers.
- `BUS0085`: 8 trips, 306.8 km, 25.5 average passengers.
- `BUS0141`: 8 trips, 365.8 km, 30 average passengers.

Interpretation: Among the displayed results, BUS0062 has the highest trip count and total distance. BUS0141 has the highest average passenger count among these three. These are separate measures and should not be treated as interchangeable.

### 2. Group by category and calculate totals with `$sum`

Pipeline: `10. Maintenance cost by type`

| Maintenance type | Records | Total cost | Average cost |
|---|---:|---:|---:|
| PREVENTIVE | 86 | 754,371 | 8,771.76 |
| INSPECTION | 50 | 431,736 | 8,634.72 |
| CORRECTIVE | 44 | 396,557 | 9,012.66 |

Interpretation: Preventive maintenance has the largest total cost and most records. Corrective maintenance has the highest average cost per record. The dataset does not explicitly establish a currency unit, so costs are reported in the recorded units.

### 3. Calculate an average using `$avg`

Pipeline: `2. Average passengers by trip type`

| Trip type | Trip count | Average passengers |
|---|---:|---:|
| REGULAR | 371 | 28.50 |
| CHARTER | 101 | 27.51 |
| SPECIAL | 128 | 26.13 |

Interpretation: Regular trips have the highest average passenger count among the three types in this dataset.

### 4. Calculate minimum, maximum, and average with `$min`, `$max`, and `$avg`

Pipeline: `4. Revenue min, max, average`

- Total revenue: 859,322
- Average revenue: 1,432.20
- Minimum revenue: 150
- Maximum revenue: 4,730

Interpretation: These aggregate values summarize revenue across the records included in the pipeline. Revenue units are not labelled as a specific currency in this interpretation.

### 5. Count records by status and identify the largest group

Pipelines: `1. Trips grouped by status` and `1b. Largest trip-status group`

- CANCELLED: 135 trips
- ASSIGNED: 128 trips
- SCHEDULED: 121 trips
- Largest status group: CANCELLED, with 135 trips.

Interpretation: CANCELLED is the largest displayed status group. This is a count of statuses; it does not establish the reasons for cancellations.

### 6. Sort and return the top five routes using `$sort` and `$limit`

Pipeline: `3. Top routes by revenue`

Top displayed results:

| Route | Total revenue | Trips |
|---|---:|---:|
| RT0068 | 32,594 | 11 |
| RT0054 | 25,491 | 12 |
| RT0110 | 23,478 | 10 |

Interpretation: RT0068 has the highest total revenue among the displayed routes. The pipeline returns five results; the captured console excerpt displays only the first three distinct results.

### 7. Paginate a report using `$skip` and `$limit`

Pipeline: `12b. Paginated trip report (page 2)`

- Returned documents: 10.
- The pipeline sorts the records, skips the first ten, and limits the result to the next ten.

Interpretation: Pagination allows a report to be viewed in bounded pages rather than returning the entire dataset at once. A deterministic sort is important for consistent page boundaries.

### 8. Unwind an embedded array and calculate a statistic

Pipeline: `12. Route stops grouped by name`

- Silk Board: 43 occurrences.
- Electronic City: 42 occurrences.
- Banashankari: 42 occurrences.

Interpretation: `$unwind` turns embedded route-stop array entries into individual pipeline documents. Grouping those entries by stop name counts occurrences across the arrays; it does not necessarily count unique physical locations.

### 9. Demonstrate `$push` and `$addToSet`

Pipeline: `11. Unique statuses and trip IDs by route`

For RT0054:

- Trip count: 12.
- Distinct statuses: COMPLETED, ASSIGNED, IN_PROGRESS, SCHEDULED, CANCELLED.
- The sample trip ID list contains five IDs.

Interpretation: `$addToSet` collects distinct status values, whereas `$push` collects values into an array and can preserve repeated values. The pipeline demonstrates both array-building behaviours.

### 10. Join related collections using `$lookup`

Pipeline: `5. Trips joined with buses`

Example joined record:

- Trip: TRP000004
- Bus: BUS0133
- Registration: KA22DJ1133
- Status: ASSIGNED

Interpretation: `$lookup` enriches trip records with matching bus information. This makes it possible to display bus registration details alongside trip data without storing every bus field inside every trip document.

## Additional implemented pipelines

The demonstration also includes:

- Trips joined with routes.
- Trips joined with drivers.
- Fuel cost by bus.
- Completed trips by route using `$match`.
- A preview of the first three stops of active routes using `$slice`.
- A largest-status-group query.
- A paginated trip report.

## Screenshot Evidence Checklist

Save genuine screenshots from the local run under `screenshots/`.

- [ ] Trip status counts and largest status group.
- [ ] Average passengers by trip type.
- [ ] Maintenance cost by type.
- [ ] Revenue minimum, maximum, and average.
- [ ] Top routes by revenue.
- [ ] Bus trip and distance summary.
- [ ] Paginated report.
- [ ] Route-stop grouping and the `$push`/`$addToSet` output.
- [ ] At least one `$lookup` result.
- [ ] Final aggregation summary showing `Passed: 16`, `Failed: 0`, and `AGGREGATION DEMONSTRATION PASSED.`

Capture the actual terminal output; do not fabricate or manually alter result screenshots.

## Pagination and array accumulator evidence

- **Pagination:** trips are sorted by `tripId`, then `$skip: 10` and `$limit: 10` return the second page of 10 records.
- **`$push` and `$addToSet`:** trips are grouped by `routeId`. `$push` collects trip IDs, while `$addToSet` collects distinct statuses. The evidence query returned route `RT0054` with 12 trips and the five statuses `IN_PROGRESS`, `ASSIGNED`, `COMPLETED`, `SCHEDULED`, and `CANCELLED`.
- Screenshots: `23-paginated-trip-report.png` and `24-push-addToSet-by-route.png`.
