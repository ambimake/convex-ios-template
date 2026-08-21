# Eval Judge Gates

Open before wiring evals into CI or a verify gate.

- Gate `verify` on the offline smoke run, not the real-provider run. Real
  provider calls are non-deterministic, cost money, and need a secret — keep
  them a manual/opt-in command.
- A judge score below its `minScore` should fail the case and the run's exit
  code, so a regression is a red build, not a buried log line.
- Report a scorecard (passed/total per case) so a failing case is identifiable
  at a glance in CI output.
