# Progress

A microsite for johnsy.com that displays a progress bar based on two dates from the URL path.

## Usage

The site takes two dates from the URL path, with an optional title:

```
/progression/2024-01-01/2024-12-31
/progression/2024-01-01/2024-12-31/Pete's Career break
```

- The left end of the progress bar represents the earlier of the two dates
- The right end represents the later of the two dates
- If today is within the range, it will be shown with the percentage complete
- The percentage is clamped between 0% and 100%
- An optional third parameter can be used as a custom title (defaults to "Progress")
- If no valid dates are provided, the site automatically redirects to the current year (e.g., `/progression/2025-01-01/2025-12-31/2025`)

## Development

```bash
# Install dependencies
pnpm install

# Build
pnpm run build

# Run tests (watch mode)
pnpm test

# Run tests once
pnpm run test:run

# Start development server
pnpm dev

# Format code
pnpm run format

# Lint code
pnpm run lint

# Type check
pnpm run typecheck

# Run all checks (format, lint, typecheck, test)
pnpm run precommit
```

## Project Structure

- `src/main.ts` - Entry point, initialises the progress bar and handles URL redirects
- `src/progressBar.ts` - Progress bar logic and rendering
- `src/utils/dateParser.ts` - Date parsing and progress calculation utilities
- `src/utils/svgGenerator.ts` - SVG generation for OpenGraph images
- `src/utils/generateFallbackSVG.ts` - Static fallback SVG generation
- `src/sw.ts` - Service worker for dynamic SVG generation
- `src/server/htmlTransform.ts` - Vite plugin for HTML transformation during development
- `src/server/buildPlugin.ts` - Vite plugin for build-time optimisations
- `src/index.html` - HTML template
- `src/style.css` - Styles matching johnsy.com

## Building

The project compiles TypeScript to JavaScript in the `dist/` directory. The HTML and CSS files are copied to `dist/` during the build process.

```bash
# Build for production
pnpm run build

# Preview production build
pnpm run preview
```

## Deployment

The project is configured to deploy to GitHub Pages automatically via GitHub Actions.

### CI Workflow

The CI workflow runs on:
- Pull requests
- Pushes to any branch

It runs tests, linting, type checking, and builds the project to ensure code quality.

### Deploy Workflow

The deploy workflow:
- Runs automatically when CI completes successfully on the `main` branch
- Can be manually triggered via GitHub Actions UI
- Deploys to GitHub Pages only after all checks pass

### Setting up GitHub Pages

1. Go to your repository Settings → Pages
2. Under "Source", select "GitHub Actions"
3. Push to the `main` branch to trigger CI, which will then trigger deployment

The site will be available at `https://yourusername.github.io/progression` (replace `yourusername` and `progression` with your actual GitHub username and repository name).

### Dependabot

Dependabot is configured to automatically create PRs for dependency updates. PRs that pass CI will be automatically merged.

## Testing

Unit tests are written using Vitest and cover:
- Date parsing from URL paths (including base path handling)
- Title parsing from URL paths
- Progress calculation
- Edge cases (dates outside range, invalid dates, etc.)
- Default behavior when no dates provided

Run tests with `pnpm run test:run` (single run) or `pnpm test` (watch mode).


