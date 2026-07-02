---
name: ubiquitous-language
description: Reviews and improves project language so docs, plans, skills, and code-facing concepts use the same domain terms. Use when writing or reviewing docs, plans, specs, skills, glossary entries, or when terms feel fuzzy, overloaded, implementation-leaky, or inconsistent with CONTEXT.md.
---

# Ubiquitous Language

Keep the project's language rigorous enough that human operators, domain
experts, and agents can use the same terms without translation.

## Inputs

Read only what is needed:

1. the document, plan, skill, issue, or code surface being reviewed
2. `CONTEXT.md` or the nearest context/glossary document
3. `docs/architecture.md` when terms describe system boundaries
4. relevant decision records under `docs/decisions/`
5. workflow docs or skills when the terms describe agent behavior
6. nearby code only when it can confirm how a named concept behaves

If the repo has a documentation map, use it to choose the authoritative files.

## Process

1. Identify candidate language problems:
   - a term means more than one thing;
   - two terms appear to name the same concept;
   - a term conflicts with `CONTEXT.md` or a decision record;
   - a term exposes implementation details where the domain needs product
     language;
   - a phrase is awkward enough that a human operator would not reuse it;
   - a new concept is described but not named.
2. Compare each candidate against the existing product model and glossary.
3. Resolve what can be resolved from docs or code before asking the user.
4. Ask one question at a time when the language choice changes meaning. For each:
   name the ambiguity; explain the consequence of each interpretation; recommend
   the canonical term or structure.
5. Test the proposed term in concrete scenarios. Prefer examples a user or
   operator would actually say.
6. After the term is resolved, edit the smallest durable artifact that changes
   future behavior.
7. Preserve rejected aliases only when they prevent likely confusion later.

## Artifact Homes

- `CONTEXT.md`: product and domain terms meaningful to users/operators.
- `docs/architecture.md`: system boundaries, component responsibilities,
  integration terms.
- `ENGINEERING.md`: engineering posture or review principles.
- `docs/workflow.md`: workflow language and skill routing.
- `.agents/skills/<skill>/SKILL.md`: procedure future agents should follow.
- `docs/decisions/`: hard-to-reverse naming or model decisions that were
  surprising and involved real tradeoffs.
- The reviewed doc itself: local wording that does not change durable truth.

Do not put implementation details in `CONTEXT.md` unless they are also product
language. Do not create a decision record for a simple wording cleanup.

## Output

Report: the ambiguous/conflicting terms found; the canonical terms chosen; files
edited and why those homes were correct; unresolved terms needing operator input;
aliases intentionally rejected or preserved.
