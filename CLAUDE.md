<!--MAC-BLOCK:BEGIN-->

## 🚨 Multi-Agent Coordination

This project runs **3** Claude Code terminals in parallel. Coordination is enforced by three artifacts at the repo root: `active_tasks.md` (kanban), `active_files.md` (file locks), and `.multi-agent/config.json` (settings). The kanban + lock files are gitignored (live state); the config is committed so team members get the same settings on clone.

### Terminal roles

| Terminal | Role | Responsibilities |
| --- | --- | --- |
| `T1` | Developer | Implements tasks assigned by the Planner. |
| `T2` | Developer | Implements tasks assigned by the Planner. |
| `P` | Planner | Plans, dispatches, reviews, and approves — never writes code directly. |

If unsure which terminal you are at session start, run `/agent-intro` or ask the user.

### File-lock protocol (mandatory before every edit)

Before editing **any** file:

1. Read `active_files.md`.
2. If the target path is listed by another terminal and the timestamp is fresher than **15 minutes**, wait 30s and re-check. Loop until the lock disappears.
3. If listed by another terminal but older than TTL: it's stale — per project policy (warn user before clearing).
4. If not listed: append `- <path> → T<N> @ <ISO-timestamp>` (developers) or `- <path> → P @ <ISO-timestamp>` (planner) and proceed.
5. Edit.
6. Remove your line from `active_files.md` immediately when done.

Read-only operations (`Read`, `Grep`, `git status`, `git diff`) do NOT need a lock.

### Shared kanban (`active_tasks.md`)

Four sections in order: 🟢 IN PROGRESS / TODO → 🟡 AWAITING REVIEW → 🟠 BLOCKED → ✅ DONE.

- **Planner** writes new tasks into TODO with full file lists, acceptance criteria, and an assignee (T1 / T2).
- **Developer** picks up the task, locks files, implements, runs verification, moves the task to AWAITING REVIEW with a status note.
- **STOP** at AWAITING REVIEW. Do NOT commit until the user relays planner approval.
- After approval: pull-rebase → `git add` specific files → commit → push → move to DONE with commit hash.

### Approval gate

Developers must NOT run `git add` / `git commit` / `git push` until the Planner has reviewed the uncommitted diff and the user relays an explicit "approved" message. Developers signal readiness by moving the task to 🟡 AWAITING REVIEW and saying so in chat. The Planner verifies via `git diff` + a manual run of the game in a browser, then approves or blocks. Exceptions: pure-docs commits and user-authorized hotfixes.

### Git workflow — Variant B (single integration branch)

Two-branch model. Daily commits go directly to `dev` (the integration branch) — no per-task feature branches. After planner approval: `git fetch && git pull --rebase origin dev` → `git add <specific-files>` (never `-A`) → `git commit` → `git push origin dev`. Releases promote `dev → main` via a release PR, then tag `main`. The approval gate plays the role of code review.

### Project verification commands

- **Typecheck / build:** `npm run build`
- **Tests:** `npm run dev`, then open http://localhost:5173 and click through the game (no automated test suite).

Run `npm run build` + the manual browser check before moving any task to AWAITING REVIEW.

### Commit format

Use **Conventional Commits**: `<type>(<scope>): <description>` where `<type>` ∈ {feat, fix, refactor, docs, chore, test, style, perf}. Example: `feat(game): add flashlight battery drain`.

### Reference

Full coordination protocol: load the `multi-agent-coordination` skill or read its references directly (`lock-protocol.md`, `approval-gate.md`, `git-workflow-variants.md`, `troubleshooting.md`).
<!--MAC-BLOCK:END-->
