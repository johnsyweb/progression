# Issue tracker: GitHub Issues

## Overview

Issues for this repo are tracked in GitHub Issues at https://github.com/johnsyweb/progression/issues.

## Agent skills integration

The following agent skills read from and write to GitHub Issues:

- **`triage`** — Processes incoming issues through a workflow state machine, applying triage labels.
- **`to-issues`** — Breaks plans and specs into independently-grabbable issues.
- **`to-prd`** — Creates a PRD issue.
- **`qa`** — Files bug reports and feature requests.
- **`review`** — Can optionally file issues from code review findings.

## How skills interact with GitHub Issues

Agent skills use the `gh` CLI (GitHub CLI) to:

- List issues with specific labels
- Create new issues
- Apply labels to existing issues
- Add comments to issues
- Close issues

Ensure you have `gh` installed and authenticated before running these skills:

```bash
gh auth status
```

## Issue creation and workflow

When a skill creates an issue, it uses the following conventions:

- **Title** — Clear, concise summary of the work
- **Body** — Markdown-formatted description, often including context from the skill's analysis
- **Labels** — Applied according to `docs/agents/triage-labels.md`

## Viewing and managing issues

- **GitHub web UI** — https://github.com/johnsyweb/progression/issues
- **Command line** — Use `gh issue list`, `gh issue view <number>`, etc.
- **In VS Code** — Install the GitHub Issues extension for inline issue management
