# Domain docs

## Overview

Some agent skills (`improve-codebase-architecture`, `diagnose`, `tdd`) read domain-specific context and architectural decisions to make better recommendations. This repo uses a **single-context** layout.

## Single-context layout

In a single-context layout, all domain knowledge and architectural decisions are centralized:

- **`CONTEXT.md`** (at repo root) — The canonical domain language, key terms, architectural invariants, and project philosophy
- **`docs/adr/`** (at repo root) — Architecture Decision Records that document past decisions and their rationales

## How skills consume these files

- **`improve-codebase-architecture`** — Reads `CONTEXT.md` to understand the domain model and project language; reads `docs/adr/` to discover existing patterns and decisions before proposing improvements
- **`diagnose`** — Uses `CONTEXT.md` to understand invariants and `docs/adr/` to avoid proposing solutions that conflict with past decisions
- **`tdd`** — Reads `CONTEXT.md` to write tests that align with the project's domain language and mental model
- **`grill-with-docs`** — Uses `CONTEXT.md` and `docs/adr/` during a design grilling session to challenge plans against the project's documented language and decisions

## Creating CONTEXT.md

When you're ready, create `CONTEXT.md` at the repo root. This file should contain:

1. **Domain overview** — What is this project? What problem does it solve?
2. **Key terms** — Vocabulary that agents should use when discussing this codebase
3. **Architectural invariants** — Rules that must always hold (e.g., "all public APIs are immutable")
4. **Decision framework** — How does the team make tradeoffs? (performance vs. simplicity? single-purpose vs. do-it-all?)
5. **Integration points** — How this module integrates with the rest of your system

Example structure:

```markdown
# CONTEXT.md

## Domain

This is a [description of the project].

## Key terms

- **Term 1** — Definition
- **Term 2** — Definition

## Architectural invariants

- All [invariant]
- All [invariant]

## Decision framework

We prioritize [value 1] over [value 2] because [reason].

## Integration points

- Used by: [list of dependents]
- Depends on: [list of dependencies]
```

## Creating ADRs

As you make architectural decisions, document them in `docs/adr/` using the Architecture Decision Record format:

```markdown
# ADR 001: [Decision title]

## Status

Accepted (or Proposed/Rejected/Superseded)

## Context

[Explain the situation and what prompted the decision.]

## Decision

[State what was decided.]

## Consequences

[Describe the implications and tradeoffs.]
```

## Multi-context layout (not used here)

If this repo eventually becomes a monorepo or has multiple independent contexts, you can switch to a **multi-context** layout by:

1. Creating a `CONTEXT-MAP.md` at the repo root
2. Pointing each context to its own `CONTEXT.md` and `docs/adr/` directory
3. Running this setup skill again to update the configuration

For now, assume skills will look in the repo root.
