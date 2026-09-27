import { writeFile } from 'node:fs/promises'
import path from 'node:path'

import { renderPageviewsChartPng, writePageviewsPdf } from './charts/index.js'
import type { PageDataParams, PageviewsResponse } from './shared/index.js'

export interface ReportPaths {
  pngPath: string
  pdfPath: string
}

export const writeReport = async (
  data: PageviewsResponse,
  params: PageDataParams,
  pngName: string,
  pdfName: string,
  description: string,
): Promise<ReportPaths> => {
  const text = description.trim()
  if (!text) {
    throw new Error('description is empty')
  }

  const chartPng = await renderPageviewsChartPng(params, data.items)
  const outputDir = path.resolve(process.cwd(), 'output')
  const pngPath = path.join(outputDir, pngName)
  const pdfPath = await writePageviewsPdf(params, text, chartPng, path.join(outputDir, pdfName))
  await writeFile(pngPath, chartPng)

  return { pngPath, pdfPath }
}
