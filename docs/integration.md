# Integrate the WhyNot appointment engine

The [independent Node example](../examples/node/README.md) uses local ESM tarballs from the checkout. Build with `pnpm build`, then run `pnpm exec node examples/node/verify-packages.mjs` to exercise them in a clean temporary project. To install the archives in your own project, pack the three libraries with `pnpm --filter @whynot/contracts pack`, `pnpm --filter @whynot/engine pack` and `pnpm --filter @whynot/narrator pack`. Install all three tarballs together and direct `@whynot/contracts` dependencies to the contracts tarball with a pnpm override, as shown in [the consumer script](../examples/node/verify-packages.mjs). The packages are built for ESM and the repository currently uses private package manifests.

| ESM entry point | Use |
| --- | --- |
| `@whynot/contracts` or `@whynot/contracts/schemas` | Validate data with shared Zod schemas and import their inferred TypeScript types. |
| `@whynot/contracts/api` | Validate HTTP request and response payloads for the full local API. |
| `@whynot/engine` | Call `evaluate`, `isBookable`, `explainRange`, `projectForAudience`, `applyPolicyChanges` and `previewPolicyChanges`. Import time helpers, `catalog` and `catalogVersion` from the same entry. |
| `@whynot/narrator` or `@whynot/narrator/templates` | Render deterministic patient and staff wording using `TemplateNarrator`. |

## Map records into a snapshot

| Your records | WhyNot fields |
| --- | --- |
| Clinic calendar | Clinic ID, IANA timezone, local start grid, weekly hours, explicit closed dates and a half-open snapshot coverage interval. |
| Appointment types | Services with duration, required practitioner skill, optional room capability and equipment type, eligibility, practitioner buffer and room turnover. |
| Resource rosters | Practitioner skills and working hours, breaks, leave, optional caps, room capabilities, equipment types and maintenance windows. |
| Patients and appointments | Stable IDs, returning status and referral service IDs. Map each booking to an existing patient, service and its assigned resources. Include scheduled start/end and confirmed or cancelled status. |
| Scheduling settings | Policy version ID, minimum notice, maximum advance days, patient daily limit and an optional default practitioner cap. |

Use stable IDs for references and separate display names for wording. Validate mapped records with `ClinicSnapshotSchema` and a request with `BookingRequestSchema`. Include bookings and resource blocks that could overlap a requested or searched appointment, including buffers that cross the coverage boundary. Inject `now` on each check. Pass explicit-offset ISO instants through `parseOffsetInstant` at your integration boundary. The snapshot, requests and frozen clock represent instants as integer UTC epoch minutes.

Call `evaluate(snapshot, request, { now })` to get an assignment, a blocked explanation or structured invalid-input issues. Call `isBookable` when you only need the boolean, which is also false on invalid input. Project evaluated slot and range results with `projectForAudience(result, "patient", { requesterPatientId })` before sending or rendering them on patient surfaces. Supply public display labels to the patient narrator. Keep staff evaluation and trace behind your own access controls. A bookable result applies to the supplied snapshot. Your booking system owns any write, authorization and concurrent recheck.

## Supported limits

- **Model.** The engine schedules one appointment in one clinic with one practitioner, one room and, when required, one equipment unit. It evaluates modeled qualifications, availability, eligibility, occupancy and timing. Build adapters for your source records using the same contracts.
- **Time.** Intervals are half-open. Starts align to the clinic’s local midnight grid. Split weekly hours at midnight. Explicit offsets disambiguate repeated local times. Affected evaluations can return invalid input for ambiguous or nonexistent recurring schedule boundaries. Maximum advance is measured in elapsed 1,440-minute days. Daily caps use clinic-local dates.
- **Explanations and search.** The engine returns sufficient, irredundant blockers. Use the `optimal` flag to identify an explanation proven minimum-weight within the model. Alternatives are rechecked and selected for diversity within the bounded search. By default the slot search uses 14 days on either side and up to 3,000 evaluations, and the range next-opening search uses up to 14 days forward and 3,000 evaluations. Use the returned coverage and status to interpret empty or limited results. Range requests span one to seven local dates. Merged range segments describe appointment starts.
- **Policy.** Use `previewPolicyChanges` for a comparison against copied settings. Supported changes cover notice, advance, daily caps, buffers, turnover and returning-only eligibility. Verified suggestions make the modeled request bookable under those hypothetical settings. Clinical suitability and adoption remain decisions for the clinic.

## Use snapshot files in the playground

Open **Synthetic snapshot files** and select a UTF-8 JSON file with `schemaVersion: 1`, `snapshot` and `now`. Use the [Harbor example](../examples/node/snapshot.json) or download the current scenario with **Export snapshot JSON**. The file describes clinic data and the frozen clock. On import, the playground starts in patient view with the first patient and service in file order. **Reset imported snapshot** returns to the curated selection. Reloading or using browser history also clears the import.

Playground limits are 256 KiB, 100 practitioners, 100 rooms, 100 equipment units, 5,000 bookings, 20,000 real candidate combinations per service and 31 covered local dates. The file stays in tab memory. The export is a local download, and shareable links contain curated selections only. Use fictional data.

## Extend the rules in source

Update the shared schemas and rule catalog first, then add the rule to the relevant engine family and update the independent reference checker. Add patient projection and both audiences’ templates where the rule creates new facts. Cover boundary cases with unit and differential or property checks. Explain changes to the documented model or golden expectations in the pull request. See the [rule catalog specification](02-domain-and-rules.md), [projection and wording](04-explanation-and-ai.md) and [accuracy checks](06-testing-and-accuracy.md).
