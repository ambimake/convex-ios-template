# Convex Auth Ownership

Open before writing any owner-scoped Convex query or mutation.

Derive ownership inside the Convex function with `requireOwnerKey(ctx)`. **Never
accept an owner identifier as an argument**, even for internal queries. Internal
mutations may accept record IDs, but must still rederive the owner from auth
before writing, and validate that the record belongs to that owner.

- Query through **owner-qualified indexes** before checking size/existence caps.
  Post-filtering by owner after a broad query turns cross-owner data-integrity
  problems into false "too large"/"not found" failures for the authed user.
- Keep target selection and its audit write in **one** internal mutation. When an
  action delegates to multiple mutations, each is a separate transaction, and
  re-querying "latest" in a later mutation can select a different row than the
  one you acted on. Preflight domain errors before writes rather than catching
  after partial state may have been written.
- For a validated write layer, keep a single approved write boundary; don't let a
  helper module (validators/builders) quietly become a second write path unless a
  decision record and a boundary test approve it.
- For shared/collaborative resources, start from an operation-policy matrix
  (editor-allowed / owner-only / out-of-scope) and test by operation class, not
  one example.

Regression tests should cover: authenticated user without a profile gets a
profile-specific error; cross-owner rows don't count toward the authed user's
limits; lifecycle-event replay rejects cross-owner or mismatched inputs.
