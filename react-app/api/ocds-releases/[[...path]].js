// Simple in-memory cache
const cache = new Map()
const CACHE_TIMEOUT = 5 * 60 * 1000 // 5 minutes

function getFromCache(key) {
  const cached = cache.get(key)
  if (cached) {
    const { data, timestamp } = cached
    if (Date.now() - timestamp < CACHE_TIMEOUT) {
      return data
    } else {
      // Remove expired entry
      cache.delete(key)
    }
  }
  return null
}

function saveToCache(key, data) {
  cache.set(key, {
    data,
    timestamp: Date.now()
  })
}

export default async function handler(request, context) {
  const url = new URL(request.url)
  const pathname = url.pathname
  
  try {
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      })
    }
    
    // Handle list requests (/api/ocds-releases)
    if (pathname === '/api/ocds-releases') {
      // Build the target URL with query parameters
      const targetUrl = `https://ocds-api.etenders.gov.za/api/OCDSReleases${url.search}`
      
      // Check cache first
      const cachedData = getFromCache(targetUrl)
      if (cachedData) {
        console.log(`Cache hit for: ${targetUrl}`)
        return new Response(cachedData, {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'X-Cache': 'HIT',
          },
        })
      }
      
      // Make the request to the actual API
      const response = await fetch(targetUrl)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.text()
      
      // Cache the response
      saveToCache(targetUrl, data)
      
      return new Response(data, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'X-Cache': 'MISS',
        },
      })
    }
    
    // Handle detail requests (/api/ocds-releases/release/:ocid)
    if (pathname.startsWith('/api/ocds-releases/release/')) {
      const ocid = pathname.split('/').pop()
      const targetUrl = `https://ocds-api.etenders.gov.za/api/OCDSReleases/release/${ocid}`
      
      // Check cache first
      const cachedData = getFromCache(targetUrl)
      if (cachedData) {
        console.log(`Cache hit for: ${targetUrl}`)
        return new Response(cachedData, {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'X-Cache': 'HIT',
          },
        })
      }
      
      // Make the request to the actual API
      const response = await fetch(targetUrl)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.text()
      
      // Cache the response
      saveToCache(targetUrl, data)
      
      return new Response(data, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'X-Cache': 'MISS',
        },
      })
    }
    
    // Handle not found
    return new Response('Not Found', {
      status: 404,
      headers: {
        'Content-Type': 'text/plain',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (error) {
    console.error('Proxy error:', error)
    return new Response(`Proxy Error: ${error.message}`, {
      status: 500,
      headers: {
        'Content-Type': 'text/plain',
        'Access-Control-Allow-Origin': '*',
      },
    })
  }
}

export const config = {
  runtime: 'edge',
}