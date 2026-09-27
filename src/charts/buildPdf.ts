import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'

import fontkit from '@pdf-lib/fontkit'
import { PDFDocument, rgb } from 'pdf-lib'

import { PageGranularity, type PageDataParams } from '../shared/index.js'

const require = createRequire(import.meta.url)
const fontsRoot = path.dirname(require.resolve('dejavu-fonts-ttf/package.json'))

const PAGE_WIDTH = 612
const PAGE_HEIGHT = 792
const MARGIN = 48
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2

const wrapText = (text: string, measure: (line: string) => number, maxWidth: number): string[] => {
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let current = ''

  for (const word of words) {
    const next = current ? `${current} ${word}` : word
    if (current && measure(next) > maxWidth) {
      lines.push(current)
      current = word
    } else {
      current = next
    }
  }

  if (current) {
    lines.push(current)
  }

  return lines
}

export const writePageviewsPdf = async (
  params: PageDataParams,
  description: string,
  chartPng: Buffer,
  outputPath = path.resolve(process.cwd(), 'output', 'pageviews-report.pdf'),
): Promise<string> => {
  const pdf = await PDFDocument.create()
  pdf.registerFontkit(fontkit)
  const page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT])
  const regular = await pdf.embedFont(await readFile(path.join(fontsRoot, 'ttf', 'DejaVuSans.ttf')), { subset: true })
  const bold = await pdf.embedFont(await readFile(path.join(fontsRoot, 'ttf', 'DejaVuSans-Bold.ttf')), { subset: true })
  const chartImage = await pdf.embedPng(chartPng)

  const granularityLabel = params.granularity === PageGranularity.Monthly ? 'monthly' : 'daily'
  const title = `${params.article} — ${granularityLabel} pageviews`
  let y = PAGE_HEIGHT - MARGIN

  page.drawText(title, {
    x: MARGIN,
    y: y - 18,
    size: 18,
    font: bold,
    color: rgb(0.1, 0.1, 0.12),
  })
  y -= 40

  const descriptionLines = wrapText(description, (line) => regular.widthOfTextAtSize(line, 11), CONTENT_WIDTH)
  for (const line of descriptionLines) {
    page.drawText(line, {
      x: MARGIN,
      y: y - 11,
      size: 11,
      font: regular,
      color: rgb(0.2, 0.2, 0.22),
    })
    y -= 16
  }

  y -= 20
  const chartWidth = CONTENT_WIDTH
  const chartHeight = (chartImage.height / chartImage.width) * chartWidth
  page.drawImage(chartImage, {
    x: MARGIN,
    y: y - chartHeight,
    width: chartWidth,
    height: chartHeight,
  })

  page.drawText('Джерело: Wikimedia Pageviews API', {
    x: MARGIN,
    y: MARGIN - 8,
    size: 9,
    font: regular,
    color: rgb(0.4, 0.4, 0.42),
  })

  await mkdir(path.dirname(outputPath), { recursive: true })
  await writeFile(outputPath, await pdf.save())
  return outputPath
}
