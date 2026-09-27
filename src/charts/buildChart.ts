import { CategoryScale, Chart, Legend, LinearScale, LineController, LineElement, PointElement, Title } from 'chart.js'
import { Canvas } from 'skia-canvas'

import type { PageDataParams, PageviewItem } from '../shared/index.js'

Chart.register(CategoryScale, Legend, LinearScale, LineController, LineElement, PointElement, Title)

const CHART_WIDTH = 800
const CHART_HEIGHT = 450

const formatPeriod = (timestamp: string): string =>
  timestamp.length >= 6 ? `${timestamp.slice(0, 4)}-${timestamp.slice(4, 6)}` : timestamp

export const renderPageviewsChartPng = async (params: PageDataParams, items: PageviewItem[]): Promise<Buffer> => {
  const canvas = new Canvas(CHART_WIDTH, CHART_HEIGHT)
  const chart = new Chart(canvas as never, {
    type: 'line',
    data: {
      labels: items.map((item) => formatPeriod(item.timestamp)),
      datasets: [
        {
          label: 'Pageviews',
          data: items.map((item) => item.views),
          borderColor: '#1d4ed8',
          backgroundColor: 'rgba(29, 78, 216, 0.12)',
          pointBackgroundColor: '#1d4ed8',
        },
      ],
    },
    options: {
      animation: false,
      responsive: false,
      plugins: {
        legend: { display: true },
        title: {
          display: true,
          text: `${params.article} ${params.granularity} pageviews`,
        },
      },
      scales: {
        x: { title: { display: true, text: 'Period' } },
        y: { beginAtZero: true, title: { display: true, text: 'Views' } },
      },
    },
  })

  const pngBuffer = Buffer.from(await canvas.toBuffer('png', { matte: 'white' }))
  chart.destroy()
  return pngBuffer
}
