# iOS Simulator Verification

Open before writing or running iOS build, test, install, launch, or screenshot
commands.

## Destination

Use an explicit simulator OS when possible:

```sh
platform=iOS Simulator,OS=18.5,name=iPhone 16
```

Bare `platform=iOS Simulator,name=iPhone 16` can select an unexpected latest OS
or fail destination lookup on machines with multiple runtimes.

## Recovery

If `xcodebuild test` fails immediately with invalid device state,
`(ipc/mig) server died`, or clone/allocation errors, try a serial rerun and
boot the target simulator:

```sh
xcrun simctl boot "iPhone 16" 2>/dev/null || true
```

If the same CoreSimulator error remains, record it as blocked verification.
Do not claim unit tests passed from a successful build or build-for-testing.

## Evidence

Use fixture launch arguments for deterministic screenshots:

```sh
xcrun simctl install "iPhone 16" "<path-to-app>"
xcrun simctl launch --terminate-running-process "iPhone 16" com.example.voiceagent.template --template-signed-in
xcrun simctl io "iPhone 16" screenshot .context/signed-in.png
```
