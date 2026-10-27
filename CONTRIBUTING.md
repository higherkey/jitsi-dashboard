# Contributing to Jitsi Deck

Thank you for contributing to Jitsi Deck! We welcome bug fixes, documentation improvements, and feature contributions.

## Development Workflow

1. **Prerequisites:**
   - Node.js >= 20.0.0
   - Docker and Docker Compose

2. **Setup:**
   ```bash
   git clone https://github.com/higherkey/jitsi-deck.git
   cd jitsi-deck
   ```

3. **Running Tests:**
   We enforce strict Test-Driven Development with the native Node.js test runner:
   ```bash
   npm test
   ```

4. **Code Quality Standards:**
   - **Frontend UI Hygiene:**
     - Absolutely no inline styles (`style="..."` attributes).
     - Absolutely no `!important` declarations in CSS.
     - Keep CSS modular and use design tokens from `tokens.css`.
     - Interactive elements must maintain touch targets $\ge 44 \times 44\text{px}$.
   - **Commit Conventions:**
     - Follow [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`.
     - Write commit messages and PR titles in the **imperative mood** (e.g., `feat: Add container restart button`, not `Added container restart button`).

5. **Submitting a Pull Request:**
   - Open a PR targeting the `main` branch.
   - Ensure the automated GitHub Actions CI workflow passes completely.
