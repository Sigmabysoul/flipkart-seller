'use client'

import React, { useState, useTransition } from 'react'
import useSWR, { mutate } from 'swr'
import {
  Archive,
  ArrowDownToLine,
  BarChart3,
  Bell,
  BookOpen,
  Box,
  ChevronDown,
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
  Printer,
  Search,
  Settings as SettingsIcon,
  ShieldAlert,
  Sun,
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
  ApiProduct,
  ApiWorker,
  ApiCategory,
  UnknownSkuItem,
  TrainingHistoryItem,
  PatternRule,
  ParsedLabelItem,
  ProcessBatchResponse,
} from '@/lib/api'

const nav = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
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

function StatusBadge({ value }: { value: string }) {
  const v = value.toLowerCase()
  let kind = 'neutral'
  if (['mapped', 'confirmed', 'active', 'ok'].includes(v)) kind = 'success'
  else if (['duplicate', 'needs_review', 'review', 'override'].includes(v)) kind = 'warning'
  else if (['unknown', 'mismatch', 'cancelled', 'danger'].includes(v)) kind = 'danger'
  else if (['mixed', 'info', 'draft'].includes(v)) kind = 'info'
  return <Badge kind={kind}>{value}</Badge>
}

export default function LabelManager() {
  const [page, setPage] = useState('dashboard')
  const [dark, setDark] = useState(true)
  const [mobile, setMobile] = useState(false)
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0])
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showHelpModal, setShowHelpModal] = useState(false)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 4000)
  }

  const go = (id: string) => {
    setPage(id)
    setMobile(false)
    setShowNotifications(false)
  }

  // Live unknown count for nav badge
  const { data: trainStats } = useSWR('/training/stats', getTrainingStats, { refreshInterval: 5000 })

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
          {nav.map((item) => {
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
                {isTraining && count > 0 && <span className="nav-count">{count}</span>}
              </button>
            )
          })}
        </nav>

        <div className="sidebar-bottom">
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

          <div className="top-actions relative">
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

        <div className="content">
          {page === 'dashboard' && (
            <Dashboard
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
  const { data: dash, mutate: refreshDash, isLoading } = useSWR(
    `/dashboard?date=${selectedDate}`,
    () => getDashboard(selectedDate),
    { refreshInterval: 5000 }
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
    lines.push(`WORKER ALLOCATION`)
    lines.push(`Worker,Status,Unique Labels,Items,Workload Share(%)`)
    workersList.forEach((w: any) => {
      lines.push(`${w.name},${w.status},${w.unique_labels},${w.items},${w.share_of_total}%`)
    })
    lines.push(``)
    lines.push(`PRODUCT CATEGORY BREAKDOWN`)
    lines.push(`Category,Dispatched Units,Volume Share(%),Active AWBs,Unique SKUs`)
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
    showToast(`Exported CSV report for ${selectedDate}`)
  }

  // Copy PackCalc recipe to clipboard
  const handleCopyPackCalc = () => {
    const text = `PACKCALC REQUIREMENTS (${selectedDate}):
• Averx: ${dash?.raw_material_requirements?.Averx?.['3-Bag'] ?? 0} rolls (3-Bag), ${dash?.raw_material_requirements?.Averx?.['2-Bag'] ?? 0} rolls (2-Bag)
• Star: ${dash?.raw_material_requirements?.Star?.['3-Bag'] ?? 0} rolls (3-Bag), ${dash?.raw_material_requirements?.Star?.['2-Bag'] ?? 0} rolls (2-Bag)
• Plain: ${dash?.raw_material_requirements?.Plain?.['3-Bag'] ?? 0} rolls (3-Bag), ${dash?.raw_material_requirements?.Plain?.['2-Bag'] ?? 0} rolls (2-Bag)`

    navigator.clipboard.writeText(text)
    showToast('PackCalc recipe copied to clipboard')
  }

  return (
    <>
      <PageHead
        eyebrow={`Processing Date: ${selectedDate}`}
        title={`Warehouse Dashboard`}
        description={`Operational stock-out, worker daily progress, product categories, and PackCalc raw materials for ${dateFormatted}.`}
        action={
          <div className="flex gap-2 flex-wrap items-center">
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

      {/* Worker Daily Progress & Allocation */}
      <section className="section" id="worker-progress-section">
        <div className="section-head">
          <div>
            <h2>Daily Progress by Worker</h2>
            <p>Live workload distribution, picked items, and progress toward daily quotas</p>
          </div>
          <div className="flex gap-2">
            <button className="text-button" onClick={() => setPicklistModal(true)} id="dash-worker-picklist-btn">
              <Printer size={14} /> Full Picklist
            </button>
            <button className="text-button" onClick={() => go('products')} id="view-worker-rules-btn">
              View product rules <ChevronRight size={15} />
            </button>
          </div>
        </div>

        <div className="worker-grid" id="workers-allocation-grid">
          {workersList.map((w: any, index: number) => {
            const avatarColorClass = index % 2 === 0 ? 'blue-avatar' : 'teal-avatar'
            const initial = w.name.charAt(0).toUpperCase()
            const workerCardId = `worker-card-${w.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`

            return (
              <div
                className="worker-card cursor-pointer hover:border-blue-400/60 transition-all shadow-sm"
                id={workerCardId}
                key={w.id || w.name}
                onClick={() => setSelectedWorkerModal(w)}
                title="Click to view worker assigned items drill-down"
              >
                <div className="worker-top">
                  <div className={`avatar ${avatarColorClass}`}>{initial}</div>
                  <div className="flex items-center gap-2">
                    <span className={`worker-status ${w.active ? '' : 'bg-slate-100 text-slate-500'}`}>
                      {w.status || (w.active ? 'On shift' : 'Offline')}
                    </span>
                    <Eye size={14} className="text-muted hover:text-blue-500" />
                  </div>
                </div>
                <h3>{w.name}</h3>

                <div className="worker-metrics">
                  <div>
                    <strong>{w.unique_labels}</strong>
                    <span>Unique labels</span>
                  </div>
                  <div>
                    <strong>{w.items}</strong>
                    <span>Items to pick</span>
                  </div>
                </div>

                {/* Worker Daily Progress Bar */}
                <div className="mt-4 pt-3 border-t border-slate-200/70 dark:border-slate-700/60">
                  <div className="flex justify-between items-center text-[11px] mb-1">
                    <span className="text-muted">Quota ({w.target_quota} units)</span>
                    <strong className="font-semibold">{w.progress_percent}%</strong>
                  </div>
                  <div className="progress-track">
                    <div
                      className={`progress-fill ${index % 2 === 0 ? 'blue' : 'teal'}`}
                      style={{ width: `${Math.min(100, w.progress_percent)}%` }}
                    />
                  </div>
                </div>

                {/* Worker Efficiency & Share Details */}
                <div className="mt-3 flex items-center justify-between text-[11px] text-muted">
                  <span>Share: <strong>{w.share_of_total}%</strong></span>
                  <span>Avg: <strong>{w.items_per_label}</strong> items/pkg</span>
                </div>

                {/* Top picked products for this worker */}
                {w.top_products && w.top_products.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px]">
                    <span className="text-muted block mb-1 font-medium">Top Items Today:</span>
                    <div className="flex flex-wrap gap-1">
                      {w.top_products.map((tp: any) => (
                        <span key={tp.name} className="cat-badge">
                          {tp.name} ({tp.quantity})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

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

      {/* Two Column Section: Stock Out & Raw Materials */}
      <div className="two-col">
        {/* Product Stock Out Panel */}
        <section className="panel" id="product-stock-out-panel">
          <div className="section-head">
            <div>
              <h2>Product stock out</h2>
              <p>Canonical warehouse products aggregated by ID</p>
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

        {/* PackCalc Raw Materials Panel */}
        <section className="panel" id="packcalc-materials-panel">
          <div className="section-head">
            <div>
              <h2>Raw materials required (PackCalc)</h2>
              <p>Garbage bag raw roll calculations (duplicates excluded)</p>
            </div>
            <div className="flex gap-2 items-center">
              <button
                className="small-button"
                onClick={handleCopyPackCalc}
                id="copy-packcalc-btn"
                title="Copy PackCalc calculations to clipboard"
              >
                <Copy size={12} /> Copy
              </button>
              <Badge kind="success">Auto-calculated</Badge>
            </div>
          </div>

          <div className="material-list">
            <div className="material" id="material-row-averx">
              <div className="material-icon amber"><Archive size={17} /></div>
              <div className="material-name">
                <strong>Averx</strong>
                <span>Averx Garbage Bag Family</span>
              </div>
              <div className="recipe">
                <span><b>{dash?.raw_material_requirements?.Averx?.['3-Bag'] ?? 0}</b> 3-Bag</span>
                <span><b>{dash?.raw_material_requirements?.Averx?.['2-Bag'] ?? 0}</b> 2-Bag</span>
              </div>
            </div>

            <div className="material" id="material-row-star">
              <div className="material-icon blue"><Archive size={17} /></div>
              <div className="material-name">
                <strong>Star</strong>
                <span>Star Garbage Bag Family</span>
              </div>
              <div className="recipe">
                <span><b>{dash?.raw_material_requirements?.Star?.['3-Bag'] ?? 0}</b> 3-Bag</span>
                <span><b>{dash?.raw_material_requirements?.Star?.['2-Bag'] ?? 0}</b> 2-Bag</span>
              </div>
            </div>

            <div className="material" id="material-row-plain">
              <div className="material-icon slate"><Archive size={17} /></div>
              <div className="material-name">
                <strong>Plain Garbage Bag</strong>
                <span>Plain Garbage Bag Family</span>
              </div>
              <div className="recipe">
                <span><b>{dash?.raw_material_requirements?.Plain?.['3-Bag'] ?? 0}</b> 3-Bag</span>
                <span><b>{dash?.raw_material_requirements?.Plain?.['2-Bag'] ?? 0}</b> 2-Bag</span>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-slate-100 dark:bg-slate-800/60 rounded-lg text-xs text-muted flex items-center gap-2">
            <ShieldAlert size={15} className="text-amber-500 shrink-0" />
            <span>Duplicate shipments never increase PackCalc requirements.</span>
          </div>
        </section>
      </div>

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
                <span className="text-[10px] text-muted block">Shift Quota Target</span>
                <strong className="text-lg font-bold">{selectedWorkerModal.target_quota || 50}</strong>
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

function ProcessLabelsView({ go, showToast }: any) {
  const [processing, setProcessing] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [batchData, setBatchData] = useState<ProcessBatchResponse | null>(null)
  const [sortMode, setSortMode] = useState<SortMode>('sku_grouped')
  const [selectedSkuCluster, setSelectedSkuCluster] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState<'all' | 'mapped' | 'duplicate' | 'unknown' | 'mismatch'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [trainItem, setTrainItem] = useState<{ raw_sku: string; description: string; seen?: number } | null>(null)
  const [duplicateModalItem, setDuplicateModalItem] = useState<ParsedLabelItem | null>(null)
  const [mismatchModalItem, setMismatchModalItem] = useState<ParsedLabelItem | null>(null)
  const [confirming, setConfirming] = useState(false)

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
      setCurrentStep((prev) => {
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
      mutate('/training/stats')
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
      mutate(`/dashboard?date=${batchData.processing_date}`)
      mutate('/training/stats')
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
      mutate(`/dashboard?date=${batchData.processing_date}`)
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
              const updatedLabels = batchData.labels.map((l) => ({
                ...l,
                items: l.items.map((i) =>
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
  const [dialog, setDialog] = useState<string | null>(null)
  const [editingProduct, setEditingProduct] = useState<ApiProduct | null>(null)

  const { data: products = [], mutate: refreshProducts } = useSWR('/products', () => getProducts(true))
  const { data: categories = [], mutate: refreshCategories } = useSWR('/categories', getCategories)
  const { data: workers = [] } = useSWR('/workers', getWorkers)

  const filtered = products.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.internal_code || '').toLowerCase().includes(search.toLowerCase())
    const matchCat = categoryFilter === 'all' || p.category?.toLowerCase() === categoryFilter.toLowerCase()
    const matchWorker = workerFilter === 'all' || p.assigned_worker?.toLowerCase() === workerFilter.toLowerCase()
    return matchSearch && matchCat && matchWorker
  })

  return (
    <>
      <PageHead
        eyebrow="Catalog / Product Library"
        title="Product Library & PackCalc Recipes"
        description="Manage canonical warehouse products, worker picking inheritance, and garbage-bag raw material recipes."
        action={
          <button className="button primary" id="add-product-btn" onClick={() => { setEditingProduct(null); setDialog('product') }}>
            <Plus size={16} /> Add product
          </button>
        }
      />

      {/* Toolbar */}
      <div className="toolbar">
        <button
          className="button secondary"
          id="new-category-btn"
          onClick={async () => {
            const name = window.prompt('New category name:')
            if (name && name.trim()) {
              try {
                await createCategory({ name: name.trim() })
                refreshCategories()
                showToast(`Category "${name}" created.`)
              } catch (e: any) {
                alert(e.message)
              }
            }
          }}
        >
          <Plus size={15} /> New category
        </button>

        <div className="search">
          <Search size={17} />
          <input
            id="search-products-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products or internal codes..."
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-transparent border border-slate-700 rounded px-2 py-1 text-xs"
        >
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.name}>{c.name}</option>
          ))}
        </select>

        <select
          value={workerFilter}
          onChange={(e) => setWorkerFilter(e.target.value)}
          className="bg-transparent border border-slate-700 rounded px-2 py-1 text-xs"
        >
          <option value="all">All Workers</option>
          {workers.map((w) => (
            <option key={w.id} value={w.name}>{w.name}</option>
          ))}
        </select>

        <span className="result-count">{filtered.length} products</span>
      </div>

      <section className="panel" id="product-list-panel">
        <TableWrap>
          <thead>
            <tr>
              <th>Product Name</th>
              <th>Internal Code</th>
              <th>Category</th>
              <th>Assigned Worker</th>
              <th>PackCalc Recipe</th>
              <th>Sort Order</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id}>
                <td>
                  <strong>{p.name}</strong>
                  {p.notes && <small className="text-muted block">{p.notes}</small>}
                </td>
                <td>
                  <span className="mono text-muted">{p.internal_code || '—'}</span>
                </td>
                <td>
                  <Badge kind="neutral">{p.category || 'General'}</Badge>
                </td>
                <td>
                  <span className="worker-name">
                    <i className={`dot ${p.assigned_worker === 'Sohel' ? 'blue' : 'teal'}`} />
                    {p.assigned_worker}
                  </span>
                </td>
                <td>
                  {p.bag_family ? (
                    <span className="text-xs font-semibold text-amber-500">
                      {p.bag_family} ({p.raw_3bag_qty || 0}×3B + {p.raw_2bag_qty || 0}×2B)
                    </span>
                  ) : (
                    <span className="text-muted text-xs">—</span>
                  )}
                </td>
                <td>{p.sort_order}</td>
                <td>
                  <StatusBadge value={p.active ? 'Active' : 'Inactive'} />
                </td>
                <td className="text-right">
                  <button
                    className="small-button mr-2"
                    onClick={() => {
                      setEditingProduct(p)
                      setDialog('product')
                    }}
                  >
                    Edit
                  </button>
                  <button
                    className="icon-button text-rose-400 hover:text-rose-600"
                    title="Deactivate product"
                    onClick={async () => {
                      if (window.confirm(`Deactivate product "${p.name}"?`)) {
                        await deleteProduct(p.id)
                        refreshProducts()
                        showToast(`Product "${p.name}" deactivated.`)
                      }
                    }}
                  >
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
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
            showToast(editingProduct ? 'Product updated' : 'New product created')
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
  const [tab, setTab] = useState<'unknown' | 'rules' | 'history'>('unknown')
  const [selectedSkus, setSelectedSkus] = useState<string[]>([])
  const [trainTargetSku, setTrainTargetSku] = useState<UnknownSkuItem | null>(null)
  const [conflictItem, setConflictItem] = useState<any>(null)
  const [ruleModalOpen, setRuleModalOpen] = useState(false)

  const { data: stats, mutate: refreshStats } = useSWR('/training/stats', getTrainingStats)
  const { data: unknowns = [], mutate: refreshUnknowns } = useSWR('/training/unknown', getUnknownSkus)
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
    try {
      await bulkMapSkus({ raw_skus: selectedSkus, product_id: productId })
      showToast(`Bulk trained ${selectedSkus.length} SKUs successfully!`)
      setSelectedSkus([])
      refreshUnknowns()
      refreshStats()
      refreshHistory()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleUndo = async (historyId: number) => {
    try {
      await undoTraining(historyId)
      showToast('Training mapping reverted.')
      refreshUnknowns()
      refreshStats()
      refreshHistory()
    } catch (err: any) {
      alert(err.message)
    }
  }

  return (
    <>
      <PageHead
        eyebrow="Catalog / Training Center"
        title="SKU Training & Rule Learning"
        description="Map unknown Flipkart marketplace SKUs to canonical warehouse products. Train once to automatically classify all future batches."
        action={
          <div className="flex gap-2">
            <button className="button secondary" onClick={() => setRuleModalOpen(true)}>
              <Plus size={15} /> Add pattern rule
            </button>
          </div>
        }
      />

      {/* Training Stats Grid */}
      <div className="stats-grid four" id="training-stats-grid">
        <Stat
          label="Unknown SKUs"
          value={stats?.unknown_skus ?? 0}
          note="Need classification"
          icon={Tags}
          tone="rose"
        />
        <Stat
          label="Mapped SKUs"
          value={stats?.mapped_skus ?? 0}
          note="Active warehouse rules"
          icon={Check}
          tone="teal"
        />
        <Stat
          label="Total SKUs seen"
          value={stats?.total_unique_skus_seen ?? 0}
          note="Historical catalog count"
          icon={Layers}
          tone="blue"
        />
        <Stat
          label="Recognition rate"
          value={`${stats?.recognition_percentage ?? 100}%`}
          note="Automatic classification"
          icon={BarChart3}
          tone="teal"
        />
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab ${tab === 'unknown' ? 'active' : ''}`}
          onClick={() => setTab('unknown')}
        >
          Unmapped SKUs <span>{unknowns.length}</span>
        </button>
        <button
          className={`tab ${tab === 'rules' ? 'active' : ''}`}
          onClick={() => setTab('rules')}
        >
          Pattern Rules <span>{rules.length}</span>
        </button>
        <button
          className={`tab ${tab === 'history' ? 'active' : ''}`}
          onClick={() => setTab('history')}
        >
          Training History <span>{history.length}</span>
        </button>
      </div>

      {/* Tab 1: Unmapped SKUs */}
      {tab === 'unknown' && (
        <section className="panel" id="unmapped-skus-panel">
          <div className="section-head">
            <div>
              <h2>Unmapped Flipkart SKUs</h2>
              <p>Description similarity suggestions generated automatically</p>
            </div>

            {selectedSkus.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold">{selectedSkus.length} selected</span>
                <select
                  id="bulk-product-select"
                  className="bg-slate-800 text-white text-xs rounded px-2 py-1 border border-slate-700"
                  onChange={(e) => {
                    if (e.target.value) handleBulkTrain(Number(e.target.value))
                  }}
                  defaultValue=""
                >
                  <option value="" disabled>Train selected as...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <TableWrap>
            <thead>
              <tr>
                <th style={{ width: 30 }}>
                  <input
                    type="checkbox"
                    checked={selectedSkus.length === unknowns.length && unknowns.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedSkus(unknowns.map((u) => u.raw_sku))
                      else setSelectedSkus([])
                    }}
                  />
                </th>
                <th>Raw SKU</th>
                <th>Description</th>
                <th>Times Seen</th>
                <th>AI / Fuzzy Suggestion</th>
                <th>Worker</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {unknowns.length > 0 ? (
                unknowns.map((u) => (
                  <tr key={u.raw_sku}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedSkus.includes(u.raw_sku)}
                        onChange={() => toggleSelectSku(u.raw_sku)}
                      />
                    </td>
                    <td>
                      <strong className="mono">{u.raw_sku}</strong>
                    </td>
                    <td>
                      <span className="text-xs">{u.description}</span>
                    </td>
                    <td>
                      <strong>{u.seen} batches</strong>
                    </td>
                    <td>
                      {u.suggestion ? (
                        <div>
                          <div className="flex items-center gap-2">
                            <Sparkles size={13} className="text-amber-400" />
                            <strong>{u.suggestion.product}</strong>
                            <Badge kind="success">{Math.round(u.suggestion.confidence * 100)}% match</Badge>
                          </div>
                          <small className="text-muted text-[10px]">
                            Matched: {u.suggestion.matched_terms.join(', ')}
                          </small>
                        </div>
                      ) : (
                        <span className="text-muted text-xs">No close match</span>
                      )}
                    </td>
                    <td>
                      <span className="worker-name">
                        <i className={`dot ${u.suggestion?.worker === 'Kartik Da' ? 'teal' : 'blue'}`} />
                        {u.suggestion?.worker || 'Sohel'}
                      </span>
                    </td>
                    <td className="text-right">
                      <button
                        className="small-button"
                        id={`train-sku-btn-${u.raw_sku}`}
                        onClick={() => setTrainTargetSku(u)}
                      >
                        Train SKU
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-muted">
                    <CheckCircle2 size={24} className="mx-auto mb-2 text-emerald-400" />
                    All Flipkart SKUs in the current batches are recognized and mapped!
                  </td>
                </tr>
              )}
            </tbody>
          </TableWrap>
        </section>
      )}

      {/* Tab 2: Pattern Rules */}
      {tab === 'rules' && (
        <section className="panel" id="pattern-rules-panel">
          <div className="section-head">
            <div>
              <h2>Pattern rules</h2>
              <p>Fallback rules executed after exact SKU mapping checks</p>
            </div>
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
                      <strong className="mono">{r.value}</strong>
                    </td>
                    <td>{prod?.name || <span className="text-muted">—</span>}</td>
                    <td>
                      <span className="worker-name">
                        <i className={`dot ${r.suggested_worker === 'Kartik Da' ? 'teal' : 'blue'}`} />
                        {r.suggested_worker || 'Auto'}
                      </span>
                    </td>
                    <td>{r.priority}</td>
                    <td className="text-right">
                      <button
                        className="icon-button text-rose-400"
                        onClick={async () => {
                          await deletePatternRule(r.id)
                          refreshRules()
                          showToast('Pattern rule removed.')
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

      {/* Tab 3: Training History & Undo */}
      {tab === 'history' && (
        <section className="panel" id="training-history-panel">
          <div className="section-head">
            <div>
              <h2>Training activity audit log</h2>
              <p>Recent mapping events with instant undo capability</p>
            </div>
          </div>

          <TableWrap>
            <thead>
              <tr>
                <th>Time</th>
                <th>Action</th>
                <th>Raw SKU</th>
                <th>New Mapping</th>
                <th>Assigned Worker</th>
                <th className="text-right">Undo</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h) => (
                <tr key={h.id}>
                  <td className="text-xs text-muted">
                    {new Date(h.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td>
                    <Badge kind={h.action.includes('Removed') ? 'danger' : 'success'}>{h.action}</Badge>
                  </td>
                  <td>
                    <strong className="mono">{h.raw_sku}</strong>
                  </td>
                  <td>{h.new_product_name}</td>
                  <td>{h.new_worker}</td>
                  <td className="text-right">
                    {h.action !== 'Removed Mapping' && (
                      <button
                        className="button secondary text-xs py-1"
                        onClick={() => handleUndo(h.id)}
                      >
                        <Undo2 size={13} /> Undo
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        </section>
      )}

      {/* Train Target Modal */}
      {trainTargetSku && (
        <TrainSkuModal
          skuItem={trainTargetSku}
          close={() => setTrainTargetSku(null)}
          onTrained={(mappedName: any) => {
            showToast(`Trained ${trainTargetSku.raw_sku} → ${mappedName}`)
            setTrainTargetSku(null)
            refreshUnknowns()
            refreshStats()
            refreshHistory()
          }}
          onConflict={(conflict: any) => {
            setConflictItem(conflict)
          }}
        />
      )}

      {/* Conflict Modal */}
      {conflictItem && (
        <Modal title="Mapping Conflict Detected" close={() => setConflictItem(null)}>
          <div className="warning-box">
            <AlertTriangle size={20} />
            <p>
              This SKU is already mapped to <strong>{conflictItem.existing_product_name}</strong>. Overwriting will change classification for future batches.
            </p>
          </div>

          <div className="detail-row">
            <span>Raw SKU</span>
            <strong className="mono">{conflictItem.raw_sku}</strong>
          </div>
          <div className="detail-row">
            <span>Existing Product</span>
            <strong>{conflictItem.existing_product_name}</strong>
          </div>
          <div className="detail-row">
            <span>New Proposed Product</span>
            <strong className="text-blue-500">{conflictItem.new_product_name}</strong>
          </div>

          <div className="modal-actions">
            <button className="button secondary" onClick={() => setConflictItem(null)}>
              Keep Existing
            </button>
            <button
              className="button primary"
              onClick={async () => {
                await mapSku({
                  raw_sku: conflictItem.raw_sku,
                  product_id: conflictItem.new_product_id,
                  replace: true,
                })
                setConflictItem(null)
                setTrainTargetSku(null)
                refreshUnknowns()
                refreshStats()
                refreshHistory()
                showToast(`Replaced mapping to ${conflictItem.new_product_name}`)
              }}
            >
              Replace Mapping
            </button>
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
            setRuleModalOpen(false)
            showToast('Pattern rule added')
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
  const [newWorkerName, setNewWorkerName] = useState('')
  const [newWorkerPhone, setNewWorkerPhone] = useState('')

  const handleAddWorker = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newWorkerName.trim()) return
    try {
      await createWorker({ name: newWorkerName.trim(), phone: newWorkerPhone.trim() })
      setNewWorkerName('')
      setNewWorkerPhone('')
      refreshWorkers()
      showToast(`Worker "${newWorkerName}" added.`)
    } catch (err: any) {
      alert(err.message)
    }
  }

  return (
    <>
      <PageHead
        eyebrow="Workspace / Settings"
        title="Settings & Staff Management"
        description="Configure warehouse staff, category taxonomy, and operational parameters."
      />

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

function ModalActions({ close, primary, onPrimary, loading }: any) {
  return (
    <div className="modal-actions">
      <button className="button secondary" onClick={close} type="button" disabled={loading}>
        Cancel
      </button>
      <button className="button primary" onClick={onPrimary} type="submit" disabled={loading}>
        {loading ? 'Saving...' : primary}
      </button>
    </div>
  )
}

function TrainSkuModal({ skuItem, close, onTrained, onConflict }: any) {
  const { data: products = [] } = useSWR('/products', () => getProducts(false))
  const [selectedProductId, setSelectedProductId] = useState<number>(
    skuItem.suggestion?.product_id || (products[0]?.id ?? 1)
  )
  const [overrideWorker, setOverrideWorker] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const chosenProduct = products.find((p) => p.id === selectedProductId) || products[0]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chosenProduct) return
    setLoading(true)
    try {
      const res = await mapSku({
        raw_sku: skuItem.raw_sku,
        product_id: chosenProduct.id,
        optional_worker_override: overrideWorker || undefined,
        remember_mapping: true,
      })

      if (res.status === 'conflict') {
        if (onConflict) {
          onConflict({
            raw_sku: skuItem.raw_sku,
            existing_product_name: res.existing_product_name,
            new_product_id: chosenProduct.id,
            new_product_name: chosenProduct.name,
          })
        }
        return
      }

      onTrained(chosenProduct.name)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal title="Train Flipkart SKU" close={close}>
      <form onSubmit={handleSubmit}>
        <div className="sku-callout">
          <span>Raw SKU</span>
          <strong className="mono">{skuItem.raw_sku}</strong>
          <span>Description</span>
          <strong>{skuItem.description || 'Flipkart Product'}</strong>
          <span>Seen Count</span>
          <strong>{skuItem.seen || 1} batches</strong>
        </div>

        <label>
          What canonical product is this?
          <select
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(Number(e.target.value))}
            className="w-full"
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.category}) — {p.assigned_worker}
              </option>
            ))}
          </select>
        </label>

        {chosenProduct && (
          <div className="inherit">
            <div>
              <span>Assigned Worker</span>
              <strong>{chosenProduct.assigned_worker}</strong>
            </div>
            <div>
              <span>Category</span>
              <strong>{chosenProduct.category || 'General'}</strong>
            </div>
            <div>
              <span>PackCalc Recipe</span>
              <strong>
                {chosenProduct.bag_family
                  ? `${chosenProduct.bag_family} (${chosenProduct.raw_3bag_qty || 0}×3B)`
                  : '—'}
              </strong>
            </div>
          </div>
        )}

        <label className="mt-3">
          Optional Worker Override
          <input
            placeholder="Leave blank to inherit from product"
            value={overrideWorker}
            onChange={(e) => setOverrideWorker(e.target.value)}
          />
        </label>

        <label className="check mt-4">
          <input type="checkbox" defaultChecked />
          Remember this mapping for all future labels
        </label>

        <ModalActions
          close={close}
          primary="Save & Train Mapping"
          loading={loading}
        />
      </form>
    </Modal>
  )
}

function ProductModal({ product, categories, workers, close, onSaved }: any) {
  const [name, setName] = useState(product?.name || '')
  const [internalCode, setInternalCode] = useState(product?.internal_code || '')
  const [category, setCategory] = useState(product?.category || 'Tripod')
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
    <Modal title={product ? 'Edit Warehouse Product' : 'Add Canonical Product'} close={close}>
      <form onSubmit={handleSubmit}>
        <label>
          Product Name
          <input
            placeholder="e.g. R1S Selfie Stick"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>

        <div className="form-grid">
          <label>
            Internal Code
            <input
              placeholder="e.g. R1S"
              value={internalCode}
              onChange={(e) => setInternalCode(e.target.value)}
            />
          </label>
          <label>
            Category
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              {categories.map((c: ApiCategory) => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="form-grid">
          <label>
            Assigned Worker (Inheritance)
            <select value={worker} onChange={(e) => setWorker(e.target.value)}>
              {workers.map((w: ApiWorker) => (
                <option key={w.id} value={w.name}>{w.name}</option>
              ))}
            </select>
          </label>
          <label>
            Sort Order
            <input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
            />
          </label>
        </div>

        {/* PackCalc Recipe fields */}
        <div className="mt-3 p-3 bg-slate-800/40 rounded-lg border border-slate-700/50">
          <p className="text-xs font-semibold mb-2">PackCalc Raw Material Recipe (Optional)</p>
          <div className="form-grid">
            <label>
              Garbage Bag Family
              <select value={bagFamily} onChange={(e) => setBagFamily(e.target.value)}>
                <option value="">None (Standard product)</option>
                <option value="Star">Star Family</option>
                <option value="Averx">Averx Family</option>
                <option value="Plain">Plain Family</option>
              </select>
            </label>
            {bagFamily && (
              <div className="grid grid-cols-2 gap-2">
                <label>
                  3-Bag Qty
                  <input
                    type="number"
                    value={raw3Bag}
                    onChange={(e) => setRaw3Bag(Number(e.target.value))}
                  />
                </label>
                <label>
                  2-Bag Qty
                  <input
                    type="number"
                    value={raw2Bag}
                    onChange={(e) => setRaw2Bag(Number(e.target.value))}
                  />
                </label>
              </div>
            )}
          </div>
        </div>

        <label className="mt-3">
          Notes / Specs
          <input
            placeholder="Special packing notes..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </label>

        <label className="check mt-4">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
          />
          Active Product (Visible for picking)
        </label>

        <ModalActions
          close={close}
          primary={product ? 'Update Product' : 'Create Product'}
          loading={loading}
        />
      </form>
    </Modal>
  )
}

function AddPatternRuleModal({ products, close, onAdded }: any) {
  const [ruleType, setRuleType] = useState('contains')
  const [value, setValue] = useState('')
  const [productId, setProductId] = useState<number | ''>('')
  const [worker, setWorker] = useState('')
  const [priority, setPriority] = useState(10)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!value.trim()) return
    setLoading(true)
    try {
      await createPatternRule({
        rule_type: ruleType as any,
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
    <Modal title="Add Pattern SKU Rule" close={close}>
      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <label>
            Rule Match Type
            <select value={ruleType} onChange={(e) => setRuleType(e.target.value)}>
              <option value="starts_with">Starts With</option>
              <option value="contains">Contains</option>
              <option value="ends_with">Ends With</option>
              <option value="regex">Regex</option>
            </select>
          </label>
          <label>
            Match Value
            <input
              placeholder="e.g. GB- or R16S"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              required
            />
          </label>
        </div>

        <label>
          Target Canonical Product (Optional)
          <select
            value={productId}
            onChange={(e) => setProductId(e.target.value ? Number(e.target.value) : '')}
          >
            <option value="">None (Worker suggestion only)</option>
            {products.map((p: any) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </label>

        <div className="form-grid">
          <label>
            Suggested Worker
            <select value={worker} onChange={(e) => setWorker(e.target.value)}>
              <option value="">Default from product</option>
              <option value="Sohel">Sohel</option>
              <option value="Kartik Da">Kartik Da</option>
            </select>
          </label>
          <label>
            Priority
            <input
              type="number"
              value={priority}
              onChange={(e) => setPriority(Number(e.target.value))}
            />
          </label>
        </div>

        <ModalActions
          close={close}
          primary="Create Rule"
          loading={loading}
        />
      </form>
    </Modal>
  )
}
