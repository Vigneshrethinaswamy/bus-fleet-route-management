# Aggregation Results and Interpretation Guide

This guide maps the faculty's ten required analytical questions to the executable pipelines in `aggregation_demo.js`. Run the script locally and use the actual terminal output when writing the final interpretation. Do not copy illustrative values from another run: the dataset is synthetic and generated dates may vary.

## Run

From the repository root:

```powershell
mongosh aggregation_demo.js
```

The script prints each pipeline's result count and up to three result documents. Capture screenshots of the output after confirming the run ends with `Failed: 0` and `AGGREGATION DEMONSTRATION PASSED.`

## Required questions

| # | Faculty question | Pipeline in script | Interpretation to write from actual output |
|---:|---|---|---|
| 1 | Top 5 bus-related records by the main business measure | `8. Bus trip and distance summary` and `3. Top routes by revenue` | Identify the top bus/route IDs and compare total trips, distance, or revenue. State which measure the pipeline ranks. |
| 2 | Group by important category and total using `$sum` | `10. Maintenance cost by type` | Compare total maintenance cost and record count across maintenance types. |
| 3 | Average business value using `$avg` | `2. Average passengers by trip type` | Compare average passengers among regular, special, and charter trips that appear in the output. |
| 4 | Minimum and maximum using `$min` and `$max` | `4. Revenue min, max, average` | Report the observed minimum and maximum trip revenue and the average; use the printed values. |
| 5 | Count records by status and identify largest group | `1. Trips grouped by status` and `1b. Largest trip-status group` | Report the status with the greatest trip count and its count. |
| 6 | Sort a meaningful result and return top 5 using `$limit` | `3. Top routes by revenue` or `9. Fuel cost by bus` | List the five returned entities in descending order of the selected measure. |
| 7 | Paginated report using `$skip` and `$limit` | `12b. Paginated trip report (page 2)` | Explain that sorting establishes a stable order, `$skip: 10` skips the first ten records, and `$limit: 10` returns the next ten. |
| 8 | `$unwind` an embedded array and calculate a statistic | `12. Route stops grouped by name` | Explain that each embedded stop becomes a pipeline document before the stop-name grouping. The resulting count is occurrences across route-stop arrays. |
| 9 | Use `$push` and `$addToSet` | `11. Unique statuses and trip IDs by route` | Explain that `$push` preserves each trip ID in a list, while `$addToSet` collects distinct status values. |
| 10 | Use `$lookup` to combine two related collections | `5. Trips joined with buses` (also pipelines 6 and 7) | Explain the join keys and identify the joined bus registration, route, or driver fields in the resulting report. |

## Additional useful pipelines

- `9. Fuel cost by bus`: compares fuel consumption and cost by bus.
- `6. Trips joined with routes`: combines trip details with route names and endpoints.
- `7. Trips joined with drivers`: combines trips with driver names.
- `8. Bus trip and distance summary`: compares trips, distance, and average passengers by bus.

## Screenshot checklist

Save screenshots under a local `screenshots/` directory (the directory is not populated automatically):

- [ ] Status counts and largest status group.
- [ ] Top routes by revenue.
- [ ] Revenue min/max/average.
- [ ] Paginated trip report.
- [ ] Route-stop unwind statistic.
- [ ] Push/addToSet grouped report.
- [ ] One or more lookup reports.
- [ ] Final aggregation summary showing zero failures.

For each required question, add a short interpretation based on the real output: what was grouped or joined, what the highest/lowest result was, and why the result matters for fleet operations. Avoid claiming a business insight that is not supported by the printed result.
