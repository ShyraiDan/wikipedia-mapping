# Wikipedia Market Insights

An Agent Skill and TypeScript CLI for analyzing Wikipedia pageviews. One `analyze` command fetches Wikimedia data once, calculates deterministic trend metrics, creates a chart, and writes a one-page PDF report.

There is no separate UI and no internal LLM call. The chat agent maps a natural-language request to CLI arguments and explains the resulting JSON summary.

## Setup

```bash
npm install
```

No API key is required. Data comes from the Wikimedia Pageviews API.

To check TypeScript or compile into `dist/`:

```bash
npm run build
```

Normal agent runs use `tsx` directly and do not require a build.

## Run an analysis

Fixed historical range:

```bash
npx tsx src/index.ts analyze --location en.wikipedia.org --article "Albert Einstein" --start 2023010100 --end 2023123100 --granularity monthly --png pageviews-chart.png --pdf pageviews-report.pdf
```

Relative monthly range:

```bash
npx tsx src/index.ts analyze --location uk.wikipedia.org --article "Астрономія" --months 24 --png pageviews-chart.png --pdf pageviews-report.pdf
```

`--months 24` means the latest 24 complete months. The CLI reads the current system date and converts this shortcut into the normal `start` and `end` fields. `months` is not part of `PageDataParams`.

Use either:

- `--months <count>` for a relative monthly range; or
- both `--start <YYYYMMDD00>` and `--end <YYYYMMDD00>` for an explicit range.

Do not combine the two forms. Monthly ranges must start on the first day and end on the last day of a month, preventing partial monthly observations.

## Arguments

Required:

- `analyze` — the only command.
- `--location` — Wikimedia project host, for example `en.wikipedia.org`.
- `--article` — exact localized Wikipedia title.
- `--months`, or both `--start` and `--end`.

Optional:

- `--access` — `all-access` (default), `desktop`, `mobile-app`, or `mobile-web`.
- `--agent` — `all-agents` (default), `user`, `spider`, or `automated`.
- `--granularity` — `monthly` (default) or `daily`. `--months` is available only for monthly data.
- `--png` — output filename; defaults to `pageviews-chart.png`.
- `--pdf` — output filename; defaults to `pageviews-report.pdf`.

These values are represented by `PageAccess`, `PageAgent`, and `PageGranularity` enums in `src/shared/types.ts`.

## Workflow

1. `src/index.ts` parses the CLI arguments.
2. `src/readParams.ts` validates enums and date ranges and creates `PageDataParams`.
3. `src/fetchPageViews.ts` makes one Wikimedia request.
4. `src/analyzePageviews.ts` calculates metrics and builds the English report description.
5. `src/writeReport.ts` writes the PNG and one-page PDF.
6. The CLI prints `params`, `analysis`, `description`, and `files` as JSON.

The analysis includes:

- observation count, total views, and average views;
- first, last, and peak observations;
- raw Wikimedia timestamps plus human-readable periods such as `September 2024`;
- linear trend direction and estimated change;
- relative volatility;
- linear trend fit and a confidence score.

Confidence describes support for the detected trend direction, not confidence in commercial demand.

## Output

All generated files are written under `output/`:

- `output/pageviews-chart.png`
- `output/pageviews-report.pdf`

For several language editions, use unique names such as `pageviews-chart-1.png`, `pageviews-chart-2.png`, and matching PDF names.

The PDF contains an English title, a data-based English description, the chart, and `Source: Wikimedia Pageviews API`.

## Agent Skill flow

`SKILL.md` instructs the agent to:

1. Parse the user request into one invocation per language edition.
2. Use `--months` for relative monthly periods instead of guessing the current year.
3. Run `npx tsx src/index.ts analyze`.
4. Read the JSON summary and explain only the calculated results.
5. Run separate commands before comparing multiple editions.

The agent must not create temporary `.ts`, `.js`, `.mjs`, or JSON files. A run should add only its PNG and PDF files under `output/`.

To test automatic skill discovery in Cursor, copy the root skill file to:

`.cursor/skills/wikipedia-market-insights/SKILL.md`

Then open a new Agent chat and send only the user question. `.cursor/` is gitignored.

## Limitations

Wikipedia pageviews measure attention to an article. They do not directly measure product demand, user intent, market size, or willingness to pay. Article coverage and Wikipedia edition size also differ across languages, so raw totals alone are not a market ranking.
