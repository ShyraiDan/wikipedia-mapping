import {
  getErrorReason,
  USER_AGENT,
  WIKIMEDIA_URL,
  type PageDataParams,
  type PageviewItem,
  type PageviewsResponse,
} from './shared/index.js'

export type { PageviewItem, PageviewsResponse }

const insertParamsToUrl = ({ location, access, agent, article, granularity, start, end }: PageDataParams): string => {
  const encodedArticle = encodeURIComponent(article.replaceAll(' ', '_'))
  return `${WIKIMEDIA_URL}${[location, access, agent, encodedArticle, granularity, start, end].join('/')}`
}

export const fetchPageViews = async (params: PageDataParams): Promise<any> => {
  const url = insertParamsToUrl(params)

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'application/json',
      },
    })

    return response.json()
  } catch (error) {
    throw new Error(`Failed to reach Wikimedia API at ${url}: ${getErrorReason(error)}`)
  }
}
