# Leonida Trophy Guide — GTA VI (PS5)

[![make.fun](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/canglvam/gta6-trophy-guide/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/canglvam/gta6-trophy-guide/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01)

An offline guide and tracker for all 55 PlayStation 5 trophies of Grand Theft Auto VI, for the [make.fun "Build the best GTA 6 trophy guide" bounty](https://make.fun/bounty/gta6-trophy-guide-01).

## What it is

A static web app under `app/` — open `app/index.html` in a desktop browser, no build step, no network. It gives you:

- **Every trophy** with its official name, description and grade as PlayStation publishes them (1 Platinum, 2 Gold, 6 Silver, 46 Bronze; 28 hidden until earned), plus a guide in our own words that cites its sources beside it.
- **A checklist that remembers** — progress is saved in the browser (localStorage), with export to a JSON file and import back.
- **Filters** by kind (story, missable, collectibles, activities, strangers, crime, money, platinum path, online — there are no online trophies), by grade, by earned status, and a text search.
- **A spoiler setting** that hides the names and descriptions of story trophies until you earn them.
- **A roadmap to the Platinum** in 7 stages, built from the official descriptions: story first, then strangers, activities, collectibles and counts, crime with your partner, money and loose ends, then 100% completion and the Platinum.
- **The one missable warning**: Positive Mental Attitude (meditate at all 18 spots) is the only trophy GTABase and PowerPyx flag as possibly missable — do not skip Lucia's balcony meditation in Chapter 1.

## How it works

- `app/index.html` — the page; `app/style.css` — the look (original, no Rockstar artwork); `app/app.js` — the tracker logic.
- `app/data/trophies.json` — the 55 trophies: official name, description and grade, kind, roadmap stage, missable flag, count target where one applies, the guide, and its sources.
- `main.ts` — the entry program: copies `app/` and `screenshots/` to `/output` and writes `/output/dossier.json` with the vendored make.fun library.
- `serve.ts` — a tiny static server for trying the guide locally: `node serve.ts`, then open http://localhost:8080.

## Sources

Names, descriptions and grades are as PlayStation publishes them, as listed by Exophase and PSNProfiles (the two agree on every name, description and grade). Guides draw on Push Square, GTABase, KeenGamer, GamesFuze and EGamers.io, and cite them per trophy; where no guide has confirmed a method yet (Personal Best, Actions Speak Louder, Bad Luck I Guess, The Truth Is Out There, Challenging Tank, Capital Offense), the guide says so instead of guessing. Nothing is copied from another guide.

Unofficial fan guide. Not affiliated with Rockstar Games, Sony or PlayStation.
