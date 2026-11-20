// GTA VI trophy guide — entrypoint (Node 22, standard library only).
//
// The guide itself is app/: plain static files a desktop browser opens at
// app/index.html, with no build step and no network at run time. This program
// hands it in: it copies app/ and screenshots/ from beside this file into
// /output and writes /output/dossier.json, the summary the judge reads
// (screenshots, first-load files and bytes, and the source), using the
// vendored make.fun library. vendor/makefun-frontend.ts stays exactly as
// the kit ships it: the scorer rebuilds the dossier with its own copy and
// compares the two byte for byte.
//
// Run it outside the grader with MAKEFUN_OUTPUT_DIR standing in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-frontend.ts";

const here = fileURLToPath(new URL(".", import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

mkdirSync(out, { recursive: true });
cpSync(join(here, "app"), join(out, "app"), { recursive: true });
mkdirSync(join(out, "screenshots"), { recursive: true });
if (existsSync(join(here, "screenshots"))) {
  cpSync(join(here, "screenshots"), join(out, "screenshots"), { recursive: true });
}

// Caps mirror the scorer's own limits: at most 4 screenshots, none over
// 256 KiB; app/ at most 993 files and directories and 48 MiB in all.
writeFileSync(
  join(out, "dossier.json"),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
  }),
);
