---
name: tdd
description: Use for feature work or bug fixes with clear behavior. Work in red-green-refactor slices through public interfaces, especially Convex actions, Swift UI state seams, and command request encoders.
---

# Test-Driven Development

Use one vertical tracer at a time.

## Workflow

1. Name the observable behavior in product terms.
2. Write one failing test through a public interface.
3. Implement only enough code to pass.
4. Run the focused test.
5. Repeat for the next behavior.
6. Refactor only while green, then rerun the tests.

## Good Seams

- Convex: public actions such as `commands:submitCommand`, then queries for
  persisted state.
- Swift: pure state, request encoding, config parsing, permission-state
  mapping, and wrappers around vendor SDK state.
- UI: accessibility identifiers and fixture launch states for smokeable views.

## Guardrails

- Do not write a batch of tests before implementation.
- Do not test private helpers when a public interface can prove the behavior.
- Keep command tests focused on persisted state, structured responses, and
  privacy boundaries, not free-form copy.
- For voice payloads, include base64 expansion checks before action validation.
