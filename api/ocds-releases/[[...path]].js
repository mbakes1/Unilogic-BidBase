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

export default async function handler(request, response) {
  const url = new URL(request.url)
  const pathname = url.pathname
  
  try {
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      response.status(204).setHeader('Access-Control-Allow-Origin', '*')
        .setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        .setHeader('Access-Control-Allow-Headers', 'Content-Type')
        .send()
      return
    }
    
    // Handle list requests (/api/ocds-releases)
    if (pathname === '/api/ocds-releases') {
      // Build the target URL with query parameters
      const targetUrl = `https://ocds-api.etenders.gov.za/api/OCDSReleases${url.search}`
      
      // Check cache first
      const cachedData = getFromCache(targetUrl)
      if (cachedData) {
        console.log(`Cache hit for: ${targetUrl}`)
        response.status(200)
          .setHeader('Content-Type', 'application/json')
          .setHeader('Access-Control-Allow-Origin', '*')
          .setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
          .setHeader('Access-Control-Allow-Headers', 'Content-Type')
          .setHeader('X-Cache', 'HIT')
          .send(cachedData)
        return
      }
      
      // Make the request to the actual API
      const apiResponse = await fetch(targetUrl)
      
      if (!apiResponse.ok) {
        throw new Error(`HTTP error! status: ${apiResponse.status}`)
      }
      
      const data = await apiResponse.text()
      
      // Cache the response
      saveToCache(targetUrl, data)
      
      response.status(200)
        .setHeader('Content-Type', 'application/json')
        .setHeader('Access-Control-Allow-Origin', '*')
        .setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        .setHeader('Access-Control-Allow-Headers', 'Content-Type')
        .setHeader('X-Cache', 'MISS')
        .send(data)
      return
    }
    
    // Handle detail requests (/api/ocds-releases/release/:ocid)
    if (pathname.startsWith('/api/ocds-releases/release/')) {
      const ocid = pathname.split('/').pop()
      const targetUrl = `https://ocds-api.etenders.gov.za/api/OCDSReleases/release/${ocid}`
      
      // Check cache first
      const cachedData = getFromCache(targetUrl)
      if (cachedData) {
        console.log(`Cache hit for: ${targetUrl}`)
        response.status(200)
          .setHeader('Content-Type', 'application/json')
          .setHeader('Access-Control-Allow-Origin', '*')
          .setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
          .setHeader('Access-Control-Allow-Headers', 'Content-Type')
          .setHeader('X-Cache', 'HIT')
          .send(cachedData)
        return
      }
      
      // Make the request to the actual API
      const apiResponse = await fetch(targetUrl)
      
      if (!apiResponse.ok) {
        throw new Error(`HTTP error! status: ${apiResponse.status}`)
      }
      
      const data = await apiResponse.text()
      
      // Cache the response
      saveToCache(targetUrl, data)
      
      response.status(200)
        .setHeader('Content-Type', 'application/json')
        .setHeader('Access-Control-Allow-Origin', '*')
        .setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        .setHeader('Access-Control-Allow-Headers', 'Content-Type')
        .setHeader('X-Cache', 'MISS')
        .send(data)
      return
    }
    
    // Handle not found
    response.status(404)
      .setHeader('Content-Type', 'text/plain')
      .setHeader('Access-Control-Allow-Origin', '*')
      .send('Not Found')
  } catch (error) {
    console.error('Proxy error:', error)
    response.status(500)
      .setHeader('Content-Type', 'text/plain')
      .setHeader('Access-Control-Allow-Origin', '*')
      .send(`Proxy Error: ${error.message}`)
  }
}

export const config = {
  runtime: 'nodejs18.x',
}