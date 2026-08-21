# iOS Permission State Mapping

Open before building a multi-permission iOS flow.

Model and test the **cross-product** of required permission states, not just the
fully-allowed and fully-denied cases. A denied first permission plus a
not-determined second permission can map to a wrong "unknown" state that sends an
already-denied user through prompts that can't make the feature usable.

- When one required permission is already denied or restricted, route directly to
  the recovery state for that permission and skip prompting for downstream
  permissions that provide no benefit without the first.
- Unit-test mixed states (e.g. "first denied, second not-determined") — they are
  awkward to reproduce reliably through simulator UI automation.
- When the user already expressed intent (e.g. tapped the capture button before
  the rationale sheet), granting permission must **complete that intent** —
  dismiss the sheet and start the action without a second tap. See
  [voice-pipeline-stage-ownership](voice-pipeline-stage-ownership.md).
