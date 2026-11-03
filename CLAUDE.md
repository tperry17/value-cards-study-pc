# CLAUDE.md

Guidance for Claude (and other contributors) working in this repository.

## Project

A web-based card-trading study ("Value Cards Study"). Participants are dealt
cards, trade with two virtual partners, choose their top 3, and the session is
saved to Supabase for the research team.

The app runs **two study conditions from one codebase**:

| Condition | Link | Deck | `deck_version` |
|---|---|---|---|
| Values | `https://value-cards-study-pc.lovable.app/?condition=values` | first 18 of `ALL_VALUES` (`src/data/values.ts`) | `values-18` |
| Issues | `https://value-cards-study-pc.lovable.app/?condition=issues` | `ALL_ISSUES` (`src/data/issues.ts`) | `issues-20` |

- The condition is read once from the `condition` URL parameter in
  `src/hooks/useGameState.ts` (`conditionFromUrl` / `resolveCondition`). A
  missing or invalid value falls back to a 50/50 random assignment.
- Condition-specific text lives next to the screen that shows it
  (`condition === 'issues' ? ... : ...` in `Glossary.tsx`, `Sort.tsx`), plus
  `CONDITION_TITLES` (browser-tab title) and `CONDITION_HEADINGS` (welcome
  screen) in `useGameState.ts`.
- The link-preview title (`og:title`, `twitter:title` in `index.html`) is
  shared by both conditions and is "Value Cards Study".

## Rules for changes

- **Every change must work in both conditions.** When editing participant
  text, check whether it is shared or condition-specific, and update both
  branches where relevant.
- **Do not refer to the virtual players as "NPCs"** or "Non-Playing
  Characters" in participant-facing text. Use wording like "two other
  (virtual) players" or "partners". Internal code names (`npc`, `card-npc`)
  are fine.
- **Keep saved data stable.** Card names are stored in session rows
  (`dealt_hand`, `final_hand`, `top_selection`, `trades`). Renaming a card
  splits it into two labels in the data, so only do it before data collection
  or with the research team's agreement. Do not change the `sessions` insert
  shape without a matching Supabase migration.
- The researcher view (button bottom-right, or Ctrl/Cmd+Shift+D) is gated by
  the `researcher` role in Supabase; do not expose session data outside it.

## Branches and commits

- **Branch names must describe the work being done**, e.g.
  `claude/merge-conditions-url-param` or `fix/summary-wording`. Do not use
  auto-generated or random names (e.g. `claude/nifty-mendel-su3nuu`).
- Keep commits focused, with messages that say what changed and why.
- This repo is synced with a Lovable project: Lovable commits directly to
  `main`, and anything merged to `main` appears in the Lovable editor. Work on
  a branch and merge through a pull request.

## Pull requests

Every PR uses the template below (also saved as
`.github/pull_request_template.md`, which GitHub fills in automatically; keep
the two in sync).

```markdown
## Why
The problem or request this PR addresses.

## Changes
What changed, in participant-facing terms where possible. Say which
condition(s) each change affects: Values, Issues, or both.

## Checks
What was run and the result: npm test, build, lint, manual checks of
?condition=values and ?condition=issues. Report failures as failures.

## Not in this PR
Related work that was left out, and anything that must be done outside the
code (Supabase, Lovable publishing).

## Questions for the author
Numbered list of open decisions or things to confirm before merging.
Write "None" if there are none.
```

- **Open questions go in two places.** Whenever Claude opens a PR, it lists
  every open question in the PR's "Questions for the author" section **and**
  lists the same questions, numbered, in its message to the author in the
  chat. Do not leave a question only in one of them.
- When a question is answered, update the PR description to record the answer.

## Commands

```bash
npm install --legacy-peer-deps   # peer-dependency conflicts break a plain install
npm run dev                      # local dev server
npm test                         # vitest unit tests (src/test)
npm run lint
npm run build
```

## Layout

- `src/pages/Index.tsx` – screen flow and researcher-view toggle
- `src/hooks/useGameState.ts` – game state, condition, saving sessions
- `src/lib/tradeEngine.ts` – dealing, partner rankings, trade rules
- `src/screens/` – one component per study screen
- `src/data/` – card decks and partner responses
- `src/integrations/supabase/` – generated Supabase client and types (do not
  hand-edit `types.ts`)
- `supabase/migrations/` – database migrations
