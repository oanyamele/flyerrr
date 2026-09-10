# Flyerrr

## Package management

Flyerrr uses [Bun](https://bun.com/) 1.3.14 as its only package manager. The
committed `bun.lock` file is the source of truth for dependency resolution. Do
not create or commit npm, pnpm, Yarn, or legacy binary Bun lockfiles.

Install dependencies from the lockfile:

```sh
bun install --frozen-lockfile
```

Start the local development server:

```sh
bun run dev
```

Run the same validation commands used by CI:

```sh
bunx tsc --noEmit -p tsconfig.app.json
bunx eslint .
bun run test
bun run build
bun audit --audit-level=high
```
