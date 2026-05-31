---
name: ios-voice-template
description: Use before SwiftUI, capture UI/state, settings/account deletion UI, iOS config parsing, accessibility identifiers, or simulator verification work.
---

# iOS Voice Template

Read:

1. `AGENTS.md`
2. `docs/architecture.md`
3. `.agents/learnings/ios-simulator-verification.md`
4. `.agents/learnings/ios-accessibility-identifiers.md`

## SwiftUI Rules

- Keep app-wide state in the root model only when multiple screens need it.
- Keep service seams small and testable: config parsing, request encoding,
  analytics no-op behavior, Sentry user scope, and permission-state mapping.
- Add accessibility identifiers to concrete controls that smoke tests tap or
  type into.
- Use fixture launch arguments for visual evidence when the state would
  otherwise require live Apple Sign In, microphone permissions, or backend
  credentials.

## Verification

Use an explicit simulator OS in commands, for example:

```sh
xcodebuild build -project <project>.xcodeproj -scheme VoiceAgentTemplate -destination 'platform=iOS Simulator,OS=18.5,name=iPhone 16'
xcodebuild build-for-testing -project <project>.xcodeproj -scheme VoiceAgentTemplate -destination 'platform=iOS Simulator,OS=18.5,name=iPhone 16'
xcodebuild test -project <project>.xcodeproj -scheme VoiceAgentTemplate -destination 'platform=iOS Simulator,OS=18.5,name=iPhone 16'
```

If `xcodebuild test` is blocked by simulator state, capture the exact error and
preserve build/build-for-testing evidence separately from executed tests.
