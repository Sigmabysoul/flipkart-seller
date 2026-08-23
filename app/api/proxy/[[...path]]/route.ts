import { NextRequest, NextResponse } from "next/server"

// Helper to determine destination target URL
function getTargetBaseUrl(): string {
  const envUrl = (process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || "").trim()
  if (envUrl && /^https?:\/\//i.test(envUrl)) {
    return envUrl.replace(/\/+$/, "")
  }
  // If no valid external URL is configured, fallback to local host for internal routing
  return "http://127.0.0.1:3000"
}

// Handler for all proxy HTTP methods
async function handleProxy(req: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  const resolvedParams = await params
  const pathSegments = resolvedParams?.path || []
  const subPath = pathSegments.length > 0 ? `/${pathSegments.join("/")}` : ""
  
  // Extract search query parameters from incoming request
  const searchParams = req.nextUrl.search || ""
  
  const targetBase = getTargetBaseUrl()
  const destinationUrl = `${targetBase}${subPath}${searchParams}`

  // Prepare outgoing headers
  const outgoingHeaders = new Headers()
  
  // Copy relevant request headers
  const forwardedHeaderNames = [
    "accept",
    "content-type",
    "authorization",
    "x-requested-with",
    "cache-control",
    "user-agent"
  ]

  for (const [key, value] of req.headers.entries()) {
    if (forwardedHeaderNames.includes(key.toLowerCase())) {
      outgoingHeaders.set(key, value)
    }
  }

  // Forwarding metadata
  outgoingHeaders.set("X-Forwarded-Host", req.headers.get("host") || "")
  outgoingHeaders.set("X-Forwarded-Proto", req.nextUrl.protocol.replace(":", ""))

  // Prepare body for methods that support payload
  const method = req.method.toUpperCase()
  let body: BodyInit | null = null

  if (method !== "GET" && method !== "HEAD" && method !== "OPTIONS") {
    try {
      const contentType = req.headers.get("content-type") || ""
      if (contentType.includes("application/json")) {
        const json = await req.json()
        body = JSON.stringify(json)
      } else if (contentType.includes("multipart/form-data") || contentType.includes("application/x-www-form-urlencoded")) {
        body = await req.formData()
      } else {
        const text = await req.text()
        if (text) body = text
      }
    } catch {
      // Body may be empty or unparseable
      body = null
    }
  }

  try {
    const upstreamResponse = await fetch(destinationUrl, {
      method,
      headers: outgoingHeaders,
      body,
      // @ts-ignore
      duplex: "half",
      redirect: "follow",
    })

    // Collect response headers
    const responseHeaders = new Headers()
    
    // Add CORS headers to ensure browser compatibility
    responseHeaders.set("Access-Control-Allow-Origin", "*")
    responseHeaders.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD")
    responseHeaders.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept")

    // Forward upstream response headers
    const allowedUpstreamHeaders = [
      "content-type",
      "content-disposition",
      "cache-control",
      "etag",
      "last-modified"
    ]

    for (const [k, v] of upstreamResponse.headers.entries()) {
      if (allowedUpstreamHeaders.includes(k.toLowerCase())) {
        responseHeaders.set(k, v)
      }
    }

    const responseBody = await upstreamResponse.arrayBuffer()

    return new NextResponse(responseBody, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: responseHeaders,
    })
  } catch (err: any) {
    console.error(`[API Proxy Error] Failed to proxy to ${destinationUrl}:`, err)
    
    return NextResponse.json(
      {
        error: "Proxy Request Failed",
        detail: err?.message || "Failed to establish connection to upstream host.",
        targetUrl: destinationUrl,
        timestamp: new Date().toISOString()
      },
      {
        status: 502,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD",
          "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, Accept",
        }
      }
    )
  }
}

// Handle OPTIONS preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, Accept",
      "Access-Control-Max-Age": "86400",
    }
  })
}

export async function GET(req: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
  return handleProxy(req, context)
}

export async function POST(req: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
  return handleProxy(req, context)
}

export async function PUT(req: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
  return handleProxy(req, context)
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
  return handleProxy(req, context)
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
  return handleProxy(req, context)
}

export async function HEAD(req: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
  return handleProxy(req, context)
}
