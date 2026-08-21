---
name: review-panel
description: Use when the user asks for neutral feedback, expert review, a review panel, second opinions, stress testing, stakeholder critique, or role-based feedback on the current chat, artifact, plan, diff, UI, decision, or implementation direction; also use when a repo workflow skill such as plan-work requires a plan-panel gate.
---

# Review Panel

Create an ephemeral team of real reviewer subagents, then synthesize their
independent feedback. Personas are lenses, not authorities; the parent agent
keeps judgment and owns follow-up work.

## Hard Rules

- Use a real subagent-spawning tool exposed by the current runtime. If none is
  callable, fail the panel immediately and report why so the parent workflow can
  record a blocker or explicit waiver.
- Do not simulate reviewers in the parent response.
- Do not ask the user to approve the reviewer roster.
- Panel reviews are read-only. Do not let reviewers edit files, update trackers,
  create PRs, or perform destructive actions.
- Keep reviewers independent: do not share one reviewer's output with another
  before synthesis.

## Workflow Fit

- Use fixed repo reviewers first when a workflow skill already names one.
- Use this skill for explicitly requested neutral multi-lens feedback, required
  workflow `plan-panel` gates, or gaps not covered by fixed reviewers when the
  gap is material to plan approval, merge readiness, or a documented gate.
- Ephemeral personas are one-off review briefs, not checked-in subagent configs.
  If a persona becomes routinely useful, propose a `compound-learning` or skill
  update instead of silently adding durable config.
- Panel reviewers are not second owners and do not change dependency or
  concurrency ownership.

## Workflow

0. Preflight subagent support. Confirm the runtime has a callable real-subagent
   mechanism. If not, stop immediately. If a reviewer fails, retry once when the
   failure is mechanical; if it still fails, synthesize only if at least two
   reviewers from the 3-5 roster completed and state which lens is missing;
   otherwise fail the panel.
1. Frame the review. Summarize the current task, artifact, decision, open
   question, stage, and surface. Exclude parent conclusions and preferred answers
   from the neutral summary.
2. Choose 3-5 ephemeral personas. For narrow questions, use 3. Default shape: one
   domain reviewer, one implementation/risk reviewer, one skeptic; add
   specialists up to five. Prefer concrete roles over prestige titles ("strategy/
   scope reviewer" not "CEO"; "UX flow reviewer"/"accessibility reviewer" not
   "designer").
3. Spawn one subagent per persona with the same neutral task summary plus its
   role brief and a minimum context packet (request, artifact/path/diff,
   constraints, non-goals, relevant repo reading rules). Tell each to report only
   from its lens and not to edit files.
4. Synthesize. Group consensus, disagreements, blocking risks, non-blocking
   concerns, low-confidence opinions, and concrete next actions. Preserve
   high-confidence minority concerns. Separate direct next changes, defer items,
   and parent-owned tracker/docs/`compound-learning` follow-ups.

## Persona Menu

- Product/scope: product scope, strategy/scope, target user/ICP, PM,
  support/operator.
- UI/UX: UX flow, visual design, accessibility, first-time user.
- Engineering: implementation, architecture, iOS, Convex/backend, integration.
- Quality: test/reliability, edge-case, observability.
- Risk: devil's advocate, privacy/security, cost/operations, scope-control.
- Communication: docs, no-context, App Store/legal copy.

## Subagent Prompt Template

```text
You are the {persona} for a neutral review panel.

Task context:
{neutral summary of current chat, artifact, decision, or diff}

Context packet:
- Request: {request}
- Artifact/path/diff: {artifact}
- Constraints/non-goals: {constraints}
- Repo reading rules if applicable:
  - Read AGENTS.md and docs/workflow.md for repo workflow feedback.
  - Read CONTEXT.md for product/domain feedback.
  - Read ENGINEERING.md for engineering feedback.
  - If touching convex/, read convex/_generated/ai/guidelines.md.

Review only from this lens:
{persona-specific brief}

Rules:
- Report findings only.
- Do not edit files, update trackers, create PRs, or perform destructive actions.
- Do not assume the parent agent's preferred answer is correct.
- You are not given and must not rely on other reviewers' feedback.
- Focus on the task at hand, not unrelated project-wide critique.

Return:
Lens; artifact reviewed; top findings; blocking concerns; non-blocking
concerns; missed opportunities; recommended changes; confidence; what to ignore
or defer; reusable lesson candidate, if any.
```

## Common Mistakes

- Roleplaying all reviewers in one response. Fail instead if real subagents are
  unavailable.
- Letting the panel sprawl into unrelated critique.
- Treating feedback as a vote. The parent agent must synthesize and decide.
