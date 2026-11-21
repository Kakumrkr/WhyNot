# WhyNot v1.0.0 release notes

WhyNot is an open-source TypeScript appointment engine and static playground. Explore booking failures and available alternatives at the fictional Riverside Family Clinic. [Live playground](https://kakumrkr.github.io/WhyNot/)

- Patient and staff views explain unavailable appointments and show verified alternatives with search coverage.
- The staff inspector shows candidate combinations and which facts cover them. Staff can compare the original request with a hypothetical policy change.
- Day and week views explain blocked start windows and can open a rechecked next appointment when the search finds one.
- Import and export versioned fictional snapshots locally. Imported selections clear on reset or browser navigation.
- Build the ESM engine, contracts and templates as tarballs and run the independent Harbor clinic example. The `v1.0.0` tag versions the repository release. The package manifests are private and the example installs from local archives. [Integration guide](../integration.md)

The release models one appointment in one clinic from the supplied records and settings. Search is bounded. The static demo stores no appointments and requires no account, server, database or model key. Clinical usefulness and developer adoption are pending external review. [Runbook](../runbook.md) · [Technical evidence](session-5.2-release.md)
