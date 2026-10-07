---
status: accepted
---

# aube with paranoid mode for package management

Progression is a small Vite microsite with a non-trivial npm tree for build, test, Lighthouse, and Playwright screenshot automation. Supply-chain risk on registry packages and install-time lifecycle scripts matters for any project that runs headless browsers in CI and publishes to GitHub Pages. We moved from pnpm to [aube](https://aube.jdx.dev/) with strict install-time protections, matching the ambassy pattern.

## Decision

1. **aube as the sole package manager** — native `aube-lock.yaml` (imported from the former pnpm lock); retire `pnpm-lock.yaml` and `pnpm-workspace.yaml`. Atomic cutover across local dev, CI, Husky hooks, and docs.
2. **`paranoid: true`** in `aube-workspace.yaml` — jailed builds, strict store integrity, strict dependency-build review, OSV malicious-package checks, and a seven-day minimum release age (aligned with Renovate; see ADR 0002).
3. **Explicit build approval** — lifecycle scripts run only when listed in `allowBuilds`. esbuild was previously in pnpm `ignoredBuiltDependencies` and stays unapproved until deliberately reviewed.
4. **Release-age gate escape hatch** — add packages to `minimumReleaseAgeExclude` in a deliberate PR only when an emergency security bump cannot wait.
5. **CVE audit in CI** — `aube audit --audit-level moderate --ignore-unfixable` in the lint-test job and in `./script/cibuild`.
6. **Version pinning** — `aube` in `.tool-versions`, `packageManager: "aube@1.40.0"` in `package.json`, and `packageManagerStrictVersion: true`.
7. **CI bootstrap via mise** — `jdx/mise-action` installs Node and aube from `.tool-versions`; cache the aube store keyed on `aube-lock.yaml`; frozen installs via `aube ci` (`./script/ci-install`).
8. **Local tasks** — `mise run bootstrap` / `update` / `update-deps` / `cibuild` for the usual contributor flows.
9. **Security overrides** — `source-map-js >=1.2.2` and `undici >=7.29.1 <8` in `aube-workspace.yaml` (undici stays on 7.x because jsdom 29 imports `wrap-handler.js`, removed in undici 8). Both packages are on `minimumReleaseAgeExclude` until they age past the seven-day gate.

## Considered options

**Keep pnpm with Renovate only (rejected)** — fleet standard is aube + Renovate; Dependabot/pnpm does not share the paranoid install story with ambassy.

**Phased cutover (rejected)** — mixed package managers defeat paranoid guarantees until cutover completes.

**aube without paranoid mode (rejected)** — faster installs but weaker protection against freshly published malicious packages and unreviewed lifecycle scripts.

## Consequences

- Contributors need [mise](https://mise.jdx.dev/) and run `aube install` / `aube ci`.
- New dependencies with lifecycle scripts need an explicit `allowBuilds` entry before CI passes.
- Emergency bumps younger than seven days need a visible `minimumReleaseAgeExclude` commit.
