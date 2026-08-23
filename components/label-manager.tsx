'use client'

import React, { useState, useTransition, useEffect } from 'react'
import useSWR, { mutate } from 'swr'
import {
  Archive,
  ArrowDownToLine,
  BarChart3,
  Bell,
  BookOpen,
  Box,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  CloudUpload,
  FileCheck2,
  Filter,
  HelpCircle,
  LayoutDashboard,
  Menu,
  Moon,
  Package,
  Plus,
  PlusCircle,
  Printer,
  Search,
  Settings as SettingsIcon,
  ShieldAlert,
  Sun,
  Tag,
  Tags,
  TrainFront,
  Trash2,
  TrendingUp,
  TrendingDown,
  Truck,
  Upload,
  Users,
  X,
  Check,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  MoreHorizontal,
  Undo2,
  ExternalLink,
  Layers,
  FileText,
  Clock,
  Sparkles,
  FolderTree,
  Copy,
  Download,
  CalendarDays,
  FileSpreadsheet,
  Eye,
  Keyboard,
  Zap,
  Command,
  Calculator,
  Sliders,
  Database,
  RotateCcw,
  Code,
  FileCode,
  Edit3,
  SlidersHorizontal,
  ArrowRight,
  Sparkle,
  Bookmark,
  GitBranch,
} from 'lucide-react'

import {
  getDashboard,
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getWorkers,
  createWorker,
  deleteWorker,
  getCategories,
  createCategory,
  deleteCategory,
  getTrainingStats,
  getUnknownSkus,
  getSkuMappings,
  deleteSkuMapping,
  ApiSkuMapping,
  mapSku,
  bulkMapSkus,
  getTrainingHistory,
  undoTraining,
  getPatternRules,
  createPatternRule,
  deletePatternRule,
  processLabels,
  confirmBatch,
  cancelBatch,
  recordPrintEvent,
  getHistory,
  searchShipments,
  clearOldLabelData,
  resetDatabaseToDefault,
  syncDatabaseWithDisk,
  getFullDatabaseExport,
  importDatabaseData,
  ApiProduct,
  ApiWorker,
  ApiCategory,
  DashboardResponse,
  UnknownSkuItem,
  TrainingHistoryItem,
  PatternRule,
  ParsedLabelItem,
  ProcessBatchResponse,
} from '@/lib/api'
import { ApiDiagnostics } from './api-diagnostics'

const nav = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'kartik', label: "Kartik Da's Station", icon: Layers },
  { id: 'my-station', label: 'My Station (Sohel)', icon: Box },
  { id: 'process', label: 'Process Labels', icon: CloudUpload },
  { id: 'products', label: 'Products & Recipes', icon: Package },
  { id: 'training', label: 'Training Center', icon: TrainFront },
  { id: 'history', label: 'History & Logs', icon: Archive },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
]

function Badge({ children, kind = 'neutral' }: { children: React.ReactNode; kind?: string }) {
  return <span className={`badge badge-${kind}`}>{children}</span>
}

function Stat({ label, value, note, icon: Icon, tone = 'blue' }: any) {
  return (
    <div className="stat-card" id={`stat-${label.toLowerCase().replace(/\s+/g, '-')}`}>
      <div className={`stat-icon ${tone}`}><Icon size={18} /></div>
      <div>
        <p className="eyebrow">{label}</p>
        <p className="stat-value">{value}</p>
        {note && <p className="stat-note">{note}</p>}
      </div>
    </div>
  )
}

function PageHead({ eyebrow, title, description, action }: any) {
  return (
    <div className="page-head">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {description && <p className="subhead">{description}</p>}
      </div>
      {action}
    </div>
  )
}

function TableWrap({ children }: { children: React.ReactNode }) {
  return <div className="table-wrap"><table>{children}</table></div>
}

// ----------------------------------------------------------------------
// SKELETON LOADING COMPONENTS
// ----------------------------------------------------------------------
export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-slate-200 dark:bg-slate-800 rounded ${className}`}
      role="status"
      aria-label="Loading..."
    />
  )
}

export function ViewSkeleton({
  title = 'Loading View...',
  eyebrow = 'Warehouse Pipeline',
  statCount = 4,
}: {
  title?: string
  eyebrow?: string
  statCount?: number
}) {
  return (
    <div className="space-y-6 animate-pulse" aria-busy="true" aria-live="polite">
      {/* Header Skeleton */}
      <div className="page-head">
        <div className="space-y-2">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>

      {/* Stats Cards Skeleton */}
      <div className={`stats-grid ${statCount === 3 ? 'three' : ''}`}>
        {Array.from({ length: statCount }).map((_, i) => (
          <div key={i} className="stat-card">
            <Skeleton className="w-9 h-9 rounded-lg shrink-0" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid / Panels Skeleton */}
      <div className="two-col">
        <div className="panel space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-border">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="space-y-3 pt-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex justify-between items-center py-2 border-b border-border/50">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-8 h-8 rounded-full" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
                <Skeleton className="h-5 w-16 rounded" />
              </div>
            ))}
          </div>
        </div>

        <div className="panel space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-border">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="space-y-3 pt-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2 py-1">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-4 w-12" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="panel space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-8 w-44" />
        </div>
        <div className="space-y-3 pt-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    </div>
  )
}


function StatusBadge({ value }: { value: string }) {
  const v = value.toLowerCase()
  let kind = 'neutral'
  if (['mapped', 'confirmed', 'active', 'ok'].includes(v)) kind = 'success'
  else if (['duplicate', 'needs_review', 'review', 'override'].includes(v)) kind = 'warning'
  else if (['unknown', 'mismatch', 'cancelled', 'danger'].includes(v)) kind = 'danger'
  else if (['mixed', 'info', 'draft'].includes(v)) kind = 'info'
  return <Badge kind={kind}>{value}</Badge>
}

// Global helper to revalidate dashboard and workspace data after any changes
export function revalidateWarehouseData() {
  mutate(
    (key) =>
      typeof key === 'string' &&
      (key.startsWith('/dashboard') ||
        key.startsWith('/training') ||
        key.startsWith('/history') ||
        key.startsWith('/products') ||
        key.startsWith('/workers') ||
        key.startsWith('/categories') ||
        key.startsWith('/database') ||
        key.startsWith('/batches') ||
        key.startsWith('/shipments')),
    undefined,
    { revalidate: true }
  )
}

// Global helper to generate and download Warehouse Dispatch CSV
export function downloadWarehouseDispatchCSV(dash: any, selectedDate: string) {
  const lines: string[] = []
  lines.push(`WAREHOUSE DISPATCH SUMMARY - ${selectedDate}`)
  lines.push(`Generated at: ${new Date().toLocaleString()}`)
  lines.push(``)
  lines.push(`METRIC,VALUE`)
  lines.push(`Unique Shipments (AWBs),${dash?.unique_labels ?? 0}`)
  lines.push(`Total Items Dispatched,${dash?.total_items ?? 0}`)
  lines.push(`Duplicate Shipments Prevented,${dash?.duplicate_labels ?? 0}`)
  lines.push(`Unmapped SKUs,${dash?.unknown_skus ?? 0}`)
  lines.push(``)
  lines.push(`WORKER ALLOCATION`)
  lines.push(`Worker,Status,Unique Labels,Items,Workload Share(%)`)
  const workersList = dash?.worker_progress || []
  workersList.forEach((w: any) => {
    lines.push(`${w.name},${w.status},${w.unique_labels},${w.items},${w.share_of_total}%`)
  })
  lines.push(``)
  lines.push(`PRODUCT CATEGORY BREAKDOWN`)
  lines.push(`Category,Dispatched Units,Volume Share(%),Active AWBs,Unique SKUs`)
  const categoryList = dash?.category_breakdown || []
  categoryList.forEach((cat: any) => {
    lines.push(`"${cat.name}",${cat.quantity},${cat.percentage_of_total}%,${cat.unique_labels},${cat.unique_products}`)
  })
  lines.push(``)
  lines.push(`PACKCALC RAW MATERIALS (BAG ROLLS)`)
  lines.push(`Brand,3-Bag Rolls,2-Bag Rolls`)
  lines.push(`Averx,${dash?.raw_material_requirements?.Averx?.['3-Bag'] ?? 0},${dash?.raw_material_requirements?.Averx?.['2-Bag'] ?? 0}`)
  lines.push(`Star,${dash?.raw_material_requirements?.Star?.['3-Bag'] ?? 0},${dash?.raw_material_requirements?.Star?.['2-Bag'] ?? 0}`)
  lines.push(`Plain,${dash?.raw_material_requirements?.Plain?.['3-Bag'] ?? 0},${dash?.raw_material_requirements?.Plain?.['2-Bag'] ?? 0}`)
  lines.push(``)
  lines.push(`PRODUCT STOCK OUT LIST`)
  lines.push(`Product Name,Category,Worker,Quantity`)
  ;(dash?.product_stock_out || []).forEach((p: any) => {
    lines.push(`"${p.name}","${p.category}","${p.worker}",${p.quantity}`)
  })

  const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(lines.join('\n'))
  const link = document.createElement('a')
  link.setAttribute('href', csvContent)
  link.setAttribute('download', `warehouse_dispatch_summary_${selectedDate}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export default function LabelManager() {
  const [page, setPage] = useState('dashboard')
  const [dark, setDark] = useState(true)
  const [mobile, setMobile] = useState(false)
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0])
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showHelpModal, setShowHelpModal] = useState(false)
  const [showShortcutsModal, setShowShortcutsModal] = useState(false)

  // Global Workspace Active Batch & Pipeline State
  const [activeBatch, setActiveBatch] = useState<ProcessBatchResponse | null>(null)
  const [isProcessingBatch, setIsProcessingBatch] = useState(false)
  const [batchProcessingStep, setBatchProcessingStep] = useState(0)
  const [progressBarCollapsed, setProgressBarCollapsed] = useState(false)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 4000)
  }

  const go = (id: string) => {
    setPage(id)
    setMobile(false)
    setShowNotifications(false)
  }

  // Live unknown count for nav badge (2m refresh cycle)
  const { data: trainStats } = useSWR('/training/stats', getTrainingStats, { refreshInterval: 120000 })
  // Live shift dashboard data for global progress bar metrics (2m refresh cycle)
  const { data: dashData } = useSWR(`/dashboard?date=${selectedDate}`, () => getDashboard(selectedDate), { refreshInterval: 120000 })

  // Global Actions
  const handleProcessLabelGlobal = () => {
    if (page !== 'process') {
      setPage('process')
      showToast('Switched to Process Labels [P]')
    }
    setTimeout(() => {
      const input = document.getElementById('label-pdf-input') as HTMLInputElement
      if (input) {
        input.click()
      }
    }, 150)
  }

  const handleExportReportGlobal = async () => {
    try {
      showToast(`Generating report for ${selectedDate}...`)
      const dash = await getDashboard(selectedDate)
      downloadWarehouseDispatchCSV(dash, selectedDate)
      showToast(`Exported CSV report [E] for ${selectedDate}`)
    } catch (err: any) {
      showToast(`Export failed: ${err.message}`)
    }
  }

  const handleClearAllGlobal = () => {
    setActiveBatch(null)
    setIsProcessingBatch(false)
    window.dispatchEvent(new CustomEvent('warehouse:clear-all'))
    showToast('Cleared active batch & filters [C]')
  }

  const handleConfirmBatchGlobal = async (batchId: number) => {
    try {
      await confirmBatch(batchId)
      if (activeBatch && activeBatch.batch_id === batchId) {
        setActiveBatch({ ...activeBatch, status: 'confirmed' })
      }
      showToast(`Batch #${batchId} successfully confirmed into warehouse accounting!`)
      revalidateWarehouseData()
    } catch (err: any) {
      showToast(`Confirm failed: ${err.message}`)
    }
  }

  // Global Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const isInput = target && (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      )

      // Allow Escape to dismiss modals/inputs
      if (e.key === 'Escape') {
        if (showShortcutsModal) {
          setShowShortcutsModal(false)
          return
        }
        if (showHelpModal) {
          setShowHelpModal(false)
          return
        }
        if (showNotifications) {
          setShowNotifications(false)
          return
        }
        if (isInput) {
          target.blur()
          return
        }
        handleClearAllGlobal()
        return
      }

      // If user is actively typing in an input field, do not trigger single character shortcuts
      if (isInput && !e.altKey && !e.ctrlKey && !e.metaKey) {
        return
      }

      const key = e.key.toLowerCase()

      // ? or Shift+/ -> Open Shortcuts Modal
      if (e.key === '?' || (e.shiftKey && e.key === '/') || (key === 'h' && !isInput)) {
        e.preventDefault()
        setShowShortcutsModal((prev) => !prev)
        return
      }

      // 'P' or Alt+P -> Process Label
      if ((key === 'p' && !isInput) || (e.altKey && key === 'p') || (e.ctrlKey && e.shiftKey && key === 'p')) {
        e.preventDefault()
        handleProcessLabelGlobal()
        return
      }

      // 'E' or Alt+E -> Export Report
      if ((key === 'e' && !isInput) || (e.altKey && key === 'e') || (e.ctrlKey && e.shiftKey && key === 'e')) {
        e.preventDefault()
        handleExportReportGlobal()
        return
      }

      // 'C' or Alt+C -> Clear All
      if ((key === 'c' && !isInput) || (e.altKey && key === 'c')) {
        e.preventDefault()
        handleClearAllGlobal()
        return
      }

      // 'D' or Alt+D -> Toggle Dark Mode
      if ((key === 'd' && !isInput) || (e.altKey && key === 'd')) {
        e.preventDefault()
        setDark((prev) => !prev)
        showToast(`Switched to ${!dark ? 'Dark' : 'Light'} theme [D]`)
        return
      }

      // 'R' or Alt+R -> Refresh Metrics
      if ((key === 'r' && !isInput) || (e.altKey && key === 'r')) {
        e.preventDefault()
        revalidateWarehouseData()
        showToast('Refreshed warehouse metrics [R]')
        return
      }

      // 1-8 -> Navigate between tabs
      if (!isInput && !e.ctrlKey && !e.metaKey) {
        if (e.key === '1') { e.preventDefault(); go('dashboard'); showToast('Dashboard [1]'); }
        else if (e.key === '2') { e.preventDefault(); go('kartik'); showToast("Kartik Da's Station [2]"); }
        else if (e.key === '3') { e.preventDefault(); go('my-station'); showToast('My Station (Sohel) [3]'); }
        else if (e.key === '4') { e.preventDefault(); go('process'); showToast('Process Labels [4]'); }
        else if (e.key === '5') { e.preventDefault(); go('products'); showToast('Products & Recipes [5]'); }
        else if (e.key === '6') { e.preventDefault(); go('training'); showToast('Training Center [6]'); }
        else if (e.key === '7') { e.preventDefault(); go('history'); showToast('History & Logs [7]'); }
        else if (e.key === '8') { e.preventDefault(); go('settings'); showToast('Settings [8]'); }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [page, selectedDate, dark, showShortcutsModal, showHelpModal, showNotifications])

  return (
    <div className={dark ? 'app dark' : 'app'}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white px-4 py-3 rounded-lg shadow-xl border border-slate-700 flex items-center gap-3 text-xs animate-in fade-in slide-in-from-top-3 duration-200">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 text-slate-400 hover:text-white">
            <X size={14} />
          </button>
        </div>
      )}

      <aside className={mobile ? 'sidebar mobile-open' : 'sidebar'}>
        <div className="brand">
          <div className="brand-mark"><Box size={19} /></div>
          <div>
            <strong>Flipkart Label Manager</strong>
            <span>Warehouse & Stock-Out</span>
          </div>
          <button className="icon-button mobile-close" onClick={() => setMobile(false)}>
            <X size={17} />
          </button>
        </div>

        <div className="workspace">
          <span className="workspace-dot" />
          <span>Kolkata Warehouse Unit 6</span>
          <ChevronDown size={14} />
        </div>

        <nav>
          {nav.map((item, index) => {
            const Icon = item.icon
            const isTraining = item.id === 'training'
            const count = trainStats?.unknown_skus || 0
            return (
              <button
                key={item.id}
                id={`nav-btn-${item.id}`}
                className={page === item.id ? 'nav-item active' : 'nav-item'}
                onClick={() => go(item.id)}
              >
                <Icon size={18} />
                <span>{item.label}</span>
                <span className="ml-auto flex items-center gap-1">
                  {isTraining && count > 0 && <span className="nav-count">{count}</span>}
                  <kbd className="opacity-60 text-[9px] py-0 px-1">{index + 1}</kbd>
                </span>
              </button>
            )
          })}
        </nav>

        <div className="sidebar-bottom">
          <div
            className="help cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            onClick={() => setShowShortcutsModal(true)}
            title="View keyboard shortcuts cheat sheet (?)"
          >
            <Keyboard size={17} className="text-blue-500" />
            <div>
              <strong className="flex items-center gap-1.5">
                Keyboard Shortcuts <kbd className="text-[9px]">?</kbd>
              </strong>
              <span>Fast warehouse hotkeys</span>
            </div>
          </div>

          <div
            className="help cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            onClick={() => setShowHelpModal(true)}
            title="Click to view Flipkart pipeline info"
          >
            <HelpCircle size={17} />
            <div>
              <strong>Flipkart V1 Pipeline</strong>
              <span>Auto-crop & duplicate protection</span>
            </div>
          </div>

          <button className="theme-toggle" id="theme-toggle-btn" onClick={() => setDark(!dark)}>
            {dark ? <Sun size={17} /> : <Moon size={17} />} {dark ? 'Light mode' : 'Dark mode'}
            <kbd className="ml-auto opacity-70 text-[9px]">D</kbd>
          </button>

          <div className="user-row">
            <div className="avatar">SO</div>
            <div>
              <strong>Sohel / Kartik Da</strong>
              <span>Printing Department</span>
            </div>
          </div>
        </div>
      </aside>

      {mobile && <div className="scrim" onClick={() => setMobile(false)} />}

      <main className="main">
        <header className="topbar relative">
          <button className="icon-button menu-button" onClick={() => setMobile(true)}>
            <Menu size={20} />
          </button>

          <div className="crumb">
            <span>Operations</span>
            <span>/</span>
            <strong>{nav.find((n) => n.id === page)?.label}</strong>
          </div>

          {/* Quick Action Shortcuts Bar */}
          <div className="hidden md:flex items-center gap-1.5 ml-3">
            <button
              onClick={handleProcessLabelGlobal}
              className="px-2.5 py-1 text-xs font-semibold rounded-md border border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 transition-all flex items-center gap-1.5 shadow-xs"
              title="Process Label (Hotkey: P or Alt+P)"
            >
              <CloudUpload size={13} />
              <span>Process Label</span>
              <kbd className="bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-400/40 text-[9px] px-1 py-0">P</kbd>
            </button>

            <button
              onClick={handleClearAllGlobal}
              className="px-2.5 py-1 text-xs font-semibold rounded-md border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center gap-1.5 shadow-xs"
              title="Clear All Batch / Filters (Hotkey: C or Alt+C)"
            >
              <Trash2 size={13} />
              <span>Clear All</span>
              <kbd className="text-[9px] px-1 py-0">C</kbd>
            </button>

            <button
              onClick={handleExportReportGlobal}
              className="px-2.5 py-1 text-xs font-semibold rounded-md border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 transition-all flex items-center gap-1.5 shadow-xs"
              title="Export Dispatch Summary CSV (Hotkey: E or Alt+E)"
            >
              <Download size={13} />
              <span>Export Report</span>
              <kbd className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-400/40 text-[9px] px-1 py-0">E</kbd>
            </button>
          </div>

          <div className="top-actions relative">
            <button
              className="icon-button flex items-center justify-center text-xs font-mono"
              title="Keyboard Shortcuts Cheat Sheet (?)"
              id="topbar-shortcuts-btn"
              onClick={() => setShowShortcutsModal(true)}
            >
              <Keyboard size={18} />
            </button>

            <button
              className={`icon-button ${showNotifications ? 'bg-slate-200 dark:bg-slate-700' : ''}`}
              title="Live operations updates"
              id="topbar-bell-btn"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell size={18} />
              {(trainStats?.unknown_skus ?? 0) > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full" />
              )}
            </button>

            {/* Notification Drawer Popover */}
            {showNotifications && (
              <div className="absolute right-0 top-12 z-50 w-80 bg-card border border-border rounded-xl shadow-2xl p-4 text-xs animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex justify-between items-center pb-2 mb-2 border-b border-border">
                  <strong className="font-bold text-foreground flex items-center gap-1.5">
                    <Bell size={14} className="text-blue-500" /> Operational Alerts
                  </strong>
                  <button
                    className="text-muted hover:text-foreground"
                    onClick={() => setShowNotifications(false)}
                  >
                    <X size={14} />
                  </button>
                </div>
                <div className="space-y-2.5">
                  <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300">
                    <strong className="block font-semibold">Pipeline Active & Connected</strong>
                    <span className="text-[11px]">Real-time label cropping and worker routing operational.</span>
                  </div>
                  {(trainStats?.unknown_skus ?? 0) > 0 ? (
                    <div
                      className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 cursor-pointer hover:opacity-90"
                      onClick={() => go('training')}
                    >
                      <strong className="block font-semibold">SKUs Require Mapping ({trainStats?.unknown_skus})</strong>
                      <span className="text-[11px]">Click to map newly detected SKUs in Training Center.</span>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-blue-800 dark:text-blue-300">
                      <strong className="block font-semibold">All SKUs Recognized</strong>
                      <span className="text-[11px]">100% SKU database accuracy for active shipments.</span>
                    </div>
                  )}
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-border text-foreground">
                    <strong className="block font-semibold">Duplicate Defense Shield</strong>
                    <span className="text-[11px] text-muted">Protects against multi-print inventory double counts.</span>
                  </div>
                </div>
              </div>
            )}

            <div className="top-date">
              <span className="live-dot" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent border-0 text-xs font-semibold text-inherit cursor-pointer outline-none"
                id="topbar-date-picker"
              />
            </div>
          </div>
        </header>

        {/* Help / Pipeline Info Modal */}
        {showHelpModal && (
          <Modal title="Flipkart Label Manager Pipeline" close={() => setShowHelpModal(false)}>
            <div className="space-y-3 text-xs">
              <p>
                Flipkart Label Manager streamlines daily warehouse dispatch operations for Flipkart seller accounts:
              </p>
              <div className="space-y-2">
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-border">
                  <strong>1. Precision Auto-Crop</strong>
                  <p className="text-muted text-[11px]">Isolates shipping label and barcode dimensions for clean thermal and standard laser printing.</p>
                </div>
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-border">
                  <strong>2. Worker Workload Allocation</strong>
                  <p className="text-muted text-[11px]">Automatically routes items to Sohel, Kartik Da, or Mixed line based on product rules.</p>
                </div>
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-border">
                  <strong>3. PackCalc Raw Material Roll Engine</strong>
                  <p className="text-muted text-[11px]">Calculates 3-Bag and 2-Bag raw garbage bag roll requirements without duplicate bias.</p>
                </div>
              </div>
              <div className="modal-actions">
                <button className="button primary" onClick={() => setShowHelpModal(false)}>
                  Got it
                </button>
              </div>
            </div>
          </Modal>
        )}

        {/* Global Keyboard Shortcuts Cheat Sheet Modal */}
        {showShortcutsModal && (
          <KeyboardShortcutsModal
            close={() => setShowShortcutsModal(false)}
            go={go}
            onProcess={() => {
              setShowShortcutsModal(false)
              handleProcessLabelGlobal()
            }}
            onExport={() => {
              setShowShortcutsModal(false)
              handleExportReportGlobal()
            }}
            onClearAll={() => {
              setShowShortcutsModal(false)
              handleClearAllGlobal()
            }}
            onToggleTheme={() => {
              setDark(!dark)
              showToast(`Theme switched to ${!dark ? 'Dark' : 'Light'} mode`)
            }}
          />
        )}

        {/* Global Top Workspace Progress Bar (Labels Processed vs Batch Total) */}
        <GlobalWorkspaceProgressBar
          activeBatch={activeBatch}
          isProcessing={isProcessingBatch}
          processingStep={batchProcessingStep}
          dashData={dashData}
          selectedDate={selectedDate}
          go={go}
          showToast={showToast}
          onClearBatch={handleClearAllGlobal}
          onProcessNew={handleProcessLabelGlobal}
          onConfirmBatch={handleConfirmBatchGlobal}
          collapsed={progressBarCollapsed}
          setCollapsed={setProgressBarCollapsed}
        />

        <div className="content">
          {page === 'dashboard' && (
            <Dashboard
              go={go}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              showToast={showToast}
            />
          )}

          {page === 'kartik' && (
            <KartikStationView
              go={go}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              showToast={showToast}
            />
          )}

          {page === 'my-station' && (
            <MyStationView
              go={go}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              showToast={showToast}
            />
          )}

          {page === 'process' && (
            <ProcessLabelsView
              go={go}
              showToast={showToast}
              batchData={activeBatch}
              setBatchData={setActiveBatch}
              processing={isProcessingBatch}
              setProcessing={setIsProcessingBatch}
              currentStep={batchProcessingStep}
              setCurrentStep={setBatchProcessingStep}
            />
          )}

          {page === 'products' && (
            <ProductsView
              showToast={showToast}
            />
          )}

          {page === 'training' && (
            <TrainingCenterView
              showToast={showToast}
            />
          )}

          {page === 'history' && (
            <HistoryView
              showToast={showToast}
            />
          )}

          {page === 'settings' && (
            <SettingsView
              showToast={showToast}
            />
          )}
        </div>
      </main>
    </div>
  )
}

// ----------------------------------------------------------------------
// 1. DASHBOARD VIEW
// ----------------------------------------------------------------------
function Dashboard({ go, selectedDate, setSelectedDate, showToast }: any) {
  const [autoRefresh, setAutoRefresh] = useState(true)
  const { data: dash, mutate: refreshDash, isLoading } = useSWR(
    `/dashboard?date=${selectedDate}`,
    () => getDashboard(selectedDate),
    { refreshInterval: autoRefresh ? 120000 : 0 }
  )

  const [productFilter, setProductFilter] = useState('')
  const [selectedWorkerModal, setSelectedWorkerModal] = useState<any>(null)
  const [selectedCategoryModal, setSelectedCategoryModal] = useState<any>(null)
  const [duplicateAuditModal, setDuplicateAuditModal] = useState(false)
  const [picklistModal, setPicklistModal] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const dateObj = new Date(selectedDate + 'T00:00:00')
  const dateFormatted = dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  // Date navigation helpers
  const handleDateOffset = (offsetDays: number) => {
    const current = new Date(selectedDate + 'T00:00:00')
    current.setDate(current.getDate() + offsetDays)
    const yyyy = current.getFullYear()
    const mm = String(current.getMonth() + 1).padStart(2, '0')
    const dd = String(current.getDate()).padStart(2, '0')
    setSelectedDate(`${yyyy}-${mm}-${dd}`)
  }

  const setDateToToday = () => {
    setSelectedDate('2026-08-22')
  }

  const setDateToYesterday = () => {
    setSelectedDate('2026-08-21')
  }

  // Refresh handler
  const handleManualRefresh = async () => {
    setIsRefreshing(true)
    await refreshDash()
    setTimeout(() => {
      setIsRefreshing(false)
      showToast('Dashboard metrics refreshed with live warehouse data')
    }, 300)
  }

  const workersList = dash?.worker_progress && dash.worker_progress.length > 0
    ? dash.worker_progress
    : [
        {
          id: 1,
          name: 'Sohel',
          active: true,
          status: 'On shift',
          unique_labels: dash?.worker_totals?.Sohel?.unique_labels ?? 0,
          items: dash?.worker_totals?.Sohel?.items ?? 0,
          target_quota: 50,
          progress_percent: Math.min(100, Math.round(((dash?.worker_totals?.Sohel?.items ?? 0) / 50) * 100)),
          label_progress_percent: Math.min(100, Math.round(((dash?.worker_totals?.Sohel?.unique_labels ?? 0) / 30) * 100)),
          share_of_total: dash?.total_items ? Number((((dash?.worker_totals?.Sohel?.items ?? 0) / dash.total_items) * 100).toFixed(1)) : 0,
          items_per_label: dash?.worker_totals?.Sohel?.unique_labels ? Number(((dash.worker_totals.Sohel.items / dash.worker_totals.Sohel.unique_labels)).toFixed(2)) : 0,
          top_products: [],
        },
        {
          id: 2,
          name: 'Kartik Da',
          active: true,
          status: 'On shift',
          unique_labels: dash?.worker_totals?.['Kartik Da']?.unique_labels ?? 0,
          items: dash?.worker_totals?.['Kartik Da']?.items ?? 0,
          target_quota: 50,
          progress_percent: Math.min(100, Math.round(((dash?.worker_totals?.['Kartik Da']?.items ?? 0) / 50) * 100)),
          label_progress_percent: Math.min(100, Math.round(((dash?.worker_totals?.['Kartik Da']?.unique_labels ?? 0) / 30) * 100)),
          share_of_total: dash?.total_items ? Number((((dash?.worker_totals?.['Kartik Da']?.items ?? 0) / dash.total_items) * 100).toFixed(1)) : 0,
          items_per_label: dash?.worker_totals?.['Kartik Da']?.unique_labels ? Number(((dash.worker_totals['Kartik Da'].items / dash.worker_totals['Kartik Da'].unique_labels)).toFixed(2)) : 0,
          top_products: [],
        },
      ]

  const categoryList = dash?.category_progress ?? []

  const shiftOverview = dash?.shift_overview ?? {
    target_labels: 50,
    target_items: 80,
    label_progress_percent: Math.min(100, Math.round(((dash?.unique_labels ?? 0) / 50) * 100)),
    item_progress_percent: Math.min(100, Math.round(((dash?.total_items ?? 0) / 80) * 100)),
    mapping_accuracy_rate: dash?.total_items ? Number(((((dash.total_items - (dash.unknown_skus ?? 0)) / dash.total_items) * 100)).toFixed(1)) : 100,
    clean_shipment_rate: ((dash?.unique_labels ?? 0) + (dash?.duplicate_labels ?? 0)) > 0
      ? Number((((dash?.unique_labels ?? 0) / ((dash?.unique_labels ?? 0) + (dash?.duplicate_labels ?? 0))) * 100).toFixed(1))
      : 100,
  }

  // Filtered product stock out items
  const filteredProducts = (dash?.product_stock_out || []).filter((p: any) => {
    if (!productFilter) return true
    const term = productFilter.toLowerCase()
    return (
      p.name.toLowerCase().includes(term) ||
      p.category.toLowerCase().includes(term) ||
      p.worker.toLowerCase().includes(term)
    )
  })

  // Export CSV summary function
  const handleExportCSV = () => {
    const lines: string[] = []
    lines.push(`WAREHOUSE DISPATCH SUMMARY - ${selectedDate}`)
    lines.push(`Generated at: ${new Date().toLocaleString()}`)
    lines.push(``)
    lines.push(`METRIC,VALUE`)
    lines.push(`Unique Shipments (AWBs),${dash?.unique_labels ?? 0}`)
    lines.push(`Total Items Dispatched,${dash?.total_items ?? 0}`)
    lines.push(`Duplicate Shipments Prevented,${dash?.duplicate_labels ?? 0}`)
    lines.push(`Unmapped SKUs,${dash?.unknown_skus ?? 0}`)
    lines.push(``)
    lines.push(`PRODUCT CATEGORY BREAKDOWN`)
    lines.push(`Category,Dispatched Units,Volume Share(%),Active AWBs,Unique SKUs`)
    categoryList.forEach((cat: any) => {
      lines.push(`"${cat.name}",${cat.quantity},${cat.percentage_of_total}%,${cat.unique_labels},${cat.unique_products}`)
    })
    lines.push(``)
    lines.push(`PRODUCT STOCK OUT LIST`)
    lines.push(`Product Name,Category,Worker,Quantity`)
    ;(dash?.product_stock_out || []).forEach((p: any) => {
      lines.push(`"${p.name}","${p.category}","${p.worker}",${p.quantity}`)
    })

    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(lines.join('\n'))
    const link = document.createElement('a')
    link.setAttribute('href', csvContent)
    link.setAttribute('download', `warehouse_dispatch_summary_${selectedDate}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    showToast(`Exported CSV report for ${selectedDate}`)
  }

  if (isLoading && !dash) {
    return <ViewSkeleton eyebrow={`Processing Date: ${selectedDate}`} title="Loading Warehouse Dashboard..." statCount={4} />
  }

  return (
    <>
      <PageHead
        eyebrow={`Processing Date: ${selectedDate}`}
        title={`Warehouse Dashboard`}
        description={`Dispatched product volume, category breakdown, SKU stock-out, and recent batches for ${dateFormatted}.`}
        action={
          <div className="flex gap-2 flex-wrap items-center">
            <button
              className={`button secondary ${autoRefresh ? 'border-emerald-500/50 text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20' : 'text-muted'}`}
              id="dash-auto-refresh-toggle-btn"
              onClick={() => {
                const nextState = !autoRefresh
                setAutoRefresh(nextState)
                showToast(`Auto-refresh (2m) ${nextState ? 'enabled' : 'disabled'}`)
              }}
              title={autoRefresh ? 'Auto-refresh active (updates every 2 mins). Click to pause.' : 'Auto-refresh paused. Click to enable 2m interval.'}
            >
              <span className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
              Auto-refresh: {autoRefresh ? '2m On' : 'Off'}
            </button>
            <button
              className="button secondary"
              id="dash-export-csv-btn"
              onClick={handleExportCSV}
              title="Download full shift dispatch report in CSV format"
            >
              <Download size={15} /> Export CSV
            </button>
            <button
              className="button secondary"
              id="dash-print-picklist-btn"
              onClick={() => setPicklistModal(true)}
              title="Open printable warehouse picklist view"
            >
              <Printer size={15} /> Print Picklist
            </button>
            <button
              className="button secondary"
              id="refresh-dash-btn"
              onClick={handleManualRefresh}
              disabled={isRefreshing || isLoading}
            >
              <RefreshCw size={15} className={isRefreshing ? 'animate-spin' : ''} /> {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <button className="button primary" id="dash-new-batch-btn" onClick={() => go('process')}>
              <CloudUpload size={16} /> Process new batch
            </button>
          </div>
        }
      />

      {/* Date Navigation & Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-700/60">
        <div className="flex items-center gap-2">
          <CalendarDays size={16} className="text-blue-500 shrink-0" />
          <span className="text-xs font-semibold text-muted">Active Date:</span>
          <span className="text-xs font-bold text-foreground">{dateFormatted}</span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${
              selectedDate === '2026-08-22'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-card border border-border text-muted hover:text-foreground'
            }`}
            onClick={setDateToToday}
            id="quick-date-today-btn"
          >
            Today (Aug 22)
          </button>
          <button
            className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${
              selectedDate === '2026-08-21'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-card border border-border text-muted hover:text-foreground'
            }`}
            onClick={setDateToYesterday}
            id="quick-date-yesterday-btn"
          >
            Yesterday (Aug 21)
          </button>
          <div className="flex items-center border border-border rounded-md bg-card overflow-hidden">
            <button
              className="px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-muted hover:text-foreground"
              onClick={() => handleDateOffset(-1)}
              title="Previous Day"
              id="prev-date-btn"
            >
              &lt;
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent border-0 text-xs px-2 py-1 text-foreground outline-none font-medium cursor-pointer"
              id="dashboard-inline-date-picker"
            />
            <button
              className="px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-muted hover:text-foreground"
              onClick={() => handleDateOffset(1)}
              title="Next Day"
              id="next-date-btn"
            >
              &gt;
            </button>
          </div>
        </div>
      </div>

      {/* Real-Time API & NEXT_PUBLIC_API_URL Diagnostics */}
      <ApiDiagnostics />

      {/* Top Level Metric Stats Grid */}
      <div className="stats-grid" id="main-stats-grid">
        <div className="cursor-pointer" onClick={() => go('history')} title="Click to view all batches in history">
          <Stat
            label="Unique labels"
            value={dash?.unique_labels ?? 0}
            note={
              dash?.increments?.unique_labels
                ? `${dash.increments.unique_labels.percent >= 0 ? '+' : ''}${dash.increments.unique_labels.percent}% from yesterday (${dash.increments.unique_labels.previous} prev)`
                : 'Confirmed shipments'
            }
            icon={FileCheck2}
          />
        </div>
        <div className="cursor-pointer" onClick={() => setPicklistModal(true)} title="Click to view shift picklist">
          <Stat
            label="Total items"
            value={dash?.total_items ?? 0}
            note={
              dash?.increments?.total_items
                ? `${dash.increments.total_items.percent >= 0 ? '+' : ''}${dash.increments.total_items.percent}% vs yesterday (${dash.increments.total_items.previous} prev)`
                : `Across ${dash?.unique_labels ?? 0} unique shipments`
            }
            icon={Package}
            tone="teal"
          />
        </div>
        <div className="cursor-pointer" onClick={() => setDuplicateAuditModal(true)} title="Click to view duplicate protection audit">
          <Stat
            label="Duplicate labels"
            value={dash?.duplicate_labels ?? 0}
            note={
              dash?.duplicate_labels
                ? `${dash.duplicate_labels} duplicates filtered out (click to view)`
                : 'Zero duplicate wastage'
            }
            icon={ShieldAlert}
            tone="amber"
          />
        </div>
        <div
          className="cursor-pointer"
          onClick={() => {
            if ((dash?.unknown_skus ?? 0) > 0) {
              go('training')
            } else {
              showToast('All SKUs mapped and recognized with 100% accuracy!')
            }
          }}
          title="Click to train unmapped SKUs"
        >
          <Stat
            label="Unknown SKUs"
            value={dash?.unknown_skus ?? 0}
            note={dash?.unknown_skus ? 'Requires mapping training (Click)' : '100% SKUs recognized'}
            icon={Tags}
            tone={dash?.unknown_skus ? 'rose' : 'teal'}
          />
        </div>
      </div>

      {/* Station Split Cards (Kartik Da vs My Station) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6" id="dashboard-stations-split">
        {/* Kartik Da Station Card */}
        <div
          className="p-4 rounded-xl border border-teal-500/30 bg-teal-50/40 dark:bg-teal-950/20 hover:border-teal-500/60 transition-all cursor-pointer shadow-sm relative overflow-hidden group"
          id="dash-card-kartik-station"
          onClick={() => go('kartik')}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
                <Layers size={18} />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-teal-600 dark:text-teal-400">Station 2 • Dedicated</span>
                <h3 className="text-base font-bold text-foreground">Kartik Da's Station</h3>
              </div>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-700 dark:text-teal-300 font-semibold border border-teal-500/20">
              Shortcut [2]
            </span>
          </div>

          <p className="text-xs text-muted mb-3 line-clamp-1">
            4 Types of Products: Garbage Bags (17x19, 19x21), Butter Paper & Aluminium Container
          </p>

          <div className="grid grid-cols-2 gap-2 mb-3 bg-card/60 rounded-lg p-2.5 border border-border/50 text-xs">
            <div>
              <span className="text-[10px] text-muted block">Kartik's Labels</span>
              <strong className="text-sm font-bold text-foreground">
                {dash?.kartik_station?.total_labels ?? (dash?.worker_totals?.['Kartik Da']?.unique_labels ?? 0)} labels
              </strong>
            </div>
            <div>
              <span className="text-[10px] text-muted block">Station Items</span>
              <strong className="text-sm font-bold text-teal-600 dark:text-teal-400">
                {dash?.kartik_station?.total_items ?? (dash?.worker_totals?.['Kartik Da']?.items ?? 0)} items
              </strong>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs font-semibold text-teal-700 dark:text-teal-300 group-hover:translate-x-0.5 transition-transform">
            <span>View Dedicated Station & PackCalc</span>
            <ChevronRight size={15} />
          </div>
        </div>

        {/* My Station (Sohel) Card */}
        <div
          className="p-4 rounded-xl border border-blue-500/30 bg-blue-50/40 dark:bg-blue-950/20 hover:border-blue-500/60 transition-all cursor-pointer shadow-sm relative overflow-hidden group"
          id="dash-card-my-station"
          onClick={() => go('my-station')}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                <Box size={18} />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-blue-600 dark:text-blue-400">Station 1 • Main Line</span>
                <h3 className="text-base font-bold text-foreground">My Station (Sohel)</h3>
              </div>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-300 font-semibold border border-blue-500/20">
              Shortcut [3]
            </span>
          </div>

          <p className="text-xs text-muted mb-3 line-clamp-1">
            General Catalogue: R1, R1S, R16S, SE-3B, AX6, AX-10B, Mics, Wallets, Cases & Tripods
          </p>

          <div className="grid grid-cols-2 gap-2 mb-3 bg-card/60 rounded-lg p-2.5 border border-border/50 text-xs">
            <div>
              <span className="text-[10px] text-muted block">My Labels Total</span>
              <strong className="text-sm font-bold text-foreground">
                {dash?.my_station?.total_labels ?? (dash?.worker_totals?.Sohel?.unique_labels ?? 0)} labels
              </strong>
            </div>
            <div>
              <span className="text-[10px] text-muted block">Order Breakdown Types</span>
              <strong className="text-sm font-bold text-blue-600 dark:text-blue-400">
                {dash?.my_station?.orders?.length || (dash?.my_station as any)?.order_counts?.length || 11} SKU Lines
              </strong>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs font-semibold text-blue-700 dark:text-blue-300 group-hover:translate-x-0.5 transition-transform">
            <span>View Total Number of Each Order</span>
            <ChevronRight size={15} />
          </div>
        </div>
      </div>

      {/* Daily Progress by Product Category */}
      <section className="panel mb-6" id="product-category-progress-panel">
        <div className="section-head">
          <div>
            <h2>Daily Progress by Product Category</h2>
            <p>Dispatched volume, percentage share, and day-over-day category velocity</p>
          </div>
          <div className="flex gap-2 items-center">
            <Badge kind="neutral">{categoryList.length} Categories Active</Badge>
          </div>
        </div>

        <TableWrap>
          <thead>
            <tr>
              <th>Category</th>
              <th>Dispatched Units</th>
              <th>Volume Share</th>
              <th>Active Labels</th>
              <th>Unique Products</th>
              <th>Day Growth</th>
              <th className="text-right">Assigned Pickers</th>
            </tr>
          </thead>
          <tbody>
            {categoryList && categoryList.length > 0 ? (
              categoryList.map((cat: any) => {
                const isPositive = (cat.growth_percent ?? 0) >= 0
                return (
                  <tr
                    key={cat.id || cat.name}
                    id={`category-row-${cat.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                    className="hover:bg-blue-50/50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors"
                    onClick={() => setSelectedCategoryModal(cat)}
                    title="Click to view category details & products"
                  >
                    <td>
                      <div className="flex items-center gap-2">
                        <FolderTree size={14} className="text-blue-500 shrink-0" />
                        <strong>{cat.name}</strong>
                      </div>
                    </td>
                    <td>
                      <strong className="text-sm">{cat.quantity}</strong>
                      <span className="text-xs text-muted ml-1">units</span>
                    </td>
                    <td>
                      <div className="w-32">
                        <div className="flex justify-between text-[10px] text-muted mb-1">
                          <span>{cat.percentage_of_total}%</span>
                        </div>
                        <div className="progress-track !mt-0 !h-1.5">
                          <div
                            className="progress-fill blue"
                            style={{ width: `${Math.min(100, cat.percentage_of_total)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td>{cat.unique_labels} AWBs</td>
                    <td>{cat.unique_products} SKUs</td>
                    <td>
                      <span className={`delta-tag ${cat.growth_percent === 0 ? 'neutral' : isPositive ? 'up' : 'down'}`}>
                        {isPositive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                        {isPositive && cat.growth_percent > 0 ? '+' : ''}{cat.growth_percent}%
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="flex justify-end gap-1 flex-wrap">
                        {cat.workers && Object.keys(cat.workers).length > 0 ? (
                          Object.entries(cat.workers).map(([wName, qty]: any) => (
                            <span key={wName} className="cat-badge">
                              {wName}: <b>{qty}</b>
                            </span>
                          ))
                        ) : (
                          <span className="text-muted text-xs">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan={7} className="text-center py-6 text-muted">
                  No category records available for this date.
                </td>
              </tr>
            )}
          </tbody>
        </TableWrap>
      </section>

      {/* Product Stock Out Panel */}
      <section className="panel mb-6" id="product-stock-out-panel">
        <div className="section-head">
          <div>
            <h2>Product stock out</h2>
            <p>Canonical warehouse products aggregated by SKU & worker assignment</p>
          </div>
          <Badge kind="neutral">{filteredProducts.length} items</Badge>
        </div>

        {/* Product stock-out search bar */}
        <div className="mb-3">
          <div className="search !w-full">
            <Search size={14} />
            <input
              type="text"
              placeholder="Filter stock-out items by name, category, or worker..."
              value={productFilter}
              onChange={(e) => setProductFilter(e.target.value)}
              id="product-stockout-search-input"
            />
            {productFilter && (
              <button onClick={() => setProductFilter('')} className="text-muted hover:text-foreground">
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        <TableWrap>
          <thead>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th>Worker</th>
              <th className="text-right">Qty</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts && filteredProducts.length > 0 ? (
              filteredProducts.map((p: any) => (
                <tr key={p.name}>
                  <td>
                    <strong>{p.name}</strong>
                  </td>
                  <td>
                    <span className="text-muted text-xs">{p.category}</span>
                  </td>
                  <td>
                    <span className="worker-name">
                      <i className={`dot ${p.worker === 'Sohel' ? 'blue' : p.worker === 'Kartik Da' ? 'teal' : 'gray'}`} />
                      {p.worker}
                    </span>
                  </td>
                  <td className="text-right">
                    <strong className="text-sm font-bold">{p.quantity}</strong>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="text-center py-6 text-muted">
                  {productFilter
                    ? `No products matching "${productFilter}".`
                    : 'No confirmed stock-out records for this date yet.'}
                </td>
              </tr>
            )}
          </tbody>
        </TableWrap>
      </section>

      {/* Recent Batches Panel */}
      <section className="panel recent" id="recent-batches-panel">
        <div className="section-head">
          <div>
            <h2>Recent batches</h2>
            <p>Label upload history for this date</p>
          </div>
          <button className="text-button" onClick={() => go('history')} id="dash-view-all-history-btn">
            View all history <ArrowDownToLine size={15} />
          </button>
        </div>

        <TableWrap>
          <thead>
            <tr>
              <th>Batch ID</th>
              <th>File</th>
              <th>Pages</th>
              <th>Unique AWBs</th>
              <th>Duplicates</th>
              <th>Status</th>
              <th className="text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {dash?.recent_batches && dash.recent_batches.length > 0 ? (
              dash.recent_batches.map((b: any) => (
                <tr key={b.id}>
                  <td>
                    <strong className="mono">#{b.id}</strong>
                  </td>
                  <td>
                    <span className="file-cell">
                      <FileCheck2 size={15} />
                      {b.filename}
                    </span>
                  </td>
                  <td>{b.unique_awbs + b.duplicate_awbs}</td>
                  <td><strong>{b.unique_awbs}</strong></td>
                  <td>
                    {b.duplicate_awbs > 0 ? (
                      <span className="amber-text font-bold">{b.duplicate_awbs}</span>
                    ) : (
                      '0'
                    )}
                  </td>
                  <td>
                    <StatusBadge value={b.status} />
                  </td>
                  <td className="text-right">
                    <button
                      className="small-button"
                      onClick={() => go('history')}
                      title="Inspect batch in history view"
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="text-center py-6 text-muted">
                  No batches processed yet today. Click "Process new batch" above.
                </td>
              </tr>
            )}
          </tbody>
        </TableWrap>
      </section>

      {/* Worker Drill-down Modal */}
      {selectedWorkerModal && (
        <Modal
          title={`Worker Shift Details: ${selectedWorkerModal.name}`}
          close={() => setSelectedWorkerModal(null)}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2 text-center p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
              <div>
                <span className="text-[10px] text-muted block">Unique AWBs</span>
                <strong className="text-lg font-bold">{selectedWorkerModal.unique_labels}</strong>
              </div>
              <div>
                <span className="text-[10px] text-muted block">Items to Pick</span>
                <strong className="text-lg font-bold text-blue-600 dark:text-blue-400">{selectedWorkerModal.items}</strong>
              </div>
              <div>
                <span className="text-[10px] text-muted block">Workload Share</span>
                <strong className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{selectedWorkerModal.share_of_total || 0}%</strong>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-muted uppercase tracking-wider mb-2">Assigned Products Today</h4>
              <div className="max-h-60 overflow-y-auto border border-border rounded-lg">
                <table className="w-full text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 border-b border-border">
                    <tr>
                      <th className="p-2 text-left">Product</th>
                      <th className="p-2 text-left">Category</th>
                      <th className="p-2 text-right">Quantity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(dash?.product_stock_out || [])
                      .filter((p: any) => p.worker === selectedWorkerModal.name)
                      .map((p: any) => (
                        <tr key={p.name} className="border-b border-border last:border-0">
                          <td className="p-2 font-semibold">{p.name}</td>
                          <td className="p-2 text-muted">{p.category}</td>
                          <td className="p-2 text-right font-bold">{p.quantity}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="modal-actions">
              <button
                className="button secondary"
                onClick={() => {
                  const text = `PICKLIST FOR ${selectedWorkerModal.name.toUpperCase()} (${selectedDate}):\n` +
                    (dash?.product_stock_out || [])
                      .filter((p: any) => p.worker === selectedWorkerModal.name)
                      .map((p: any) => `• [${p.quantity}x] ${p.name} (${p.category})`)
                      .join('\n')
                  navigator.clipboard.writeText(text)
                  showToast(`Copied picklist for ${selectedWorkerModal.name}`)
                }}
              >
                <Copy size={14} /> Copy Picklist
              </button>
              <button className="button primary" onClick={() => setSelectedWorkerModal(null)}>
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Category Drill-down Modal */}
      {selectedCategoryModal && (
        <Modal
          title={`Category Details: ${selectedCategoryModal.name}`}
          close={() => setSelectedCategoryModal(null)}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2 text-center p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
              <div>
                <span className="text-[10px] text-muted block">Dispatched Units</span>
                <strong className="text-lg font-bold">{selectedCategoryModal.quantity}</strong>
              </div>
              <div>
                <span className="text-[10px] text-muted block">Volume Share</span>
                <strong className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {selectedCategoryModal.percentage_of_total}%
                </strong>
              </div>
              <div>
                <span className="text-[10px] text-muted block">Active Labels</span>
                <strong className="text-lg font-bold">{selectedCategoryModal.unique_labels} AWBs</strong>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-muted uppercase tracking-wider mb-2">Category Products Dispatched</h4>
              <div className="max-h-60 overflow-y-auto border border-border rounded-lg">
                <table className="w-full text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 border-b border-border">
                    <tr>
                      <th className="p-2 text-left">Product</th>
                      <th className="p-2 text-left">Assigned Worker</th>
                      <th className="p-2 text-right">Quantity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(dash?.product_stock_out || [])
                      .filter((p: any) => p.category === selectedCategoryModal.name)
                      .map((p: any) => (
                        <tr key={p.name} className="border-b border-border last:border-0">
                          <td className="p-2 font-semibold">{p.name}</td>
                          <td className="p-2 text-muted">{p.worker}</td>
                          <td className="p-2 text-right font-bold">{p.quantity}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="modal-actions">
              <button className="button primary" onClick={() => setSelectedCategoryModal(null)}>
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Duplicate Protection Audit Modal */}
      {duplicateAuditModal && (
        <Modal title="Duplicate Protection Audit" close={() => setDuplicateAuditModal(false)}>
          <div className="space-y-4">
            <div className="warning-box !mb-0">
              <ShieldAlert size={20} className="shrink-0" />
              <p>
                Flipkart Label Manager automatically isolates duplicate airway bills. Reprints are cropped and marked as reprints, but are excluded from stock-out subtraction and PackCalc roll calculations to prevent double-counting inventory.
              </p>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-border">
              <div className="flex justify-between text-xs py-1 border-b border-border">
                <span className="text-muted">Duplicates Prevented Today</span>
                <strong className="font-bold text-amber-600 dark:text-amber-400">{dash?.duplicate_labels ?? 0} AWBs</strong>
              </div>
              <div className="flex justify-between text-xs py-1 border-b border-border">
                <span className="text-muted">Unique Valid Shipments</span>
                <strong className="font-bold text-emerald-600 dark:text-emerald-400">{dash?.unique_labels ?? 0} AWBs</strong>
              </div>
              <div className="flex justify-between text-xs py-1">
                <span className="text-muted">Clean Shipment Accuracy</span>
                <strong className="font-bold">{shiftOverview.clean_shipment_rate}%</strong>
              </div>
            </div>

            <div className="modal-actions">
              <button
                className="button secondary"
                onClick={() => {
                  go('history')
                  setDuplicateAuditModal(false)
                }}
              >
                View History Batches
              </button>
              <button className="button primary" onClick={() => setDuplicateAuditModal(false)}>
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Full Shift Picklist Modal */}
      {picklistModal && (
        <Modal title={`Warehouse Picklist — ${selectedDate}`} close={() => setPicklistModal(false)}>
          <div className="space-y-4">
            <div className="p-3 bg-blue-50 dark:bg-slate-800/80 rounded-lg border border-blue-200 dark:border-blue-900 text-xs flex justify-between items-center">
              <div>
                <strong>Date: {dateFormatted}</strong>
                <span className="block text-muted">Total: {dash?.total_items ?? 0} items across {dash?.unique_labels ?? 0} shipments</span>
              </div>
              <button
                className="button primary !py-1 !px-3"
                onClick={() => {
                  window.print()
                }}
              >
                <Printer size={14} /> Print Document
              </button>
            </div>

            {/* Worker Breakdown Picklists */}
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {['Sohel', 'Kartik Da'].map((workerName) => {
                const itemsForWorker = (dash?.product_stock_out || []).filter((p: any) => p.worker === workerName)
                if (itemsForWorker.length === 0) return null

                return (
                  <div key={workerName} className="border border-border rounded-lg p-3 bg-card">
                    <div className="flex justify-between items-center pb-2 mb-2 border-b border-border">
                      <strong className="text-xs text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                        {workerName}'s Picklist
                      </strong>
                      <span className="text-xs font-bold">
                        {itemsForWorker.reduce((sum: number, p: any) => sum + p.quantity, 0)} units
                      </span>
                    </div>
                    <ul className="space-y-1 text-xs">
                      {itemsForWorker.map((p: any) => (
                        <li key={p.name} className="flex justify-between py-0.5">
                          <span className="font-medium">• {p.name} ({p.category})</span>
                          <strong className="font-mono">{p.quantity}</strong>
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })}

              {/* PackCalc Rolls Checklist */}
              <div className="border border-border rounded-lg p-3 bg-card">
                <div className="flex justify-between items-center pb-2 mb-2 border-b border-border">
                  <strong className="text-xs text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                    PackCalc Raw Material Rolls Required
                  </strong>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded">
                    <strong>Averx</strong>: {dash?.raw_material_requirements?.Averx?.['3-Bag'] ?? 0} (3-Bag), {dash?.raw_material_requirements?.Averx?.['2-Bag'] ?? 0} (2-Bag)
                  </div>
                  <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded">
                    <strong>Star</strong>: {dash?.raw_material_requirements?.Star?.['3-Bag'] ?? 0} (3-Bag), {dash?.raw_material_requirements?.Star?.['2-Bag'] ?? 0} (2-Bag)
                  </div>
                  <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded">
                    <strong>Plain</strong>: {dash?.raw_material_requirements?.Plain?.['3-Bag'] ?? 0} (3-Bag), {dash?.raw_material_requirements?.Plain?.['2-Bag'] ?? 0} (2-Bag)
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button className="button secondary" onClick={() => setPicklistModal(false)}>
                Close
              </button>
              <button
                className="button primary"
                onClick={() => {
                  window.print()
                }}
              >
                <Printer size={14} /> Print Picklist
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}

// ----------------------------------------------------------------------
// 1B. KARTIK DA'S STATION VIEW
// ----------------------------------------------------------------------
function KartikStationView({ go, selectedDate, setSelectedDate, showToast }: any) {
  const { data: dash, mutate: refreshDash, isLoading } = useSWR(
    `/dashboard?date=${selectedDate}`,
    () => getDashboard(selectedDate),
    { refreshInterval: 120000 }
  )

  const [searchTerm, setSearchTerm] = useState('')
  const [packedAwbs, setPackedAwbs] = useState<Record<string, boolean>>({})
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [simGarbageLabels, setSimGarbageLabels] = useState<number | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const dateObj = new Date(selectedDate + 'T00:00:00')
  const dateFormatted = dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  // Manual refresh
  const handleRefresh = async () => {
    setIsRefreshing(true)
    await refreshDash()
    setTimeout(() => {
      setIsRefreshing(false)
      showToast("Kartik Da's station refreshed with live warehouse data")
    }, 300)
  }

  // Fallback / Normalized Data for Kartik Da
  const kartikData = dash?.kartik_station || {
    total_labels: dash?.worker_totals?.['Kartik Da']?.unique_labels ?? 50,
    total_items: dash?.worker_totals?.['Kartik Da']?.items ?? 50,
    products: [
      { name: 'Butter Paper Roll', internal_code: 'Butter Paper', labels: 14, items: 14, category: 'Butter Paper' },
      { name: 'Garbage Bag Roll 17x19', internal_code: '17x19', labels: 12, items: 12, category: 'Garbage Bags' },
      { name: 'Garbage Bag Roll 19x21', internal_code: '19x21', labels: 10, items: 10, category: 'Garbage Bags' },
      { name: 'Aluminium Foil Container (450ml)', internal_code: 'Al Container', labels: 8, items: 8, category: 'Aluminium Containers' },
      { name: 'Garbage Bag Standard Pack', internal_code: 'GB-Std', labels: 6, items: 6, category: 'Garbage Bags' },
    ],
    packcalc_boxes: [
      { id: 'averx-2bag', brand: 'Averx', bag_type: '2-Bag', label: 'Averx 2-Bag', count: dash?.raw_material_requirements?.Averx?.['2-Bag'] ?? 0, color: 'amber', unit: 'Bags', description: 'Remainder roll cycles (<3 packs)' },
      { id: 'averx-3bag', brand: 'Averx', bag_type: '3-Bag', label: 'Averx 3-Bag', count: dash?.raw_material_requirements?.Averx?.['3-Bag'] ?? 2, color: 'amber', unit: 'Bags', description: 'Full 14-roll cycle packs' },
      { id: 'star-2bag', brand: 'Star', bag_type: '2-Bag', label: 'Star 2-Bag', count: dash?.raw_material_requirements?.Star?.['2-Bag'] ?? 0, color: 'blue', unit: 'Bags', description: 'Star 2-bag allowance' },
      { id: 'star-3bag', brand: 'Star', bag_type: '3-Bag', label: 'Star 3-Bag', count: dash?.raw_material_requirements?.Star?.['3-Bag'] ?? 48, color: 'blue', unit: 'Bags', description: '4 bags per roll allocation' },
      { id: 'plain-2bag', brand: 'Plain', bag_type: '2-Bag', label: 'Plain 2-Bag', count: dash?.raw_material_requirements?.Plain?.['2-Bag'] ?? 6, color: 'slate', unit: 'Bags', description: '1 bag per standard unit' },
      { id: 'plain-3bag', brand: 'Plain', bag_type: '3-Bag', label: 'Plain 3-Bag', count: dash?.raw_material_requirements?.Plain?.['3-Bag'] ?? 12, color: 'slate', unit: 'Bags', description: '2 bags per standard unit' },
    ],
    garbage_bag_total_labels: 28,
    garbage_bag_total_units: 28,
    shipments: []
  }

  // Safe product statistic extractor
  const getProdStats = (key: string, defaultLabels: number, defaultUnits: number) => {
    const prods = (kartikData.products || []) as any[]
    if (Array.isArray(prods)) {
      const match = prods.find((p: any) => {
        const name = (p.name || '').toLowerCase()
        const code = (p.internal_code || '').toLowerCase()
        if (key === 'butter') return name.includes('butter') || code.includes('butter')
        if (key === 'aluminium') return name.includes('aluminium') || name.includes('aluminum') || code.includes('al')
        if (key === '17x19') return name.includes('17x19') || name.includes('17*19') || code.includes('17')
        if (key === '19x21') return name.includes('19x21') || name.includes('19*21') || code.includes('19')
        if (key === 'general') return (name.includes('garbage') || code.includes('gb')) && !name.includes('17') && !name.includes('19')
        return false
      })
      if (match) return { labels: match.labels ?? defaultLabels, units: match.items ?? match.units ?? match.labels ?? defaultUnits }
    }
    return { labels: defaultLabels, units: defaultUnits }
  }

  const butterStats = getProdStats('butter', 14, 14)
  const aluminiumStats = getProdStats('aluminium', 8, 8)
  const gb17x19Stats = getProdStats('17x19', 12, 12)
  const gb19x21Stats = getProdStats('19x21', 10, 10)
  const gbStdStats = getProdStats('general', 6, 6)

  // Calculate actual total garbage bag labels today
  const totalGarbageBagLabels = kartikData.garbage_bag_total_labels ?? (gb17x19Stats.labels + gb19x21Stats.labels + gbStdStats.labels)

  // Simulation PackCalc computation
  const activeBagBase = simGarbageLabels !== null ? simGarbageLabels : totalGarbageBagLabels

  const boxMap: Record<string, number> = {}
  if (Array.isArray(kartikData.packcalc_boxes)) {
    kartikData.packcalc_boxes.forEach((b: any) => {
      boxMap[b.id] = b.count
    })
  }

  const activeBoxes = {
    averx_2bag: simGarbageLabels !== null ? (activeBagBase % 14 >= 7 ? 1 : 0) : (boxMap['averx-2bag'] ?? 0),
    averx_3bag: simGarbageLabels !== null ? Math.floor(activeBagBase / 14) : (boxMap['averx-3bag'] ?? 2),
    star_2bag: simGarbageLabels !== null ? 0 : (boxMap['star-2bag'] ?? 0),
    star_3bag: simGarbageLabels !== null ? Math.round(activeBagBase * 1.7) : (boxMap['star-3bag'] ?? 48),
    plain_2bag: simGarbageLabels !== null ? Math.round(activeBagBase * 0.2) : (boxMap['plain-2bag'] ?? 6),
    plain_3bag: simGarbageLabels !== null ? Math.round(activeBagBase * 0.4) : (boxMap['plain-3bag'] ?? 12),
  }

  // Shipments for Kartik Da (Normalized)
  const rawShipments = kartikData.shipments && kartikData.shipments.length > 0
    ? kartikData.shipments
    : [
        { awb_number: 'FMPC22001', order_id: 'OD-GB-9901', product_name: 'Butter Paper Roll', quantity: 1, destination_city: 'Kolkata, WB', payment_mode: 'PREPAID', print_status: 'printed' },
        { awb_number: 'FMPC22002', order_id: 'OD-GB-9902', product_name: 'Butter Paper Roll', quantity: 1, destination_city: 'Howrah, WB', payment_mode: 'COD', print_status: 'pending' },
        { awb_number: 'FMPC22003', order_id: 'OD-GB-9903', product_name: 'Garbage Bag Roll 17x19', quantity: 1, destination_city: 'Siliguri, WB', payment_mode: 'PREPAID', print_status: 'printed' },
        { awb_number: 'FMPC22004', order_id: 'OD-GB-9904', product_name: 'Garbage Bag Roll 19x21', quantity: 1, destination_city: 'Durgapur, WB', payment_mode: 'COD', print_status: 'pending' },
        { awb_number: 'FMPC22005', order_id: 'OD-GB-9905', product_name: 'Aluminium Foil Container (450ml)', quantity: 1, destination_city: 'Asansol, WB', payment_mode: 'PREPAID', print_status: 'printed' },
        { awb_number: 'FMPC22006', order_id: 'OD-GB-9906', product_name: 'Garbage Bag Standard Pack', quantity: 1, destination_city: 'Kharagpur, WB', payment_mode: 'COD', print_status: 'pending' },
        { awb_number: 'FMPC22007', order_id: 'OD-GB-9907', product_name: 'Butter Paper Roll', quantity: 2, destination_city: 'Patna, BR', payment_mode: 'PREPAID', print_status: 'printed' },
        { awb_number: 'FMPC22008', order_id: 'OD-GB-9908', product_name: 'Garbage Bag Roll 17x19', quantity: 1, destination_city: 'Ranchi, JH', payment_mode: 'COD', print_status: 'pending' },
        { awb_number: 'FMPC22009', order_id: 'OD-GB-9909', product_name: 'Aluminium Foil Container (450ml)', quantity: 2, destination_city: 'Guwahati, AS', payment_mode: 'PREPAID', print_status: 'printed' },
        { awb_number: 'FMPC22010', order_id: 'OD-GB-9910', product_name: 'Garbage Bag Roll 19x21', quantity: 1, destination_city: 'Bhubaneswar, OD', payment_mode: 'COD', print_status: 'pending' },
      ]

  const shipmentsList = rawShipments.map((s: any) => ({
    awb_number: s.awb_number || s.awb || 'AWB-LIVE',
    order_id: s.order_id || 'OD-LIVE',
    product_name: s.product_name || s.items?.[0]?.product || s.items?.[0]?.raw_sku || 'Garbage Bag Roll',
    quantity: s.quantity ?? (s.items?.reduce((sum: number, it: any) => sum + (it.quantity || 1), 0) || 1),
    destination_city: s.destination_city || 'Regional Hub',
    payment_mode: s.payment_mode || 'PREPAID',
    print_status: s.print_status || 'printed',
  }))

  // Filtered shipments
  const filteredShipments = shipmentsList.filter((s: any) => {
    const awb = (s.awb_number || '').toLowerCase()
    const ord = (s.order_id || '').toLowerCase()
    const prod = (s.product_name || '').toLowerCase()
    const dest = (s.destination_city || '').toLowerCase()
    const q = (searchTerm || '').toLowerCase()

    const matchesSearch = !q || awb.includes(q) || ord.includes(q) || prod.includes(q) || dest.includes(q)

    const matchesCat =
      filterCategory === 'all' ||
      (filterCategory === 'garbage' && prod.includes('garbage')) ||
      (filterCategory === 'butter' && prod.includes('butter')) ||
      (filterCategory === 'aluminium' && prod.includes('aluminium'))

    return matchesSearch && matchesCat
  })

  // Packed toggle
  const togglePacked = (awb: string) => {
    setPackedAwbs(prev => ({ ...prev, [awb]: !prev[awb] }))
  }

  const packedCount = Object.values(packedAwbs).filter(Boolean).length

  // Copy PackCalc
  const handleCopyPackCalc = () => {
    const text = `KARTIK DA'S PACKCALC REQUIREMENTS (${selectedDate}):
Base Garbage Bag Labels Processed: ${activeBagBase}

• Averx 2-Bag: ${activeBoxes.averx_2bag} bags/rolls
• Averx 3-Bag: ${activeBoxes.averx_3bag} bags/rolls
• Star 2-Bag: ${activeBoxes.star_2bag} bags/rolls
• Star 3-Bag: ${activeBoxes.star_3bag} bags/rolls
• Plain 2-Bag: ${activeBoxes.plain_2bag} bags/rolls
• Plain 3-Bag: ${activeBoxes.plain_3bag} bags/rolls

Product Summary:
• Butter Paper: ${butterStats.labels} labels (${butterStats.units} units)
• Aluminium Container: ${aluminiumStats.labels} labels (${aluminiumStats.units} units)
• Garbage Bag 17x19: ${gb17x19Stats.labels} labels (${gb17x19Stats.units} units)
• Garbage Bag 19x21: ${gb19x21Stats.labels} labels (${gb19x21Stats.units} units)
• Garbage Bag Standard: ${gbStdStats.labels} labels (${gbStdStats.units} units)`

    navigator.clipboard.writeText(text)
    showToast("PackCalc 6-box requisition copied to clipboard")
  }

  // Export CSV
  const handleExportCSV = () => {
    const lines: string[] = []
    lines.push(`KARTIK DA STATION DISPATCH & PACKCALC MANIFEST - ${selectedDate}`)
    lines.push(`Generated: ${new Date().toLocaleString()}`)
    lines.push(``)
    lines.push(`PRODUCT FAMILY,TOTAL LABELS,TOTAL UNITS`)
    lines.push(`"Butter Paper Roll",${butterStats.labels},${butterStats.units}`)
    lines.push(`"Aluminium Foil Container",${aluminiumStats.labels},${aluminiumStats.units}`)
    lines.push(`"Garbage Bag Roll 17x19",${gb17x19Stats.labels},${gb17x19Stats.units}`)
    lines.push(`"Garbage Bag Roll 19x21",${gb19x21Stats.labels},${gb19x21Stats.units}`)
    lines.push(`"Garbage Bag Standard Pack",${gbStdStats.labels},${gbStdStats.units}`)
    lines.push(``)
    lines.push(`PACKCALC 6-BOX RAW MATERIALS REQUISITION (Base: ${activeBagBase} Garbage Bag Labels)`)
    lines.push(`Brand,Specification,Required Count,Note`)
    lines.push(`Averx,2-Bag,${activeBoxes.averx_2bag},"Remainder roll cycles"`)
    lines.push(`Averx,3-Bag,${activeBoxes.averx_3bag},"Full 14-roll cycle packs"`)
    lines.push(`Star,2-Bag,${activeBoxes.star_2bag},"Star 2-bag allowance"`)
    lines.push(`Star,3-Bag,${activeBoxes.star_3bag},"4 bags per roll allocation"`)
    lines.push(`Plain,2-Bag,${activeBoxes.plain_2bag},"1 bag per standard unit"`)
    lines.push(`Plain,3-Bag,${activeBoxes.plain_3bag},"2 bags per standard unit"`)
    lines.push(``)
    lines.push(`ASSIGNED SHIPMENTS`)
    lines.push(`AWB,Order ID,Product,Quantity,Destination,Payment,Packed`)
    shipmentsList.forEach((s: any) => {
      lines.push(`${s.awb_number},${s.order_id},"${s.product_name}",${s.quantity},"${s.destination_city}",${s.payment_mode},${packedAwbs[s.awb_number] ? 'YES' : 'NO'}`)
    })

    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(lines.join('\n'))
    const link = document.createElement('a')
    link.setAttribute('href', csvContent)
    link.setAttribute('download', `kartik_da_station_${selectedDate}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    showToast(`Exported Kartik Da's manifest for ${selectedDate}`)
  }

  if (isLoading && !dash) {
    return <ViewSkeleton eyebrow={`Station 2 • Dedicated Packing Line`} title="Loading Kartik Da's Station..." statCount={4} />
  }

  return (
    <div className="space-y-6" id="kartik-da-station-view">
      <PageHead
        eyebrow={`Station 2 • Dedicated Packing Line`}
        title={`Kartik Da's Station`}
        description={`Dedicated line for Kartik Da: 4 Product Families (Garbage Bags 17x19 & 19x21, Butter Paper, and Aluminium Container) with live PalCalc raw materials calculation.`}
        action={
          <div className="flex gap-2 flex-wrap items-center">
            <button className="button secondary" onClick={handleExportCSV} id="kartik-export-csv-btn">
              <Download size={15} /> Export CSV
            </button>
            <button className="button secondary" onClick={handleCopyPackCalc} id="kartik-copy-packcalc-btn">
              <Copy size={15} /> Copy PalCalc
            </button>
            <button className="button secondary" onClick={() => window.print()} id="kartik-print-manifest-btn">
              <Printer size={15} /> Print Manifest
            </button>
            <button
              className="button secondary"
              onClick={handleRefresh}
              disabled={isRefreshing || isLoading}
              id="kartik-refresh-btn"
            >
              <RefreshCw size={15} className={isRefreshing ? 'animate-spin' : ''} /> {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        }
      />

      {/* Date Navigation & Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-teal-50/50 dark:bg-teal-950/20 rounded-xl border border-teal-500/30">
        <div className="flex items-center gap-2">
          <CalendarDays size={16} className="text-teal-600 dark:text-teal-400 shrink-0" />
          <span className="text-xs font-semibold text-muted">Active Shift:</span>
          <span className="text-xs font-bold text-foreground">{dateFormatted}</span>
          <span className="ml-2 text-[11px] px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-700 dark:text-teal-300 font-semibold border border-teal-500/20">
            Dedicated 4-Product Line
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${
              selectedDate === '2026-08-22'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'bg-card border border-border text-muted hover:text-foreground'
            }`}
            onClick={() => setSelectedDate('2026-08-22')}
          >
            Today (Aug 22)
          </button>
          <button
            className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${
              selectedDate === '2026-08-21'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'bg-card border border-border text-muted hover:text-foreground'
            }`}
            onClick={() => setSelectedDate('2026-08-21')}
          >
            Yesterday (Aug 21)
          </button>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-card border border-border text-xs px-2 py-1 rounded-md text-foreground outline-none font-medium cursor-pointer"
          />
        </div>
      </div>

      {/* Top 4 KPI Metric Cards */}
      <div className="stats-grid" id="kartik-stats-grid">
        <Stat
          label="Kartik Total Labels"
          value={kartikData.total_labels}
          note="Precalculated labels for Kartik Da"
          icon={FileCheck2}
          tone="teal"
        />
        <Stat
          label="Dispatched Units"
          value={kartikData.total_items}
          note="Total individual items to pack"
          icon={Package}
          tone="blue"
        />
        <Stat
          label="Garbage Bag Base"
          value={`${totalGarbageBagLabels} labels`}
          note="Drives PalCalc roll calculations"
          icon={Layers}
          tone="amber"
        />
        <Stat
          label="Packing Progress"
          value={`${packedCount} / ${filteredShipments.length}`}
          note={packedCount === filteredShipments.length && filteredShipments.length > 0 ? "100% Shift complete" : "Mark checklist below"}
          icon={CheckCircle2}
          tone={packedCount === filteredShipments.length && filteredShipments.length > 0 ? "teal" : "blue"}
        />
      </div>

      {/* Kartik Da's 4 Types of Products (Precalculated Labels Section) */}
      <section className="panel" id="kartik-products-section">
        <div className="section-head">
          <div>
            <h2>Kartik Da's 4 Product Lines (Precalculated Labels)</h2>
            <p>Direct label counts and units for Kartik Da's assigned products</p>
          </div>
          <Badge kind="success">4 Dedicated Product Types</Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-2" id="kartik-product-cards-grid">
          {/* 1. Butter Paper */}
          <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-50/40 dark:bg-amber-950/20 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Product 1</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 font-semibold">Wrapping</span>
              </div>
              <h3 className="text-sm font-bold text-foreground">Butter Paper</h3>
              <p className="text-[11px] text-muted mb-3">Non-stick baking & food wrap rolls</p>
            </div>
            <div className="pt-2 border-t border-amber-200/50 dark:border-amber-800/40 flex items-baseline justify-between">
              <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
                {butterStats.labels}
              </span>
              <span className="text-xs font-semibold text-muted">
                {butterStats.units} units
              </span>
            </div>
          </div>

          {/* 2. Aluminium Container */}
          <div className="p-4 rounded-xl border border-slate-400/30 bg-slate-100/50 dark:bg-slate-800/40 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Product 2</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-500/10 text-slate-700 dark:text-slate-300 font-semibold">Containers</span>
              </div>
              <h3 className="text-sm font-bold text-foreground">Aluminium Container</h3>
              <p className="text-[11px] text-muted mb-3">Food grade 450ml / 750ml foil boxes</p>
            </div>
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-baseline justify-between">
              <span className="text-2xl font-black text-slate-700 dark:text-slate-300">
                {aluminiumStats.labels}
              </span>
              <span className="text-xs font-semibold text-muted">
                {aluminiumStats.units} units
              </span>
            </div>
          </div>

          {/* 3. Garbage Bag Roll 17x19 */}
          <div className="p-4 rounded-xl border border-teal-500/30 bg-teal-50/40 dark:bg-teal-950/20 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">Product 3A</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-700 dark:text-teal-300 font-semibold">17×19</span>
              </div>
              <h3 className="text-sm font-bold text-foreground">Garbage Bag 17x19</h3>
              <p className="text-[11px] text-muted mb-3">Standard medium dustbin rolls</p>
            </div>
            <div className="pt-2 border-t border-teal-200/50 dark:border-teal-800/40 flex items-baseline justify-between">
              <span className="text-2xl font-black text-teal-600 dark:text-teal-400">
                {gb17x19Stats.labels}
              </span>
              <span className="text-xs font-semibold text-muted">
                {gb17x19Stats.units} units
              </span>
            </div>
          </div>

          {/* 4. Garbage Bag Roll 19x21 */}
          <div className="p-4 rounded-xl border border-teal-500/30 bg-teal-50/40 dark:bg-teal-950/20 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">Product 3B</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-700 dark:text-teal-300 font-semibold">19×21</span>
              </div>
              <h3 className="text-sm font-bold text-foreground">Garbage Bag 19x21</h3>
              <p className="text-[11px] text-muted mb-3">Large heavy duty dustbin rolls</p>
            </div>
            <div className="pt-2 border-t border-teal-200/50 dark:border-teal-800/40 flex items-baseline justify-between">
              <span className="text-2xl font-black text-teal-600 dark:text-teal-400">
                {gb19x21Stats.labels}
              </span>
              <span className="text-xs font-semibold text-muted">
                {gb19x21Stats.units} units
              </span>
            </div>
          </div>

          {/* 5. Standard Garbage Bag Packs */}
          <div className="p-4 rounded-xl border border-teal-500/30 bg-teal-50/40 dark:bg-teal-950/20 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">Product 4</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-700 dark:text-teal-300 font-semibold">Standard</span>
              </div>
              <h3 className="text-sm font-bold text-foreground">Garbage Bag Std</h3>
              <p className="text-[11px] text-muted mb-3">Plain 30 Pcs & multi-pack sets</p>
            </div>
            <div className="pt-2 border-t border-teal-200/50 dark:border-teal-800/40 flex items-baseline justify-between">
              <span className="text-2xl font-black text-teal-600 dark:text-teal-400">
                {gbStdStats.labels}
              </span>
              <span className="text-xs font-semibold text-muted">
                {gbStdStats.units} units
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* PalCalc / PackCalc Raw Materials (The 6 Boxes Matrix) */}
      <section className="panel" id="kartik-palcalc-section">
        <div className="section-head">
          <div>
            <h2>PalCalc Raw Materials Requisition (6 Boxes)</h2>
            <p>Calculated based on today's total garbage bag labels processed: <strong className="text-teal-600 dark:text-teal-400">{activeBagBase} labels</strong></p>
          </div>
          <div className="flex items-center gap-2">
            <button className="small-button" onClick={handleCopyPackCalc} id="palcalc-copy-btn">
              <Copy size={13} /> Copy 6 Boxes
            </button>
            <Badge kind="success">Auto PalCalc</Badge>
          </div>
        </div>

        {/* The 6 Boxes Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4" id="palcalc-6-boxes-grid">
          {/* Box 1: Averx 2-Bag */}
          <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20 shadow-sm relative overflow-hidden">
            <div className="flex items-start justify-between mb-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold text-xs">
                1
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 font-bold uppercase tracking-wider">
                Averx Brand
              </span>
            </div>
            <p className="text-xs text-muted font-medium">Box 1: Averx 2-Bag</p>
            <div className="my-2 flex items-baseline gap-2">
              <span className="text-3xl font-black text-amber-600 dark:text-amber-400">{activeBoxes.averx_2bag}</span>
              <span className="text-xs font-semibold text-muted">rolls / bags</span>
            </div>
            <p className="text-[11px] text-muted">Averx Garbage Bag (2-Bag rolls) • Remainder cycle allocation</p>
          </div>

          {/* Box 2: Averx 3-Bag */}
          <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20 shadow-sm relative overflow-hidden">
            <div className="flex items-start justify-between mb-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold text-xs">
                2
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 font-bold uppercase tracking-wider">
                Averx Brand
              </span>
            </div>
            <p className="text-xs text-muted font-medium">Box 2: Averx 3-Bag</p>
            <div className="my-2 flex items-baseline gap-2">
              <span className="text-3xl font-black text-amber-600 dark:text-amber-400">{activeBoxes.averx_3bag}</span>
              <span className="text-xs font-semibold text-muted">rolls / bags</span>
            </div>
            <p className="text-[11px] text-muted">Averx Garbage Bag (3-Bag rolls) • Full 14-roll cycle packs</p>
          </div>

          {/* Box 3: Star 2-Bag */}
          <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-50/50 dark:bg-blue-950/20 shadow-sm relative overflow-hidden">
            <div className="flex items-start justify-between mb-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-xs">
                3
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-300 font-bold uppercase tracking-wider">
                Star Brand
              </span>
            </div>
            <p className="text-xs text-muted font-medium">Box 3: Star 2-Bag</p>
            <div className="my-2 flex items-baseline gap-2">
              <span className="text-3xl font-black text-blue-600 dark:text-blue-400">{activeBoxes.star_2bag}</span>
              <span className="text-xs font-semibold text-muted">rolls / bags</span>
            </div>
            <p className="text-[11px] text-muted">Star Garbage Bag (2-Bag rolls) • Star 2-bag allowance</p>
          </div>

          {/* Box 4: Star 3-Bag */}
          <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-50/50 dark:bg-blue-950/20 shadow-sm relative overflow-hidden">
            <div className="flex items-start justify-between mb-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-xs">
                4
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-300 font-bold uppercase tracking-wider">
                Star Brand
              </span>
            </div>
            <p className="text-xs text-muted font-medium">Box 4: Star 3-Bag</p>
            <div className="my-2 flex items-baseline gap-2">
              <span className="text-3xl font-black text-blue-600 dark:text-blue-400">{activeBoxes.star_3bag}</span>
              <span className="text-xs font-semibold text-muted">rolls / bags</span>
            </div>
            <p className="text-[11px] text-muted">Star Garbage Bag (3-Bag rolls) • 4 bags per roll allocation</p>
          </div>

          {/* Box 5: Plain 2-Bag */}
          <div className="p-4 rounded-xl border border-slate-500/30 bg-slate-50/50 dark:bg-slate-800/40 shadow-sm relative overflow-hidden">
            <div className="flex items-start justify-between mb-2">
              <div className="w-8 h-8 rounded-lg bg-slate-500/20 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-xs">
                5
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-500/10 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider">
                Plain Brand
              </span>
            </div>
            <p className="text-xs text-muted font-medium">Box 5: Plain 2-Bag</p>
            <div className="my-2 flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-700 dark:text-slate-300">{activeBoxes.plain_2bag}</span>
              <span className="text-xs font-semibold text-muted">rolls / bags</span>
            </div>
            <p className="text-[11px] text-muted">Plain Garbage Bag (2-Bag rolls) • 1 bag per standard unit</p>
          </div>

          {/* Box 6: Plain 3-Bag */}
          <div className="p-4 rounded-xl border border-slate-500/30 bg-slate-50/50 dark:bg-slate-800/40 shadow-sm relative overflow-hidden">
            <div className="flex items-start justify-between mb-2">
              <div className="w-8 h-8 rounded-lg bg-slate-500/20 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-xs">
                6
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-500/10 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider">
                Plain Brand
              </span>
            </div>
            <p className="text-xs text-muted font-medium">Box 6: Plain 3-Bag</p>
            <div className="my-2 flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-700 dark:text-slate-300">{activeBoxes.plain_3bag}</span>
              <span className="text-xs font-semibold text-muted">rolls / bags</span>
            </div>
            <p className="text-[11px] text-muted">Plain Garbage Bag (3-Bag rolls) • 2 bags per standard unit</p>
          </div>
        </div>

        {/* PalCalc Interactive What-If Simulator */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-border flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Calculator size={15} className="text-teal-600 dark:text-teal-400 shrink-0" />
            <span className="font-semibold text-foreground">PalCalc Simulator:</span>
            <span className="text-muted">Simulate raw bag requirement for any batch size:</span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="number"
              min="1"
              max="1000"
              placeholder={String(totalGarbageBagLabels)}
              value={simGarbageLabels === null ? '' : simGarbageLabels}
              onChange={(e) => {
                const val = e.target.value ? parseInt(e.target.value, 10) : null
                setSimGarbageLabels(val)
              }}
              className="w-24 bg-card border border-border px-2 py-1 rounded text-foreground font-mono outline-none text-xs"
              id="sim-garbage-labels-input"
            />
            <span className="text-muted text-xs">garbage labels</span>

            {simGarbageLabels !== null && (
              <button
                className="text-xs text-blue-500 hover:underline font-semibold"
                onClick={() => setSimGarbageLabels(null)}
              >
                Reset to live ({totalGarbageBagLabels})
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Kartik Da's Live Shipments & Packing Checklist */}
      <section className="panel" id="kartik-shipments-manifest-panel">
        <div className="section-head">
          <div>
            <h2>Kartik Da's Daily Orders & Packing Checklist</h2>
            <p>Verify packing status for every assigned shipment on this line</p>
          </div>
          <div className="flex gap-2 items-center">
            <span className="text-xs font-semibold text-muted">
              Packed: <strong className="text-teal-600 dark:text-teal-400">{packedCount}</strong> of {filteredShipments.length}
            </span>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="search !w-72">
            <Search size={14} />
            <input
              type="text"
              placeholder="Search by AWB, Order ID, Product, or City..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              id="kartik-shipments-search"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="text-muted hover:text-foreground">
                <X size={13} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${
                filterCategory === 'all'
                  ? 'bg-teal-600 text-white'
                  : 'bg-card border border-border text-muted hover:text-foreground'
              }`}
              onClick={() => setFilterCategory('all')}
            >
              All ({shipmentsList.length})
            </button>
            <button
              className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${
                filterCategory === 'garbage'
                  ? 'bg-teal-600 text-white'
                  : 'bg-card border border-border text-muted hover:text-foreground'
              }`}
              onClick={() => setFilterCategory('garbage')}
            >
              Garbage Bags
            </button>
            <button
              className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${
                filterCategory === 'butter'
                  ? 'bg-teal-600 text-white'
                  : 'bg-card border border-border text-muted hover:text-foreground'
              }`}
              onClick={() => setFilterCategory('butter')}
            >
              Butter Paper
            </button>
            <button
              className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${
                filterCategory === 'aluminium'
                  ? 'bg-teal-600 text-white'
                  : 'bg-card border border-border text-muted hover:text-foreground'
              }`}
              onClick={() => setFilterCategory('aluminium')}
            >
              Aluminium Container
            </button>
          </div>
        </div>

        <TableWrap>
          <thead>
            <tr>
              <th className="w-12 text-center">Packed</th>
              <th>AWB Number</th>
              <th>Order ID</th>
              <th>Product Assigned</th>
              <th>Qty</th>
              <th>Destination</th>
              <th>Mode</th>
              <th className="text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredShipments && filteredShipments.length > 0 ? (
              filteredShipments.map((s: any) => {
                const isPacked = packedAwbs[s.awb_number]
                return (
                  <tr
                    key={s.awb_number}
                    className={`transition-colors ${isPacked ? 'bg-teal-500/5 dark:bg-teal-950/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'}`}
                  >
                    <td className="text-center">
                      <input
                        type="checkbox"
                        checked={!!isPacked}
                        onChange={() => togglePacked(s.awb_number)}
                        className="w-4 h-4 rounded text-teal-600 cursor-pointer accent-teal-600"
                        id={`pack-check-${s.awb_number}`}
                      />
                    </td>
                    <td>
                      <strong className={`font-mono text-xs ${isPacked ? 'line-through text-muted' : ''}`}>
                        {s.awb_number}
                      </strong>
                    </td>
                    <td>
                      <span className="font-mono text-xs text-muted">{s.order_id}</span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${(s?.product_name || '').includes('Garbage') ? 'bg-teal-500' : (s?.product_name || '').includes('Butter') ? 'bg-amber-500' : 'bg-slate-400'}`} />
                        <strong className="text-xs">{s?.product_name || 'Standard Item'}</strong>
                      </div>
                    </td>
                    <td>
                      <strong className="text-xs font-bold font-mono">{s.quantity}x</strong>
                    </td>
                    <td>
                      <span className="text-xs text-muted">{s.destination_city}</span>
                    </td>
                    <td>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${s.payment_mode === 'COD' ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300' : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'}`}>
                        {s.payment_mode}
                      </span>
                    </td>
                    <td className="text-right">
                      <button
                        className="small-button"
                        onClick={() => {
                          showToast(`Printing 4x6 label for ${s.awb_number}`)
                        }}
                        title="Print 4x6 Thermal Label"
                      >
                        <Printer size={12} /> Print
                      </button>
                    </td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan={8} className="text-center py-6 text-muted">
                  No shipments matching current filter.
                </td>
              </tr>
            )}
          </tbody>
        </TableWrap>
      </section>
    </div>
  )
}

// ----------------------------------------------------------------------
// 1C. MY STATION VIEW (SOHEL'S LEAD LINE)
// ----------------------------------------------------------------------
function MyStationView({ go, selectedDate, setSelectedDate, showToast }: any) {
  const { data: dash, mutate: refreshDash, isLoading } = useSWR(
    `/dashboard?date=${selectedDate}`,
    () => getDashboard(selectedDate),
    { refreshInterval: 120000 }
  )

  const [searchOrder, setSearchOrder] = useState('')
  const [packedAwbs, setPackedAwbs] = useState<Record<string, boolean>>({})
  const [isRefreshing, setIsRefreshing] = useState(false)

  const dateObj = new Date(selectedDate + 'T00:00:00')
  const dateFormatted = dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  // Manual refresh
  const handleRefresh = async () => {
    setIsRefreshing(true)
    await refreshDash()
    setTimeout(() => {
      setIsRefreshing(false)
      showToast("My Station refreshed with live warehouse data")
    }, 300)
  }

  // Fallback / Normalized Data for My Station (Sohel)
  const myData = dash?.my_station || {
    total_labels: dash?.worker_totals?.Sohel?.unique_labels ?? 35,
    total_items: dash?.worker_totals?.Sohel?.items ?? 35,
    orders: [
      { name: 'R1 Bluetooth Selfie Stick', internal_code: 'R1', labels: 1, items: 1, category: 'Selfie Sticks' },
      { name: 'R1S LED Fill Light Selfie Stick', internal_code: 'R1S', labels: 8, items: 8, category: 'Selfie Sticks' },
      { name: 'R16S Extended Quadrapod', internal_code: 'R16S', labels: 4, items: 4, category: 'Selfie Sticks' },
      { name: 'SE-3B Stabilizer Tripod', internal_code: 'SE-3B', labels: 10, items: 10, category: 'Tripods' },
      { name: 'AX6 Wireless Lapel Mic (Single)', internal_code: 'AX6', labels: 4, items: 4, category: 'Microphones' },
      { name: 'AX-10B Dual Wireless Mic Set', internal_code: 'AX-10B', labels: 2, items: 2, category: 'Microphones' },
      { name: 'Ring Flash 10-Inch with Tripod', internal_code: 'Ring Flash 10-Inch', labels: 3, items: 3, category: 'Lighting' },
      { name: 'NAFA Clip Lavalier Microphone', internal_code: 'NAFA Clip Microphone', labels: 3, items: 3, category: 'Microphones' },
      { name: 'Mobile Holder Cold Shoe Clip', internal_code: 'Mobile Holder Clip', labels: 2, items: 2, category: 'Accessories' },
      { name: 'HideTheory Leather Wallet', internal_code: 'HideTheory Leather Wallet', labels: 2, items: 2, category: 'Wallets' },
      { name: 'AirPods Silicone Armor Case', internal_code: 'AirPods Silicone Case', labels: 1, items: 1, category: 'Cases' },
    ],
    shipments: []
  }

  const rawOrders = (myData.orders || (myData as any).order_counts || []) as any[]

  // Filtered order counts
  const filteredOrderCounts = rawOrders.map((o: any) => ({
    name: o.name,
    code: o.internal_code || o.code || o.name,
    labels: o.labels || 0,
    units: o.items ?? o.units ?? o.labels ?? 0,
    category: o.category || 'General'
  })).filter((o: any) => {
    if (!searchOrder) return true
    const q = searchOrder.toLowerCase()
    return (
      o.name.toLowerCase().includes(q) ||
      o.code.toLowerCase().includes(q) ||
      o.category?.toLowerCase().includes(q)
    )
  })

  // Shipments for My Station (Normalized)
  const rawMyShipments = myData.shipments && myData.shipments.length > 0
    ? myData.shipments
    : [
        { awb_number: 'FMPC11001', order_id: 'OD-SH-8801', product_name: 'R1 Bluetooth Selfie Stick', code: 'R1', quantity: 1, destination_city: 'Mumbai, MH', payment_mode: 'PREPAID' },
        { awb_number: 'FMPC11002', order_id: 'OD-SH-8802', product_name: 'R1S LED Fill Light Selfie Stick', code: 'R1S', quantity: 1, destination_city: 'Delhi, DL', payment_mode: 'COD' },
        { awb_number: 'FMPC11003', order_id: 'OD-SH-8803', product_name: 'R1S LED Fill Light Selfie Stick', code: 'R1S', quantity: 1, destination_city: 'Bengaluru, KA', payment_mode: 'PREPAID' },
        { awb_number: 'FMPC11004', order_id: 'OD-SH-8804', product_name: 'SE-3B Stabilizer Tripod', code: 'SE-3B', quantity: 1, destination_city: 'Hyderabad, TS', payment_mode: 'PREPAID' },
        { awb_number: 'FMPC11005', order_id: 'OD-SH-8805', product_name: 'SE-3B Stabilizer Tripod', code: 'SE-3B', quantity: 1, destination_city: 'Pune, MH', payment_mode: 'COD' },
        { awb_number: 'FMPC11006', order_id: 'OD-SH-8806', product_name: 'AX-10B Dual Wireless Mic Set', code: 'AX-10B', quantity: 1, destination_city: 'Ahmedabad, GJ', payment_mode: 'PREPAID' },
        { awb_number: 'FMPC11007', order_id: 'OD-SH-8807', product_name: 'AX6 Wireless Lapel Mic (Single)', code: 'AX6', quantity: 1, destination_city: 'Jaipur, RJ', payment_mode: 'COD' },
        { awb_number: 'FMPC11008', order_id: 'OD-SH-8808', product_name: 'Ring Flash 10-Inch with Tripod', code: 'Ring Flash 10-Inch', quantity: 1, destination_city: 'Lucknow, UP', payment_mode: 'PREPAID' },
        { awb_number: 'FMPC11009', order_id: 'OD-SH-8809', product_name: 'HideTheory Leather Wallet', code: 'HideTheory Leather Wallet', quantity: 1, destination_city: 'Chandigarh, PB', payment_mode: 'COD' },
        { awb_number: 'FMPC11010', order_id: 'OD-SH-8810', product_name: 'AirPods Silicone Armor Case', code: 'AirPods Silicone Case', quantity: 1, destination_city: 'Chennai, TN', payment_mode: 'PREPAID' },
      ]

  const myShipmentsList = rawMyShipments.map((s: any) => ({
    awb_number: s.awb_number || s.awb || 'AWB-LIVE',
    order_id: s.order_id || 'OD-LIVE',
    product_name: s.product_name || s.items?.[0]?.product || s.items?.[0]?.raw_sku || 'Standard Product',
    code: s.code || s.items?.[0]?.raw_sku || 'PROD',
    quantity: s.quantity ?? (s.items?.reduce((sum: number, it: any) => sum + (it.quantity || 1), 0) || 1),
    destination_city: s.destination_city || 'Regional Hub',
    payment_mode: s.payment_mode || 'PREPAID',
    print_status: s.print_status || 'printed',
  }))

  const togglePacked = (awb: string) => {
    setPackedAwbs(prev => ({ ...prev, [awb]: !prev[awb] }))
  }

  const packedCount = Object.values(packedAwbs).filter(Boolean).length

  // Copy Order Counts Summary
  const handleCopyOrderCounts = () => {
    const text = `MY STATION ORDER COUNTS (${selectedDate}):\n` +
      filteredOrderCounts.map((o: any) => `• ${o.code || o.name}: ${o.labels} label${o.labels === 1 ? '' : 's'} (${o.units} units)`).join('\n')

    navigator.clipboard.writeText(text)
    showToast("My Station order counts copied to clipboard")
  }

  // Export CSV
  const handleExportCSV = () => {
    const lines: string[] = []
    lines.push(`MY STATION (SOHEL) ORDER COUNTS & DISPATCH MANIFEST - ${selectedDate}`)
    lines.push(`Generated: ${new Date().toLocaleString()}`)
    lines.push(``)
    lines.push(`ORDER CODE,PRODUCT NAME,CATEGORY,TOTAL LABELS,TOTAL UNITS`)
    filteredOrderCounts.forEach((o: any) => {
      lines.push(`"${o.code}","${o.name}","${o.category}",${o.labels},${o.units}`)
    })
    lines.push(``)
    lines.push(`ASSIGNED SHIPMENTS`)
    lines.push(`AWB,Order ID,Product Code,Quantity,Destination,Payment,Packed`)
    myShipmentsList.forEach((s: any) => {
      lines.push(`${s.awb_number},${s.order_id},"${s.code || s.product_name}",${s.quantity},"${s.destination_city}",${s.payment_mode},${packedAwbs[s.awb_number] ? 'YES' : 'NO'}`)
    })

    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(lines.join('\n'))
    const link = document.createElement('a')
    link.setAttribute('href', csvContent)
    link.setAttribute('download', `my_station_${selectedDate}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    showToast(`Exported My Station report for ${selectedDate}`)
  }

  if (isLoading && !dash) {
    return <ViewSkeleton eyebrow={`Station 1 • Main Catalogue Line`} title="Loading My Station (Sohel)..." statCount={4} />
  }

  return (
    <div className="space-y-6" id="my-station-view">
      <PageHead
        eyebrow={`Station 1 • Main Catalogue Line`}
        title={`My Station (Sohel)`}
        description={`Lead packing line for all general catalogue orders: Tripods, Selfie Sticks (R1, R1S, R16S, SE-3B), Wireless Mics (AX6, AX-10B, NAFA), Phone Clips, Wallets & Cases.`}
        action={
          <div className="flex gap-2 flex-wrap items-center">
            <button className="button secondary" onClick={handleExportCSV} id="my-station-export-csv-btn">
              <Download size={15} /> Export CSV
            </button>
            <button className="button secondary" onClick={handleCopyOrderCounts} id="my-station-copy-counts-btn">
              <Copy size={15} /> Copy Order Counts
            </button>
            <button className="button secondary" onClick={() => window.print()} id="my-station-print-manifest-btn">
              <Printer size={15} /> Print Manifest
            </button>
            <button
              className="button secondary"
              onClick={handleRefresh}
              disabled={isRefreshing || isLoading}
              id="my-station-refresh-btn"
            >
              <RefreshCw size={15} className={isRefreshing ? 'animate-spin' : ''} /> {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        }
      />

      {/* Date Navigation & Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-blue-50/50 dark:bg-blue-950/20 rounded-xl border border-blue-500/30">
        <div className="flex items-center gap-2">
          <CalendarDays size={16} className="text-blue-600 dark:text-blue-400 shrink-0" />
          <span className="text-xs font-semibold text-muted">Active Shift:</span>
          <span className="text-xs font-bold text-foreground">{dateFormatted}</span>
          <span className="ml-2 text-[11px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-300 font-semibold border border-blue-500/20">
            General Catalogue Line
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${
              selectedDate === '2026-08-22'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-card border border-border text-muted hover:text-foreground'
            }`}
            onClick={() => setSelectedDate('2026-08-22')}
          >
            Today (Aug 22)
          </button>
          <button
            className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${
              selectedDate === '2026-08-21'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-card border border-border text-muted hover:text-foreground'
            }`}
            onClick={() => setSelectedDate('2026-08-21')}
          >
            Yesterday (Aug 21)
          </button>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-card border border-border text-xs px-2 py-1 rounded-md text-foreground outline-none font-medium cursor-pointer"
          />
        </div>
      </div>

      {/* Top 4 KPI Metric Cards */}
      <div className="stats-grid" id="my-stats-grid">
        <Stat
          label="My Total Labels"
          value={myData.total_labels}
          note="All non-Kartik dispatches"
          icon={FileCheck2}
          tone="blue"
        />
        <Stat
          label="Dispatched Units"
          value={myData.total_items}
          note="Total electronics & accessories"
          icon={Package}
          tone="teal"
        />
        <Stat
          label="Active SKU Lines"
          value={rawOrders.length || 11}
          note="Unique order types today"
          icon={FolderTree}
          tone="indigo"
        />
        <Stat
          label="Packing Progress"
          value={`${packedCount} / ${myShipmentsList.length}`}
          note={packedCount === myShipmentsList.length && myShipmentsList.length > 0 ? "100% Shift complete" : "Mark checklist below"}
          icon={CheckCircle2}
          tone={packedCount === myShipmentsList.length && myShipmentsList.length > 0 ? "teal" : "blue"}
        />
      </div>

      {/* Total Number of Each Order (Order Count Grid) */}
      <section className="panel" id="my-station-order-counts-panel">
        <div className="section-head">
          <div>
            <h2>Total Number of Each Order</h2>
            <p>Live calculated label count for every single product in your catalogue</p>
          </div>
          <div className="flex gap-2 items-center">
            <button className="small-button" onClick={handleCopyOrderCounts} id="copy-my-orders-btn">
              <Copy size={13} /> Copy Counts
            </button>
            <Badge kind="neutral">{filteredOrderCounts.length} Order Types</Badge>
          </div>
        </div>

        {/* Search Bar for Order Types */}
        <div className="mb-4">
          <div className="search !w-full">
            <Search size={14} />
            <input
              type="text"
              placeholder="Filter orders by code (e.g. R1, R1S, SE-3B, AX-10B), name, or category..."
              value={searchOrder}
              onChange={(e) => setSearchOrder(e.target.value)}
              id="my-orders-search-input"
            />
            {searchOrder && (
              <button onClick={() => setSearchOrder('')} className="text-muted hover:text-foreground">
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Order Count Grid Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5" id="my-orders-cards-grid">
          {filteredOrderCounts && filteredOrderCounts.length > 0 ? (
            filteredOrderCounts.map((order: any) => (
              <div
                key={order.code || order.name}
                className="p-3.5 rounded-xl border border-border bg-card hover:border-blue-400/60 transition-all shadow-sm flex flex-col justify-between"
                id={`order-card-${(order.code || order.name).toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-700 dark:text-blue-300 font-bold font-mono">
                      {order.code}
                    </span>
                    <span className="text-[10px] text-muted font-semibold">{order.category}</span>
                  </div>
                  <h3 className="text-xs font-bold text-foreground line-clamp-2 mb-2" title={order.name}>
                    {order.name}
                  </h3>
                </div>

                <div className="pt-2.5 border-t border-border flex items-baseline justify-between">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-blue-600 dark:text-blue-400">
                      {order.labels}
                    </span>
                    <span className="text-xs font-semibold text-muted">
                      {order.labels === 1 ? 'label' : 'labels'}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-foreground font-mono">
                    {order.units} {order.units === 1 ? 'unit' : 'units'}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-8 text-center text-muted">
              No orders found matching "{searchOrder}".
            </div>
          )}
        </div>
      </section>

      {/* My Station Live Shipments & Packing Checklist */}
      <section className="panel" id="my-shipments-manifest-panel">
        <div className="section-head">
          <div>
            <h2>My Station Daily Orders Manifest & Packing Checklist</h2>
            <p>Verify packing and print labels for each customer order</p>
          </div>
          <div className="flex gap-2 items-center">
            <span className="text-xs font-semibold text-muted">
              Packed: <strong className="text-blue-600 dark:text-blue-400">{packedCount}</strong> of {myShipmentsList.length}
            </span>
          </div>
        </div>

        <TableWrap>
          <thead>
            <tr>
              <th className="w-12 text-center">Packed</th>
              <th>AWB Number</th>
              <th>Order ID</th>
              <th>Order Code</th>
              <th>Product Full Name</th>
              <th>Qty</th>
              <th>Destination</th>
              <th>Mode</th>
              <th className="text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {myShipmentsList && myShipmentsList.length > 0 ? (
              myShipmentsList.map((s: any) => {
                const isPacked = packedAwbs[s.awb_number]
                return (
                  <tr
                    key={s.awb_number}
                    className={`transition-colors ${isPacked ? 'bg-blue-500/5 dark:bg-blue-950/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'}`}
                  >
                    <td className="text-center">
                      <input
                        type="checkbox"
                        checked={!!isPacked}
                        onChange={() => togglePacked(s.awb_number)}
                        className="w-4 h-4 rounded text-blue-600 cursor-pointer accent-blue-600"
                        id={`my-pack-check-${s.awb_number}`}
                      />
                    </td>
                    <td>
                      <strong className={`font-mono text-xs ${isPacked ? 'line-through text-muted' : ''}`}>
                        {s.awb_number}
                      </strong>
                    </td>
                    <td>
                      <span className="font-mono text-xs text-muted">{s.order_id}</span>
                    </td>
                    <td>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-700 dark:text-blue-300 font-bold font-mono">
                        {s?.code || s?.product_name || 'PROD'}
                      </span>
                    </td>
                    <td>
                      <strong className="text-xs">{s?.product_name || 'Standard Product'}</strong>
                    </td>
                    <td>
                      <strong className="text-xs font-bold font-mono">{s.quantity}x</strong>
                    </td>
                    <td>
                      <span className="text-xs text-muted">{s.destination_city}</span>
                    </td>
                    <td>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${s.payment_mode === 'COD' ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300' : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'}`}>
                        {s.payment_mode}
                      </span>
                    </td>
                    <td className="text-right">
                      <button
                        className="small-button"
                        onClick={() => {
                          showToast(`Printing 4x6 label for ${s.awb_number}`)
                        }}
                        title="Print 4x6 Thermal Label"
                      >
                        <Printer size={12} /> Print
                      </button>
                    </td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan={9} className="text-center py-6 text-muted">
                  No shipments assigned for this date.
                </td>
              </tr>
            )}
          </tbody>
        </TableWrap>
      </section>
    </div>
  )
}

// ----------------------------------------------------------------------
// 2. PROCESS LABELS VIEW
// ----------------------------------------------------------------------
type SortMode = 'sku_grouped' | 'worker_sku' | 'category_sku' | 'original_page' | 'awb_order'

function sortClientLabels(labels: ParsedLabelItem[], mode: SortMode): ParsedLabelItem[] {
  const cloned: ParsedLabelItem[] = labels.map((l, idx) => ({
    ...l,
    original_page: l.original_page || l.page || idx + 1,
    items: [...l.items],
  }))

  const naturalCompare = (a: string, b: string) =>
    a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })

  switch (mode) {
    case 'sku_grouped': {
      // Group identical primary SKUs together consecutively (e.g. all SE-3B on 1..4, AX6 on 5..8, R1 on 9..11)
      cloned.sort((a, b) => {
        const skuA = (a.items[0]?.product || a.items[0]?.raw_sku || 'Unmapped').toUpperCase()
        const skuB = (b.items[0]?.product || b.items[0]?.raw_sku || 'Unmapped').toUpperCase()
        const diff = naturalCompare(skuA, skuB)
        if (diff !== 0) return diff

        return (a.original_page || 0) - (b.original_page || 0)
      })
      break
    }

    case 'worker_sku': {
      const workerRank: Record<string, number> = { Sohel: 1, 'Kartik Da': 2 }
      cloned.sort((a, b) => {
        const workerA = a.items[0]?.assigned_worker || 'Sohel'
        const workerB = b.items[0]?.assigned_worker || 'Sohel'

        const rankA = workerRank[workerA] || 99
        const rankB = workerRank[workerB] || 99
        if (rankA !== rankB) return rankA - rankB

        const skuA = (a.items[0]?.product || a.items[0]?.raw_sku || 'Unmapped').toUpperCase()
        const skuB = (b.items[0]?.product || b.items[0]?.raw_sku || 'Unmapped').toUpperCase()
        const diff = naturalCompare(skuA, skuB)
        if (diff !== 0) return diff

        return (a.original_page || 0) - (b.original_page || 0)
      })
      break
    }

    case 'category_sku': {
      cloned.sort((a, b) => {
        const descA = (a.items[0]?.description || a.items[0]?.product || '').toUpperCase()
        const descB = (b.items[0]?.description || b.items[0]?.product || '').toUpperCase()
        const diff = naturalCompare(descA, descB)
        if (diff !== 0) return diff

        const skuA = (a.items[0]?.product || a.items[0]?.raw_sku || '').toUpperCase()
        const skuB = (b.items[0]?.product || b.items[0]?.raw_sku || '').toUpperCase()
        return naturalCompare(skuA, skuB)
      })
      break
    }

    case 'original_page': {
      cloned.sort((a, b) => (a.original_page || a.page || 0) - (b.original_page || b.page || 0))
      break
    }

    case 'awb_order': {
      cloned.sort((a, b) => naturalCompare(a.awb, b.awb))
      break
    }
  }

  // Count totals per SKU group
  const skuCounts = new Map<string, number>()
  cloned.forEach((item) => {
    const sku = item.items[0]?.product || item.items[0]?.raw_sku || 'Unmapped'
    skuCounts.set(sku, (skuCounts.get(sku) || 0) + 1)
  })

  // Assign group_page (1, 2, 3, 4) and global sequence (1, 2, 3...)
  const skuCurrentIndex = new Map<string, number>()
  let currentGroup = ''
  let groupIndex = 0

  return cloned.map((item, idx) => {
    const sku = item.items[0]?.product || item.items[0]?.raw_sku || 'Unmapped'
    const currIndex = (skuCurrentIndex.get(sku) || 0) + 1
    skuCurrentIndex.set(sku, currIndex)

    if (sku !== currentGroup) {
      currentGroup = sku
      groupIndex++
    }

    const groupTotal = skuCounts.get(sku) || 1

    return {
      ...item,
      page: mode === 'original_page' ? (item.original_page || idx + 1) : idx + 1,
      sequence: idx + 1,
      group_page: currIndex,
      group_total: groupTotal,
      sku_group: sku,
      sku_group_index: groupIndex,
    }
  })
}

function ProcessLabelsView({
  go,
  showToast,
  batchData: externalBatchData,
  setBatchData: setExternalBatchData,
  processing: externalProcessing,
  setProcessing: setExternalProcessing,
  currentStep: externalCurrentStep,
  setCurrentStep: setExternalCurrentStep,
}: any) {
  const [internalProcessing, setInternalProcessing] = useState(false)
  const [internalCurrentStep, setInternalCurrentStep] = useState(0)
  const [internalBatchData, setInternalBatchData] = useState<ProcessBatchResponse | null>(null)

  const processing = externalProcessing !== undefined ? externalProcessing : internalProcessing
  const setProcessing = (val: any) => {
    if (setExternalProcessing) setExternalProcessing(val)
    setInternalProcessing(val)
  }

  const currentStep = externalCurrentStep !== undefined ? externalCurrentStep : internalCurrentStep
  const setCurrentStep = (val: any) => {
    if (setExternalCurrentStep) setExternalCurrentStep(val)
    setInternalCurrentStep(val)
  }

  const batchData = externalBatchData !== undefined ? externalBatchData : internalBatchData
  const setBatchData = (val: any) => {
    if (setExternalBatchData) setExternalBatchData(val)
    setInternalBatchData(val)
  }

  const [sortMode, setSortMode] = useState<SortMode>('sku_grouped')
  const [selectedSkuCluster, setSelectedSkuCluster] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState<'all' | 'mapped' | 'duplicate' | 'unknown' | 'mismatch'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [trainItem, setTrainItem] = useState<{ raw_sku: string; description: string; seen?: number } | null>(null)
  const [duplicateModalItem, setDuplicateModalItem] = useState<ParsedLabelItem | null>(null)
  const [mismatchModalItem, setMismatchModalItem] = useState<ParsedLabelItem | null>(null)
  const [confirming, setConfirming] = useState(false)

  // Listen to global clear-all event
  useEffect(() => {
    const handleClear = () => {
      setBatchData(null)
      setSelectedSkuCluster(null)
      setSearchQuery('')
      setActiveFilter('all')
    }
    window.addEventListener('warehouse:clear-all', handleClear)
    return () => window.removeEventListener('warehouse:clear-all', handleClear)
  }, [])

  const steps = [
    'Reading pages',
    'Extracting AWBs',
    'Reading SKUs',
    'Checking duplicates',
    'Mapping products',
    'Cropping labels',
    'Sorting labels',
    'Ready for review',
  ]

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setProcessing(true)
    setCurrentStep(0)

    // Simulate animated stepper progression through pipeline
    const interval = setInterval(() => {
      setCurrentStep((prev: number) => {
        if (prev < 6) return prev + 1
        return prev
      })
    }, 280)

    try {
      const result = await processLabels(Array.from(files), sortMode)
      clearInterval(interval)
      setCurrentStep(7)
      setBatchData(result)
      showToast(`Batch #${result.batch_id} ready for review: ${result.unique_awbs} unique AWBs`)
      revalidateWarehouseData()
    } catch (err: any) {
      clearInterval(interval)
      alert(err?.message || 'Failed to process PDF')
    } finally {
      setProcessing(false)
    }
  }

  const handleConfirmBatch = async () => {
    if (!batchData) return
    setConfirming(true)
    try {
      await confirmBatch(batchData.batch_id)
      setBatchData({ ...batchData, status: 'confirmed' })
      showToast(`Batch #${batchData.batch_id} successfully confirmed into warehouse accounting!`)
      revalidateWarehouseData()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setConfirming(false)
    }
  }

  const handlePrint = async () => {
    if (!batchData) return
    try {
      await recordPrintEvent(batchData.batch_id, 'Sohel', 'full_batch')
      window.open(`/batches/${batchData.batch_id}/pdf?sort=${sortMode}`, '_blank')
      showToast(`Print opened in real-time sequence (${sortModeLabel(sortMode)}).`)
      revalidateWarehouseData()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const sortModeLabel = (mode: SortMode) => {
    switch (mode) {
      case 'sku_grouped':
        return 'Group by SKU (Sequential 1,2,3,4...)'
      case 'worker_sku':
        return 'Worker Grouping (Sohel ➔ Kartik Da)'
      case 'category_sku':
        return 'Product Category'
      case 'original_page':
        return 'Original PDF Order'
      case 'awb_order':
        return 'AWB Alphanumeric'
    }
  }

  // Live real-time sorted labels
  const rawLabels = batchData?.labels || []
  const sortedLabels = React.useMemo(() => {
    return sortClientLabels(rawLabels, sortMode)
  }, [rawLabels, sortMode])

  // Extract contiguous SKU clusters for quick visualization & filtering
  const clusters = React.useMemo(() => {
    const list: { name: string; count: number; startSeq: number; endSeq: number; origPages: number[] }[] = []
    let current: { name: string; count: number; startSeq: number; endSeq: number; origPages: number[] } | null = null

    sortedLabels.forEach((l, idx) => {
      const skuName = l.items[0]?.product || l.items[0]?.raw_sku || 'Mixed'
      const origPg = l.original_page || l.page || idx + 1
      if (!current || current.name !== skuName) {
        if (current) list.push(current)
        current = { name: skuName, count: 1, startSeq: idx + 1, endSeq: idx + 1, origPages: [origPg] }
      } else {
        current.count++
        current.endSeq = idx + 1
        current.origPages.push(origPg)
      }
    })
    if (current) list.push(current)
    return list
  }, [sortedLabels])

  const filteredLabels = sortedLabels.filter((l) => {
    const isUnknown = l.items.some((i) => i.mapping_status === 'unknown')
    const isDup = l.duplicate
    const isMismatch = l.mismatch
    const skuName = l.items[0]?.product || l.items[0]?.raw_sku || 'Unmapped'

    if (selectedSkuCluster && skuName !== selectedSkuCluster) return false

    if (activeFilter === 'duplicate' && !isDup) return false
    if (activeFilter === 'unknown' && !isUnknown) return false
    if (activeFilter === 'mismatch' && !isMismatch) return false
    if (activeFilter === 'mapped' && (isUnknown || isDup || isMismatch)) return false

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      const matchAwb = l.awb.toLowerCase().includes(q)
      const matchOrder = l.order_id.toLowerCase().includes(q)
      const matchCust = (l.customer_name || '').toLowerCase().includes(q)
      const matchSku = l.items.some(
        (i) => i.raw_sku.toLowerCase().includes(q) || (i.product || '').toLowerCase().includes(q)
      )
      if (!matchAwb && !matchOrder && !matchCust && !matchSku) return false
    }

    return true
  })

  return (
    <>
      <PageHead
        eyebrow="Operations / Process labels"
        title="Process Flipkart Labels"
        description="Upload Flipkart shipping-label PDFs. Automatically crops out invoices, extracts AWBs & SKUs, and sorts labels in contiguous sequence."
        action={
          <div className="flex gap-2">
            {batchData && (
              <button className="button dark-button" id="print-batch-top-btn" onClick={handlePrint}>
                <Printer size={16} /> Print sorted labels ({sortModeLabel(sortMode).split(' ')[0]})
              </button>
            )}
          </div>
        }
      />

      {/* Process Grid: Upload Zone & Summary */}
      <div className="process-grid">
        <div className="panel upload-panel" id="upload-panel">
          <div className="panel-title">
            <div>
              <h2>Upload Flipkart label PDF</h2>
              <p>Supports multi-file bulk uploads (up to 50 MB each)</p>
            </div>
            <Badge kind={batchData ? 'success' : 'neutral'}>
              {batchData ? 'PDF Loaded' : 'Step 1: Upload'}
            </Badge>
          </div>

          <div
            className={`upload-zone ${batchData ? 'uploaded' : ''}`}
            onClick={() => document.getElementById('label-pdf-input')?.click()}
          >
            <input
              id="label-pdf-input"
              type="file"
              accept="application/pdf,.pdf"
              multiple
              hidden
              onChange={(e) => handleFiles(e.target.files)}
            />
            <div className="upload-icon">
              {processing ? (
                <RefreshCw size={26} className="animate-spin text-blue-500" />
              ) : batchData ? (
                <FileCheck2 size={26} />
              ) : (
                <Upload size={26} />
              )}
            </div>

            <h3>{batchData ? batchData.filename : 'Drop Flipkart label PDF here'}</h3>
            <p>
              {batchData
                ? `${batchData.pages_scanned} pages extracted and sorted in real-time`
                : 'Click to browse or drag & drop PDF files from computer'}
            </p>

            {!batchData && (
              <button className="button primary mt-2">
                <Upload size={16} /> Choose PDF files
              </button>
            )}

            {batchData && (
              <button className="text-button mt-1" onClick={(e) => { e.stopPropagation(); document.getElementById('label-pdf-input')?.click() }}>
                Upload different file
              </button>
            )}
          </div>

          {/* 8-Step Pipeline */}
          <div className="steps">
            {steps.map((s, i) => {
              const isDone = batchData || (processing && i < currentStep)
              const isCurr = processing && i === currentStep
              return (
                <div key={s} className={`step ${isDone ? 'done' : isCurr ? 'current' : ''}`}>
                  <span>{isDone ? <Check size={13} /> : i + 1}</span>
                  {s}
                </div>
              )
            })}
          </div>
        </div>

        {/* Summary Panel */}
        <div className="panel summary-panel" id="summary-panel">
          <div className="panel-title">
            <div>
              <h2>Batch summary preview</h2>
              <p>{batchData ? `Batch #${batchData.batch_id} • ${batchData.processing_date}` : 'Waiting for PDF'}</p>
            </div>
            {batchData && <StatusBadge value={batchData.status} />}
          </div>

          <div className="mini-stats">
            <div>
              <span>Pages scanned</span>
              <strong>{batchData ? batchData.pages_scanned : '—'}</strong>
            </div>
            <div>
              <span>Unique AWBs</span>
              <strong className="text-emerald-500">{batchData ? batchData.unique_awbs : '—'}</strong>
            </div>
            <div>
              <span>Duplicate AWBs</span>
              <strong className="amber-text">{batchData ? batchData.duplicate_awbs : '—'}</strong>
            </div>
            <div>
              <span>Total items</span>
              <strong>{batchData ? batchData.total_items : '—'}</strong>
            </div>
            <div>
              <span>Unknown SKUs</span>
              <strong className="rose-text">{batchData ? batchData.unknown_skus : '—'}</strong>
            </div>
            <div>
              <span>Active Sorting</span>
              <strong className="text-xs text-blue-400 font-semibold">{sortMode === 'sku_grouped' ? 'SKU Sequence' : sortMode === 'worker_sku' ? 'Worker Grouped' : 'Custom'}</strong>
            </div>
          </div>

          <div className="summary-note">
            <ShieldAlert size={18} />
            <span>
              <strong>Real-time sorting active:</strong> Identical SKUs are grouped into unbroken sequences (e.g. SE-3B pg 1, 27, 28, 34 ➔ Seq 1, 2, 3, 4; AX6 pg 2, 9, 40, 57 ➔ Seq 5, 6, 7, 8).
            </span>
          </div>
        </div>
      </div>

      {/* Real-time Sorting Toolbar & SKU Cluster Strip */}
      {batchData && (
        <section className="panel mb-6 p-4 border border-blue-500/30 bg-slate-900/40" id="realtime-sorting-controls">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-blue-400" />
              <div>
                <h3 className="text-sm font-bold text-foreground">Real-time Label Sequence & Sorting</h3>
                <p className="text-xs text-muted">Select grouping rule to instantly reorganize labels & thermal print sequence</p>
              </div>
            </div>

            {/* Sort Mode Buttons */}
            <div className="flex flex-wrap items-center gap-1.5" id="sort-mode-selector">
              <button
                className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                  sortMode === 'sku_grouped'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'bg-card border border-border text-muted hover:text-foreground'
                }`}
                onClick={() => setSortMode('sku_grouped')}
                id="sort-sku-grouped-btn"
                title="Group identical SKUs sequentially (1,2,3,4...)"
              >
                <Tags size={13} /> Group by SKU (1,2,3,4...)
              </button>

              <button
                className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                  sortMode === 'worker_sku'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'bg-card border border-border text-muted hover:text-foreground'
                }`}
                onClick={() => setSortMode('worker_sku')}
                id="sort-worker-sku-btn"
                title="Group by assigned worker first, then SKU"
              >
                <Users size={13} /> Worker ➔ SKU
              </button>

              <button
                className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                  sortMode === 'category_sku'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'bg-card border border-border text-muted hover:text-foreground'
                }`}
                onClick={() => setSortMode('category_sku')}
                id="sort-category-sku-btn"
                title="Group by product category description"
              >
                <FolderTree size={13} /> Category
              </button>

              <button
                className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                  sortMode === 'original_page'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'bg-card border border-border text-muted hover:text-foreground'
                }`}
                onClick={() => setSortMode('original_page')}
                id="sort-original-page-btn"
                title="Show original PDF upload order"
              >
                <FileText size={13} /> Original PDF
              </button>

              <button
                className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                  sortMode === 'awb_order'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'bg-card border border-border text-muted hover:text-foreground'
                }`}
                onClick={() => setSortMode('awb_order')}
                id="sort-awb-order-btn"
                title="Sort by AWB alphanumeric sequence"
              >
                <ClipboardList size={13} /> AWB Order
              </button>
            </div>
          </div>

          {/* SKU Cluster Ribbon */}
          <div className="pt-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted flex items-center gap-1.5">
                <Box size={13} className="text-emerald-400" />
                Contiguous Sequence Clusters ({clusters.length} groups):
              </span>
              {selectedSkuCluster && (
                <button
                  className="text-xs text-blue-400 hover:underline flex items-center gap-1"
                  onClick={() => setSelectedSkuCluster(null)}
                >
                  <X size={12} /> Clear cluster filter
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto pr-1">
              {clusters.map((c) => {
                const isSelected = selectedSkuCluster === c.name
                return (
                  <button
                    key={c.name}
                    className={`text-xs px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 border ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                        : 'bg-card/80 border-border hover:border-emerald-500/50 text-foreground'
                    }`}
                    onClick={() => setSelectedSkuCluster(isSelected ? null : c.name)}
                    title={`Click to filter to ${c.name} (Orig Pgs: ${c.origPages.join(', ')})`}
                  >
                    <span className="font-bold">{c.name}</span>
                    <span className="bg-slate-800/80 px-1.5 py-0.2 rounded text-[11px] font-mono text-emerald-300">
                      {c.count} {c.count === 1 ? 'unit' : 'units'}
                    </span>
                    <span className="text-[10px] text-muted">
                      (Seq #{c.startSeq}{c.count > 1 ? `–#${c.endSeq}` : ''})
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* Label Review Section */}
      {batchData && (
        <section className="panel review-panel" id="label-review-panel">
          <div className="section-head">
            <div>
              <h2>Label review & verification</h2>
              <p>
                Showing {filteredLabels.length} of {sortedLabels.length} extracted shipping labels •
                Sorted in real-time by <strong>{sortModeLabel(sortMode)}</strong>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="search w-64">
                <Search size={15} />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter by AWB, SKU, customer..."
                />
              </div>

              <div className="filter-actions">
                <button
                  className={`button ${activeFilter === 'all' ? 'primary' : 'secondary'}`}
                  onClick={() => setActiveFilter('all')}
                >
                  All ({sortedLabels.length})
                </button>
                <button
                  className={`button ${activeFilter === 'unknown' ? 'primary' : 'secondary'}`}
                  onClick={() => setActiveFilter('unknown')}
                >
                  Unknown ({sortedLabels.filter((l) => l.items.some((i) => i.mapping_status === 'unknown')).length})
                </button>
                <button
                  className={`button ${activeFilter === 'duplicate' ? 'primary' : 'secondary'}`}
                  onClick={() => setActiveFilter('duplicate')}
                >
                  Duplicates ({sortedLabels.filter((l) => l.duplicate).length})
                </button>
                <button
                  className={`button ${activeFilter === 'mismatch' ? 'primary' : 'secondary'}`}
                  onClick={() => setActiveFilter('mismatch')}
                >
                  Mismatches ({sortedLabels.filter((l) => l.mismatch).length})
                </button>
              </div>
            </div>
          </div>

          <TableWrap>
            <thead>
              <tr>
                <th style={{ width: 90 }}>Seq #</th>
                <th>Orig Pg</th>
                <th>AWB / Order ID</th>
                <th>Customer</th>
                <th>Product / Flipkart SKU</th>
                <th>Qty</th>
                <th>Worker</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLabels.map((l, index) => {
                const isUnknown = l.items.some((i) => i.mapping_status === 'unknown')
                const currentSku = l.items[0]?.product || l.items[0]?.raw_sku || 'Unmapped'
                const prevSku = index > 0 ? (filteredLabels[index - 1].items[0]?.product || filteredLabels[index - 1].items[0]?.raw_sku || 'Unmapped') : null
                const isFirstOfGroup = index === 0 || currentSku !== prevSku
                const worker = l.items[0]?.assigned_worker || 'Sohel'

                return (
                  <React.Fragment key={`${l.page}-${l.awb}-${index}`}>
                    {/* SKU Group Divider Header */}
                    {isFirstOfGroup && sortMode === 'sku_grouped' && (
                      <tr className="bg-slate-800/40 border-y border-blue-500/20">
                        <td colSpan={9} className="py-1.5 px-3">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-blue-400 flex items-center gap-1.5">
                              <Tags size={12} /> {currentSku} Group
                            </span>
                            <span className="text-[11px] text-muted font-mono">
                              Sequential pick sequence ({l.group_total || 1} {l.group_total === 1 ? 'label' : 'labels'})
                            </span>
                          </div>
                        </td>
                      </tr>
                    )}
                    <tr className={l.duplicate ? 'bg-amber-500/5' : l.mismatch ? 'bg-rose-500/5' : ''}>
                      <td>
                        <div className="flex flex-col gap-0.5">
                          <span className="inline-flex items-center px-2 py-0.5 rounded font-mono font-bold text-xs bg-blue-500/15 text-blue-400 border border-blue-500/30">
                            #{l.sequence || l.page}
                          </span>
                          {l.group_total && l.group_total > 1 ? (
                            <span className="text-[10px] font-mono text-emerald-400 font-semibold">
                              Pg {l.group_page}/{l.group_total}
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="text-muted font-mono text-xs">
                        Pg {l.original_page || l.page}
                      </td>
                      <td>
                        <strong className="mono block">{l.awb}</strong>
                        <small className="mono text-muted">{l.order_id}</small>
                      </td>
                      <td>
                        <div>
                          <strong>{l.customer_name || 'Customer'}</strong>
                          <small className="text-muted">{l.customer_city}</small>
                        </div>
                      </td>
                      <td>
                        {l.items.map((item, idx) => (
                          <div key={idx} className={idx > 0 ? 'mt-1 pt-1 border-t border-slate-700/20' : ''}>
                            <strong>{item.product || <span className="rose-text">Unknown Product</span>}</strong>
                            <small className="mono block text-muted">{item.raw_sku}</small>
                          </div>
                        ))}
                      </td>
                      <td>
                        {l.items.map((item, idx) => (
                          <div key={idx}>
                            <strong>{item.quantity}</strong>
                          </div>
                        ))}
                      </td>
                      <td>
                        <span className="worker-name">
                          <i
                            className={`dot ${
                              worker === 'Kartik Da' ? 'teal' : 'blue'
                            }`}
                          />
                          {worker}
                        </span>
                      </td>
                      <td>
                        <div className="flex flex-col gap-1 items-start">
                          {l.mismatch ? (
                            <StatusBadge value="Mismatch" />
                          ) : l.duplicate ? (
                            <StatusBadge value="Duplicate" />
                          ) : isUnknown ? (
                            <StatusBadge value="Unknown" />
                          ) : (
                            <StatusBadge value="Mapped" />
                          )}

                          {l.duplicate && !l.mismatch && (
                            <small className="table-note">Counted previously</small>
                          )}
                          {l.mismatch && (
                            <small className="text-rose-500 font-semibold">SKU mismatch with DB</small>
                          )}
                        </div>
                      </td>
                      <td className="text-right">
                        {isUnknown ? (
                          <button
                            className="small-button"
                            id={`train-btn-${l.page}`}
                            onClick={() =>
                              setTrainItem({
                                raw_sku: l.items.find((i) => i.mapping_status === 'unknown')?.raw_sku || '',
                                description: l.items.find((i) => i.mapping_status === 'unknown')?.description || '',
                              })
                            }
                          >
                            Train SKU
                          </button>
                        ) : l.mismatch ? (
                          <button className="small-button" onClick={() => setMismatchModalItem(l)}>
                            Review Mismatch
                          </button>
                        ) : l.duplicate ? (
                          <button className="small-button" onClick={() => setDuplicateModalItem(l)}>
                            Reprint Info
                          </button>
                        ) : (
                          <span className="text-xs text-muted">Ready</span>
                        )}
                      </td>
                    </tr>
                  </React.Fragment>
                )
              })}
            </tbody>
          </TableWrap>
        </section>
      )}

      {/* Sticky Confirmation Bar */}
      {batchData && (
        <div className="confirm-bar" id="sticky-confirm-bar">
          <div>
            <strong>
              {batchData.unique_awbs} unique labels will be counted into warehouse stock-out
            </strong>
            <span>
              {batchData.duplicate_awbs} duplicates ignored in accounting • {batchData.unknown_skus} SKUs require training
            </span>
          </div>

          <div className="bar-actions">
            <button
              className="button secondary"
              id="cancel-batch-btn"
              onClick={async () => {
                if (window.confirm('Cancel this batch?')) {
                  await cancelBatch(batchData.batch_id)
                  setBatchData(null)
                  showToast('Batch cancelled')
                }
              }}
            >
              Cancel
            </button>

            <button
              className="button primary"
              id="confirm-batch-btn"
              disabled={batchData.status === 'confirmed' || confirming}
              onClick={handleConfirmBatch}
            >
              {batchData.status === 'confirmed' ? (
                <>
                  <Check size={16} /> Batch Confirmed
                </>
              ) : confirming ? (
                'Confirming...'
              ) : (
                'Confirm batch'
              )}
            </button>

            <button className="button dark-button" id="print-action-btn" onClick={handlePrint}>
              <Printer size={16} /> Print cropped PDF ({sortModeLabel(sortMode).split(' ')[0]})
            </button>
          </div>
        </div>
      )}

      {/* Train SKU Modal */}
      {trainItem && (
        <TrainSkuModal
          skuItem={trainItem}
          close={() => setTrainItem(null)}
          onTrained={(mappedName: string) => {
            showToast(`Mapped ${trainItem.raw_sku} → ${mappedName}. All matching labels updated.`)
            setTrainItem(null)
            // Refresh batch labels if loaded
            if (batchData) {
              const updatedLabels = batchData.labels.map((l: ParsedLabelItem) => ({
                ...l,
                items: l.items.map((i: any) =>
                  i.raw_sku === trainItem.raw_sku
                    ? { ...i, product: mappedName, mapping_status: 'mapped' as const }
                    : i
                ),
              }))
              setBatchData({ ...batchData, labels: updatedLabels })
            }
          }}
        />
      )}

      {/* Duplicate Info Modal */}
      {duplicateModalItem && (
        <Modal title="Already Processed Shipment" close={() => setDuplicateModalItem(null)}>
          <div className="warning-box">
            <ShieldAlert size={20} />
            <p>
              This shipment has already been counted in previous batches. You can reprint it freely, but its products and PackCalc materials will not be counted again.
            </p>
          </div>

          <div className="detail-row">
            <span>AWB Number</span>
            <strong className="mono">{duplicateModalItem.awb}</strong>
          </div>
          <div className="detail-row">
            <span>Order ID</span>
            <strong className="mono">{duplicateModalItem.order_id}</strong>
          </div>
          <div className="detail-row">
            <span>Customer</span>
            <strong>{duplicateModalItem.customer_name} ({duplicateModalItem.customer_city})</strong>
          </div>
          <div className="detail-row">
            <span>Items</span>
            <strong>{duplicateModalItem.items.map((i) => `${i.product || i.raw_sku} x ${i.quantity}`).join(', ')}</strong>
          </div>

          <ModalActions
            close={() => setDuplicateModalItem(null)}
            primary="Reprint Label"
            onPrimary={() => {
              setDuplicateModalItem(null)
              window.open(`/batches/${batchData?.batch_id}/pdf`, '_blank')
            }}
          />
        </Modal>
      )}

      {/* Mismatch Modal */}
      {mismatchModalItem && (
        <Modal title="AWB Data Mismatch Warning" close={() => setMismatchModalItem(null)}>
          <div className="warning-box">
            <AlertTriangle size={20} />
            <p>
              This AWB exists in database with different SKU / quantity details. Accounting data was not silently modified.
            </p>
          </div>

          <div className="detail-row">
            <span>AWB</span>
            <strong className="mono">{mismatchModalItem.awb}</strong>
          </div>
          <div className="detail-row">
            <span>Database Items</span>
            <strong className="text-amber-500">{mismatchModalItem.existing_items_desc || 'R16S x 1'}</strong>
          </div>
          <div className="detail-row">
            <span>Uploaded PDF Items</span>
            <strong className="text-blue-500">{mismatchModalItem.items.map((i) => `${i.product || i.raw_sku} x ${i.quantity}`).join(', ')}</strong>
          </div>

          <ModalActions
            close={() => setMismatchModalItem(null)}
            primary="Keep Existing Record"
            onPrimary={() => setMismatchModalItem(null)}
          />
        </Modal>
      )}
    </>
  )
}

// ----------------------------------------------------------------------
// 3. PRODUCTS & RECIPES VIEW
// ----------------------------------------------------------------------
function ProductsView({ showToast }: any) {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [workerFilter, setWorkerFilter] = useState('all')
  const [familyFilter, setFamilyFilter] = useState('all')
  const [activeOnly, setActiveOnly] = useState(false)
  const [dialog, setDialog] = useState<string | null>(null)
  const [editingProduct, setEditingProduct] = useState<ApiProduct | null>(null)

  const { data: products = [], mutate: refreshProducts } = useSWR('/products', () => getProducts(true))
  const { data: categories = [], mutate: refreshCategories } = useSWR('/categories', getCategories)
  const { data: workers = [] } = useSWR('/workers', getWorkers)

  const filtered = products.filter((p) => {
    const matchSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.internal_code || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.category || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.notes || '').toLowerCase().includes(search.toLowerCase())
    const matchCat = categoryFilter === 'all' || (p.category || 'General').toLowerCase() === categoryFilter.toLowerCase()
    const matchWorker = workerFilter === 'all' || p.assigned_worker?.toLowerCase() === workerFilter.toLowerCase()
    const matchFamily = familyFilter === 'all' || (p.bag_family || 'None').toLowerCase() === familyFilter.toLowerCase()
    const matchActive = !activeOnly || p.active
    return matchSearch && matchCat && matchWorker && matchFamily && matchActive
  })

  // Quick stats
  const totalActive = products.filter((p) => p.active).length
  const bagProducts = products.filter((p) => p.bag_family)
  const sohelCount = products.filter((p) => p.assigned_worker === 'Sohel').length
  const kartikCount = products.filter((p) => p.assigned_worker === 'Kartik Da').length

  return (
    <>
      <PageHead
        eyebrow="Catalog / Product Library"
        title="Product Library & PackCalc Recipes"
        description="Manage canonical warehouse products, worker picking inheritance, and garbage-bag raw material recipes."
        action={
          <div className="flex gap-2">
            <button
              className="button secondary"
              id="new-category-btn"
              onClick={async () => {
                const name = window.prompt('New category name (e.g. Tripod, Selfie Stick, Lights):')
                if (name && name.trim()) {
                  try {
                    await createCategory({ name: name.trim() })
                    refreshCategories()
                    revalidateWarehouseData()
                    showToast(`Category "${name.trim()}" created successfully!`)
                  } catch (e: any) {
                    alert(e.message)
                  }
                }
              }}
            >
              <Plus size={15} /> New Category
            </button>
            <button
              className="button primary"
              id="add-product-btn"
              onClick={() => {
                setEditingProduct(null)
                setDialog('product')
              }}
            >
              <Plus size={16} /> Add Product
            </button>
          </div>
        }
      />

      {/* Catalog Summary Stats */}
      <div className="stats-grid four mb-6" id="product-stats-grid">
        <Stat
          label="Total Products"
          value={products.length}
          note={`${totalActive} Active / ${products.length - totalActive} Inactive`}
          icon={Package}
          tone="blue"
        />
        <Stat
          label="PackCalc Recipes"
          value={bagProducts.length}
          note="Configured Bag Families"
          icon={Calculator}
          tone="amber"
        />
        <Stat
          label="Warehouse Categories"
          value={categories.length}
          note="Product Classifications"
          icon={FolderTree}
          tone="teal"
        />
        <Stat
          label="Picking Floor Stations"
          value={`${sohelCount} / ${kartikCount}`}
          note="Sohel (My) vs Kartik Da"
          icon={Users}
          tone="purple"
        />
      </div>

      {/* Advanced Toolbar */}
      <div className="toolbar flex-wrap gap-3">
        <div className="search flex-1 min-w-[220px]">
          <Search size={16} />
          <input
            id="search-products-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, code (R1S, AX6), category, specs..."
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="text-xs text-muted hover:text-foreground px-1"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-transparent border border-border rounded-lg px-3 py-1.5 text-xs text-foreground font-medium"
        >
          <option value="all">All Categories ({categories.length})</option>
          {categories.map((c) => (
            <option key={c.id} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          value={workerFilter}
          onChange={(e) => setWorkerFilter(e.target.value)}
          className="bg-transparent border border-border rounded-lg px-3 py-1.5 text-xs text-foreground font-medium"
        >
          <option value="all">All Workers</option>
          {workers.map((w) => (
            <option key={w.id} value={w.name}>
              {w.name} Station
            </option>
          ))}
        </select>

        <select
          value={familyFilter}
          onChange={(e) => setFamilyFilter(e.target.value)}
          className="bg-transparent border border-border rounded-lg px-3 py-1.5 text-xs text-foreground font-medium"
        >
          <option value="all">All Bag Families</option>
          <option value="Star">Star Family</option>
          <option value="Averx">Averx Family</option>
          <option value="Plain">Plain Family</option>
          <option value="None">Non-Bag Products</option>
        </select>

        <label className="flex items-center gap-2 text-xs text-muted cursor-pointer select-none">
          <input
            type="checkbox"
            checked={activeOnly}
            onChange={(e) => setActiveOnly(e.target.checked)}
            className="rounded border-border"
          />
          Active only
        </label>

        <span className="result-count text-xs text-muted ml-auto font-medium">
          Showing {filtered.length} of {products.length} products
        </span>
      </div>

      {/* Products Table Panel */}
      <section className="panel" id="product-list-panel">
        <TableWrap>
          <thead>
            <tr>
              <th>Canonical Product</th>
              <th>Internal Code</th>
              <th>Category</th>
              <th>Picking Station</th>
              <th>PackCalc Bag Recipe</th>
              <th>Sort Order</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length > 0 ? (
              filtered.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="flex flex-col">
                      <strong className="text-sm font-semibold text-foreground">{p.name}</strong>
                      {p.notes && <span className="text-xs text-muted mt-0.5 line-clamp-1">{p.notes}</span>}
                    </div>
                  </td>
                  <td>
                    {p.internal_code ? (
                      <span className="mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {p.internal_code}
                      </span>
                    ) : (
                      <span className="text-muted text-xs">—</span>
                    )}
                  </td>
                  <td>
                    <Badge kind="neutral">{p.category || 'General'}</Badge>
                  </td>
                  <td>
                    <span className="worker-name">
                      <i className={`dot ${p.assigned_worker === 'Sohel' ? 'blue' : 'teal'}`} />
                      <span className="font-medium">{p.assigned_worker}</span>
                    </span>
                  </td>
                  <td>
                    {p.bag_family ? (
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        <span>{p.bag_family}</span>
                        <span className="text-[10px] text-muted">
                          ({p.raw_3bag_qty || 0}×3B + {p.raw_2bag_qty || 0}×2B)
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted text-xs">— Standard</span>
                    )}
                  </td>
                  <td>
                    <span className="mono text-xs text-muted font-medium">{p.sort_order}</span>
                  </td>
                  <td>
                    <StatusBadge value={p.active ? 'Active' : 'Inactive'} />
                  </td>
                  <td className="text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        className="small-button"
                        onClick={() => {
                          setEditingProduct(p)
                          setDialog('product')
                        }}
                      >
                        <Edit3 size={13} className="mr-1 inline" /> Edit
                      </button>
                      <button
                        className="icon-button text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                        title="Deactivate product"
                        onClick={async () => {
                          if (window.confirm(`Are you sure you want to deactivate or remove "${p.name}"?`)) {
                            await deleteProduct(p.id)
                            refreshProducts()
                            revalidateWarehouseData()
                            showToast(`Product "${p.name}" deactivated.`)
                          }
                        }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="text-center py-12 text-muted">
                  <Package size={28} className="mx-auto mb-2 text-muted opacity-40" />
                  <p className="font-medium text-sm">No products found matching your filters</p>
                  <p className="text-xs text-muted mt-1">Try adjusting your search terms or filters above</p>
                </td>
              </tr>
            )}
          </tbody>
        </TableWrap>
      </section>

      {/* Add / Edit Product Modal */}
      {dialog === 'product' && (
        <ProductModal
          product={editingProduct}
          categories={categories}
          workers={workers}
          close={() => {
            setDialog(null)
            setEditingProduct(null)
          }}
          onSaved={() => {
            refreshProducts()
            revalidateWarehouseData()
            showToast(editingProduct ? `Product "${editingProduct.name}" updated` : 'New product created')
            setDialog(null)
            setEditingProduct(null)
          }}
        />
      )}
    </>
  )
}

// ----------------------------------------------------------------------
// 4. TRAINING CENTER VIEW
// ----------------------------------------------------------------------
function TrainingCenterView({ showToast }: any) {
  const [tab, setTab] = useState<'unknown' | 'mapped' | 'rules' | 'history'>('unknown')
  const [selectedSkus, setSelectedSkus] = useState<string[]>([])
  const [trainTargetSku, setTrainTargetSku] = useState<UnknownSkuItem | null>(null)
  const [conflictItem, setConflictItem] = useState<any>(null)
  const [ruleModalOpen, setRuleModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [mappedSearch, setMappedSearch] = useState('')
  const [testSkuInput, setTestSkuInput] = useState('')

  const { data: stats, mutate: refreshStats } = useSWR('/training/stats', getTrainingStats)
  const { data: unknowns = [], mutate: refreshUnknowns } = useSWR('/training/unknown', getUnknownSkus)
  const { data: mappings = [], mutate: refreshMappings } = useSWR('/training/mappings', getSkuMappings)
  const { data: history = [], mutate: refreshHistory } = useSWR('/training/history', getTrainingHistory)
  const { data: rules = [], mutate: refreshRules } = useSWR('/training/rules', getPatternRules)
  const { data: products = [] } = useSWR('/products', () => getProducts(false))

  const toggleSelectSku = (sku: string) => {
    setSelectedSkus((prev) =>
      prev.includes(sku) ? prev.filter((s) => s !== sku) : [...prev, sku]
    )
  }

  const handleBulkTrain = async (productId: number) => {
    if (selectedSkus.length === 0) return
    const prod = products.find((p) => p.id === productId)
    try {
      await bulkMapSkus({ raw_skus: selectedSkus, product_id: productId })
      showToast(`Bulk trained ${selectedSkus.length} SKUs to "${prod?.name || 'Product'}" successfully!`)
      setSelectedSkus([])
      refreshUnknowns()
      refreshMappings()
      refreshStats()
      refreshHistory()
      revalidateWarehouseData()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleAcceptSuggestion = async (item: UnknownSkuItem) => {
    if (!item.suggestion) return
    try {
      await mapSku({
        raw_sku: item.raw_sku,
        product_id: item.suggestion.product_id,
        optional_worker_override: item.suggestion.worker !== 'Sohel' ? item.suggestion.worker : undefined,
        remember_mapping: true,
      })
      showToast(`Mapped "${item.raw_sku}" ➔ "${item.suggestion.product}"!`)
      refreshUnknowns()
      refreshMappings()
      refreshStats()
      refreshHistory()
      revalidateWarehouseData()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleUnmapSku = async (mappingId: number, rawSku: string) => {
    if (window.confirm(`Unmap rule for SKU "${rawSku}"? This will return it to unclassified.`)) {
      try {
        await deleteSkuMapping(mappingId)
        showToast(`Unmapped SKU "${rawSku}"`)
        refreshMappings()
        refreshUnknowns()
        refreshStats()
        refreshHistory()
        revalidateWarehouseData()
      } catch (err: any) {
        alert(err.message)
      }
    }
  }

  const handleUndo = async (historyId: number) => {
    try {
      await undoTraining(historyId)
      showToast('Training mapping reverted.')
      refreshUnknowns()
      refreshMappings()
      refreshStats()
      refreshHistory()
      revalidateWarehouseData()
    } catch (err: any) {
      alert(err.message)
    }
  }

  // Filtered lists
  const filteredUnknowns = unknowns.filter((u) =>
    !searchQuery ||
    u.raw_sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.suggestion?.product || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredMappings = mappings.filter((m) =>
    !mappedSearch ||
    m.raw_sku.toLowerCase().includes(mappedSearch.toLowerCase()) ||
    (m.product_name || '').toLowerCase().includes(mappedSearch.toLowerCase()) ||
    (m.category || '').toLowerCase().includes(mappedSearch.toLowerCase()) ||
    (m.assigned_worker || '').toLowerCase().includes(mappedSearch.toLowerCase())
  )

  // Pattern rule test engine
  const matchedTestRule = testSkuInput.trim() ? rules.find((r) => {
    const raw = testSkuInput.trim().toUpperCase()
    const val = r.value.toUpperCase()
    if (r.rule_type === 'starts_with') return raw.startsWith(val)
    if (r.rule_type === 'ends_with') return raw.endsWith(val)
    if (r.rule_type === 'contains') return raw.includes(val)
    if (r.rule_type === 'regex') {
      try { return new RegExp(r.value, 'i').test(raw) } catch { return false }
    }
    return false
  }) : null
  const matchedTestProduct = matchedTestRule?.product_id ? products.find((p) => p.id === matchedTestRule.product_id) : null

  return (
    <>
      <PageHead
        eyebrow="Catalog / Training Center"
        title="SKU Training & Rule Learning"
        description="Map raw Flipkart marketplace SKUs to canonical warehouse products. Train once to automatically classify and route all future batches."
        action={
          <div className="flex gap-2">
            <button
              className="button secondary"
              title="Sync with VS Code data/sku-rules.json"
              onClick={async () => {
                try {
                  await syncDatabaseWithDisk()
                  refreshStats()
                  refreshUnknowns()
                  refreshMappings()
                  refreshRules()
                  refreshHistory()
                  showToast('Synced with VS Code data/sku-rules.json successfully!')
                } catch {
                  showToast('Sync failed')
                }
              }}
            >
              <RefreshCw size={14} /> Sync VS Code Rules
            </button>
            <button className="button secondary" onClick={() => setRuleModalOpen(true)}>
              <Plus size={15} /> Add Pattern Rule
            </button>
          </div>
        }
      />

      {/* Training Stats Grid */}
      <div className="stats-grid four" id="training-stats-grid">
        <Stat
          label="Unmapped SKUs"
          value={stats?.unknown_skus ?? unknowns.length}
          note="Need classification"
          icon={Tags}
          tone={unknowns.length > 0 ? 'rose' : 'teal'}
        />
        <Stat
          label="Active SKU Mappings"
          value={stats?.mapped_skus ?? mappings.length}
          note="Exact mapped rules"
          icon={Check}
          tone="teal"
        />
        <Stat
          label="Pattern Rules"
          value={rules.length}
          note="Prefix / Contains rules"
          icon={GitBranch}
          tone="blue"
        />
        <Stat
          label="Recognition Rate"
          value={`${stats?.recognition_percentage ?? 100}%`}
          note="Automatic classification"
          icon={BarChart3}
          tone="teal"
        />
      </div>

      {/* Enhanced 4-Tabs Bar */}
      <div className="tabs">
        <button
          className={`tab ${tab === 'unknown' ? 'active' : ''}`}
          onClick={() => setTab('unknown')}
        >
          Unmapped SKUs{' '}
          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${unknowns.length > 0 ? 'bg-rose-500/10 text-rose-500' : 'bg-slate-100 text-slate-600'}`}>
            {unknowns.length}
          </span>
        </button>
        <button
          className={`tab ${tab === 'mapped' ? 'active' : ''}`}
          onClick={() => setTab('mapped')}
        >
          Active SKU Mappings{' '}
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600">
            {mappings.length}
          </span>
        </button>
        <button
          className={`tab ${tab === 'rules' ? 'active' : ''}`}
          onClick={() => setTab('rules')}
        >
          Pattern Rules{' '}
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600">
            {rules.length}
          </span>
        </button>
        <button
          className={`tab ${tab === 'history' ? 'active' : ''}`}
          onClick={() => setTab('history')}
        >
          Training Audit Log{' '}
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-600">
            {history.length}
          </span>
        </button>
      </div>

      {/* TAB 1: UNMAPPED SKUS */}
      {tab === 'unknown' && (
        <section className="panel" id="unmapped-skus-panel">
          <div className="section-head flex-wrap gap-3 pb-3 border-b border-border">
            <div>
              <h2 className="text-base font-bold">Unmapped Flipkart Marketplace SKUs</h2>
              <p className="text-xs text-muted mt-0.5">
                Review raw SKUs parsed from batches with AI similarity suggestions. Train each item once to classify all future batches.
              </p>
            </div>

            <div className="flex items-center gap-3 ml-auto">
              <div className="search w-64">
                <Search size={15} />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search unmapped SKUs..."
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="text-xs text-muted">
                    <X size={13} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Bulk Action Toolbar */}
          {selectedSkus.length > 0 && (
            <div className="p-3 my-3 bg-blue-500/10 border border-blue-500/30 rounded-xl flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-xs text-blue-600 dark:text-blue-400">
                  {selectedSkus.length} SKU{selectedSkus.length > 1 ? 's' : ''} Selected
                </span>
                <span className="text-muted text-xs">| Map selected items in one click:</span>
              </div>

              <div className="flex items-center gap-2">
                <select
                  id="bulk-product-select"
                  className="bg-card text-foreground text-xs rounded-lg px-3 py-1.5 border border-border font-medium"
                  onChange={(e) => {
                    if (e.target.value) handleBulkTrain(Number(e.target.value))
                  }}
                  defaultValue=""
                >
                  <option value="" disabled>
                    Choose Canonical Product...
                  </option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.category}) — {p.assigned_worker}
                    </option>
                  ))}
                </select>
                <button
                  className="button secondary text-xs py-1.5"
                  onClick={() => setSelectedSkus([])}
                >
                  Clear Selection
                </button>
              </div>
            </div>
          )}

          <TableWrap>
            <thead>
              <tr>
                <th style={{ width: 32 }}>
                  <input
                    type="checkbox"
                    checked={filteredUnknowns.length > 0 && selectedSkus.length === filteredUnknowns.length}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedSkus(filteredUnknowns.map((u) => u.raw_sku))
                      else setSelectedSkus([])
                    }}
                  />
                </th>
                <th>Raw Flipkart SKU</th>
                <th>Item Description</th>
                <th>Frequency</th>
                <th>AI Similarity Suggestion</th>
                <th>Worker Station</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredUnknowns.length > 0 ? (
                filteredUnknowns.map((u) => (
                  <tr key={u.raw_sku}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedSkus.includes(u.raw_sku)}
                        onChange={() => toggleSelectSku(u.raw_sku)}
                      />
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <strong className="mono text-xs font-bold text-foreground">{u.raw_sku}</strong>
                      </div>
                    </td>
                    <td>
                      <span className="text-xs text-muted line-clamp-1">{u.description || 'Flipkart Item'}</span>
                    </td>
                    <td>
                      <span className="badge badge-neutral font-semibold text-[11px]">
                        {u.seen || 1} batch{(u.seen || 1) > 1 ? 'es' : ''}
                      </span>
                    </td>
                    <td>
                      {u.suggestion ? (
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <Sparkles size={13} className="text-amber-500" />
                              <strong className="text-xs font-semibold">{u.suggestion.product}</strong>
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                                {Math.round(u.suggestion.confidence * 100)}% match
                              </span>
                            </div>
                            <small className="text-muted text-[10px] block mt-0.5">
                              Matched: {u.suggestion.matched_terms.join(', ')}
                            </small>
                          </div>

                          <button
                            className="small-button text-[11px] px-2 py-1 bg-emerald-600 text-white hover:bg-emerald-700 font-medium shrink-0"
                            title="1-Click Accept Suggestion"
                            onClick={() => handleAcceptSuggestion(u)}
                          >
                            <Check size={12} className="mr-1 inline" /> Accept
                          </button>
                        </div>
                      ) : (
                        <span className="text-muted text-xs italic">No confident AI match</span>
                      )}
                    </td>
                    <td>
                      <span className="worker-name">
                        <i className={`dot ${u.suggestion?.worker === 'Kartik Da' ? 'teal' : 'blue'}`} />
                        <span className="font-medium">{u.suggestion?.worker || 'Sohel'}</span>
                      </span>
                    </td>
                    <td className="text-right">
                      <button
                        className="small-button font-medium"
                        id={`train-sku-btn-${u.raw_sku}`}
                        onClick={() => setTrainTargetSku(u)}
                      >
                        <Edit3 size={12} className="mr-1 inline" /> Train SKU
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-muted">
                    <div className="max-w-md mx-auto space-y-2">
                      <CheckCircle2 size={32} className="mx-auto text-emerald-500" />
                      <p className="font-semibold text-foreground text-sm">
                        {searchQuery ? 'No unmapped SKUs match your search query' : 'All Marketplace SKUs Are Classified!'}
                      </p>
                      <p className="text-xs text-muted">
                        {searchQuery
                          ? 'Try clearing the search query to see all items.'
                          : 'Every SKU in your current batches is successfully mapped to canonical warehouse products.'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </TableWrap>
        </section>
      )}

      {/* TAB 2: ACTIVE SKU MAPPINGS */}
      {tab === 'mapped' && (
        <section className="panel" id="active-mappings-panel">
          <div className="section-head flex-wrap gap-3 pb-3 border-b border-border">
            <div>
              <h2 className="text-base font-bold">Active SKU Learned Mappings ({mappings.length})</h2>
              <p className="text-xs text-muted mt-0.5">
                Exact matches currently learned in memory and synchronized with <code className="mono">data/sku-rules.json</code>.
              </p>
            </div>

            <div className="search w-64 ml-auto">
              <Search size={15} />
              <input
                value={mappedSearch}
                onChange={(e) => setMappedSearch(e.target.value)}
                placeholder="Search raw SKU or product..."
              />
              {mappedSearch && (
                <button onClick={() => setMappedSearch('')} className="text-xs text-muted">
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          <TableWrap>
            <thead>
              <tr>
                <th>Raw Flipkart SKU</th>
                <th>Target Warehouse Product</th>
                <th>Category</th>
                <th>Assigned Worker</th>
                <th>Rule Type</th>
                <th>Times Seen</th>
                <th>Last Active</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMappings.length > 0 ? (
                filteredMappings.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <strong className="mono text-xs font-bold text-foreground">{m.raw_sku}</strong>
                    </td>
                    <td>
                      <strong className="text-sm font-semibold">{m.product_name}</strong>
                    </td>
                    <td>
                      <Badge kind="neutral">{m.category || 'General'}</Badge>
                    </td>
                    <td>
                      <span className="worker-name">
                        <i className={`dot ${m.assigned_worker === 'Kartik Da' ? 'teal' : 'blue'}`} />
                        <span className="font-medium">{m.assigned_worker}</span>
                        {m.worker_override && (
                          <span className="text-[10px] text-amber-500 font-medium ml-1">(Override)</span>
                        )}
                      </span>
                    </td>
                    <td>
                      <Badge kind="success">{m.match_type?.toUpperCase() || 'EXACT'}</Badge>
                    </td>
                    <td>
                      <span className="mono text-xs font-semibold">{m.times_seen || 1} batches</span>
                    </td>
                    <td className="text-xs text-muted">
                      {m.last_seen_at
                        ? new Date(m.last_seen_at).toLocaleDateString([], { month: 'short', day: 'numeric' })
                        : '—'}
                    </td>
                    <td className="text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          className="small-button"
                          onClick={() => {
                            setTrainTargetSku({
                              raw_sku: m.raw_sku,
                              description: `Mapped to ${m.product_name}`,
                              seen: m.times_seen || 1,
                              suggestion: {
                                product_id: m.product_id,
                                product: m.product_name,
                                confidence: 1,
                                matched_terms: ['Exact mapping'],
                                worker: m.assigned_worker,
                                category: m.category,
                              },
                            })
                          }}
                        >
                          <Edit3 size={12} className="mr-1 inline" /> Re-map
                        </button>
                        <button
                          className="icon-button text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                          title="Unmap SKU"
                          onClick={() => handleUnmapSku(m.id, m.raw_sku)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-muted">
                    <Bookmark size={28} className="mx-auto mb-2 text-muted opacity-40" />
                    <p className="font-medium text-sm">No mapped SKUs found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </TableWrap>
        </section>
      )}

      {/* TAB 3: PATTERN RULES & LIVE SANDBOX */}
      {tab === 'rules' && (
        <section className="panel space-y-6" id="pattern-rules-panel">
          <div className="section-head flex-wrap gap-3 pb-3 border-b border-border">
            <div>
              <h2 className="text-base font-bold">Pattern Classification Rules ({rules.length})</h2>
              <p className="text-xs text-muted mt-0.5">
                Heuristic pattern matching applied when an exact SKU match is not found in catalog.
              </p>
            </div>
            <button className="button primary ml-auto" onClick={() => setRuleModalOpen(true)}>
              <Plus size={15} /> Add Pattern Rule
            </button>
          </div>

          {/* Live Interactive Pattern Tester */}
          <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-900 border border-border space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-blue-500" />
              <strong className="text-xs uppercase font-bold tracking-wider text-foreground">
                Interactive Pattern Rule Sandbox
              </strong>
            </div>
            <div className="flex items-center gap-3">
              <input
                className="w-full text-xs font-mono rounded-lg px-3 py-2 border border-border bg-card text-foreground"
                placeholder="Type a sample raw SKU to test rules (e.g. GB-17X19-BLK, R1S-BLACK)..."
                value={testSkuInput}
                onChange={(e) => setTestSkuInput(e.target.value)}
              />
              {testSkuInput && (
                <button
                  className="button secondary text-xs py-2"
                  onClick={() => setTestSkuInput('')}
                >
                  Clear
                </button>
              )}
            </div>

            {testSkuInput.trim() && (
              <div className="p-3 rounded-lg bg-card border border-border text-xs flex items-center justify-between">
                {matchedTestRule ? (
                  <div className="flex items-center gap-3">
                    <span className="badge badge-success font-bold">MATCH FOUND</span>
                    <span>
                      Matches Rule <code className="mono font-bold">"{matchedTestRule.value}"</code> (
                      {matchedTestRule.rule_type})
                    </span>
                    <ArrowRight size={14} className="text-muted" />
                    <strong>{matchedTestProduct?.name || 'No specific product'}</strong>
                    <span className="text-muted">
                      Worker: <strong className="text-foreground">{matchedTestRule.suggested_worker || matchedTestProduct?.assigned_worker || 'Default'}</strong>
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-muted">
                    <AlertTriangle size={15} className="text-amber-500" />
                    <span>No active pattern rule matched "{testSkuInput}". This SKU would be marked as Unmapped.</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <TableWrap>
            <thead>
              <tr>
                <th>Rule Type</th>
                <th>Pattern Match Value</th>
                <th>Target Product</th>
                <th>Suggested Worker</th>
                <th>Priority</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((r) => {
                const prod = products.find((p) => p.id === r.product_id)
                return (
                  <tr key={r.id}>
                    <td>
                      <Badge kind="info">{r.rule_type.replace('_', ' ').toUpperCase()}</Badge>
                    </td>
                    <td>
                      <strong className="mono text-xs font-bold text-foreground">{r.value}</strong>
                    </td>
                    <td>
                      {prod ? (
                        <strong className="text-sm font-semibold">{prod.name}</strong>
                      ) : (
                        <span className="text-muted text-xs">— Worker Override Only</span>
                      )}
                    </td>
                    <td>
                      <span className="worker-name">
                        <i className={`dot ${r.suggested_worker === 'Kartik Da' ? 'teal' : 'blue'}`} />
                        <span className="font-medium">{r.suggested_worker || 'Auto from Product'}</span>
                      </span>
                    </td>
                    <td>
                      <span className="mono text-xs font-semibold">{r.priority}</span>
                    </td>
                    <td className="text-right">
                      <button
                        className="icon-button text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                        title="Delete pattern rule"
                        onClick={async () => {
                          if (window.confirm(`Delete pattern rule "${r.value}"?`)) {
                            await deletePatternRule(r.id)
                            refreshRules()
                            showToast('Pattern rule removed.')
                          }
                        }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </TableWrap>
        </section>
      )}

      {/* TAB 4: TRAINING AUDIT LOG */}
      {tab === 'history' && (
        <section className="panel" id="training-history-panel">
          <div className="section-head pb-3 border-b border-border">
            <div>
              <h2 className="text-base font-bold">Training Activity Audit Log</h2>
              <p className="text-xs text-muted mt-0.5">
                Audit trail of learned mappings with 1-click instant undo.
              </p>
            </div>
          </div>

          <TableWrap>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Action Type</th>
                <th>Raw Flipkart SKU</th>
                <th>Learned Mapping</th>
                <th>Assigned Worker</th>
                <th className="text-right">Undo Action</th>
              </tr>
            </thead>
            <tbody>
              {history.length > 0 ? (
                history.map((h) => (
                  <tr key={h.id}>
                    <td className="text-xs text-muted whitespace-nowrap">
                      {new Date(h.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })},{' '}
                      {new Date(h.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </td>
                    <td>
                      <Badge kind={h.action.includes('Removed') ? 'danger' : 'success'}>
                        {h.action}
                      </Badge>
                    </td>
                    <td>
                      <strong className="mono text-xs font-bold text-foreground">{h.raw_sku}</strong>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5 text-xs font-semibold">
                        {h.old_product_name && (
                          <>
                            <span className="text-muted line-through">{h.old_product_name}</span>
                            <ArrowRight size={12} className="text-muted" />
                          </>
                        )}
                        <span>{h.new_product_name}</span>
                      </div>
                    </td>
                    <td>
                      <span className="worker-name">
                        <i className={`dot ${h.new_worker === 'Kartik Da' ? 'teal' : 'blue'}`} />
                        <span className="font-medium">{h.new_worker}</span>
                      </span>
                    </td>
                    <td className="text-right">
                      {h.action !== 'Removed Mapping' && (
                        <button
                          className="button secondary text-xs py-1 px-2.5 font-medium"
                          onClick={() => handleUndo(h.id)}
                        >
                          <Undo2 size={13} className="mr-1 inline" /> Undo
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-muted">
                    <Clock size={28} className="mx-auto mb-2 text-muted opacity-40" />
                    <p className="font-medium text-sm">No training events recorded yet</p>
                  </td>
                </tr>
              )}
            </tbody>
          </TableWrap>
        </section>
      )}

      {/* Train Target SKU Modal */}
      {trainTargetSku && (
        <TrainSkuModal
          skuItem={trainTargetSku}
          close={() => setTrainTargetSku(null)}
          onTrained={(mappedName: any) => {
            showToast(`Trained "${trainTargetSku.raw_sku}" ➔ "${mappedName}"`)
            setTrainTargetSku(null)
            refreshUnknowns()
            refreshMappings()
            refreshStats()
            refreshHistory()
            revalidateWarehouseData()
          }}
          onConflict={(conflict: any) => {
            setConflictItem(conflict)
          }}
        />
      )}

      {/* Conflict Modal */}
      {conflictItem && (
        <Modal title="Mapping Conflict Detected" close={() => setConflictItem(null)}>
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
              <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
              <div className="text-xs text-foreground space-y-1">
                <p className="font-bold">Raw SKU is already assigned to another catalog product</p>
                <p className="text-muted text-[11px] leading-relaxed">
                  Overwriting this rule will reassign all future labels matching this SKU to the newly selected product.
                </p>
              </div>
            </div>

            <div className="form-section space-y-2.5">
              <div className="flex items-center justify-between py-1.5 border-b border-border text-xs">
                <span className="text-muted font-medium">Raw Marketplace SKU</span>
                <span className="font-mono font-bold text-foreground bg-secondary px-2 py-0.5 rounded">{conflictItem.raw_sku}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-border text-xs">
                <span className="text-muted font-medium">Current Assignment</span>
                <span className="font-semibold text-muted line-through">{conflictItem.existing_product_name}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 text-xs">
                <span className="text-muted font-medium">Proposed New Product</span>
                <span className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                  <Check size={14} /> {conflictItem.new_product_name}
                </span>
              </div>
            </div>

            <div className="modal-actions flex items-center justify-between pt-3 border-t border-border">
              <span className="text-[11px] text-muted">Conflict resolution required</span>
              <div className="flex items-center gap-2">
                <button className="button secondary text-xs font-semibold py-2 px-3.5" onClick={() => setConflictItem(null)}>
                  Keep Existing
                </button>
                <button
                  className="button primary text-xs font-semibold py-2 px-4 flex items-center gap-1.5"
                  onClick={async () => {
                    await mapSku({
                      raw_sku: conflictItem.raw_sku,
                      product_id: conflictItem.new_product_id,
                      replace: true,
                    })
                    setConflictItem(null)
                    setTrainTargetSku(null)
                    refreshUnknowns()
                    refreshMappings()
                    refreshStats()
                    refreshHistory()
                    revalidateWarehouseData()
                    showToast(`Replaced mapping to ${conflictItem.new_product_name}`)
                  }}
                >
                  <RefreshCw size={13} /> Overwrite & Replace Mapping
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Pattern Rule Modal */}
      {ruleModalOpen && (
        <AddPatternRuleModal
          products={products}
          close={() => setRuleModalOpen(false)}
          onAdded={() => {
            refreshRules()
            revalidateWarehouseData()
            setRuleModalOpen(false)
            showToast('Pattern rule added successfully!')
          }}
        />
      )}
    </>
  )
}

// ----------------------------------------------------------------------
// 5. HISTORY & LOGS VIEW
// ----------------------------------------------------------------------
function HistoryView({ showToast }: any) {
  const [range, setRange] = useState('today')
  const [searchQuery, setSearchQuery] = useState('')

  const { data: hist, mutate: refreshHist } = useSWR(
    `/history?range=${range}`,
    () => getHistory(range)
  )

  const { data: searchResults = [] } = useSWR(
    searchQuery ? `/shipments/search?q=${searchQuery}` : null,
    () => searchShipments(searchQuery)
  )

  return (
    <>
      <PageHead
        eyebrow="Operations / History & Logs"
        title="Processing History & Batch Audits"
        description="Review all confirmed warehouse batches, shipment serials (AWBs), and printing logs."
        action={
          <button
            className="button secondary"
            onClick={() => {
              // Export CSV
              const rows = [
                ['Batch ID', 'File', 'Processing Date', 'Unique AWBs', 'Duplicates', 'Total Items', 'Status'],
                ...(hist?.batches || []).map((b: any) => [
                  b.id,
                  b.filename,
                  b.processing_date,
                  b.unique_awbs,
                  b.duplicate_awbs,
                  b.total_items,
                  b.status,
                ]),
              ]
              const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n')
              const encodedUri = encodeURI(csvContent)
              const link = document.createElement('a')
              link.setAttribute('href', encodedUri)
              link.setAttribute('download', `flipkart_batch_history_${range}.csv`)
              document.body.appendChild(link)
              link.click()
              showToast('History exported to CSV.')
            }}
          >
            <ArrowDownToLine size={15} /> Export CSV
          </button>
        }
      />

      {/* Date Filter Tabs */}
      <div className="filter-tabs">
        {['today', 'yesterday', '7days', 'month', 'all'].map((r) => (
          <button
            key={r}
            className={range === r ? 'active' : ''}
            onClick={() => setRange(r)}
          >
            {r === 'today'
              ? 'Today'
              : r === 'yesterday'
              ? 'Yesterday'
              : r === '7days'
              ? 'Last 7 days'
              : r === 'month'
              ? 'This month'
              : 'All Time'}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="stats-grid three" id="history-stats-grid">
        <Stat label="Total Batches" value={hist?.summary?.total_batches ?? 0} icon={Layers} />
        <Stat label="Unique AWBs" value={hist?.summary?.unique_awbs ?? 0} icon={FileCheck2} tone="teal" />
        <Stat label="Duplicate Labels" value={hist?.summary?.duplicate_awbs ?? 0} icon={ShieldAlert} tone="amber" />
      </div>

      {/* Shipment Search Bar */}
      <div className="panel mb-4 p-4">
        <div className="flex items-center gap-3">
          <Search size={18} className="text-muted" />
          <input
            className="w-full bg-transparent border-0 text-sm outline-none text-inherit placeholder-slate-500"
            placeholder="Search by AWB serial number, Order ID, SKU code, or customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="text-muted hover:text-white" onClick={() => setSearchQuery('')}>
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Search Results Table (if querying) */}
      {searchQuery && (
        <section className="panel mb-6" id="search-results-panel">
          <div className="section-head">
            <div>
              <h2>Search results for "{searchQuery}"</h2>
              <p>{searchResults.length} shipments found</p>
            </div>
          </div>

          <TableWrap>
            <thead>
              <tr>
                <th>AWB</th>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Worker</th>
                <th>Prints</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {searchResults.map((s: any) => (
                <tr key={s.id}>
                  <td><strong className="mono">{s.awb}</strong></td>
                  <td className="mono text-muted">{s.order_id}</td>
                  <td>{s.customer_name} ({s.customer_city})</td>
                  <td>{s.items.map((i: any) => `${i.product || i.raw_sku} x ${i.quantity}`).join(', ')}</td>
                  <td>{s.items[0]?.assigned_worker || 'Sohel'}</td>
                  <td><Badge kind="neutral">{s.print_count || 1} prints</Badge></td>
                  <td>{s.processing_date}</td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        </section>
      )}

      {/* Batch Logs Table */}
      <section className="panel" id="batch-logs-panel">
        <div className="section-head">
          <div>
            <h2>Processing batches</h2>
            <p>Confirmed and draft uploads in this time range</p>
          </div>
        </div>

        <TableWrap>
          <thead>
            <tr>
              <th>Batch ID</th>
              <th>Processing Date</th>
              <th>Filename</th>
              <th>Pages</th>
              <th>Unique AWBs</th>
              <th>Duplicates</th>
              <th>Total Items</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {hist?.batches && hist.batches.length > 0 ? (
              hist.batches.map((b: any) => (
                <tr key={b.id}>
                  <td><strong className="mono">#{b.id}</strong></td>
                  <td>{b.processing_date}</td>
                  <td>
                    <span className="file-cell">
                      <FileCheck2 size={15} />
                      {b.filename}
                    </span>
                  </td>
                  <td>{b.total_pages}</td>
                  <td><strong>{b.unique_awbs}</strong></td>
                  <td><span className="amber-text">{b.duplicate_awbs}</span></td>
                  <td>{b.total_items}</td>
                  <td><StatusBadge value={b.status} /></td>
                  <td className="text-right">
                    <a
                      href={`/batches/${b.id}/pdf`}
                      target="_blank"
                      rel="noreferrer"
                      className="small-button inline-flex items-center gap-1"
                    >
                      <Printer size={12} /> PDF
                    </a>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={9} className="text-center py-8 text-muted">
                  No batch history found for this range.
                </td>
              </tr>
            )}
          </tbody>
        </TableWrap>
      </section>
    </>
  )
}

// ----------------------------------------------------------------------
// 6. SETTINGS VIEW
// ----------------------------------------------------------------------
function SettingsView({ showToast }: any) {
  const { data: workers = [], mutate: refreshWorkers } = useSWR('/workers', getWorkers)
  const { data: categories = [], mutate: refreshCategories } = useSWR('/categories', getCategories)
  const { data: dbStats, mutate: refreshDbStats } = useSWR('/database', async () => {
    try {
      const res = await fetch('/api/proxy/database/sync')
      if (res.ok) return await res.json()
      const fallback = await fetch('/database/sync')
      return await fallback.json()
    } catch {
      return null
    }
  })

  const [newWorkerName, setNewWorkerName] = useState('')
  const [newWorkerPhone, setNewWorkerPhone] = useState('')
  const [isClearingLabels, setIsClearingLabels] = useState(false)
  const [isSyncingDisk, setIsSyncingDisk] = useState(false)
  const [isResettingDb, setIsResettingDb] = useState(false)
  const [copiedSnippet, setCopiedSnippet] = useState(false)

  const handleAddWorker = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newWorkerName.trim()) return
    try {
      await createWorker({ name: newWorkerName.trim(), phone: newWorkerPhone.trim() })
      setNewWorkerName('')
      setNewWorkerPhone('')
      refreshWorkers()
      revalidateWarehouseData()
      showToast(`Worker "${newWorkerName}" added.`)
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleClearOldLabels = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete all test label batches and shipments?\n\n✓ DELETED: Uploaded batches, shipments, and print logs\n✓ PRESERVED: All SKU mappings, pattern rules, products, recipes, workers, and categories"
    )
    if (!confirmed) return

    setIsClearingLabels(true)
    try {
      const res = await clearOldLabelData()
      revalidateWarehouseData()
      refreshDbStats()
      showToast("Old label & batch data deleted. All SKU training remains intact!")
    } catch (err: any) {
      showToast(`Failed to clear labels: ${err.message || 'Error'}`)
    } finally {
      setIsClearingLabels(false)
    }
  }

  const handleSyncWithDisk = async () => {
    setIsSyncingDisk(true)
    try {
      const res = await syncDatabaseWithDisk()
      revalidateWarehouseData()
      refreshDbStats()
      refreshWorkers()
      refreshCategories()
      showToast("Successfully synced database with VS Code disk files (data/sku-rules.json, data/products.json)!")
    } catch (err: any) {
      showToast(`Sync failed: ${err.message || 'Error'}`)
    } finally {
      setIsSyncingDisk(false)
    }
  }

  const handleResetToDefault = async () => {
    const confirmed = window.confirm(
      "Reset entire database to initial factory demo seed?\n\nThis will reset all tables to default sample data."
    )
    if (!confirmed) return

    setIsResettingDb(true)
    try {
      await resetDatabaseToDefault()
      revalidateWarehouseData()
      refreshDbStats()
      refreshWorkers()
      refreshCategories()
      showToast("Database reset to factory demo seed.")
    } catch (err: any) {
      showToast(`Reset failed: ${err.message || 'Error'}`)
    } finally {
      setIsResettingDb(false)
    }
  }

  const handleExportDatabase = async () => {
    try {
      const data = await getFullDatabaseExport()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `flipkart_db_export_${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      showToast("Database exported successfully as JSON.")
    } catch (err: any) {
      showToast("Failed to export database.")
    }
  }

  const sampleSkuRuleJson = `{
  "sku_mappings": [
    {
      "raw_sku": "MY-NEW-SKU-CODE-001",
      "product_name": "Garbage Bag Roll 17x19",
      "assigned_worker": "Kartik Da",
      "match_type": "exact"
    }
  ],
  "pattern_rules": [
    {
      "rule_type": "contains",
      "value": "17X19",
      "product_name": "Garbage Bag Roll 17x19",
      "suggested_worker": "Kartik Da",
      "priority": 15
    }
  ]
}`

  const copySampleJson = () => {
    navigator.clipboard.writeText(sampleSkuRuleJson)
    setCopiedSnippet(true)
    showToast("Sample SKU JSON copied to clipboard!")
    setTimeout(() => setCopiedSnippet(false), 2000)
  }

  return (
    <>
      <PageHead
        eyebrow="Workspace / Settings"
        title="Settings & Database Management"
        description="Manage test label data, train SKUs directly in VS Code, and configure warehouse staff and rules."
      />

      <div className="flex flex-col gap-6">
        {/* Development & Database Lifecycle Management Section */}
        <section className="panel danger-zone" id="settings-database-card">
          <div className="section-head mb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="badge badge-danger">Development Tools</span>
                <h2 className="text-base font-bold">Database & Test Label Cleanup</h2>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Clear test data while preserving all trained SKU rules and product catalogs.
              </p>
            </div>
            <Database size={20} className="text-rose-500 shrink-0" />
          </div>

          <div className="bg-slate-900/60 dark:bg-slate-950/80 border border-slate-700/50 rounded-lg p-4 mb-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-2 bg-slate-800/40 rounded border border-slate-700/30">
                <span className="block text-xs text-slate-400">Batches</span>
                <strong className="text-lg font-bold text-slate-100">{dbStats?.batches_count ?? 0}</strong>
              </div>
              <div className="p-2 bg-slate-800/40 rounded border border-slate-700/30">
                <span className="block text-xs text-slate-400">Shipments (AWBs)</span>
                <strong className="text-lg font-bold text-slate-100">{dbStats?.shipments_count ?? 0}</strong>
              </div>
              <div className="p-2 bg-emerald-950/30 rounded border border-emerald-800/30">
                <span className="block text-xs text-emerald-400">Trained SKUs</span>
                <strong className="text-lg font-bold text-emerald-300">{dbStats?.sku_mappings_count ?? 0}</strong>
              </div>
              <div className="p-2 bg-blue-950/30 rounded border border-blue-800/30">
                <span className="block text-xs text-blue-400">Pattern Rules</span>
                <strong className="text-lg font-bold text-blue-300">{dbStats?.pattern_rules_count ?? 0}</strong>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              id="btn-delete-old-labels"
              className="button danger"
              onClick={handleClearOldLabels}
              disabled={isClearingLabels}
            >
              <Trash2 size={15} />
              {isClearingLabels ? "Deleting Test Data..." : "Delete Old Label Data (Keep Training Data)"}
            </button>

            <button
              id="btn-sync-disk-files"
              className="button secondary"
              onClick={handleSyncWithDisk}
              disabled={isSyncingDisk}
              title="Reload data/sku-rules.json and data/products.json from disk into memory"
            >
              <RefreshCw size={15} className={isSyncingDisk ? "animate-spin" : ""} />
              {isSyncingDisk ? "Syncing..." : "Sync with VS Code Disk Files"}
            </button>

            <button
              id="btn-export-db"
              className="button secondary"
              onClick={handleExportDatabase}
              title="Export complete database as JSON backup"
            >
              <Download size={15} /> Export db.json
            </button>

            <button
              id="btn-reset-factory"
              className="button danger-outline ml-auto"
              onClick={handleResetToDefault}
              disabled={isResettingDb}
            >
              <RotateCcw size={14} />
              {isResettingDb ? "Resetting..." : "Reset Factory Seed"}
            </button>
          </div>

          <div className="mt-3 text-xs text-slate-400 flex items-center gap-1.5">
            <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
            <span>
              <strong>Safe Cleanup Guarantee:</strong> Clicking &quot;Delete Old Label Data&quot; only purges batch shipments &amp; print history. All SKU mappings, regex pattern rules, products, and categories remain 100% intact.
            </span>
          </div>
        </section>

        {/* Direct VS Code Database & SKU Training Guide */}
        <section className="panel vscode-guide" id="settings-vscode-guide-card">
          <div className="section-head mb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="badge badge-info">Developer Guide</span>
                <h2 className="text-base font-bold">How to Edit Database &amp; Train SKUs Directly from VS Code</h2>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                You can edit products, train SKUs, and define pattern rules directly in your VS Code workspace files.
              </p>
            </div>
            <Code size={20} className="text-blue-500 shrink-0" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-xs">
            <div className="p-3 bg-slate-900/60 dark:bg-slate-950/80 rounded-lg border border-slate-700/50">
              <div className="flex items-center gap-1.5 font-bold text-blue-400 mb-1">
                <FileCode size={14} /> 1. SKU Rules File
              </div>
              <p className="text-slate-300">
                Open <code className="text-amber-300 font-mono">/data/sku-rules.json</code> in VS Code to add raw SKU codes and pattern rules.
              </p>
            </div>

            <div className="p-3 bg-slate-900/60 dark:bg-slate-950/80 rounded-lg border border-slate-700/50">
              <div className="flex items-center gap-1.5 font-bold text-emerald-400 mb-1">
                <Package size={14} /> 2. Products Catalog
              </div>
              <p className="text-slate-300">
                Open <code className="text-amber-300 font-mono">/data/products.json</code> to edit product names, bag recipes (3-Bag / 2-Bag), and workers.
              </p>
            </div>

            <div className="p-3 bg-slate-900/60 dark:bg-slate-950/80 rounded-lg border border-slate-700/50">
              <div className="flex items-center gap-1.5 font-bold text-purple-400 mb-1">
                <Zap size={14} /> 3. Live Hot Sync
              </div>
              <p className="text-slate-300">
                After saving files in VS Code, click <strong>&quot;Sync with VS Code Disk Files&quot;</strong> or process any label to apply instantly.
              </p>
            </div>
          </div>

          <div className="relative">
            <div className="flex justify-between items-center bg-slate-950 px-3 py-2 rounded-t-lg border-t border-x border-slate-800 text-xs text-slate-400">
              <span className="font-mono text-slate-300">data/sku-rules.json (Example Schema)</span>
              <button
                className="button secondary text-xs py-1 px-2.5"
                onClick={copySampleJson}
                title="Copy sample JSON structure"
              >
                <Copy size={13} /> {copiedSnippet ? "Copied!" : "Copy JSON Snippet"}
              </button>
            </div>
            <pre className="code-preview rounded-t-none border-t-0 mt-0">
              {sampleSkuRuleJson}
            </pre>
          </div>
        </section>

        {/* Existing Settings Grid */}
        <div className="settings-grid">
          {/* Workers Configuration */}
          <section className="panel settings-card" id="settings-workers-card">
            <div className="section-head">
              <div>
                <h2>Warehouse Workers</h2>
                <p>Staff members assigned to product picking</p>
              </div>
              <Users size={18} />
            </div>

            <div className="flex flex-col gap-2">
              {workers.map((w) => (
                <div key={w.id} className="setting-person">
                  <div className={`avatar ${w.name.startsWith('S') ? 'blue-avatar' : 'teal-avatar'}`}>
                    {w.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <strong>{w.name}</strong>
                    <span>{w.active ? 'Active on floor' : 'Inactive'} • {w.phone || 'No phone'}</span>
                  </div>
                  {w.active && (
                    <button
                      className="icon-button text-slate-400 hover:text-rose-500"
                      title="Deactivate worker"
                      onClick={async () => {
                        if (window.confirm(`Deactivate ${w.name}?`)) {
                          await deleteWorker(w.id)
                          refreshWorkers()
                          revalidateWarehouseData()
                          showToast(`${w.name} deactivated`)
                        }
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <form onSubmit={handleAddWorker} className="mt-4 pt-3 border-t border-slate-700/30 flex gap-2">
              <input
                placeholder="New worker name..."
                value={newWorkerName}
                onChange={(e) => setNewWorkerName(e.target.value)}
                className="flex-1"
                required
              />
              <button type="submit" className="button primary">
                <Plus size={15} /> Add
              </button>
            </form>
          </section>

          {/* Categories Configuration */}
          <section className="panel settings-card" id="settings-categories-card">
            <div className="section-head">
              <div>
                <h2>Product Categories</h2>
                <p>Warehouse organizational groups</p>
              </div>
              <Package size={18} />
            </div>

            <div className="flex flex-col gap-1 max-h-60 overflow-y-auto">
              {categories.map((c) => (
                <div key={c.id} className="setting-person">
                  <div>
                    <strong>{c.name}</strong>
                    <span>{c.description || 'Standard category'}</span>
                  </div>
                  <button
                    className="icon-button text-slate-400 hover:text-rose-500"
                    onClick={async () => {
                      if (window.confirm(`Delete category ${c.name}?`)) {
                        await deleteCategory(c.id)
                        refreshCategories()
                        revalidateWarehouseData()
                        showToast(`Category ${c.name} deleted`)
                      }
                    }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Garbage Bag Families (PackCalc) */}
          <section className="panel settings-card" id="settings-packcalc-card">
            <div className="section-head">
              <div>
                <h2>Garbage Bag Families (PackCalc)</h2>
                <p>Formula rules for raw roll stock requirements</p>
              </div>
              <Archive size={18} />
            </div>

            <div className="setting-person">
              <div className="material-icon amber"><Archive size={16} /></div>
              <div>
                <strong>Averx Family</strong>
                <span>Algorithm: floor(qty/14) 3-Bags + remainder logic</span>
              </div>
            </div>

            <div className="setting-person">
              <div className="material-icon blue"><Archive size={16} /></div>
              <div>
                <strong>Star Family</strong>
                <span>Standard: 4 × 3-Bag per finished pack</span>
              </div>
            </div>

            <div className="setting-person">
              <div className="material-icon slate"><Archive size={16} /></div>
              <div>
                <strong>Plain Garbage Bag Family</strong>
                <span>Standard: 2 × 3-Bag + 1 × 2-Bag per unit</span>
              </div>
            </div>
          </section>

          {/* General Settings */}
          <section className="panel settings-card" id="settings-general-card">
            <div className="section-head">
              <div>
                <h2>Warehouse System Config</h2>
                <p>Printing & layout defaults</p>
              </div>
              <SettingsIcon size={18} />
            </div>

            <label>
              Warehouse Location
              <input defaultValue="Kolkata Unit 6 - Chowbaga West" />
            </label>

            <label>
              Label Output Crop Format
              <select defaultValue="4x6">
                <option value="4x6">Standard 4×6 inches (Thermal Shipping Label)</option>
                <option value="A6">A6 Document Sheet</option>
              </select>
            </label>

            <button className="button primary self-start" onClick={() => showToast('Settings saved successfully.')}>
              Save Preferences
            </button>
          </section>
        </div>
      </div>
    </>
  )
}

// ----------------------------------------------------------------------
// MODALS
// ----------------------------------------------------------------------

function Modal({ title, close, children }: any) {
  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="modal-head">
          <div>
            <p className="eyebrow">Warehouse Action</p>
            <h2>{title}</h2>
          </div>
          <button className="icon-button" onClick={close}>
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

function ModalActions({ close, primary = 'Save Changes', onPrimary, loading, secondary = 'Cancel' }: any) {
  return (
    <div className="modal-actions flex items-center justify-between pt-4 mt-4 border-t border-border">
      <div className="flex items-center gap-1.5 text-[11px] text-muted select-none">
        <span>Press</span>
        <kbd className="kbd">Esc</kbd>
        <span>to cancel</span>
      </div>
      <div className="flex items-center gap-2.5">
        <button className="button secondary text-xs font-semibold py-2 px-3.5" onClick={close} type="button" disabled={loading}>
          {secondary}
        </button>
        <button
          className="button primary text-xs font-semibold py-2 px-4 flex items-center gap-1.5"
          onClick={onPrimary}
          type="submit"
          disabled={loading}
        >
          {loading ? (
            <>
              <RefreshCw size={13} className="animate-spin" /> Saving...
            </>
          ) : (
            <>
              <Check size={14} /> {primary}
            </>
          )}
        </button>
      </div>
    </div>
  )
}

function KeyboardShortcutsModal({ close, go, onProcess, onExport, onClearAll, onToggleTheme }: any) {
  const [filter, setFilter] = useState<'all' | 'ops' | 'nav' | 'system'>('all')

  const shortcuts = [
    {
      category: 'ops',
      categoryLabel: 'Warehouse Operations',
      key: 'P',
      altKey: 'Alt+P',
      label: 'Process Label',
      desc: 'Jump directly to Process view and trigger the PDF file picker instantly.',
      action: onProcess,
      badge: 'High Priority',
    },
    {
      category: 'ops',
      categoryLabel: 'Warehouse Operations',
      key: 'C',
      altKey: 'Alt+C',
      label: 'Clear All',
      desc: 'Clear active PDF batch, reset SKU cluster selection, clear search and filters.',
      action: onClearAll,
      badge: 'Workflow Reset',
    },
    {
      category: 'ops',
      categoryLabel: 'Warehouse Operations',
      key: 'E',
      altKey: 'Alt+E',
      label: 'Export Report',
      desc: 'Instantly download the full warehouse dispatch CSV summary for the selected date.',
      action: onExport,
      badge: 'CSV Export',
    },
    {
      category: 'ops',
      categoryLabel: 'Warehouse Operations',
      key: 'Ctrl+P',
      altKey: '⌘+P',
      label: 'Print Sorted PDF',
      desc: 'Open real-time sorted sequential label PDF ready for thermal label printers.',
      badge: 'Printing',
    },
    {
      category: 'nav',
      categoryLabel: 'View Navigation',
      key: '1',
      label: 'Go to Dashboard',
      desc: 'Real-time stock-out metrics, worker workload shares, and PackCalc raw materials.',
      action: () => { go('dashboard'); close(); },
    },
    {
      category: 'nav',
      categoryLabel: 'View Navigation',
      key: '2',
      label: 'Go to Process Labels',
      desc: 'Multi-file PDF upload, auto-crop pipeline, real-time sorting, and batch review.',
      action: () => { go('process'); close(); },
    },
    {
      category: 'nav',
      categoryLabel: 'View Navigation',
      key: '3',
      label: 'Go to Products & Recipes',
      desc: 'Canonical catalog, 3-Bag/2-Bag roll recipes, and worker assignment rules.',
      action: () => { go('products'); close(); },
    },
    {
      category: 'nav',
      categoryLabel: 'View Navigation',
      key: '4',
      label: 'Go to Training Center',
      desc: 'Train newly observed SKUs, resolve conflicts, and manage prefix pattern rules.',
      action: () => { go('training'); close(); },
    },
    {
      category: 'nav',
      categoryLabel: 'View Navigation',
      key: '5',
      label: 'Go to History & Logs',
      desc: 'Audit past confirmed batches, print events, and shipment archives.',
      action: () => { go('history'); close(); },
    },
    {
      category: 'nav',
      categoryLabel: 'View Navigation',
      key: '6',
      label: 'Go to Settings',
      desc: 'Manage warehouse workers, label crop format (4×6 / A6), and general parameters.',
      action: () => { go('settings'); close(); },
    },
    {
      category: 'system',
      categoryLabel: 'Warehouse Controls',
      key: 'D',
      altKey: 'Alt+D',
      label: 'Toggle Dark / Light Theme',
      desc: 'Switch interface contrast theme to suit warehouse station lighting.',
      action: onToggleTheme,
    },
    {
      category: 'system',
      categoryLabel: 'Warehouse Controls',
      key: 'R',
      altKey: 'Alt+R',
      label: 'Refresh Live Metrics',
      desc: 'Force background re-sync of dispatch metrics and live SKU counts.',
    },
    {
      category: 'system',
      categoryLabel: 'Warehouse Controls',
      key: '?',
      altKey: 'Shift+/',
      label: 'Keyboard Shortcuts',
      desc: 'Toggle this keyboard shortcuts cheat sheet modal.',
    },
    {
      category: 'system',
      categoryLabel: 'Warehouse Controls',
      key: 'Esc',
      label: 'Dismiss / Close',
      desc: 'Close open dialogs, clear input focus, or dismiss popovers.',
      action: close,
    },
  ]

  const filteredShortcuts = shortcuts.filter((s) => {
    if (filter === 'all') return true
    return s.category === filter
  })

  return (
    <div className="modal-backdrop">
      <div className="modal max-w-2xl w-full">
        <div className="modal-head pb-3 border-b border-border">
          <div>
            <p className="eyebrow text-blue-500 font-semibold flex items-center gap-1.5">
              <Zap size={14} /> Warehouse Productivity
            </p>
            <h2 className="text-lg font-bold">Global Keyboard Shortcuts</h2>
          </div>
          <button className="icon-button" onClick={close} title="Close (Esc)">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 text-xs py-2">
          <p className="text-muted text-xs leading-relaxed">
            Use these global keyboard shortcuts anytime during warehouse operations to rapidly process batches, navigate views, clear filters, or export reports without touching the mouse.
          </p>

          {/* Filter Tabs */}
          <div className="flex gap-1.5 border-b border-border pb-2">
            {[
              { id: 'all', label: 'All Shortcuts' },
              { id: 'ops', label: '⚡ Core Operations' },
              { id: 'nav', label: '🧭 Navigation (1-6)' },
              { id: 'system', label: '🛠️ System & Display' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id as any)}
                className={`text-xs px-2.5 py-1 rounded-md font-medium transition-all ${
                  filter === tab.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-card border border-border text-muted hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Shortcuts List */}
          <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
            {filteredShortcuts.map((s, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between gap-3 p-2.5 rounded-lg border border-border bg-card hover:border-blue-500/40 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all group"
              >
                <div className="space-y-0.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <strong className="font-semibold text-foreground text-xs">{s.label}</strong>
                    {s.badge && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                        {s.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted truncate">{s.desc}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center gap-1">
                    <kbd className="kbd px-2 py-1 text-xs font-mono font-bold shadow-xs">
                      {s.key}
                    </kbd>
                    {s.altKey && (
                      <>
                        <span className="text-[10px] text-muted">or</span>
                        <kbd className="kbd px-1.5 py-0.5 text-[10px] font-mono text-muted">
                          {s.altKey}
                        </kbd>
                      </>
                    )}
                  </div>

                  {s.action && (
                    <button
                      onClick={s.action}
                      className="text-[11px] px-2 py-1 rounded border border-border bg-background hover:bg-primary hover:text-white transition-colors opacity-80 group-hover:opacity-100"
                      title="Run action now"
                    >
                      Run
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 text-blue-800 dark:text-blue-300 text-[11px] flex items-center gap-2">
            <Command size={14} className="shrink-0 text-blue-500" />
            <span>
              <strong>Warehouse Operator Tip:</strong> When typing in form fields or search boxes, press <kbd className="text-[9px] px-1 py-0 bg-background text-foreground">Esc</kbd> first to release focus, then press any single hotkey like <kbd className="text-[9px] px-1 py-0 bg-background text-foreground">P</kbd> or <kbd className="text-[9px] px-1 py-0 bg-background text-foreground">E</kbd>.
            </span>
          </div>
        </div>

        <div className="modal-actions mt-3 pt-3 border-t border-border flex justify-end">
          <button className="button primary" onClick={close}>
            Done (Esc)
          </button>
        </div>
      </div>
    </div>
  )
}

function TrainSkuModal({ skuItem, close, onTrained, onConflict }: any) {
  const { data: products = [], mutate: refreshProducts } = useSWR('/products', () => getProducts(false))
  const { data: categories = [], mutate: refreshCategories } = useSWR('/categories', getCategories)
  const { data: workers = [] } = useSWR('/workers', getWorkers)

  const [selectedProductId, setSelectedProductId] = useState<number>(
    skuItem.suggestion?.product_id || (products[0]?.id ?? 1)
  )
  const [overrideWorker, setOverrideWorker] = useState<string>(
    skuItem.suggestion?.worker && skuItem.suggestion.worker !== 'Sohel' ? skuItem.suggestion.worker : ''
  )
  const [rememberMapping, setRememberMapping] = useState(true)
  const [loading, setLoading] = useState(false)

  // Inline "Create New Product" sub-mode
  const [isCreatingNew, setIsCreatingNew] = useState(false)
  const [newProdName, setNewProdName] = useState(skuItem.description || '')
  const [newProdCode, setNewProdCode] = useState(skuItem.raw_sku.slice(0, 8))
  const [newProdCategory, setNewProdCategory] = useState('Tripod')
  const [newProdWorker, setNewProdWorker] = useState('Sohel')

  const chosenProduct = products.find((p) => p.id === selectedProductId) || products[0]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      let targetProductId = selectedProductId

      // If user chose to create a new product inline
      if (isCreatingNew) {
        if (!newProdName.trim()) {
          alert('Please enter a product name')
          setLoading(false)
          return
        }
        const created = await createProduct({
          name: newProdName.trim(),
          internal_code: newProdCode.trim() || null,
          category: newProdCategory,
          assigned_worker: newProdWorker,
          sort_order: 10,
          active: true,
        })
        targetProductId = created.id
        await refreshProducts()
        revalidateWarehouseData()
      }

      const prod = products.find((p) => p.id === targetProductId) || { name: newProdName }

      const res = await mapSku({
        raw_sku: skuItem.raw_sku,
        product_id: targetProductId,
        optional_worker_override: overrideWorker || undefined,
        remember_mapping: rememberMapping,
      })

      if (res.status === 'conflict') {
        if (onConflict) {
          onConflict({
            raw_sku: skuItem.raw_sku,
            existing_product_name: res.existing_product_name,
            new_product_id: targetProductId,
            new_product_name: prod.name,
          })
        }
        return
      }

      onTrained(prod.name)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-backdrop">
      <div className="modal max-w-2xl w-full">
        <div className="modal-head pb-3 border-b border-border">
          <div>
            <p className="eyebrow text-blue-500 font-semibold flex items-center gap-1.5 text-xs">
              <Sparkles size={14} /> Machine Learning & Catalog Mapping
            </p>
            <h2 className="text-lg font-bold text-foreground mt-0.5">Train Marketplace SKU</h2>
          </div>
          <button className="icon-button" onClick={close} title="Close (Esc)">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Target Raw SKU Callout */}
          <div className="sku-callout bg-slate-900 border border-slate-700 text-slate-100 p-4 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Raw Marketplace SKU</span>
                <p className="font-mono text-base font-bold text-blue-400 mt-0.5">{skuItem.raw_sku}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Batch Frequency</span>
                <p className="text-xs font-semibold text-slate-200 mt-0.5">{skuItem.seen || 1} Batch{(skuItem.seen || 1) > 1 ? 'es' : ''} Observed</p>
              </div>
            </div>

            {skuItem.description && (
              <div className="pt-2 border-t border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Item Description</span>
                <p className="text-xs text-slate-300 line-clamp-2 mt-0.5">{skuItem.description}</p>
              </div>
            )}
          </div>

          {/* AI Suggestion Banner if available */}
          {skuItem.suggestion && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/20 text-amber-500 shrink-0">
                  <Sparkles size={16} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <strong className="text-xs font-bold text-foreground">AI Suggestion: {skuItem.suggestion.product}</strong>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                      {Math.round(skuItem.suggestion.confidence * 100)}% match
                    </span>
                  </div>
                  <span className="text-[11px] text-muted block mt-0.5">
                    Matched: {skuItem.suggestion.matched_terms.join(', ')} • Worker: {skuItem.suggestion.worker}
                  </span>
                </div>
              </div>

              <button
                type="button"
                className="button primary text-xs py-1.5 px-3 font-semibold shrink-0"
                onClick={() => {
                  setSelectedProductId(skuItem.suggestion.product_id)
                  if (skuItem.suggestion.worker && skuItem.suggestion.worker !== 'Sohel') {
                    setOverrideWorker(skuItem.suggestion.worker)
                  }
                  setIsCreatingNew(false)
                }}
              >
                Apply Suggestion
              </button>
            </div>
          )}

          {/* Mode Selector Cards */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <div
              onClick={() => setIsCreatingNew(false)}
              className={`card-radio flex items-center gap-2.5 cursor-pointer ${
                !isCreatingNew ? 'active' : ''
              }`}
            >
              <Package size={16} className={!isCreatingNew ? 'text-blue-500' : 'text-muted'} />
              <div>
                <strong className="text-xs font-bold block text-foreground">Map to Existing Product</strong>
                <span className="text-[10.5px] text-muted block">Select from {products.length} catalog items</span>
              </div>
            </div>

            <div
              onClick={() => setIsCreatingNew(true)}
              className={`card-radio flex items-center gap-2.5 cursor-pointer ${
                isCreatingNew ? 'active' : ''
              }`}
            >
              <PlusCircle size={16} className={isCreatingNew ? 'text-blue-500' : 'text-muted'} />
              <div>
                <strong className="text-xs font-bold block text-foreground">Create New Product</strong>
                <span className="text-[10.5px] text-muted block">Register new canonical item</span>
              </div>
            </div>
          </div>

          {!isCreatingNew ? (
            <div className="form-section space-y-3">
              <div className="form-group">
                <label className="text-xs font-semibold text-foreground">
                  Canonical Warehouse Product *
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} [{p.internal_code || 'No Code'}] — {p.category || 'General'} ({p.assigned_worker})
                    </option>
                  ))}
                </select>
              </div>

              {/* Product Property Preview Card */}
              {chosenProduct && (
                <div className="p-3 rounded-lg bg-card border border-border grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-muted uppercase font-bold block">Assigned Worker</span>
                    <span className="worker-name mt-1">
                      <i className={`dot ${chosenProduct.assigned_worker === 'Sohel' ? 'blue' : 'teal'}`} />
                      <span className="font-semibold">{chosenProduct.assigned_worker}</span>
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted uppercase font-bold block">Category</span>
                    <span className="badge badge-neutral mt-1">{chosenProduct.category || 'General'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted uppercase font-bold block">PackCalc Recipe</span>
                    <span className="font-semibold text-[11px] text-foreground mt-1 block">
                      {chosenProduct.bag_family
                        ? `${chosenProduct.bag_family} (${chosenProduct.raw_3bag_qty || 0}×3B + ${chosenProduct.raw_2bag_qty || 0}×2B)`
                        : '— Standard'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="form-section space-y-3.5">
              <h3 className="form-section-title text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
                <Tag size={13} className="text-blue-500" /> New Product Definition
              </h3>

              <div className="form-group">
                <label className="text-xs font-semibold text-foreground">
                  Product Name *
                </label>
                <input
                  className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="e.g. R1S Selfie Stick with Tripod"
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="form-group">
                  <label className="text-xs font-semibold text-foreground">Internal Code</label>
                  <input
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-border bg-background text-foreground focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    placeholder="e.g. R1S"
                    value={newProdCode}
                    onChange={(e) => setNewProdCode(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="text-xs font-semibold text-foreground">Category</label>
                  <select
                    className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    value={newProdCategory}
                    onChange={(e) => setNewProdCategory(e.target.value)}
                  >
                    {categories.map((c: any) => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="text-xs font-semibold text-foreground">Picking Station</label>
                  <select
                    className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    value={newProdWorker}
                    onChange={(e) => setNewProdWorker(e.target.value)}
                  >
                    {workers.map((w: any) => (
                      <option key={w.id} value={w.name}>{w.name} Station</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Worker Override Field Card */}
          <div className="form-section space-y-2.5">
            <h3 className="form-section-title text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
              <Users size={13} className="text-teal-500" /> Floor Worker Routing
            </h3>

            <div className="grid grid-cols-3 gap-2">
              <div
                onClick={() => setOverrideWorker('')}
                className={`card-radio p-2.5 cursor-pointer ${
                  overrideWorker === '' ? 'active' : ''
                }`}
              >
                <span className="text-xs font-bold block text-foreground">Inherit from Product</span>
                <span className="text-[10px] text-muted block mt-0.5">Automatic default</span>
              </div>

              <div
                onClick={() => setOverrideWorker('Sohel')}
                className={`card-radio p-2.5 cursor-pointer ${
                  overrideWorker === 'Sohel' ? 'active' : ''
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <i className="dot blue" />
                  <span className="text-xs font-bold text-foreground">Sohel</span>
                </div>
                <span className="text-[10px] text-muted block mt-0.5">Station A (Accessories)</span>
              </div>

              <div
                onClick={() => setOverrideWorker('Kartik Da')}
                className={`card-radio p-2.5 cursor-pointer ${
                  overrideWorker === 'Kartik Da' ? 'active' : ''
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <i className="dot teal" />
                  <span className="text-xs font-bold text-foreground">Kartik Da</span>
                </div>
                <span className="text-[10px] text-muted block mt-0.5">Station B (Bulk Goods)</span>
              </div>
            </div>
          </div>

          {/* Persistence Options */}
          <div className="p-3 rounded-xl bg-card border border-border">
            <label className="flex items-center gap-2.5 text-xs font-medium text-foreground cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMapping}
                onChange={(e) => setRememberMapping(e.target.checked)}
                className="rounded border-border text-blue-600 focus:ring-blue-500 h-4 w-4"
              />
              <div>
                <strong className="block text-foreground">Remember this mapping for all future batches</strong>
                <span className="text-[11px] text-muted block">Creates an active training rule that auto-classifies incoming labels</span>
              </div>
            </label>
          </div>

          <ModalActions
            close={close}
            primary={isCreatingNew ? 'Create & Train SKU' : 'Save & Train SKU'}
            loading={loading}
          />
        </form>
      </div>
    </div>
  )
}

function ProductModal({ product, categories, workers, close, onSaved }: any) {
  const [name, setName] = useState(product?.name || '')
  const [internalCode, setInternalCode] = useState(product?.internal_code || '')
  const [category, setCategory] = useState(product?.category || categories[0]?.name || 'Tripod')
  const [worker, setWorker] = useState(product?.assigned_worker || 'Sohel')
  const [sortOrder, setSortOrder] = useState(product?.sort_order ?? 10)
  const [bagFamily, setBagFamily] = useState(product?.bag_family || '')
  const [raw3Bag, setRaw3Bag] = useState(product?.raw_3bag_qty ?? 0)
  const [raw2Bag, setRaw2Bag] = useState(product?.raw_2bag_qty ?? 0)
  const [notes, setNotes] = useState(product?.notes || '')
  const [active, setActive] = useState(product ? product.active : true)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)

    const payload = {
      name: name.trim(),
      internal_code: internalCode.trim() || null,
      category,
      assigned_worker: worker,
      sort_order: Number(sortOrder),
      bag_family: bagFamily ? bagFamily : null,
      raw_3bag_qty: Number(raw3Bag),
      raw_2bag_qty: Number(raw2Bag),
      notes: notes.trim() || null,
      active,
    }

    try {
      if (product) {
        await updateProduct(product.id, payload)
      } else {
        await createProduct(payload)
      }
      onSaved()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-backdrop">
      <div className="modal max-w-2xl w-full">
        <div className="modal-head pb-3 border-b border-border">
          <div>
            <p className="eyebrow text-blue-500 font-semibold flex items-center gap-1.5 text-xs">
              <Package size={14} /> Warehouse Catalog
            </p>
            <h2 className="text-lg font-bold text-foreground mt-0.5">
              {product ? `Edit Product: ${product.name}` : 'Add Canonical Warehouse Product'}
            </h2>
          </div>
          <button className="icon-button" onClick={close} title="Close (Esc)">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Section 1: Identification */}
          <div className="form-section space-y-3">
            <h3 className="form-section-title text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
              <Tag size={13} className="text-blue-500" /> Product Details & Classification
            </h3>

            <div className="form-group">
              <label className="text-xs font-semibold text-foreground">
                Product Name *
              </label>
              <input
                className="w-full px-3.5 py-2 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                placeholder="e.g. R1S Selfie Stick with Tripod"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="form-group">
                <label className="text-xs font-semibold text-foreground">Internal Code</label>
                <input
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-border bg-background text-foreground focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="e.g. R1S or AX6"
                  value={internalCode}
                  onChange={(e) => setInternalCode(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="text-xs font-semibold text-foreground">Category</label>
                <select
                  className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {categories.map((c: ApiCategory) => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="text-xs font-semibold text-foreground">Sort Priority Order</label>
                <input
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-border bg-background text-foreground focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(Number(e.target.value))}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Picking Station Assignment */}
          <div className="form-section space-y-3">
            <h3 className="form-section-title text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
              <Users size={13} className="text-teal-500" /> Floor Picking Station
            </h3>

            <div className="grid grid-cols-2 gap-3">
              {workers.map((w: ApiWorker) => (
                <div
                  key={w.id}
                  onClick={() => setWorker(w.name)}
                  className={`card-radio cursor-pointer transition-all ${
                    worker === w.name ? 'active' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <i className={`dot ${w.name === 'Sohel' ? 'blue' : 'teal'}`} />
                    <strong className="text-xs font-bold text-foreground">{w.name}</strong>
                    {worker === w.name && (
                      <span className="badge badge-success ml-auto text-[10px]">Assigned</span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted mt-1.5">
                    {w.name === 'Sohel' ? 'Station A: Primary picking & electronic accessories' : 'Station B: Secondary picking & bulk/heavy goods'}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: PackCalc Bag Recipe */}
          <div className="form-section space-y-3 bg-amber-500/5 p-4 rounded-xl border border-amber-500/25">
            <div className="flex items-center justify-between">
              <h3 className="form-section-title text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1.5 mb-0">
                <Calculator size={13} /> PackCalc Raw Material Recipe (Garbage Bags)
              </h3>
              <span className="text-[10px] text-muted font-medium">Optional stock formula</span>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-1">
              <div className="form-group">
                <label className="text-xs font-semibold text-foreground">Bag Family</label>
                <select
                  className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground font-medium focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  value={bagFamily}
                  onChange={(e) => setBagFamily(e.target.value)}
                >
                  <option value="">None (Standard Product)</option>
                  <option value="Star">Star Family</option>
                  <option value="Averx">Averx Family</option>
                  <option value="Plain">Plain Family</option>
                </select>
              </div>

              {bagFamily && (
                <>
                  <div className="form-group">
                    <label className="text-xs font-semibold text-foreground">3-Bag Rolls Required</label>
                    <input
                      className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-border bg-background text-foreground focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                      type="number"
                      value={raw3Bag}
                      onChange={(e) => setRaw3Bag(Number(e.target.value))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="text-xs font-semibold text-foreground">2-Bag Rolls Required</label>
                    <input
                      className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-border bg-background text-foreground focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                      type="number"
                      value={raw2Bag}
                      onChange={(e) => setRaw2Bag(Number(e.target.value))}
                    />
                  </div>
                </>
              )}
            </div>

            {bagFamily && (
              <div className="p-2.5 rounded-lg bg-card border border-border text-[11px] text-muted flex items-center gap-2">
                <Sparkles size={13} className="text-amber-500 shrink-0" />
                <span>
                  <strong>Recipe Formula:</strong> 1 finished unit of {name || 'this product'} computes as{' '}
                  <strong className="text-foreground">{raw3Bag} rolls of 3-Bag</strong> and{' '}
                  <strong className="text-foreground">{raw2Bag} rolls of 2-Bag</strong> in dispatch summary.
                </span>
              </div>
            )}
          </div>

          {/* Section 4: Notes & Status */}
          <div className="form-section space-y-3">
            <div className="form-group">
              <label className="text-xs font-semibold text-foreground">Special Packing Notes / Specs</label>
              <textarea
                rows={2}
                className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                placeholder="e.g. Include warranty card, bubble-wrap head, place in size-3 corrugated box..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="p-3 rounded-lg bg-card border border-border">
              <label className="flex items-center gap-2.5 text-xs font-medium text-foreground cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="rounded border-border text-blue-600 focus:ring-blue-500 h-4 w-4"
                />
                <div>
                  <strong className="block text-foreground">Active canonical product</strong>
                  <span className="text-[11px] text-muted block">Visible in warehouse picking manifests, batch sorting, and SKU training</span>
                </div>
              </label>
            </div>
          </div>

          <ModalActions
            close={close}
            primary={product ? 'Update Warehouse Product' : 'Create Product'}
            loading={loading}
          />
        </form>
      </div>
    </div>
  )
}

function AddPatternRuleModal({ products, close, onAdded }: any) {
  const [ruleType, setRuleType] = useState<'starts_with' | 'contains' | 'ends_with' | 'regex'>('contains')
  const [value, setValue] = useState('')
  const [productId, setProductId] = useState<number | ''>('')
  const [worker, setWorker] = useState('')
  const [priority, setPriority] = useState(10)
  const [testInput, setTestInput] = useState('')
  const [loading, setLoading] = useState(false)

  // Live test result
  const isMatch = (() => {
    if (!testInput.trim() || !value.trim()) return false
    const raw = testInput.trim().toUpperCase()
    const pattern = value.trim().toUpperCase()
    if (ruleType === 'starts_with') return raw.startsWith(pattern)
    if (ruleType === 'ends_with') return raw.endsWith(pattern)
    if (ruleType === 'contains') return raw.includes(pattern)
    if (ruleType === 'regex') {
      try { return new RegExp(value.trim(), 'i').test(raw) } catch { return false }
    }
    return false
  })()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!value.trim()) return
    setLoading(true)
    try {
      await createPatternRule({
        rule_type: ruleType,
        value: value.trim(),
        product_id: productId ? Number(productId) : null,
        suggested_worker: worker || null,
        priority: Number(priority),
      })
      onAdded()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-backdrop">
      <div className="modal max-w-xl w-full">
        <div className="modal-head pb-3 border-b border-border">
          <div>
            <p className="eyebrow text-blue-500 font-semibold flex items-center gap-1.5 text-xs">
              <GitBranch size={14} /> Pattern Matching Engine
            </p>
            <h2 className="text-lg font-bold text-foreground mt-0.5">Add Pattern Classification Rule</h2>
          </div>
          <button className="icon-button" onClick={close} title="Close (Esc)">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Rule Type Visual Cards */}
          <div className="form-section space-y-2.5">
            <h3 className="form-section-title text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
              <Layers size={13} className="text-blue-500" /> Rule Match Strategy
            </h3>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'contains', label: 'Contains', desc: 'Substring match' },
                { id: 'starts_with', label: 'Starts With', desc: 'Prefix match' },
                { id: 'ends_with', label: 'Ends With', desc: 'Suffix match' },
                { id: 'regex', label: 'Regex', desc: 'Expression' },
              ].map((t) => (
                <div
                  key={t.id}
                  onClick={() => setRuleType(t.id as any)}
                  className={`card-radio p-2.5 cursor-pointer text-left ${
                    ruleType === t.id ? 'active' : ''
                  }`}
                >
                  <p className="text-xs font-bold text-foreground">{t.label}</p>
                  <span className="text-[10px] text-muted block mt-0.5">{t.desc}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="form-section space-y-3.5">
            <div className="form-group">
              <label className="text-xs font-semibold text-foreground">
                Pattern Match Value *
              </label>
              <input
                className="w-full px-3.5 py-2 text-xs font-mono rounded-lg border border-border bg-background text-foreground focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                placeholder={ruleType === 'starts_with' ? 'e.g. GB- or R1S-' : ruleType === 'contains' ? 'e.g. 17X19 or TRIPOD' : 'e.g. -BLK'}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                required
              />
            </div>

            {/* Interactive Rule Sandbox inside modal */}
            <div className="p-3.5 rounded-xl bg-card border border-border space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted block">
                Live Test Sandbox
              </span>
              <input
                className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-border bg-background text-foreground focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                placeholder="Type test SKU (e.g. GB-17X19-BLK)..."
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
              />
              {testInput && (
                <div className="flex items-center gap-2 text-xs pt-1">
                  {isMatch ? (
                    <span className="badge badge-success font-bold">✓ Rule Matches this SKU!</span>
                  ) : (
                    <span className="badge badge-danger">✗ Does not match</span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="form-section space-y-3.5">
            <div className="form-group">
              <label className="text-xs font-semibold text-foreground">
                Target Canonical Product (Optional)
              </label>
              <select
                className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                value={productId}
                onChange={(e) => setProductId(e.target.value ? Number(e.target.value) : '')}
              >
                <option value="">None (Worker Routing Only)</option>
                {products.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.name} [{p.internal_code || '—'}] ({p.assigned_worker})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="form-group">
                <label className="text-xs font-semibold text-foreground">Suggested Floor Worker</label>
                <select
                  className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  value={worker}
                  onChange={(e) => setWorker(e.target.value)}
                >
                  <option value="">Default from product</option>
                  <option value="Sohel">Sohel</option>
                  <option value="Kartik Da">Kartik Da</option>
                </select>
              </div>

              <div className="form-group">
                <label className="text-xs font-semibold text-foreground">Rule Execution Priority</label>
                <input
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-border bg-background text-foreground focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  type="number"
                  value={priority}
                  onChange={(e) => setPriority(Number(e.target.value))}
                />
              </div>
            </div>
          </div>

          <ModalActions
            close={close}
            primary="Save Pattern Rule"
            loading={loading}
          />
        </form>
      </div>
    </div>
  )
}

interface GlobalWorkspaceProgressBarProps {
  activeBatch: ProcessBatchResponse | null
  isProcessing: boolean
  processingStep: number
  dashData: DashboardResponse | undefined
  selectedDate: string
  go: (page: string) => void
  showToast: (msg: string) => void
  onClearBatch: () => void
  onProcessNew: () => void
  onConfirmBatch?: (batchId: number) => Promise<void>
  collapsed: boolean
  setCollapsed: React.Dispatch<React.SetStateAction<boolean>>
}

function GlobalWorkspaceProgressBar({
  activeBatch,
  isProcessing,
  processingStep,
  dashData,
  selectedDate,
  go,
  showToast,
  onClearBatch,
  onProcessNew,
  onConfirmBatch,
  collapsed,
  setCollapsed,
}: GlobalWorkspaceProgressBarProps) {
  const steps = [
    'Reading pages',
    'Extracting AWBs',
    'Reading SKUs',
    'Checking duplicates',
    'Mapping products',
    'Cropping labels',
    'Sorting labels',
    'Ready for review',
  ]

  const hasBatch = Boolean(activeBatch || isProcessing)

  // 1. Active Batch Progress Mode Calculations
  const batchTotal = activeBatch?.pages_scanned || activeBatch?.labels?.length || 50
  const uniqueAwbs = activeBatch?.unique_awbs || 0
  const duplicateAwbs = activeBatch?.duplicate_awbs || 0
  const unknownSkus = activeBatch?.unknown_skus || 0
  const totalItems = activeBatch?.total_items || 0

  // Total labels processed vs batch total
  const batchLabelsProcessed = isProcessing
    ? Math.round(((processingStep + 1) / 8) * batchTotal)
    : (activeBatch ? activeBatch.labels.length : 0)

  const batchPercent = isProcessing
    ? Math.min(100, Math.round(((processingStep + 1) / 8) * 100))
    : (batchTotal > 0 ? Math.min(100, Math.round((batchLabelsProcessed / batchTotal) * 100)) : 100)

  // Segment widths
  const uniqueWidthPct = batchTotal > 0 ? (uniqueAwbs / batchTotal) * 100 : 0
  const duplicateWidthPct = batchTotal > 0 ? (duplicateAwbs / batchTotal) * 100 : 0
  const unknownWidthPct = batchTotal > 0 ? (unknownSkus / batchTotal) * 100 : 0

  // 2. Daily Warehouse Dispatch Mode Calculations
  const dailyTarget = dashData?.shift_overview?.target_labels || 50
  const dailyProcessed = dashData?.unique_labels || 0
  const dailyDuplicates = dashData?.duplicate_labels || 0
  const dailyItems = dashData?.total_items || 0
  const dailyPercent = dashData?.shift_overview?.label_progress_percent ?? Math.min(100, Math.round((dailyProcessed / dailyTarget) * 100))
  const cleanRate = dashData?.shift_overview?.clean_shipment_rate ?? 100

  // If collapsed into single compact strip
  if (collapsed) {
    return (
      <div className="bg-card border-b border-border px-6 py-2 flex items-center justify-between text-xs transition-all shadow-xs" id="global-progress-bar-collapsed">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className={`w-2 h-2 rounded-full ${hasBatch ? 'bg-blue-500 animate-pulse' : 'bg-emerald-500'}`} />
            <strong className="text-[11px] font-bold tracking-tight text-foreground">
              {hasBatch ? `Batch #${activeBatch?.batch_id ?? 'Live'}` : 'Shift Dispatch'}:
            </strong>
          </div>

          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  hasBatch ? 'bg-gradient-to-r from-blue-500 to-indigo-500' : 'bg-gradient-to-r from-emerald-500 to-teal-500'
                }`}
                style={{ width: `${hasBatch ? batchPercent : dailyPercent}%` }}
              />
            </div>
            <span className="font-mono text-[11px] font-bold shrink-0 text-foreground">
              {hasBatch ? `${batchLabelsProcessed}/${batchTotal} (${batchPercent}%)` : `${dailyProcessed}/${dailyTarget} (${dailyPercent}%)`}
            </span>
          </div>

          {hasBatch && (
            <div className="hidden lg:flex items-center gap-2 text-[11px] text-muted">
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{uniqueAwbs} Unique</span>
              <span>•</span>
              <span className={duplicateAwbs > 0 ? 'text-amber-600 dark:text-amber-400 font-semibold' : ''}>{duplicateAwbs} Duplicates</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {hasBatch ? (
            <button
              onClick={() => go('process')}
              className="px-2 py-0.5 text-[10px] font-semibold rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 hover:bg-blue-500/20"
            >
              Review [2]
            </button>
          ) : (
            <button
              onClick={onProcessNew}
              className="px-2 py-0.5 text-[10px] font-semibold rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20"
            >
              + Upload [P]
            </button>
          )}

          <button
            onClick={() => setCollapsed(false)}
            className="text-[10px] text-muted hover:text-foreground px-1.5 py-0.5 rounded border border-border"
            title="Expand full progress dashboard bar"
          >
            Expand
          </button>
        </div>
      </div>
    )
  }

  return (
    <section className="bg-card border-b border-border px-6 py-3.5 shadow-xs relative z-10 transition-all" id="global-workspace-progress-bar">
      <div className="max-w-7xl mx-auto space-y-2.5">
        {/* Top Header Row */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-lg ${hasBatch ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'}`}>
              <Layers size={17} />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted">
                  {hasBatch ? 'Active Batch Progress' : 'Workspace Shift Progress'}
                </span>

                {isProcessing ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-300 border border-blue-500/30 animate-pulse flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
                    Processing ({steps[processingStep] || 'Parsing'})
                  </span>
                ) : activeBatch ? (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    activeBatch.status === 'confirmed'
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                      : activeBatch.unknown_skus > 0 || activeBatch.duplicate_awbs > 0
                      ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                      : 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30'
                  }`}>
                    {activeBatch.status === 'confirmed' ? '✓ Confirmed to Inventory' : activeBatch.unknown_skus > 0 ? '⚠ Needs SKU Review' : 'Ready for Review'}
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    Shift Active • Kolkata Hub
                  </span>
                )}
              </div>

              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                {hasBatch ? (
                  <span>Batch #{activeBatch?.batch_id ?? 'Live'}: {activeBatch?.filename || 'Flipkart Shipping Labels Manifest'}</span>
                ) : (
                  <span>Today&apos;s Dispatch Accounting ({selectedDate})</span>
                )}
              </h3>
            </div>
          </div>

          {/* Big Ratio & Percentage Pill */}
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="flex items-baseline justify-end gap-1.5">
                <strong className="text-lg font-black tracking-tight text-foreground font-mono">
                  {hasBatch ? `${batchLabelsProcessed} / ${batchTotal}` : `${dailyProcessed} / ${dailyTarget}`}
                </strong>
                <span className="text-xs text-muted font-medium">
                  {hasBatch ? 'Labels Processed' : 'Shipments Processed'}
                </span>
              </div>
              <p className="text-[10px] text-muted -mt-0.5">
                {hasBatch
                  ? isProcessing
                    ? `Step ${processingStep + 1} of 8: ${steps[processingStep]}`
                    : `${batchPercent}% of batch completed`
                  : `${cleanRate}% clean shipment accuracy rate`}
              </p>
            </div>

            <div className={`px-2.5 py-1.5 rounded-lg text-xs font-black font-mono border ${
              hasBatch
                ? batchPercent === 100
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                  : 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30'
                : dailyPercent >= 80
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                : 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30'
            }`}>
              {hasBatch ? `${batchPercent}%` : `${dailyPercent}%`}
            </div>

            {/* Quick Actions in Global Progress Bar */}
            <div className="flex items-center gap-1.5 border-l border-border pl-3">
              {hasBatch ? (
                <>
                  <button
                    onClick={() => go('process')}
                    className="px-2.5 py-1 text-xs font-semibold rounded-md bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors flex items-center gap-1"
                    title="Open Process Labels View [2]"
                  >
                    <span>Review Batch</span>
                    <kbd className="bg-blue-700 text-blue-100 border-blue-500 text-[9px] px-1 py-0">2</kbd>
                  </button>

                  {activeBatch && activeBatch.status !== 'confirmed' && onConfirmBatch && (
                    <button
                      onClick={() => onConfirmBatch(activeBatch.batch_id)}
                      className="px-2.5 py-1 text-xs font-semibold rounded-md bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors flex items-center gap-1"
                      title="Confirm Batch & Update Stock-out"
                    >
                      <Check size={13} />
                      <span>Confirm</span>
                    </button>
                  )}

                  {activeBatch && (
                    <button
                      onClick={() => {
                        window.open(`/batches/${activeBatch.batch_id}/pdf?sort=sku_grouped`, '_blank')
                        showToast('Thermal 4×6 PDF opened for print!')
                      }}
                      className="p-1.5 rounded-md border border-border bg-card hover:bg-slate-100 dark:hover:bg-slate-800 text-muted hover:text-foreground transition-colors"
                      title="Print Cropped 4x6 Thermal PDF"
                    >
                      <Printer size={14} />
                    </button>
                  )}

                  <button
                    onClick={onClearBatch}
                    className="p-1.5 rounded-md border border-border bg-card hover:bg-rose-500/10 hover:text-rose-500 text-muted transition-colors"
                    title="Clear Batch & Reset [C]"
                  >
                    <Trash2 size={14} />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={onProcessNew}
                    className="px-2.5 py-1 text-xs font-semibold rounded-md bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors flex items-center gap-1.5"
                    title="Process New Label PDF [P]"
                  >
                    <CloudUpload size={13} />
                    <span>Upload PDF</span>
                    <kbd className="bg-blue-700 text-blue-100 border-blue-500 text-[9px] px-1 py-0">P</kbd>
                  </button>
                </>
              )}

              <button
                onClick={() => setCollapsed(true)}
                className="p-1.5 text-muted hover:text-foreground text-[10px] rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                title="Collapse bar to 1 line"
              >
                <ChevronDown size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* The Multi-Segment Visual Progress Bar Track */}
        <div className="relative w-full h-3 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner p-0.5 flex gap-0.5">
          {hasBatch ? (
            isProcessing ? (
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-teal-400 transition-all duration-300 animate-pulse"
                style={{ width: `${batchPercent}%` }}
              />
            ) : (
              <>
                {/* Unique valid labels (Emerald) */}
                {uniqueWidthPct > 0 && (
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                    style={{ width: `${uniqueWidthPct}%` }}
                    title={`Unique Valid Labels: ${uniqueAwbs}`}
                  />
                )}
                {/* Duplicate labels (Amber) */}
                {duplicateWidthPct > 0 && (
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-500"
                    style={{ width: `${duplicateWidthPct}%` }}
                    title={`Duplicate Labels Prevented: ${duplicateAwbs}`}
                  />
                )}
                {/* Unknown unmapped SKUs (Rose) */}
                {unknownWidthPct > 0 && (
                  <div
                    className="h-full bg-gradient-to-r from-rose-400 to-rose-500 rounded-full transition-all duration-500"
                    style={{ width: `${unknownWidthPct}%` }}
                    title={`Unknown SKUs Requiring Training: ${unknownSkus}`}
                  />
                )}
              </>
            )
          ) : (
            <div
              className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${dailyPercent}%` }}
            />
          )}
        </div>

        {/* Diagnostic Badges & Breakdown Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5 text-[11px]">
          <div className="flex flex-wrap items-center gap-2">
            {hasBatch ? (
              <>
                <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 font-semibold">
                  <CheckCircle2 size={12} className="text-emerald-500" />
                  <span>{uniqueAwbs} Unique AWBs</span>
                </div>

                <div className={`flex items-center gap-1 px-2 py-0.5 rounded font-semibold border ${
                  duplicateAwbs > 0
                    ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-muted border-border'
                }`}>
                  <ShieldAlert size={12} className={duplicateAwbs > 0 ? 'text-amber-500' : 'text-muted'} />
                  <span>{duplicateAwbs} Duplicates Prevented</span>
                </div>

                <div className={`flex items-center gap-1 px-2 py-0.5 rounded font-semibold border ${
                  unknownSkus > 0
                    ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-muted border-border'
                }`}>
                  <Tags size={12} className={unknownSkus > 0 ? 'text-rose-500' : 'text-muted'} />
                  <span>{unknownSkus} Unmapped SKUs</span>
                </div>

                <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-muted border border-border">
                  <Package size={12} />
                  <span>{totalItems} Total Units</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 font-semibold">
                  <CheckCircle2 size={12} className="text-emerald-500" />
                  <span>{dailyProcessed} Confirmed Shipments</span>
                </div>

                <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20 font-semibold">
                  <Package size={12} />
                  <span>{dailyItems} Dispatched Units</span>
                </div>

                <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-muted border border-border">
                  <ShieldAlert size={12} />
                  <span>{dailyDuplicates} Reprints Isolated</span>
                </div>

                <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-muted border border-border">
                  <Users size={12} />
                  <span>Active Workers: Sohel (Lead), Kartik Da</span>
                </div>
              </>
            )}
          </div>

          <div className="text-[10px] text-muted flex items-center gap-2">
            <span>Flipkart Thermal Pipeline</span>
            <span>•</span>
            <span className="font-mono text-foreground font-semibold">4×6 Auto-Crop Active</span>
          </div>
        </div>
      </div>
    </section>
  )
}
