# Project Guardian 🧠🛡️

Autonomous AI DevOps Branch Guardian Agent powered by Gemini.

## Features

- **Deterministic Safety**: Regex-based detection of dangerous SQL and migrations.
- **AI-Powered Planning**: Uses Gemini to reason about branch risks and tool usage.
- **Context Awareness**: Persistent memory store for tracking risks across branch switches.
- **Interactive CLI**: Guided risk assessment and blocking of dangerous merges.
- **Auto-detect Critical Changes**: Warns about migrations, shared code, and package.json changes on `git pull` or `git checkout`

## Installation

```bash
npm install
```

## Quick Start - Add to Any Project

In your project where you want branch watching:

```bash
cd /path/to/your/project
npm install branch-watcher --save-dev
# OR use local path:
npm install /path/to/branchWatcher
```

This automatically runs `postinstall` and installs git hooks!

## What It Does

When you run `git pull` or `git checkout/switch`:

```
🔍 Checking for critical changes after pull...

⚠️ CRITICAL CHANGES DETECTED AFTER PULL ⚠️

📦 Migrations: prisma/migrations/20240301_create_users.sql
   → Run: npx prisma migrate deploy

📝 package.json changed
   → Run: npm install
```

## Manual Setup

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Add your `GEMINI_API_KEY` to the `.env` file.

## Usage

Run the guardian on your current branch:

```bash
npm run guardian check
```

Other commands:

- `npm run guardian doctor`: Check if tools are configured correctly.
- `npm run guardian install`: Install as a git hook (coming soon).

## Project Structure

- `src/agent/`: Core agent reasoning loop, planner, and executor.
- `src/ai/`: Gemini API integration logic.
- `src/tools/`: Deterministic tools (Git, Prisma, FileSystem).
- `src/index.ts`: Library entry point.
- `src/cli.ts`: CLI entry point.
