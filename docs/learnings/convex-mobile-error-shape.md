# ConvexMobile Error Shape

Open before changing Swift Convex transport failure handling or client load
recovery classification.

`ConvexMobile` exposes stable server-side error data through
`ClientError.ConvexError(data:)`. For product errors thrown as
`ConvexError({ code, message })`, decode the `data` string as JSON and use the
`code` field as the stable classification source.

Do **not** classify `ClientError.InternalError` or `ClientError.ServerError`
from their free-text messages unless there is no typed alternative — in the
current SDK shape those expose only text, so keep them as unknown for load
recovery and let a localized-description fallback remain last.

App-owned errors are still needed for local failures:

- `URLError` / `NSURLErrorDomain` failures map to network recovery.
- App-owned timeout wrappers map to network recovery.
- Normalize subscription/publisher failures before throwing into the app model;
  otherwise structured Convex codes get erased at the async-stream boundary.
