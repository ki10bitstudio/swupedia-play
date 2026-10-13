# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**swupedia-play**, the play client deployed at `play.swupedia.com`: a fork of Karabast's
forceteki-client (a Star Wars: Unlimited web client, Next.js 14 App Router) cut down to **two screens,
the lobby and the game board**, plus an entry route. Members start a game from swupedia.com's `/play`
console and play against a bot run by a forceteki GameServer, which this client talks to over a
socket.io websocket plus a REST API. `NEXT_PUBLIC_ROOT_URL` (default `http://localhost:9500`, see
`.env.development`) points at that server. Essentially all game logic, matchmaking and user records
live there. The design is `swupedia-ui/docs/plans/play-vs-bot.md` ("Play client" and "Seamless
handoff").

Two standing rules:

- **No mention of Karabast** in `src/` or `public/` (their team's condition for the fork).
  `bash scripts/check-no-karabast.sh` enforces it in CI. It allowlists exactly one line, the
  card-image host in `_utils/s3Utils.ts`; the unit that moves the images removes that exception.
- **The board stays upstream.** Karabast's fixes and new-card prompt handling land in the board, so
  board components change only where a requirement says so. That keeps upstream rebases cheap; an
  upstream edit to a file deleted here is a modify/delete conflict resolved by keeping the delete.
  For the same reason some dead code for deleted features is kept on purpose, not overlooked:
  `ServerApiService`'s cosmetics/mod/admin methods, `User.context`'s `isMod`/`userIsModAsync`, and
  the `@aws-sdk/*` packages. Removing them would only add rebase conflicts.

## Commands

```bash
npm run dev          # dev server on :3000 (pass -- -p <port> for another)
npm run lint         # tsc --noemit && next lint   <- what CI runs; run this before finishing
npm run lint:fix     # same, with --fix
npm run build        # next build (does NOT lint: eslint.ignoreDuringBuilds is true in next.config.mjs)
npm run storybook    # component workbench on :6006
bash scripts/check-no-karabast.sh   # CI check, see above
```

Node 22.x. There is **no test framework** in this repo — verification is `npm run lint`, `npm run build`,
and manual play against a local bot server. On the `swupedia` branch (pushes and PRs into it) CI runs
lint and build (`.github/workflows/swupedia-checks.yml`) and the no-Karabast check (`no-karabast.yml`);
upstream's `pullrequest.yml` only covers PRs into `main` and is left untouched.

**Local play needs only this app plus the bot server** (`pnpm karabast` in `../swupedia-bot`), not
the swupedia website: in development `/` is a dev launcher and every "back to swupedia" link goes
there (see below).

## Architecture

### Routes and the way out

Only three pages exist: `/`, `/lobby` and `/GameBoard`. `src/middleware.ts` answers every other path
with a 307 to `exitUrl()`, so there is no dead-end or default 404 page (`not-found.tsx` redirects too).

- `_utils/siteUrls.ts` holds the one rule for leaving the site. `exitUrl()` is swupedia.com's
  `{NEXT_PUBLIC_SWUPEDIA_URL}/play` in production and the dev launcher `/` in development;
  `goToExit()` navigates there. The lobby's swupedia mark, the end-of-game "Play again", leaving a
  game and socket connection errors all use it. `swupediaUrl(path)` builds other swupedia.com links
  (the settings overlay's Credits link uses it in development too). `NEXT_PUBLIC_SWUPEDIA_URL`
  defaults to `https://swupedia.com`.
- `/` in production is a 307 to swupedia.com/play (middleware; `page.tsx` redirects as a fallback).
  The play ticket, a later unit, will be read here: it arrives in the URL fragment, which never
  reaches the server, so that unit has to stop the middleware redirecting `/`.
- `/` in development renders `_dev/DevLauncher.tsx`, the stand-in for the ticket: paste a swudb JSON
  deck, pick a format and a lobby name (a roster label such as "vs greedy-v3-medium" picks the bot's
  agent), and it POSTs a private lobby to `/api/create-lobby` as the anonymous user, then opens
  `/lobby`. `page.tsx` imports it inside a `NODE_ENV === 'development'` branch so the production build
  drops it; keep it that way (after `npm run build`, grep `.next/static` for "swupedia-dev-launcher").

### Provider stack and the websocket boundary

`src/app/layout.tsx` is a server component: it renders `<html class="dark">`, the fonts,
`_theme/firstPaint.css` (Ground background, Foreground text) and the title template, so the first
paint matches swupedia.com before any client JS. It then hands off to `ClientLayout.tsx`:

- `/GameBoard` and `/lobby` get `ClientProviders` **+ `GameProvider`**.
- `/` gets `ClientProviders` only, and therefore has no socket.

`ClientProviders` is `dynamic(..., { ssr: false })`, so everything below the layout is
client-rendered; nearly every component carries `'use client'`. Nesting order (outermost first):
`SessionProvider` → `ServerSettings` → `User` → `CardImageLocale` → `TimerVisibility` → `Popup` →
`OngoingEffectHighlight` → `Cosmetics` → `Theme`.

### Game.context.tsx is the hub

`src/app/_contexts/Game.context.tsx` owns the single socket.io connection (`path: '/ws'`) and is the only
place server state enters the app. It re-creates the socket whenever user/session identity changes.
Everything on a game page reads `useGame()`.

Three outbound channels:

- `sendGameMessage([command, ...args])` → `socket.emit('game', ...)` — in-game actions. Commands are
  usually not hardcoded; the server sends `promptState.buttons` with `{ command, arg, uuid }` and the UI
  echoes them back.
- `sendLobbyMessage([command, ...args])` → `socket.emit('lobby', ...)` — `setReadyStatus`, `updateDeck`,
  `startGameAsync`, `updateSetting`, `proceedToNextBo3Game`, `concedeBo3`, …
- `sendMessage(event, args)` — raw emit (`manualDisconnect` when leaving).

Inbound: `gamestate`, `lobbystate`, `queueHeartbeat`, `retransmitResponse`, `bugReportResult`,
`playerReportResult`, `statsSubmitNotification`, `requestScreenResolution`, `connection_error`,
`matchmakingFailed`, `inactiveDisconnect` (some are upstream features this site no longer surfaces).

`gameState` / `lobbyState` are intentionally typed `any` (the file disables `no-explicit-any`) — they are
whatever the backend sends. The game log (`gameMessages`, shown in the board's chat drawer) is
delta-encoded: `useGameMessages` detects gaps and asks for a `retransmitGameMessages` range. There is no
player-to-player chat: the drawer shows the log and the menu with Concede.

### Lobby

The lobby is kept for sideboarding: the deck and sideboard panel (`Lobby/Deck`, clicking a card sends
`updateDeck`), Ready/Start, the Bo3 score card and its popups. The deck always arrives with the lobby,
so there is no deck selection or import, invite link, chat or spectating. The swupedia mark
(`src/assets/swupedia-mark.svg`) in `Lobby/SetUp` is the way out.

### Popups are driven by game state, not by clicks

`Popup.context.tsx` holds a stack of discriminated-union `PopupData`. `Game.context`'s
`handleGameStatePopups` translates the connected player's `promptState` into popups on every gamestate,
and `prunePromptStatePopups(promptUuid)` drops stale server-sourced popups while leaving
`PopupSource.User` ones alone. Add a popup kind by extending the union in `Popup.types.ts` and adding a
variant component under `Popup/PopupVariant/`.

### Card images

All card art is on S3 under `cards/{SET}/{locale}/{format}/{size}/`. Build URLs with
`s3CardImageURL()` / `s3ImageURL()` from `_utils/s3Utils.ts` — never hand-assemble one. Bump
`CARD_IMAGE_CACHE_VERSION` in `_constants/constants.ts` to bust browser caches. `images-scripts/process_cards.py`
is the Python pipeline that produces and uploads them (see its README). The bucket is still upstream's;
moving it is a later unit.

### Auth

NextAuth (Google + Discord) with a custom JWT encode/decode in `_utils/auth.ts` is still wired
(`api/auth/[...nextauth]`, `SessionProvider`) so the token plumbing keeps working, but there is no
sign-in UI; a later unit replaces it with the play ticket. Anonymous play is the normal case:
`User.context` mints a uuid into `localStorage.anonymousUserId` when there is no session. Preferences
for anonymous players live in localStorage (`ServerAndLocalStorageUtils.ts`).

### Server settings / maintenance

`ServerSettings.context` polls the backend every 20s. `gamesEnabled` defaults to **false**, so an
unreachable backend reads as maintenance; gate maintenance UI on `hasLoaded` too, or every page load
flashes it. The client-side gate is presentation only — the server 503s anyway.

## Conventions

- **Directory naming**: `_`-prefixed dirs under `src/app` (`_components`, `_contexts`, `_hooks`,
  `_utils`, `_services`, `_constants`, `_theme`, `_validators`, `_dev`) are App Router private folders —
  not routes. Shared UI goes in `_components/_sharedcomponents/`, feature UI in
  `_components/<Feature>/_subcomponents/`.
- **Path alias**: `@/*` → `./src/*`.
- **Styling**: MUI v7 with Emotion. The house pattern is a local `const styles = { ... }` object under a
  `// ----------------Styles----------------//` comment, spread into `sx`. No CSS modules, no Tailwind.
  The theme (`_theme/theme.ts`) is dark-only, carries swupedia.com's colour tokens (copied by hand from
  the YAML front matter of swupedia-ui's `DESIGN.md`) and adds custom device breakpoints (`iphoneSE`,
  `ipadMini`, `desktopHD`, `xxl`, …) and custom typography variants — extend it rather than hardcoding
  sizes. Components that hardcode their own colours keep upstream's.
- **Type**: Geist (`--font-geist-sans`), Geist Mono (`--font-geist-mono`) and Inter (`--font-rules`),
  self-hosted via `_theme/fonts.ts`, the same variable names swupedia-ui uses.
- **Types**: interfaces are `I`-prefixed (`IGameContextType`, `IBoardProps`). Component prop
  types live in a sibling `*Types.ts` / `*.types.ts` file.
- **Lint style is enforced, not advisory** (`@stylistic`): 4-space indent, single quotes, no padded blocks,
  `{ spaced: true }` object curlies, blank line before block comments. `npm run lint` gates PRs.
- **SVGs** import as React components via SVGR (`src/assets/**`), with `fill` rewritten to `currentColor`.
- **Debug flags** are env-driven and read through `_utils/debug.ts` (`debugBorder()`, breakpoint overlay,
  hand-scaling info) — see `.env.local.example`.
- **Storybook** stories live in `src/stories/` as `ComponentName.stories.tsx`.
