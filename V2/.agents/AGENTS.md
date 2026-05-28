# AGENTS.md

## Purpose
This repository uses `.agents/` as a structured agent context workspace for humans and AI agents.
Keep this file short. Store policy here, not task history.

## Reading Order & Trust Priority
Before non-trivial work, read in this order. When information conflicts, higher items win.

1. Latest explicit user instruction
2. Verified codebase state
3. `.agents/AGENTS.md` (this file)
4. `.agents/active.md`
5. Most relevant file in `.agents/topics/`
6. Most recent file in `.agents/sessions/`
7. `.agents/index/repo-tree.md`

If notes conflict with the codebase, trust the codebase.

## Context System

| Path | Purpose |
|------|---------|
| `.agents/active.md` | Hot working state — current focus, blockers, next action |
| `.agents/topics/` | Durable knowledge that survives across sessions |
| `.agents/sessions/` | Per-task checkpoints and resumable logs |
| `.agents/private/` | Local-only notes (gitignored, never shared) |
| `.agents/index/repo-tree.md` | Auto-generated directory tree |

## Rules
- Read `.agents/active.md` before meaningful work.
- Update `.agents/active.md` when focus, blocker, or next action changes.
- Create a session note (`YYYY-MM-DD-short-topic.md`) at resumable checkpoints.
- Promote only durable, evidenced knowledge into `.agents/topics/`.
- Record evidence: file paths, commands, outputs, decisions.
- Mark uncertainty explicitly.
- Remove stale notes when they stop matching the codebase.
