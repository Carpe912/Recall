# Recall

AI-driven collaborative knowledge platform

## Project Structure

```
Recall/
├── packages/
│   └── graphite/              # Canvas editor (图形编辑器)
├── apps/
│   └── playground/            # Development playground
└── package.json
```

## Getting Started

```bash
# Install dependencies
pnpm install

# Start development
pnpm dev

# Build all packages
pnpm build
```

## Packages

### @recall/graphite

A collaborative canvas editor for knowledge management.

石墨 - 为知识管理打造的协作画布编辑器

## Development

This project uses pnpm workspace for monorepo management.

```bash
# Install pnpm if you haven't
npm install -g pnpm

# Install dependencies
pnpm install

# Start playground
pnpm --filter playground dev

# Build graphite
pnpm --filter graphite build
```
