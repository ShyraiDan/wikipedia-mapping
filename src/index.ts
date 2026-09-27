import { parseArgs } from 'node:util'

import { analyzePageviews, buildAnalysisDescription } from './analyzePageviews.js'
import { fetchPageViews } from './fetchPageViews.js'
import { readParams } from './readParams.js'
import { writeReport } from './writeReport.js'
import { PageAccess, PageAgent, PageGranularity, type PageviewsResponse } from './shared/index.js'

const main = async (): Promise<number> => {
  try {
    const { values, positionals } = parseArgs({
      args: process.argv.slice(2),
      options: {
        location: { type: 'string' },
        access: { type: 'string', default: PageAccess.AllAccess },
        agent: { type: 'string', default: PageAgent.AllAgents },
        article: { type: 'string' },
        granularity: { type: 'string', default: PageGranularity.Monthly },
        start: { type: 'string' },
        end: { type: 'string' },
        months: { type: 'string' },
        png: { type: 'string' },
        pdf: { type: 'string' },
      },
      allowPositionals: true,
      strict: true,
    })

    const command = positionals[0]
    if (command !== 'analyze' || positionals.length !== 1) {
      throw new Error(
        'Usage: npx tsx src/index.ts analyze --location <host> --article <title> (--months <count> | --start <YYYYMMDDHH> --end <YYYYMMDDHH>) [--png <file>] [--pdf <file>]',
      )
    }

    const params = readParams(values)
    const pngName = values.png?.trim() || 'pageviews-chart.png'
    const pdfName = values.pdf?.trim() || 'pageviews-report.pdf'
    const data = (await fetchPageViews(params)) as PageviewsResponse
    if (!Array.isArray(data?.items) || data.items.length === 0) {
      throw new Error(
        `Wikimedia returned no pageviews for "${params.article}" on ${params.location}: ${JSON.stringify(data)}`,
      )
    }

    const analysis = analyzePageviews(data.items, params.granularity)
    const description = buildAnalysisDescription(params, analysis)
    const files = await writeReport(data, params, pngName, pdfName, description)
    console.log(JSON.stringify({ params, analysis, description, files }, null, 2))
    return 0
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(`error: ${message}`)
    return 1
  }
}

process.exit(await main())
