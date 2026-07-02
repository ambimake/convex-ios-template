# Learnings

Status: Template

Reusable lessons copied and generalized from the source app. Open only entries
that match the work area.

- [Convex action payload limits](convex-action-payload-limits.md): open before
  sending base64 audio, binary-ish data, or large JSON through Convex actions.
- [Convex action vendor reporting](convex-action-vendor-reporting.md): open
  before adding Sentry, PostHog, or other vendor calls to Convex actions.
- [Deployment secrets](deployment-secrets.md): open before configuring Apple
  Sign In, Groq, Sentry, PostHog, Convex env vars, or local secret files.
- [iOS simulator verification](ios-simulator-verification.md): open before
  writing or running `xcodebuild` and simulator screenshot commands.
- [iOS accessibility identifiers](ios-accessibility-identifiers.md): open
  before adding smoke-tested SwiftUI controls.
- [Eval fixture robustness](eval-fixture-robustness.md): open before writing
  eval fixtures or judge rubrics.
- [Eval judge gates](eval-judge-gates.md): open before wiring evals into CI.
- [Voice pipeline stage ownership](voice-pipeline-stage-ownership.md): open
  before changing voice capture status, phase priority, or permission follow-through.
- [Convex provider test mocking](convex-provider-test-mocking.md): open before
  changing backend actions that call an LLM/transcription provider or their tests.
- [ConvexMobile error shape](convex-mobile-error-shape.md): open before changing
  Swift Convex transport failure handling or load-recovery classification.
- [Swift Convex auth query reads](swift-convex-auth-query-reads.md): open before
  adding an authenticated one-shot read from the Swift client.
- [Convex auth ownership](convex-auth-ownership.md): open before writing any
  owner-scoped Convex query or mutation.
- [Diagnostics identity fixtures](diagnostics-identity-fixtures.md): open before
  adding a cross-runtime diagnostics/vendor identity.
- [iOS permission state mapping](ios-permission-state-mapping.md): open before
  building a multi-permission iOS flow.
