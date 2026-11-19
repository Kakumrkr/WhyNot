# Run WhyNot in Node

From the repository root, with Node 24.22.3 and pnpm 12.21.0 installed:

```sh
pnpm install --frozen-lockfile
pnpm build
pnpm exec node examples/node/verify-packages.mjs
```

The verification script packs the three libraries, installs those tarballs into a temporary project outside the checkout, checks package contents and TypeScript declarations, then runs [check-appointment.mjs](check-appointment.mjs) against [snapshot.json](snapshot.json). Installation needs access to the pinned Zod and Luxon versions through the registry or pnpm store. The temporary project is removed at the end.

The fictional Harbor Walk-in Clinic asks for a 09:00 intake visit. Its frozen 08:00 clock and 90-minute notice policy block that request. The example renders the patient explanation, rechecks the 09:30 alternative, and compares the original request under a hypothetical 60-minute notice policy. It also checks whether the calendar has any available starts. For mapping your own records, see the [integration guide](../../docs/integration.md).
