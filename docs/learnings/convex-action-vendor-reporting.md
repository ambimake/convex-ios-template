# Convex Action Vendor Reporting

Open before adding external error, analytics, or observability calls to Convex
actions.

When a Convex module exports public actions that must stay in the default
runtime, do not import Node-only vendor SDKs from that module or shared helpers
it loads. Convex bundling can fail when an SDK pulls Node APIs into an
edge-runtime file.

For lightweight reporting from an action boundary:

- call the vendor HTTP ingestion API with `fetch` from a small helper;
- isolate Node-only work in a separate internal action when it truly needs Node
  runtime APIs;
- keep a test seam so Convex tests can assert payload shape without live
  credentials.

Never include transcript text, entry content, raw audio, Apple refresh tokens,
or other user-authored private content in analytics payloads.
