#!/bin/bash
# Wrapper script to run agent integrity check from root directory

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
# Get the repo root (parent of scripts)
REPO_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

# Change to repo root and run the TypeScript script
cd "$REPO_ROOT"
npx tsx --tsconfig scripts/tsconfig.json scripts/check-agent-integrity.ts
