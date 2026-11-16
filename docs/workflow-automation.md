# Unattended development workflow

Decision D-064 governs session persistence, review, merging and durable handoffs.
The application roadmap and the stop after Session 5.2 remain unchanged.

## Requested outcome

At the selected time, a hosted worker resumes the current incomplete card or selects
the next eligible first-release card. It implements, verifies, opens a PR, obtains a
fresh independent review, fixes findings, observes the merge, and saves the handoff.
The developer's PC can remain off. A recoverable failure does not require the user
to create another conversation or restate the task.

## Activation status

Not activated. Do not describe this document or a saved prompt as a running service.
Use an isolated test task for activation checks before enabling roadmap work.

Before activation, record the user's chosen execution route, schedule, timezone,
merge policy, model access and spending limit. Credential values belong in the
provider's secret store, never this repository or chat. Verify a hosted run and
its recovery path before claiming unattended operation works.

## Execution routes

| Route | What is established | What must be verified/configured |
| --- | --- | --- |
| Codex Cloud with a scheduled cloud task | Cloud coding work can continue while the PC sleeps | Account-specific scheduling support, published environment, repository write access, fresh review and durable continuation |
| GitHub-hosted Actions with Codex | The official Codex action runs coding tasks in CI using an API key | API billing authorization/key, schedule, GitHub write identity, protected merge policy and independent review |

Desktop scheduling against a local folder requires the computer and app to run.
Web scheduled tasks have connected tools, but that alone does not establish a
hosted coding workspace with checkout, tests, push and merge capabilities.

Current official references checked 2026-11-16:
[scheduled tasks](https://learn.chatgpt.com/docs/automations),
[cloud environments](https://learn.chatgpt.com/docs/environments/cloud-environments),
[Codex GitHub Action](https://learn.chatgpt.com/docs/github-action).

## Setup sequence

1. Select the hosted executor and verify its account access, authentication and cost
   model. For subscription-backed scheduling, demonstrate a supported trigger that
   actually starts a coding workspace; a reminder or GitHub-reading task is insufficient.
2. Prepare its environment with the pinned toolchain, frozen dependencies, GitHub
   access and the capabilities required by the next card. Run the existing gates
   from a clean checkout. Keep credential values in the executor's secret store.
3. Implement the coordinator's durable state, single-owner lock and phase recovery.
   Keep scheduling disabled while testing. Neither an interrupted job nor a new
   scheduled tick may create a second card or PR for existing work.
4. Connect separate implementation, fresh-review and merge phases. Record merge
   authority. Check current head/base, required CI and unresolved findings before
   merging; verify the resulting merge and post-merge checks.
5. Exercise the acceptance cases below on an isolated test task. Save actual run
   URLs/results and remaining limitations. Fix failures before activation.
6. Save the selected cadence/timezone and enable the trigger. Each tick resumes
   unfinished work first. Only a confirmed merged, verified and handed-off card
   makes the next one eligible. Keep a manual pause/disable control available.

## Worker instruction

The executor supplies a verified card and phase; workers must not treat a stale
record as permission to start a different card. Use this instruction with the
selected card's full prompt and the recorded continuation:

```text
Use whynot-session. Read AGENTS.md, docs/PROGRESS.md, docs/QUESTIONS.md,
docs/sessions/README.md, docs/09-codex-workflow.md and the entire selected card.
Reconcile live GitHub dependency, branch, PR, review and check state first.
Resume the recorded card and phase; implement only its Build list.
Diagnose and fix recoverable failures without asking the user to restart.
Commit logical checkpoints, push all commits and verify the remote branch HEAD.
Run all required gates and obtain fresh whynot-review of the exact head/base.
Resolve findings, recheck and obtain fresh review after changes.
Follow recorded merge authority; never bypass checks or protections.
Keep the card pending until actual merge, post-merge checks and durable handoff.
Before a runtime limit, save the precise continuation for the same card.
Stop before another card; a later coordinator trigger selects eligible work.
Stop after 5.2 unless a follow-on milestone has been explicitly selected.
```

## Work ownership and progression

Use one coordinator for this repository and one active implementation card. Each
scheduled tick first reconciles GitHub state with the durable record. Do not
select the next card from PROGRESS checkboxes alone. Confirm dependency PR merge
SHAs through GitHub. Reuse an existing branch/PR, including draft PRs and work
whose implementation is done but review, CI, merge or handoff is still pending.

The lifecycle is:

`implementing -> verifying -> reviewing -> fixing -> verifying/reviewing -> waiting_for_merge -> merged -> handoff_ready`

External blockers use `blocked` with the prior phase retained. Only
`handoff_ready` releases the next card, and only a later authorized trigger may
start it. Stop after 5.2; P/H/A require separate milestone selection.

One shared concurrency lock must cover scheduled, manual and recovery runs.
Do not cancel a working owner when a new tick arrives. Record a lease/run ID;
recover stale ownership only after proving the previous run ended. Repeated
events must be idempotent: one card branch, one PR, no duplicate workers.

## Persistence and recovery

Maintain a durable record outside an ephemeral runner: card, phase, branch, PR,
checkpoint SHA, reviewed SHA/base, check run URLs, last error, attempt history,
next retry, current run/lease, merge SHA and next prompt. GitHub is authoritative
for remote branch, review, checks and merge state. PROGRESS explains the evidence.

Before a runtime deadline, commit a coherent checkpoint, push, verify remote HEAD,
update the same PR and save the precise continuation. The scheduler must resume
that phase automatically; a checkpoint is not completion. If persistence itself
fails, keep the card locked and report the exact failure; never advance.

For code/test failures, reproduce, diagnose and fix while retaining scope. Two
failed attempts require recording evidence and changing the approach, not ending
the card. Retry transient service failures with bounded backoff. Permanent auth,
quota, missing capability or unresolved product decisions require a truthful
blocked record and a visible failure report. Avoid endless paid retries; the
configured attempt/spending budget must stop repeated identical failures. Resume
the same card when the blocker clears. No system can guarantee completion through
service outages or unavailable credentials.

## Review and merge gate

Run whynot-review in a fresh context against the exact proposed head and base.
The reviewer produces findings and evidence without editing implementation.
The implementer fixes findings and requests another fresh review after changes.
Use required correctness/UX review at the card's named gates. A successful command,
an empty response or a missing review is not independent approval.

Automatic merging requires explicit recorded user authorization. Otherwise keep
watching the same PR for the user's merge. In either mode require current-head
verification, independent review, all card-specific gates, no unresolved findings,
resolved merge conflicts, and compliance with GitHub protections. Never bypass
required reviewers or checks, use admin merge, or treat enqueue/auto-merge enabled
as merged. Confirm the actual merged state and merge SHA, then check post-merge CI.
A failed post-merge gate blocks progression and needs a repair PR before any next card.

Keep merge authority separate from implementation authority in a hosted pipeline.
The merge controller must verify evidence from trusted job results and GitHub,
not merely an implementation agent's claimed approval or changed control files.
New commits invalidate old approvals. Bot-authored pushes using GITHUB_TOKEN
normally do not trigger new workflows: select a GitHub App/PAT or explicitly
dispatch verification, then verify that the required checks actually execute.

## Handoff

Before requesting merge, include a short note in the PR's committed PROGRESS update:
what changed, checks, decisions, remaining issues, and the next card/prompt.
After merging, record the actual merge SHA, reviewed head, CI links and next prompt
in the durable coordinator record and PR conversation. The next worker reconciles
PROGRESS from that evidence before selecting work. Never fabricate a future merge
SHA inside the commit being merged, or create an endless chain of handoff-only PRs.

## Acceptance before enabling development

- [ ] User-selected route, schedule/timezone, merge policy and spending bound saved.
- [ ] Hosted dependencies use Node 24.22.3 / pnpm 12.21.0 and frozen installation.
- [ ] Required current skills/tools are available in the actual cloud environment.
- [ ] One manual hosted smoke run passes using an isolated test task.
- [ ] Duplicate triggers and an interrupted run resume the same maintenance test.
- [ ] A failing check and a review requesting changes both prevent merge/advance.
- [ ] Auth/quota failure preserves a checkpoint and produces a visible blocked result.
- [ ] Latest-head CI, fresh review and merge confirmation are demonstrated on a test PR.
- [ ] Post-merge CI and a durable handoff are observed before development activation.

## Verification evidence

Keep configuration, test results and unresolved activation requirements in the
coordinator's durable record and the setup PR. Run pnpm verify, the non-bootstrap
planning validator and git diff --check for repository workflow changes. Obtain
fresh independent review before merging. Local documentation checks do not satisfy
hosted execution, recovery or activation acceptance items.
