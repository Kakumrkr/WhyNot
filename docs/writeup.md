# How WhyNot explains an unavailable appointment

WhyNot takes a clinic snapshot, a request, and an injected clock. The result is an assignment, a structured input error, or an explanation of why every candidate fails. The Riverside playground runs the same TypeScript engine as the Node example. The browser adapter projects patient results before rendering and deterministic templates turn evaluated facts into wording. [Architecture](01-architecture.md) · [Integration guide](integration.md)

## From resource rules to a sufficient explanation

For a requested start, the engine enumerates combinations of practitioner, room, and any required equipment. It computes request-wide violations and per-resource violations, then combines their fact IDs into a row for each candidate. An empty row means the candidate is bookable. If a required resource pool is empty, the engine reports that structural blocker directly.

For a nonempty blocked matrix, a sufficient explanation is a set of facts that intersects every row. WhyNot removes duplicate and redundant superset rows, selects forced facts, and searches the remaining choices by weight. Canonical fact IDs break equal-weight ties. At the search cap, a greedy pass followed by deletion yields an irredundant result and `optimal: false`. Every selected fact must uniquely cover a row, so removing one makes the explanation insufficient. Actual bookings still require a fresh check against all rules.

## Recheck changes before showing them

Alternative search explores grid starts and explicit practitioner changes within its configured window and evaluation budget. Each result is re-evaluated, and the selection favors a mix of categories. A staff policy preview applies allowlisted changes to a copied snapshot and re-evaluates the original request at the same clock. The preview can show whether the proposed settings actually make the request bookable.

Calendar explanations consider eligible starts across one to seven local dates. They combine adjacent starts with the same rule-and-subject signature. A common cause is shown when its actual facts independently cover every candidate at every start. A forward search rechecks any opening and reports the applicable preference change and coverage. [Algorithm specification](03-engine-algorithms.md)

## What the evidence covers

An independent checker enumerates resource combinations and evaluates domain rules separately. Golden fixtures cover named hero cases and edge conditions. Properties check equivalence, explanation sufficiency, re-evaluation, projection and range coverage over generated inputs. The inspector exposes bounded evidence for specific evaluations, including when optimization or trace capture was limited.

WhyNot models one appointment at one clinic. Timezone boundaries follow the clinic's local grid and the snapshot's explicit instants. Facts depend on supplied records and settings. Search and trace output are bounded, and timings depend on workload and machine. Policy previews are hypothetical. Clinical usefulness and developer adoption are pending external validation. [Testing specification](06-testing-and-accuracy.md) · [Release evidence](reviews/session-5.2-release.md)
