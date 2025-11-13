# Progress

A microsite for johnsy.com that displays a progress bar based on two dates from the URL path.

## Usage

The site takes two dates from the URL path:

```
/2024-01-01/2024-12-31
```

- The left end of the progress bar represents the earlier of the two dates
- The right end represents the later of the two dates
- If today is within the range, it will be shown with the percentage complete
- The percentage is clamped between 0% and 100%

## Development

```bash
# Install dependencies
pnpm install

# Build
pnpm run build

# Run tests
pnpm test

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

- `src/main.ts` - Entry point, initialises the progress bar
- `src/progressBar.ts` - Progress bar logic and rendering
- `src/utils/dateParser.ts` - Date parsing and progress calculation utilities
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

The project is configured to deploy to GitHub Pages automatically via GitHub Actions. The workflow runs on pushes to the `main` branch.

To set up GitHub Pages:
1. Go to your repository Settings → Pages
2. Under "Source", select "GitHub Actions"
3. Push to the `main` branch to trigger deployment

The site will be available at `https://yourusername.github.io/progression` (replace `yourusername` and `progression` with your actual GitHub username and repository name).

## Testing

Unit tests are written using Vitest and cover:
- Date parsing from URL paths
- Progress calculation
- Edge cases (dates outside range, invalid dates, etc.)


