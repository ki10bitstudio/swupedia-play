# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**swupedia-play**, the play client deployed at `play.swupedia.com`: a fork of Karabast's
forceteki-client (a Star Wars: Unlimited web client, Next.js 14 App Router) cut down to **two screens,
the lobby and the game board**, plus an entry route. Members start a game from swupedia.com's `/play`
console and play against a bot run by a forceteki GameServer, which this client talks to over a
socket.io websocket plus a REST API. `NEXT_PUBLIC_ROOT_URL` (default `http://localhost:9500`, see
`.env.development`) points at that server. Essentially all game logic, matchmaking and user records
live there. The design is `swupedia-ui/docs/plans/play-vs-bot.md` ("Play client", "Seamless
handoff" and "The play ticket: redemption and the entry route", whose contract with the bot server
this client implements exactly).

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
npm run build        # next build (does NOT lint: eslint.ignoreDuringBuilds is true in next.config.mjs);
                     # refuses to run without NEXT_PUBLIC_ROOT_URL (the bot server, inlined at build time)
npm run storybook    # component workbench on :6006
bash scripts/check-no-karabast.sh   # CI check, see above
```

Node 22.x. There is **no test framework** in this repo — verification is `npm run lint`, `npm run build`,
and manual play against a local bot server. On the `swupedia` branch (pushes and PRs into it) CI runs
lint and build (`.github/workflows/swupedia-checks.yml`) and the no-Karabast check (`no-karabast.yml`);
upstream's `pullrequest.yml` only covers PRs into `main` and is left untouched.

**Local play needs only this app plus the bot server** (`pnpm karabast` in `../swupedia-bot`), not
the swupedia website: in development `/` is a dev launcher and every "back to swupedia" link goes
there (see below). `pnpm karabast` only allows CORS from `http://localhost:3000`, so run the dev
server on :3000 for it. To exercise the play ticket locally, run the bot repo's `pnpm serve` (ticket
mode) instead and open `/#ticket=<JWS>` from its `pnpm play:sign` or a local swupedia.com.

## Architecture

### Routes and the way out

Only three pages exist: `/`, `/lobby` and `/GameBoard`. `src/middleware.ts` answers every other path
with a 307 to `exitUrl()`, so there is no dead-end or default 404 page (`not-found.tsx` redirects too).

- `_utils/siteUrls.ts` holds the one rule for leaving the site. `exitUrl(flag?)` is swupedia.com's
  `{NEXT_PUBLIC_SWUPEDIA_URL}/play` in production and the dev launcher `/` in development, plus
  `?launch=<flag>` when there is a reason the console should show ("Launch again"). The flag is the
  typed `LaunchFlag` union (`expired`, `used`, `in-progress`, `busy`, `deck`, `bot-deck`, `failed`,
  `ended`), never a value read from a URL, so the site can't be an open redirect. `exitUrl()` also
  clears the stored play session; `goToExit(flag?)` navigates there with `location.replace`, so Back
  from swupedia.com doesn't land on the game just left. The lobby's swupedia mark, the end-of-game
  "Play again", leaving a game and socket connection errors all use it. `swupediaUrl(path)` builds
  other swupedia.com links (the settings overlay's Credits link uses it in development too).
  `NEXT_PUBLIC_SWUPEDIA_URL` defaults to `https://swupedia.com`.
- `/` is the entry route and passes the middleware in every environment: the play ticket arrives in
  the URL fragment (`/#ticket=<JWS>`), which never reaches the server. In production it renders
  `_components/PlayEntry/PlayEntry.tsx` outside `ClientProviders`, so the server sends the launching
  state (`LaunchingState.tsx` + `_theme/launching.css`: swupedia.com's header band with the mark, and
  its busy Launch button centred on the viewport, plain CSS, no MUI). Once per page load (a module flag, against Strict Mode's double effect)
  PlayEntry reads the ticket, `history.replaceState`s to `/` before any request, redeems it
  (`_utils/redeemTicket.ts`), stores the session and `router.replace`s to `/lobby`; a failure
  `location.replace`s to `exitUrl(flag)`. With no ticket it reopens `/lobby` for a live stored session,
  else exits (`ended` for a stale one). The lobby keeps showing `LaunchingState` until its first lobby
  state (and while the providers' chunk loads), so the launch reads as one.
- `/` in development renders `_dev/DevEntry.tsx`: a fragment ticket goes through PlayEntry (against a
  local `pnpm serve`); anything else is `_dev/DevLauncher.tsx`, the anonymous stand-in for the ticket:
  paste a swudb JSON deck, pick a format and a lobby name (a roster label such as "vs greedy-v3-medium"
  picks the bot's agent), and it POSTs a private lobby to `/api/create-lobby` as the anonymous user,
  then opens `/lobby`. It clears any stored play session and shows a one-line notice for a known
  `?launch=` flag. `page.tsx` imports it inside a `NODE_ENV === 'development'` branch so the production
  build drops it; keep it that way (after `npm run build`, grep `.next/static` for
  "swupedia-dev-launcher").
- Production responses carry a nonce-based Content-Security-Policy and `Referrer-Policy: no-referrer`
  (`src/middleware.ts`): scripts by nonce + `'strict-dynamic'`, inline styles (Emotion), images from
  self/data:/blob: and the card-image host, `connect-src` only self and the bot server (HTTP and
  WebSocket), and `object-src`, `base-uri`, `form-action`, `frame-ancestors` none. Next stamps the nonce
  on its own scripts from the request's policy, which is why the root layout is `force-dynamic`. A new
  external host (images, an API) needs adding there. Development has no CSP (Next's dev client needs eval).

### Provider stack and the websocket boundary

`src/app/layout.tsx` is a server component: it renders `<html class="dark">`, the fonts,
`_theme/firstPaint.css` (Ground background, Foreground text) and the title template, so the first
paint matches swupedia.com before any client JS. It then hands off to `ClientLayout.tsx`:

- `/GameBoard` and `/lobby` get `ClientProviders` **+ `GameProvider`**.
- `/` in production gets nothing: the entry route is server-rendered and mounts no context.
- `/` in development (the dev launcher) gets `ClientProviders` only, and therefore has no socket.

`ClientProviders` is `dynamic(..., { ssr: false })`, so everything below the layout is
client-rendered; nearly every component carries `'use client'`. Nesting order (outermost first):
`ServerSettings` → `User` → `CardImageLocale` → `TimerVisibility` → `Popup` →
`OngoingEffectHighlight` → `Cosmetics` → `Theme`.

### Game.context.tsx is the hub

`src/app/_contexts/Game.context.tsx` owns the single socket.io connection (`path: '/ws'`) and is the only
place server state enters the app. It re-creates the socket whenever user/session identity changes.
Everything on a game page reads `useGame()`.

With a stored play session (see Auth) the socket connects with `auth: { playSession }`, no
`query.user` and never `auth.token`, and the connected player is the session's `userId`. A
`connect_error` of `session-invalid` or `session-ended`, a `connection_error` (the lobby was
removed), `inactiveDisconnect`, or a stored session past its deadline, exits with `ended`; no lobby or
game state within 20 s (the server down while socket.io retries) exits with `failed`. The session
path never answers `requestScreenResolution`, which the bot server's allowlist refuses. In production a game page without a session exits to swupedia.com/play; in development
it stays anonymous (`user`/`anonymousUserId` in `query.user`) so the dev launcher works.

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

### Auth: the play ticket and the play session

There is no sign-in. A member is identified by the **play ticket** swupedia.com signs at Launch, which
the entry route redeems with the bot server (`POST {NEXT_PUBLIC_ROOT_URL}/api/play/redeem`, body
`{ ticket }`, `credentials: 'omit'`, 15 s timeout) for a **play session**: `{ session, userId,
username, deadline }`. Error codes map to `LaunchFlag`s (`expired`, `used`, `in-progress`, `busy`,
`deck`, `bot-deck`; everything else, a network error and the timeout are `failed`). Nothing sent to
the bot server carries credentials (`ServerApiService` uses `credentials: 'omit'` too).

The session lives in `sessionStorage` under `swupedia.play.session` (`_utils/playSession.ts`): a
refresh in the same tab returns to the game, other tabs and later visits don't get it, and every exit
clears it. Never log it.

next-auth is gone. `_utils/session.ts` is a no-op stand-in (`useSession` always unauthenticated,
`signIn`/`signOut` do nothing) that keeps the shape `User.context` and `Game.context` read, so only
their import lines differ from upstream. `/api/auth/*` redirects like any unknown path.
`User.context` still mints a uuid into `localStorage.anonymousUserId`; it only matters for the
anonymous dev path. Preferences live in localStorage (`ServerAndLocalStorageUtils.ts`).

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
