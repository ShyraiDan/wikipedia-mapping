---
name: wikipedia-market-insights
description: Analyzes Wikimedia pageviews for Wikipedia articles, compares interest across language editions, and writes a one-page PDF chart report. Use when the user asks whether a topic is growing, which language audiences to explore, how much to trust a pageview trend, or for a shareable Wikipedia demand report.
---

# Wikipedia market insights

The user writes the request in this chat. There is no separate UI. Do not run `npm start`, and do not send the user message to another model.

Do not create or edit files. That includes `temp-report.ts`, `analyze.mjs`, `generate-reports.mjs`, `test-search.mjs`, and any other new `.mjs`, `.js`, or `.ts` file. A file whose only job is to call `writeReport` is still a new file. Do not run `npm run build` and do not import from `dist/`. The only files a run may add are the PNG and PDF under `output/`.

## Who does what

1. Read the user message and prepare one CLI invocation per language edition.
2. Map the request to these arguments:

```ts
{
  location: string
  access: 'all-access' | 'desktop' | 'mobile-app' | 'mobile-web'
  agent: 'all-agents' | 'user' | 'spider' | 'automated'
  article: string
  granularity: 'daily' | 'monthly'
  start: number // YYYYMMDD00
  end: number // YYYYMMDD00
}
```

Rules:

- One object per language edition.
- `access` is `all-access` unless the user names a device (`desktop`, `mobile-app`, or `mobile-web`).
- `agent` is `user` when the user asks whether growth is trustworthy; otherwise `all-agents`.
- `granularity` is `monthly` unless the user asks for days (`daily`).
- `start` and `end` are numbers ending in hour `00`. For monthly data, start on the first day and end on the last day of the final complete month; otherwise Wikimedia returns a partial final month.
- `PageDataParams` always contains `start` and `end`; `months` is not part of this type.
- For relative monthly ranges, never infer the current date or year. Pass the CLI-only `--months` shortcut: "last two years" is `--months 24`, "last 6 months" is `--months 6`. Before calling Wikimedia, the CLI converts it to `start` and `end` in the shape above.
- `article` is the Wikipedia title, not a paraphrase of the request.

3. Run the `analyze` command once. It fetches the series once, calculates the metrics, writes the description, chart, and PDF, and prints a JSON summary.
4. Read that JSON summary and explain it to the user. Do not recalculate or invent metrics.
5. For several editions, compare their summaries only after all commands succeed.

A follow-up in the same chat ("only real users", "last 6 months", another language) repeats steps 2–5 with new arguments. Do not reuse the previous PDF for a new window.

## Parameters

You fill the CLI arguments in step 2. Repeat those values in the answer and check them against the request.

| Field       | How to fill it                                                                                                    |
| ----------- | ----------------------------------------------------------------------------------------------------------------- |
| location    | `{lang}.wikipedia.org`, for example `en.wikipedia.org`                                                            |
| access      | `all-access`, unless the user asks for `desktop`, `mobile-app`, or `mobile-web`                                   |
| agent       | `user` when they ask if growth is trustworthy; otherwise `all-agents`                                             |
| article     | Exact article title, spaces allowed                                                                               |
| granularity | `monthly`, unless they ask for days (`daily`)                                                                     |
| months      | CLI-only shortcut for relative monthly requests; converted to `start` and `end`, never passed to Wikimedia        |
| start, end  | `YYYYMMDDHH`. Use hour `00`. Monthly ranges start on day `01` and end on the last day of the final complete month |

Use either `months` or `start` and `end`, never both. One language edition is one invocation. Raw totals are not a ranking of markets: editions differ in size.

## Run

From the repository root, use only `npx tsx src/index.ts analyze`. One command produces one chart and one PDF. Do not save the command as `temp-report.ts` or any other file.

```bash
npx tsx src/index.ts analyze --location en.wikipedia.org --article "Albert Einstein" --start 2023010100 --end 2023120100 --granularity monthly --png pageviews-chart.png --pdf pageviews-report.pdf
```

For a relative window:

```bash
npx tsx src/index.ts analyze --location uk.wikipedia.org --article "Астрономія" --months 24 --png pageviews-chart.png --pdf pageviews-report.pdf
```

`--access` defaults to `all-access`, `--agent` to `all-agents`, `--granularity` to `monthly`, and the file names to `pageviews-chart.png` and `pageviews-report.pdf`. For several editions, pass unique names ending in `-1`, `-2`, and so on. If Wikimedia returns no items, check the exact localized article title and retry the command. Do not write a search script.

## Read the output

The command prints `params`, `analysis`, `description`, and `files` as JSON. `analysis` includes the point count, total and average views, first and last observations, peak, linear trend estimate, volatility, and confidence score. Confidence describes support for the trend direction, not commercial certainty. Confirm the PDF is a single page and that the chart title matches `article`.

## Answer

State the article, edition, window, granularity, access, and agent filter from `params`. Explain only the printed `analysis`, including its confidence. Then state the limit: pageviews measure attention, not willingness to pay.

If `params` do not match the request, say that this run does not answer it.
