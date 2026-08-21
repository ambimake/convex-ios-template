# Diagnostics Identity Fixtures

Open before adding or changing a diagnostics identity, support reference, or
vendor user identifier produced in more than one runtime.

## Lesson

Privacy-safe diagnostics identities are easy to get subtly wrong when Swift and
Convex each implement the same transformation. A mismatched prefix, encoding,
digest format, or version can leave events uncorrelated and can break vendor
deletion fan-out without an obvious local failure.

When a diagnostics identity spans runtimes, define the contract as a **versioned
format** and pin at least one **shared fixture vector** in every runtime that
produces or consumes it. If the identity replaces a legacy vendor identifier,
test deletion/scrub fan-out for both current and legacy identifiers until
retention or a migration closes the gap.

## Guardrail

- Name the exact format, version, input encoding, and output encoding in the
  owning decision or current-truth doc.
- Add matching fixture tests in each runtime.
- Pseudonymize at the vendor boundary; keep the raw owner key only where other
  approved backend behavior still needs it.
- Document the threat model: a deterministic hash prevents raw-ID exposure but is
  not a secret-key unlinkability mechanism.
