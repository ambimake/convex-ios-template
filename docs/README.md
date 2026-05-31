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

## Agent Pack

- [Reusable Learnings](../.agents/learnings/README.md)
- `.agents/skills/`: template-local skills for TDD, diagnosis, Linear
  workflow, Convex backend work, and iOS voice-template work

## Plans

Put clone-specific implementation plans in `docs/plans/` and link them from
Linear issues when using the tracker workflow.

## Decisions

For hard-to-reverse choices, create short decision records under
`docs/decisions/` in the cloned project.
