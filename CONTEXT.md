# CONTEXT.md

## Domain

A progress bar visualization tool that shows how much time has elapsed within a defined date range. Given a start date, end date, and current date, it displays the completion percentage and remaining time.

## Key terms

- **Date range** — A pair of dates (start and end) that defines a period being tracked
- **Current date** — The date at which the progress is being evaluated (defaults to today)
- **Progress** — How far through the date range we are, as a percentage (0-100%)
- **Completion** — A range is complete only after the end day has fully passed; the end date itself is still part of the tracked range
- **Status text** — Human-readable message describing progress (e.g., "75% complete • 10 days elapsed • 5 days remaining")

## Architectural invariants

- The progress bar treats date-only path inputs as whole local calendar days
- The progress bar shows a percentage when the current date falls anywhere within the range, including the full end day
- The final day of a range is rendered as complete for sharing purposes
- When the current date exceeds the end date, percentage is null and status changes to "Completed X days ago"
- Dates are parsed from URL paths in YYYY-MM-DD format

## Decision framework

We prioritize clarity and accurate time representation. The tool should tell the user exactly where they are in a timeline.
