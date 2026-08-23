/**
 * Production-ready Error Logging & Telemetry Service
 * Supports Console-based structured formatting, in-memory telemetry buffer,
 * breadcrumb tracking, and optional Sentry DSN envelope/event transport.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal'

export interface LogBreadcrumb {
  category?: string
  message: string
  data?: Record<string, any>
  level?: LogLevel
  timestamp: number
}

export interface ApiErrorLogContext {
  endpoint?: string
  method?: string
  statusCode?: number
  statusText?: string
  latencyMs?: number
  requestBody?: any
  responseData?: any
  tags?: Record<string, string>
  extra?: Record<string, any>
  [key: string]: any
}

export interface ErrorLogEntry {
  id: string
  timestamp: string
  isoTimestamp: string
  level: LogLevel
  message: string
  error?: {
    name?: string
    message?: string
    stack?: string
  }
  context?: ApiErrorLogContext
  breadcrumbs?: LogBreadcrumb[]
  environment: string
  userAgent?: string
}

type ErrorListener = (entry: ErrorLogEntry) => void

class ErrorLoggerService {
  private logs: ErrorLogEntry[] = []
  private breadcrumbs: LogBreadcrumb[] = []
  private maxLogs = 100
  private maxBreadcrumbs = 25
  private listeners: Set<ErrorListener> = new Set()
  private sentryDsn: string | null = null
  private environment: string

  constructor() {
    this.sentryDsn = typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_SENTRY_DSN || null : null
    this.environment = typeof process !== 'undefined' ? process.env.NODE_ENV || 'production' : 'production'

    if (typeof window !== 'undefined') {
      // Catch unhandled promise rejections
      window.addEventListener('unhandledrejection', (event) => {
        this.captureException(event.reason, {
          tags: { source: 'unhandledrejection' },
          extra: { reason: String(event.reason) },
        })
      })

      // Catch global window errors
      window.addEventListener('error', (event) => {
        this.captureException(event.error || new Error(event.message), {
          tags: { source: 'window.onerror' },
          extra: { filename: event.filename, lineno: event.lineno, colno: event.colno },
        })
      })
    }
  }

  /**
   * Adds a breadcrumb to capture timeline context before errors happen
   */
  public addBreadcrumb(breadcrumb: {
    category?: string
    message: string
    data?: Record<string, any>
    level?: LogLevel
  }) {
    const entry: LogBreadcrumb = {
      ...breadcrumb,
      timestamp: Date.now(),
    }
    this.breadcrumbs.push(entry)
    if (this.breadcrumbs.length > this.maxBreadcrumbs) {
      this.breadcrumbs.shift()
    }
  }

  /**
   * Captures an exception with context and breadcrumbs
   */
  public captureException(
    err: unknown,
    context?: ApiErrorLogContext,
    customMessage?: string
  ): ErrorLogEntry {
    const errorObj = err instanceof Error ? err : new Error(typeof err === 'string' ? err : 'Unknown error')
    const message = customMessage || errorObj.message || 'An unexpected error occurred'

    const entry: ErrorLogEntry = {
      id: `err_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toLocaleTimeString(),
      isoTimestamp: new Date().toISOString(),
      level: 'error',
      message,
      error: {
        name: errorObj.name,
        message: errorObj.message,
        stack: errorObj.stack,
      },
      context: {
        ...context,
        requestBody: this.sanitizeData(context?.requestBody),
        responseData: this.sanitizeData(context?.responseData),
      },
      breadcrumbs: [...this.breadcrumbs],
      environment: this.environment,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    }

    this.recordLog(entry)
    this.outputToConsole(entry)
    this.sendToSentry(entry)

    return entry
  }

  /**
   * Captures a structured API failure specifically
   */
  public captureApiError(params: {
    endpoint: string
    method?: string
    statusCode?: number
    statusText?: string
    latencyMs?: number
    error: any
    requestBody?: any
    responseData?: any
    tags?: Record<string, string>
  }): ErrorLogEntry {
    const { endpoint, method = 'GET', statusCode, statusText, latencyMs, error, requestBody, responseData, tags } = params
    const errMessage = error instanceof Error ? error.message : typeof error === 'string' ? error : 'API request failed'
    const formattedTitle = `[API ${method}] ${endpoint} failed${statusCode ? ` (${statusCode})` : ''}: ${errMessage}`

    return this.captureException(
      error,
      {
        endpoint,
        method,
        statusCode,
        statusText,
        latencyMs,
        requestBody,
        responseData,
        tags: { ...tags, api: 'true', endpoint },
      },
      formattedTitle
    )
  }

  /**
   * Captures a log message (info, warn, error)
   */
  public captureMessage(
    message: string,
    level: LogLevel = 'info',
    context?: ApiErrorLogContext
  ): ErrorLogEntry {
    const entry: ErrorLogEntry = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toLocaleTimeString(),
      isoTimestamp: new Date().toISOString(),
      level,
      message,
      context,
      breadcrumbs: [...this.breadcrumbs],
      environment: this.environment,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    }

    this.recordLog(entry)
    if (level === 'error' || level === 'fatal') {
      this.outputToConsole(entry)
      this.sendToSentry(entry)
    } else if (level === 'warn') {
      console.warn(`[WARN] ${message}`, context)
    } else {
      console.log(`[INFO] ${message}`, context)
    }

    return entry
  }

  /**
   * Output formatted error block to console
   */
  private outputToConsole(entry: ErrorLogEntry) {
    if (typeof console === 'undefined') return

    const endpoint = entry.context?.endpoint || 'Application'
    const status = entry.context?.statusCode ? `HTTP ${entry.context.statusCode}` : 'Error'
    const latency = entry.context?.latencyMs ? `${entry.context.latencyMs}ms` : ''

    const header = `%c[API Error Logger] %c${status}%c ${endpoint} ${latency}`
    console.groupCollapsed(
      header,
      'color: #ef4444; font-weight: bold;',
      'background: #fee2e2; color: #991b1b; padding: 2px 6px; border-radius: 4px; font-weight: bold;',
      'color: #64748b; font-weight: normal;'
    )
    console.error('Message:', entry.message)
    if (entry.error?.stack) {
      console.error('Stack Trace:\n', entry.error.stack)
    }
    if (entry.context) {
      console.log('Request Context:', entry.context)
    }
    if (entry.breadcrumbs && entry.breadcrumbs.length > 0) {
      console.log('Recent Breadcrumbs:', entry.breadcrumbs)
    }
    console.groupEnd()
  }

  /**
   * Sentry DSN HTTP Transport
   * Sends error event to Sentry if DSN is configured
   */
  private async sendToSentry(entry: ErrorLogEntry) {
    if (!this.sentryDsn) return

    try {
      // Parse DSN: https://<public_key>@<host>/<project_id>
      const match = this.sentryDsn.match(/^https:\/\/([^@]+)@([^/]+)\/(.+)$/)
      if (!match) return

      const [, publicKey, host, projectId] = match
      const sentryUrl = `https://${host}/api/${projectId}/store/?sentry_key=${publicKey}&sentry_version=7`

      const payload = {
        event_id: entry.id.replace(/[^a-f0-9]/gi, '').padEnd(32, '0').slice(0, 32),
        timestamp: entry.isoTimestamp,
        platform: 'javascript',
        level: entry.level === 'fatal' ? 'fatal' : entry.level === 'warn' ? 'warning' : 'error',
        logger: 'flipkart-label-manager-client',
        environment: this.environment,
        message: entry.message,
        exception: {
          values: [
            {
              type: entry.error?.name || 'Error',
              value: entry.error?.message || entry.message,
              stacktrace: entry.error?.stack
                ? {
                    frames: entry.error.stack.split('\n').slice(1).map((line) => ({
                      filename: line.trim(),
                      function: line.trim(),
                    })),
                  }
                : undefined,
            },
          ],
        },
        breadcrumbs: {
          values: entry.breadcrumbs?.map((b) => ({
            timestamp: b.timestamp / 1000,
            category: b.category || 'api',
            message: b.message,
            level: b.level || 'info',
            data: b.data,
          })),
        },
        tags: {
          endpoint: entry.context?.endpoint || 'unknown',
          method: entry.context?.method || 'GET',
          statusCode: String(entry.context?.statusCode || '0'),
          ...entry.context?.tags,
        },
        extra: {
          latencyMs: entry.context?.latencyMs,
          requestBody: entry.context?.requestBody,
          responseData: entry.context?.responseData,
          ...entry.context?.extra,
        },
      }

      await fetch(sentryUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        mode: 'cors',
      }).catch(() => {
        // Silently ignore remote Sentry transport errors
      })
    } catch {
      // Suppress logging transport errors
    }
  }

  private sanitizeData(data: any): any {
    if (!data) return data
    if (typeof data === 'string') {
      // Limit length if string is large (e.g. base64 or HTML)
      return data.length > 500 ? `${data.slice(0, 500)}... [truncated ${data.length} chars]` : data
    }
    if (typeof data === 'object') {
      try {
        const copy = JSON.parse(JSON.stringify(data))
        // Mask potential sensitive fields
        const sensitiveKeys = ['password', 'token', 'secret', 'authorization', 'apiKey', 'cookie']
        const mask = (obj: any) => {
          if (!obj || typeof obj !== 'object') return
          for (const key of Object.keys(obj)) {
            if (sensitiveKeys.some((k) => key.toLowerCase().includes(k))) {
              obj[key] = '********'
            } else if (typeof obj[key] === 'object') {
              mask(obj[key])
            }
          }
        }
        mask(copy)
        return copy
      } catch {
        return '[Unserializable Object]'
      }
    }
    return data
  }

  private recordLog(entry: ErrorLogEntry) {
    this.logs.unshift(entry)
    if (this.logs.length > this.maxLogs) {
      this.logs.pop()
    }
    this.listeners.forEach((listener) => {
      try {
        listener(entry)
      } catch (err) {
        console.error('Error in error listener:', err)
      }
    })
  }

  /**
   * Subscribe to new error logs
   */
  public subscribe(listener: ErrorListener): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  /**
   * Get all in-memory error logs
   */
  public getLogs(): ErrorLogEntry[] {
    return [...this.logs]
  }

  /**
   * Clear in-memory logs
   */
  public clearLogs() {
    this.logs = []
    this.breadcrumbs = []
  }

  /**
   * Export all error logs as a JSON string
   */
  public exportLogsAsJson(): string {
    return JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        environment: this.environment,
        totalLogs: this.logs.length,
        logs: this.logs,
      },
      null,
      2
    )
  }
}

// Singleton export
export const errorLogger = new ErrorLoggerService()
