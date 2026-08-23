'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { errorLogger, ErrorLogEntry } from '@/lib/logger'
import { sanitizeApiBaseUrl } from '@/lib/api'
import {
  Activity,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Copy,
  ExternalLink,
  Server,
  Wifi,
  WifiOff,
  Terminal,
  ChevronDown,
  ChevronUp,
  Clock,
  Globe,
  Database,
  Check,
  Zap,
  Info,
  Bug,
  Trash2,
  Download,
  ShieldAlert,
  HelpCircle
} from 'lucide-react'

export interface DiagnosticEndpointResult {
  id: string
  name: string
  path: string
  targetUrl: string
  status: 'pending' | 'success' | 'warning' | 'error'
  httpStatus?: number
  statusText?: string
  latencyMs?: number
  errorMessage?: string
  responseBody?: any
  responseHeaders?: Record<string, string>
  timestamp: string
  possibleCause?: string
}

export interface ApiDiagnosticsProps {
  defaultOpen?: boolean
  showInDashboardBanner?: boolean
  onClose?: () => void
}

export function ApiDiagnostics({
  defaultOpen = false,
  showInDashboardBanner = true,
  onClose
}: ApiDiagnosticsProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const [isRunning, setIsRunning] = useState(false)
  const [results, setResults] = useState<DiagnosticEndpointResult[]>([])
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState<'summary' | 'details' | 'raw' | 'logs'>('summary')
  const [selectedEndpointId, setSelectedEndpointId] = useState<string | null>(null)
  const [customTestUrl, setCustomTestUrl] = useState('')
  const [errorLogs, setErrorLogs] = useState<ErrorLogEntry[]>([])

  useEffect(() => {
    setErrorLogs(errorLogger.getLogs())
    const unsubscribe = errorLogger.subscribe(() => {
      setErrorLogs(errorLogger.getLogs())
    })
    return () => unsubscribe()
  }, [])

  // Environment variable evaluation with sanitization
  const rawEnvApiUrl = process.env.NEXT_PUBLIC_API_URL || ''
  const isEnvDefined = rawEnvApiUrl.trim().length > 0
  const envStatus = sanitizeApiBaseUrl(rawEnvApiUrl)
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : ''

  const runAllDiagnostics = useCallback(async () => {
    setIsRunning(true)
    const endpointsToTest = [
      { id: 'health', name: 'API Health Check', path: '/health' },
      { id: 'proxy-health', name: 'CORS Proxy Gateway', path: '/api/proxy/health' },
      { id: 'dashboard', name: 'Dashboard Analytics', path: '/dashboard?date=2026-08-22' },
      { id: 'products', name: 'Product Catalog', path: '/products' },
      { id: 'workers', name: 'Workers Allocation', path: '/workers' },
      { id: 'batches', name: 'Shipment Batches', path: '/batches' },
      { id: 'training-rules', name: 'SKU Mapping Rules', path: '/training/rules' }
    ]

    const newResults: DiagnosticEndpointResult[] = []

    for (const ep of endpointsToTest) {
      const startTime = performance.now()
      // If path is /api/proxy/..., always test via relative origin
      // Otherwise use sanitized base URL (falls back to relative same-origin if invalid/unset)
      const isProxyPath = ep.path.startsWith('/api/proxy')
      const base = isProxyPath ? '' : (envStatus.url && envStatus.isValid ? envStatus.url : '')
      const targetUrl = `${base}${ep.path}`
      const timestamp = new Date().toLocaleTimeString()

      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 8000)

        const response = await fetch(targetUrl, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          signal: controller.signal
        })
        clearTimeout(timeoutId)

        const latencyMs = Math.round(performance.now() - startTime)
        const contentType = response.headers.get('content-type') || ''
        
        let responseBody: any = null
        try {
          if (contentType.includes('application/json')) {
            responseBody = await response.json()
          } else {
            responseBody = await response.text()
          }
        } catch {
          responseBody = '[Unable to parse response body]'
        }

        const headers: Record<string, string> = {}
        response.headers.forEach((val, key) => {
          headers[key] = val
        })

        if (response.ok) {
          newResults.push({
            id: ep.id,
            name: ep.name,
            path: ep.path,
            targetUrl,
            status: 'success',
            httpStatus: response.status,
            statusText: response.statusText || 'OK',
            latencyMs,
            responseBody,
            responseHeaders: headers,
            timestamp
          })
        } else {
          let cause = `Server responded with HTTP ${response.status}`
          if (response.status === 404) cause = 'Endpoint path not found on target host.'
          if (response.status === 500) cause = 'Server encountered an internal runtime exception.'
          if (response.status === 502 || response.status === 503) cause = 'Upstream gateway or backend server is unreachable.'

          newResults.push({
            id: ep.id,
            name: ep.name,
            path: ep.path,
            targetUrl,
            status: 'error',
            httpStatus: response.status,
            statusText: response.statusText || 'Error',
            latencyMs,
            errorMessage: typeof responseBody === 'object' && responseBody?.detail ? responseBody.detail : `HTTP ${response.status}`,
            responseBody,
            responseHeaders: headers,
            timestamp,
            possibleCause: cause
          })
        }
      } catch (err: any) {
        const latencyMs = Math.round(performance.now() - startTime)
        let errMsg = err?.message || 'Network fetch failed'
        let cause = 'Unknown network error'

        if (err?.name === 'AbortError') {
          errMsg = 'Connection timed out (>8000ms)'
          cause = 'Server did not respond within 8 seconds. Host may be offline or blocked.'
        } else if (errMsg.toLowerCase().includes('failed to fetch') || errMsg.toLowerCase().includes('networkerror')) {
          if (isEnvDefined && !rawEnvApiUrl.includes(window.location.hostname)) {
            cause = 'CORS Block or Host Unreachable: The target API host rejected cross-origin credentials or is not reachable from your browser.'
          } else {
            cause = 'Network connectivity failure or dev server process down.'
          }
        }

        newResults.push({
          id: ep.id,
          name: ep.name,
          path: ep.path,
          targetUrl,
          status: 'error',
          errorMessage: errMsg,
          latencyMs,
          timestamp,
          possibleCause: cause
        })
      }
    }

    setResults(newResults)
    if (!selectedEndpointId && newResults.length > 0) {
      setSelectedEndpointId(newResults[0].id)
    }
    setIsRunning(false)
  }, [envStatus.url, isEnvDefined, rawEnvApiUrl, selectedEndpointId])

  // Run on mount
  useEffect(() => {
    runAllDiagnostics()
  }, [])

  const copyDiagnosticReport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      environment: {
        NEXT_PUBLIC_API_URL: isEnvDefined ? rawEnvApiUrl : '(undefined / empty -> using same-origin relative)',
        browserOrigin: currentOrigin,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : ''
      },
      results: results.map(r => ({
        endpoint: r.name,
        targetUrl: r.targetUrl,
        status: r.status,
        httpStatus: r.httpStatus ?? 'N/A',
        latencyMs: r.latencyMs,
        errorMessage: r.errorMessage,
        possibleCause: r.possibleCause,
        responseExcerpt: typeof r.responseBody === 'object' ? JSON.stringify(r.responseBody).slice(0, 300) : String(r.responseBody || '').slice(0, 300)
      }))
    }

    navigator.clipboard.writeText(JSON.stringify(report, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const successCount = results.filter(r => r.status === 'success').length
  const errorCount = results.filter(r => r.status === 'error').length
  const avgLatency = results.length > 0
    ? Math.round(results.reduce((acc, r) => acc + (r.latencyMs || 0), 0) / results.length)
    : 0

  const selectedEndpoint = results.find(r => r.id === selectedEndpointId) || results[0]

  return (
    <div className="w-full mb-6 font-sans" id="api-diagnostics-utility">
      {/* Compact Banner Widget */}
      <div className={`p-4 rounded-xl border transition-all ${
        errorCount > 0
          ? 'bg-rose-50/80 dark:bg-rose-950/25 border-rose-200 dark:border-rose-900/60 text-rose-950 dark:text-rose-100'
          : successCount === results.length && results.length > 0
          ? 'bg-emerald-50/80 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/60 text-emerald-950 dark:text-emerald-100'
          : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200'
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 shadow-sm ${
              errorCount > 0
                ? 'bg-rose-600 text-white'
                : successCount === results.length && results.length > 0
                ? 'bg-emerald-600 text-white'
                : 'bg-blue-600 text-white'
            }`}>
              {isRunning ? <RefreshCw size={17} className="animate-spin" /> : errorCount > 0 ? <WifiOff size={18} /> : <Wifi size={18} />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <strong className="text-sm font-bold tracking-tight">API Connectivity Diagnostics</strong>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
                  errorCount > 0
                    ? 'bg-rose-200/70 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300'
                    : 'bg-emerald-200/70 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300'
                }`}>
                  {isRunning ? 'Probing endpoints...' : `${successCount}/${results.length} Endpoints Operational`}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted mt-0.5">
                <span>
                  Target: <code className="px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 font-mono text-[11px] text-foreground font-semibold">
                    {isEnvDefined ? rawEnvApiUrl : '(Same-Origin Relative /api)'}
                  </code>
                </span>
                {avgLatency > 0 && (
                  <span className="flex items-center gap-1">
                    <Clock size={11} /> {avgLatency}ms avg latency
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={runAllDiagnostics}
              disabled={isRunning}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-card hover:bg-slate-100 dark:hover:bg-slate-800 border border-border text-foreground transition-all shadow-xs disabled:opacity-50"
              title="Retest all API endpoints now"
            >
              <RefreshCw size={13} className={isRunning ? 'animate-spin text-blue-500' : ''} />
              {isRunning ? 'Checking...' : 'Run Diagnostics'}
            </button>
            <button
              onClick={copyDiagnosticReport}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-card hover:bg-slate-100 dark:hover:bg-slate-800 border border-border text-foreground transition-all shadow-xs"
              title="Copy JSON diagnosis report to clipboard"
            >
              {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
              {copied ? 'Copied' : 'Copy Report'}
            </button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-xs"
            >
              {isOpen ? 'Hide Details' : 'View Details'}
              {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>
        </div>

        {/* Detailed Inspection Drawer */}
        {isOpen && (
          <div className="mt-4 pt-4 border-t border-border/80 text-foreground animate-in fade-in duration-200">
            {/* Environment Summary Cards */}
            {!envStatus.isValid && isEnvDefined && (
              <div className="mb-4 p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 rounded-xl text-amber-950 dark:text-amber-100 flex items-start gap-3 shadow-xs">
                <ShieldAlert size={20} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <div className="font-bold flex items-center gap-2 text-amber-900 dark:text-amber-200">
                    <span>Non-URL Value Detected in NEXT_PUBLIC_API_URL</span>
                    <span className="text-[10px] uppercase tracking-wider bg-amber-200/80 dark:bg-amber-900/80 px-2 py-0.5 rounded font-mono font-semibold">
                      Self-Healing Applied
                    </span>
                  </div>
                  <p className="text-amber-800 dark:text-amber-300 leading-relaxed">
                    The environment variable <code className="font-mono px-1 py-0.5 bg-amber-200/50 dark:bg-amber-900/40 rounded">NEXT_PUBLIC_API_URL</code> is currently set to <code className="font-mono font-bold px-1 py-0.5 bg-black/10 dark:bg-white/10 rounded">"{rawEnvApiUrl}"</code>, which is not a valid HTTP URL.
                  </p>
                  <p className="text-amber-700 dark:text-amber-400 text-[11px] leading-relaxed">
                    <strong>Automatic Fix:</strong> The app automatically ignores this invalid prefix and routes requests directly to the built-in Next.js endpoints (<code className="font-mono">/health</code>, <code className="font-mono">/dashboard</code>, <code className="font-mono">/products</code>, etc.). To remove this warning, you can clear the variable in Project Settings.
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              <div className="p-3 bg-card rounded-lg border border-border">
                <div className="flex items-center justify-between text-xs text-muted mb-1">
                  <span className="font-semibold flex items-center gap-1.5">
                    <Globe size={13} className="text-blue-500" /> NEXT_PUBLIC_API_URL
                  </span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    !envStatus.isValid && isEnvDefined
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                      : isEnvDefined
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  }`}>
                    {!envStatus.isValid && isEnvDefined ? 'INVALID (IGNORED)' : isEnvDefined ? 'CONFIGURED' : 'UNSET (SAME-ORIGIN)'}
                  </span>
                </div>
                <div className="font-mono text-xs font-bold truncate text-foreground" title={rawEnvApiUrl || 'Relative Same-Origin'}>
                  {envStatus.url || '(Same-Origin Relative /api)'}
                </div>
                <p className="text-[11px] text-muted mt-1 leading-tight">
                  {envStatus.url
                    ? 'Browser fetches route to this explicit remote host URL.'
                    : 'Browser calls standard server API routes hosted on current domain.'}
                </p>
              </div>

              <div className="p-3 bg-card rounded-lg border border-border">
                <div className="flex items-center justify-between text-xs text-muted mb-1">
                  <span className="font-semibold flex items-center gap-1.5">
                    <Server size={13} className="text-teal-500" /> Host Origin
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300">
                    CLIENT
                  </span>
                </div>
                <div className="font-mono text-xs font-bold truncate text-foreground" title={currentOrigin}>
                  {currentOrigin || 'http://localhost:3000'}
                </div>
                <p className="text-[11px] text-muted mt-1 leading-tight">
                  Origin of the current Next.js application container.
                </p>
              </div>

              <div className="p-3 bg-card rounded-lg border border-border">
                <div className="flex items-center justify-between text-xs text-muted mb-1">
                  <span className="font-semibold flex items-center gap-1.5">
                    <Database size={13} className="text-amber-500" /> Health Status
                  </span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${errorCount === 0 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'}`}>
                    {errorCount === 0 ? 'ALL GREEN' : `${errorCount} FAILING`}
                  </span>
                </div>
                <div className="text-xs font-bold text-foreground">
                  {errorCount === 0 ? 'All backend endpoints responding normally' : 'Investigate failing routes below'}
                </div>
                <p className="text-[11px] text-muted mt-1 leading-tight">
                  Tested across {results.length} core API handler routes.
                </p>
              </div>
            </div>

            {/* Sub-Tabs */}
            <div className="flex items-center justify-between border-b border-border pb-2 mb-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('summary')}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-colors ${
                    activeTab === 'summary'
                      ? 'bg-blue-600 text-white'
                      : 'text-muted hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  Endpoints Overview
                </button>
                <button
                  onClick={() => setActiveTab('details')}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-colors ${
                    activeTab === 'details'
                      ? 'bg-blue-600 text-white'
                      : 'text-muted hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  Inspect Selected Endpoint
                </button>
                <button
                  onClick={() => setActiveTab('raw')}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-colors ${
                    activeTab === 'raw'
                      ? 'bg-blue-600 text-white'
                      : 'text-muted hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  Raw Diagnostic JSON
                </button>
                <button
                  onClick={() => setActiveTab('logs')}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
                    activeTab === 'logs'
                      ? 'bg-blue-600 text-white'
                      : errorLogs.length > 0
                      ? 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100'
                      : 'text-muted hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Bug size={13} />
                  Error Logs / Telemetry
                  {errorLogs.length > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500 text-white">
                      {errorLogs.length}
                    </span>
                  )}
                </button>
              </div>

              <span className="text-[11px] text-muted font-medium">
                Last ran at {results[0]?.timestamp || 'just now'}
              </span>
            </div>

            {/* TAB: Endpoints Overview */}
            {activeTab === 'summary' && (
              <div className="space-y-2">
                <div className="overflow-x-auto rounded-lg border border-border bg-card">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100/70 dark:bg-slate-800/60 border-b border-border text-muted">
                        <th className="py-2 px-3 font-semibold">Status</th>
                        <th className="py-2 px-3 font-semibold">Endpoint Name</th>
                        <th className="py-2 px-3 font-semibold">Resolved URL</th>
                        <th className="py-2 px-3 font-semibold">HTTP Code</th>
                        <th className="py-2 px-3 font-semibold text-right">Latency</th>
                        <th className="py-2 px-3 font-semibold text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {results.map((r) => (
                        <tr
                          key={r.id}
                          className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors ${
                            selectedEndpointId === r.id ? 'bg-blue-50/60 dark:bg-blue-950/30' : ''
                          }`}
                          onClick={() => {
                            setSelectedEndpointId(r.id)
                            setActiveTab('details')
                          }}
                        >
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            {r.status === 'success' ? (
                              <span className="inline-flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 size={15} /> OK
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 font-bold text-rose-600 dark:text-rose-400">
                                <XCircle size={15} /> Failed
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-foreground">
                            {r.name}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-muted truncate max-w-xs" title={r.targetUrl}>
                            {r.targetUrl}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[11px]">
                            {r.httpStatus ? (
                              <span className={`px-1.5 py-0.5 rounded font-bold ${
                                r.httpStatus >= 200 && r.httpStatus < 300
                                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                                  : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                              }`}>
                                {r.httpStatus} {r.statusText}
                              </span>
                            ) : (
                              <span className="text-rose-500 font-bold">Network Error</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-xs text-muted">
                            {r.latencyMs !== undefined ? `${r.latencyMs}ms` : '—'}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedEndpointId(r.id)
                                setActiveTab('details')
                              }}
                              className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 font-semibold underline underline-offset-2"
                            >
                              Inspect
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Common Diagnostic Solutions / Insights */}
                {errorCount > 0 && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 rounded-lg text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5 mt-3">
                    <Info size={16} className="text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-bold block mb-1">Troubleshooting Tips for Failed Requests:</strong>
                      <ul className="list-disc pl-4 space-y-1 text-[11px] text-amber-800 dark:text-amber-300/90">
                        <li>
                          <strong>Configured Remote URL:</strong> If <code>NEXT_PUBLIC_API_URL</code> points to an external server (e.g. <code>localhost:8000</code> or an unhosted domain), ensure that server has CORS enabled with <code>Access-Control-Allow-Origin: *</code>.
                        </li>
                        <li>
                          <strong>Relative Fallback Mode:</strong> By default without <code>NEXT_PUBLIC_API_URL</code>, the app automatically makes relative calls to built-in Next.js server route handlers.
                        </li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB: Selected Endpoint Details */}
            {activeTab === 'details' && selectedEndpoint && (
              <div className="space-y-3 bg-card p-4 rounded-lg border border-border">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
                  <div>
                    <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                      {selectedEndpoint.status === 'success' ? (
                        <CheckCircle2 size={16} className="text-emerald-500" />
                      ) : (
                        <XCircle size={16} className="text-rose-500" />
                      )}
                      {selectedEndpoint.name}
                    </h4>
                    <p className="text-xs text-muted font-mono mt-0.5">
                      URL: {selectedEndpoint.targetUrl}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-foreground font-semibold">
                      HTTP {selectedEndpoint.httpStatus ?? 'ERR'} ({selectedEndpoint.latencyMs}ms)
                    </span>
                  </div>
                </div>

                {selectedEndpoint.errorMessage && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-md">
                    <strong className="text-xs font-bold text-rose-700 dark:text-rose-300 block mb-0.5">
                      Error Message:
                    </strong>
                    <p className="text-xs font-mono text-rose-800 dark:text-rose-200">
                      {selectedEndpoint.errorMessage}
                    </p>
                    {selectedEndpoint.possibleCause && (
                      <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1">
                        <strong>Probable Cause:</strong> {selectedEndpoint.possibleCause}
                      </p>
                    )}
                  </div>
                )}

                {/* Response Preview */}
                <div>
                  <span className="text-xs font-semibold text-muted block mb-1">
                    Response Payload / Excerpt:
                  </span>
                  <div className="p-3 bg-slate-900 text-slate-100 dark:bg-black rounded-md font-mono text-[11px] overflow-x-auto max-h-60">
                    <pre>
                      {typeof selectedEndpoint.responseBody === 'object'
                        ? JSON.stringify(selectedEndpoint.responseBody, null, 2)
                        : String(selectedEndpoint.responseBody || 'No response body returned.')}
                    </pre>
                  </div>
                </div>

                {/* Response Headers */}
                {selectedEndpoint.responseHeaders && Object.keys(selectedEndpoint.responseHeaders).length > 0 && (
                  <div>
                    <span className="text-xs font-semibold text-muted block mb-1">
                      Response Headers:
                    </span>
                    <div className="p-2 bg-slate-50 dark:bg-slate-800/40 rounded border border-border font-mono text-[10px] space-y-0.5">
                      {Object.entries(selectedEndpoint.responseHeaders).map(([k, v]) => (
                        <div key={k} className="flex gap-2">
                          <span className="text-muted font-bold">{k}:</span>
                          <span className="text-foreground truncate">{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB: Raw JSON */}
            {activeTab === 'raw' && (
              <div className="relative">
                <div className="p-3 bg-slate-900 text-emerald-400 rounded-lg font-mono text-xs overflow-x-auto max-h-80 border border-slate-800">
                  <pre>
                    {JSON.stringify(
                      {
                        environment: {
                          NEXT_PUBLIC_API_URL: isEnvDefined ? rawEnvApiUrl : 'undefined',
                          browserOrigin: currentOrigin,
                          time: new Date().toISOString()
                        },
                        results
                      },
                      null,
                      2
                    )}
                  </pre>
                </div>
              </div>
            )}

            {/* TAB: Live Error Logs / Sentry Telemetry */}
            {activeTab === 'logs' && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-100/80 dark:bg-slate-800/60 rounded-lg border border-border">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-foreground">Sentry Integration:</span>
                    {process.env.NEXT_PUBLIC_SENTRY_DSN ? (
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        <Check size={12} /> Connected (DSN Configured)
                      </span>
                    ) : (
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium">
                        Console & In-Memory Mode (Set NEXT_PUBLIC_SENTRY_DSN for cloud ingest)
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const json = errorLogger.exportLogsAsJson()
                        const blob = new Blob([json], { type: 'application/json' })
                        const url = URL.createObjectURL(blob)
                        const a = document.createElement('a')
                        a.href = url
                        a.download = `api_error_logs_${new Date().toISOString().split('T')[0]}.json`
                        a.click()
                        URL.revokeObjectURL(url)
                      }}
                      disabled={errorLogs.length === 0}
                      className="text-xs px-2.5 py-1 rounded bg-card border border-border text-foreground hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 disabled:opacity-40"
                    >
                      <Download size={13} /> Export JSON
                    </button>
                    <button
                      onClick={() => {
                        errorLogger.clearLogs()
                        setErrorLogs([])
                      }}
                      disabled={errorLogs.length === 0}
                      className="text-xs px-2.5 py-1 rounded bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 hover:bg-rose-100 flex items-center gap-1.5 disabled:opacity-40"
                    >
                      <Trash2 size={13} /> Clear Logs
                    </button>
                  </div>
                </div>

                {errorLogs.length === 0 ? (
                  <div className="p-8 text-center bg-card rounded-lg border border-border text-muted">
                    <CheckCircle2 size={28} className="mx-auto text-emerald-500 mb-2" />
                    <h5 className="text-sm font-bold text-foreground">No API Errors Logged</h5>
                    <p className="text-xs text-muted mt-1 max-w-sm mx-auto">
                      All recent outbound client API requests completed successfully with zero HTTP or network failures.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                    {errorLogs.map((log) => (
                      <div
                        key={log.id}
                        className="p-3 bg-card rounded-lg border border-border hover:border-slate-400 transition-colors space-y-2"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-600 font-bold uppercase font-mono text-[10px]">
                              {log.level}
                            </span>
                            <span className="text-xs font-mono font-bold text-foreground">
                              {log.context?.method || 'REQ'} {log.context?.endpoint || 'Application'}
                            </span>
                            {log.context?.statusCode && (
                              <span className="text-xs font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-foreground">
                                HTTP {log.context.statusCode}
                              </span>
                            )}
                            {log.context?.latencyMs !== undefined && (
                              <span className="text-[11px] font-mono text-muted">
                                {log.context.latencyMs}ms
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-muted font-mono">{log.timestamp}</span>
                        </div>

                        <p className="text-xs font-mono text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/20 p-2 rounded border border-rose-200/60 dark:border-rose-900/40">
                          {log.message}
                        </p>

                        {log.error?.stack && (
                          <details className="text-[11px]">
                            <summary className="text-muted cursor-pointer hover:text-foreground font-semibold">
                              View Stack Trace
                            </summary>
                            <pre className="mt-1 p-2 bg-slate-900 text-slate-200 rounded font-mono text-[10px] overflow-x-auto max-h-32">
                              {log.error.stack}
                            </pre>
                          </details>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
