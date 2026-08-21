# Documentation Map

Status: Template

Use this map to decide which docs to trust first. Singular docs hold current
truth. Subdirectories hold repeated artifacts or background.

## Start Here

- [Template README](../README.md): starter overview and setup commands
- [Customize](../CUSTOMIZE.md): clone adoption checklist and verification
- [Template Variables](../TEMPLATE_VARIABLES.md): placeholders, rename targets,
  and generated-file policy
- [Product Context](../CONTEXT.md): product scope, domain terms, and command
  language to customize for the clone
- [Brand](../BRAND.md): copy voice, positioning, onboarding, and product-facing
  language
- [Engineering Principles](../ENGINEERING.md): implementation and testing
  posture
- [Agent Rules](../AGENTS.md): coding-agent boundaries and skill routing
- [Architecture](./architecture.md): SwiftUI + Convex + voice-agent system map
- [Deployment](./deployment.md): env vars, secrets, Apple Sign In, and vendor
  setup
- [Workflow](./workflow.md): generic Linear/GitHub/Delivery Map loop

## Reference Layer

- [Decision Records](./decisions/README.md): generic, swappable template
  defaults (stack, components, observability, auth, payments, attribution, …)
- [Capability Guides](./guides/README.md): short "how this app does X" pages
  (evals, voice, auth, payments, attribution)
- [Reusable Learnings](./learnings/README.md): runbooks and sharp edges

## Agent Pack

- `.agents/skills/`: generic workflow skills (choose/shape/plan/execute/ship,
  create-pr, handoff, compound-learning), support skills (review-panel, grill-me,
  ubiquitous-language, write-a-skill, zoom-out, caveman), `backport-lessons`,
  plus Convex and iOS-voice-template skills.

## Plans

Put clone-specific implementation plans in `docs/plans/` and link them from
Linear issues when using the tracker workflow.

## Decisions

The template ships generic decision records under `docs/decisions/` as swappable
defaults. Add clone-specific decisions there for hard-to-reverse choices.
