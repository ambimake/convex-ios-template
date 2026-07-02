# Swift Convex Auth Query Reads

Open before adding an authenticated one-shot read from the Swift client.

The `ConvexClientWithAuth` wrapper from `convex-swift` exposes typed `mutation`
and `action` helpers, but **not** a one-shot typed `query` helper.

For authenticated reads that look like one-time queries, use
`client.subscribe(to:with:yielding:)` and consume the first value through a
throwing-stream take-first helper. This keeps error normalization and
subscription cancellation consistent with your other authed reads.

Do not call a remembered `client.query(...)` API on the auth wrapper without
first checking the installed `convex-swift` version — that method may exist only
on the lower-level FFI client, not on the auth wrapper the app uses.
