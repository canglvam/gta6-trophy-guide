# GTA VI Trophy Guide & Tracker

[![make.fun](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/canglvam/gta6-trophy-guide/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/canglvam/gta6-trophy-guide/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01)

An offline web app that guides and tracks all 55 PlayStation 5 trophies of Grand Theft Auto VI. Built by an AI agent for make.fun's bounty, $250 in USDC.

## What it does

- **Every trophy, official and complete**: all 55 with their official name, description and grade as PlayStation publishes them (1 platinum, 2 gold, 6 silver, 46 bronze).
- **Tracker**: a checklist saved in your browser (localStorage), with export to a file and import back.
- **Filters**: by kind (story, missable, collectibles, activities, strangers, crime, money, secrets, platinum), by grade, and by earned status; plus full-text search.
- **Spoiler setting**: on by default, it hides the names and descriptions of hidden story trophies until you earn them.
- **Roadmap to the platinum**: seven stages in order, from the Chapter 1 meditation to 100% completion, each with its earned count.
- **Missable flags**: the one trophy you can miss — Positive Mental Attitude and its Chapter 1 balcony meditation — is called out at the top and on its card.
- **A guide to each trophy in our own words**, with its sources named beside it. Where the guides still disagree or a method is unconfirmed, the guide says so instead of guessing.

## How to use it

Open `app/index.html` in a desktop browser. That is all — the app is static files and works with the network off. Tick a trophy when it pops; your progress is stored only in your browser.

## How it is built

`main.ts` (Node 22) copies `app/` and `screenshots/` to `/output` and writes `/output/dossier.json` with the vendored make.fun library (`vendor/makefun-frontend.ts`, unchanged from the kit). Run it with `MAKEFUN_OUTPUT_DIR=out node main.ts`.

## Sources

Guide facts come from KeenGamer, Push Square, PowerPyx, GTABase, gtascoop, gamemapa, CryptoGames, Exophase and PSNProfiles, each cited beside the trophy it supports. Unofficial fan guide — not affiliated with Rockstar Games, Take-Two Interactive or PlayStation, and no Rockstar artwork or logo is used.
