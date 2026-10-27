# Agent Execution & Interaction Principles

## Autonomous Action via CLI, MCP, and API
- **Direct Execution Over Menus:** Always prefer using a CLI, MCP, or API directly to accomplish tasks autonomously. Do not present menus of manual steps for the user to execute unless asked.
- **Non-Interactive First:** Run commands with non-interactive flags where applicable (e.g., `--yes`, `-y`, `--accept-package-agreements`, `--web`) to prevent terminal hang-ups.
- **Strict User Escalation Boundary:** Only delegate actions to the user if it is verifiably better/faster or impossible for the agent (e.g., interactive MFA/SSO, physical hardware manipulation, or entering secrets/passwords).

## Metacognitive Allowances & Conflict Resolution
- **Principled Conflict & Gap Resolution:**
  1. Default to core intent and safety hierarchy: **Data Integrity > System Safety > Contract Correctness > Token/Context Efficiency > Speed**.
  2. Reason through trade-offs explicitly rather than freezing, hallucinating compliance, or silently bypassing constraints.
  3. When an ambiguous trade-off crosses a user-intent boundary, escalate to the user with a concise, actionable question.

---

# Global Foundation Mandates (Antigravity)

## 1. General Development Workflows

### Git & Source Control (Windows/PowerShell)
- **Commits:** Prefer `git commit -am "message"` for modified tracked files. Use `git add` explicitly for new files.
- **PowerShell Chaining:** NEVER use `&&` to chain commands. Always use `;` (Windows compatible).
- **Standards:** All commits and PR titles **MUST** follow **Conventional Commits** (e.g., `feat:`, `fix:`) and use **Imperative Tense** (e.g., `Update`, not `Updated`) for the **entire message** (header and body).
- **Issue Reference:** Link GitHub Issues with `#123` or `fixes #123` where applicable.

### GitHub & Issue Management
- **Non-Interactive Mode:** Always run `gh` commands in non-interactive mode (e.g., passing `--title`, `--body`, or `-y`) to prevent terminal hangs on prompt inputs.

---

## 2. Engineering Standards

- **Surgical Edits:** Prioritize targeted replacements over full-file rewrites to maintain file integrity and minimize unnecessary diffs.
- **Runtime Verification Mandate:** Static AST parsing or syntax checks alone are NEVER sufficient to claim verification. Every script, build, or feature modification must be executed and validated in the real runtime environment (`npm test`).
- **Test-Driven Development (`/test-driven-development-slim`):** Maintain a Red-Green-Refactor loop. Use Arrange-Act-Assert (AAA) pattern. Mock only external I/O boundaries (child processes, network calls).
- **Frontend UI Hygiene (`/frontend-ui-engineering-slim`):**
  - **Zero `!important`:** Never use `!important` across all stylesheets.
  - **Zero Inline Styles:** Never use the `style="..."` attribute.
  - **External Files Preferred:** Modularity via `tokens.css` and `style.css`.
  - **Touch Targets:** All interactive elements must meet the $\ge 44 \times 44\text{px}$ touch target requirement.

---

## 3. Token & Context Efficiency Standards

- **Core Skill Brevity:** Keep instructions compact and focused.
- **Zero-Token Background Polling:** Never poll external status across rapid chat turns. Use background daemon execution or internal timers.
