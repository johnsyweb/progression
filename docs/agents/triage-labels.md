# Triage labels

## Overview

When the `triage` skill processes an incoming issue, it applies labels to move the issue through a workflow state machine. These five labels represent the canonical triage roles.

## Label mapping

| Role | Label | Meaning |
|------|-------|---------|
| Needs evaluation | `needs-triage` | Maintainer needs to evaluate the issue for clarity, feasibility, and priority |
| Waiting on reporter | `needs-info` | Issue is blocked waiting for the reporter to provide additional context or clarification |
| Ready for agent | `ready-for-agent` | Issue is fully specified and ready for an AI agent to pick up with no additional human context |
| Ready for human | `ready-for-human` | Issue is ready for human implementation (requires human judgment, tooling, or domain expertise) |
| Will not fix | `wontfix` | Issue will not be actioned (out of scope, rejected, duplicate, etc.) |

## Creating labels in GitHub

If these labels don't already exist in your repo, create them in GitHub:

1. Go to your repo's **Settings** → **Labels**
2. Click **New label**
3. Enter the label name (e.g., `needs-triage`)
4. Optionally add a description and color
5. Click **Create label**

Or via the command line:

```bash
gh label create needs-triage --description "Maintainer needs to evaluate"
gh label create needs-info --description "Waiting on reporter"
gh label create ready-for-agent --description "Fully specified, ready for agent"
gh label create ready-for-human --description "Ready for human implementation"
gh label create wontfix --description "Will not be actioned"
```

## Customizing labels

If you prefer different label names, edit this file to reflect your actual label strings. The `triage` skill will use these names when applying labels.
