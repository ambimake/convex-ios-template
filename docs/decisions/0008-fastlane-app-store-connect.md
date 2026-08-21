# 0008 — Fastlane / App Store Connect operator tooling

Status: Accepted (template default; adopt when release work repeats)

## Context

App Store Connect metadata and TestFlight work done as manual UI entry plus ad
hoc one-liners is slow to repeat and hard to verify. Repo-owned release tooling
makes readback and metadata reproducible and reviewable.

## Decision

Allow a top-level `fastlane/` directory (plus a root `Gemfile`/`Gemfile.lock`)
for checked-in App Store Connect metadata and verification tooling. It may hold
the `Fastfile`, `Appfile`, an operator guide, and git-tracked listing/TestFlight
metadata as a point-in-time mirror of the live listing. App Store Connect API
keys and `.p8` files stay gitignored. Fastlane fixes the `fastlane/` +
`Gemfile` layout by convention, so follow it rather than nesting under
`scripts/`.

## Consequences

- Metadata readback and seeding are reproducible via package scripts.
- The directory is limited to metadata/verification tooling and the tracked
  listing mirror; keys, `.p8` files, and build artifacts do not move here.
- Destructive push lanes exist but require explicit, reviewed, human-gated
  invocation — a live production push is an operator action, not automation.
- Build/archive/upload and CI integration are deferred until repeated release
  work proves the need.
