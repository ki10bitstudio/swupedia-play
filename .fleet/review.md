# What counts as blocking in swupedia-play

Read by fleet's review loop (`--review-loop`). The repo's rules are in `CLAUDE.md`.

A finding is **blocking** only when the change, as written, would:

- break a requirement the task's instructions asked for, or leave one out;
- change what a player sees or can do on the board beyond what the task asked for (the board stays upstream: board
  components change only where a requirement says so);
- weaken the play session's handling: log or expose the session secret, send credentials to the bot server, let a
  value read from a URL choose the exit (`LaunchFlag` stays a typed union), or leave a stale session usable after
  an exit;
- send a player off the page while their game can still continue, or leave them stuck on a dead page the task
  said should exit;
- leave a timer, listener or socket running after the component or socket that owns it is gone;
- mention Karabast in `src/` or `public/` (`bash scripts/check-no-karabast.sh` fails), or fail `npm run lint`, or
  fail `npm run build` with `NEXT_PUBLIC_ROOT_URL` set.

Everything else (style, naming, wording, nice-to-have tests, refactors) is **non-blocking**: list it as a known
limit, not a reason for another round.
