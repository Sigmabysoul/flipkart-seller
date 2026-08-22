const API_URL = process.env.NEXT_PUBLIC_API_URL || ""

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(options?.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...options?.headers,
    },
  })
  const data = await response.json().catch(() => null)
  if (!response.ok) throw new Error(data?.detail || `API request failed (${response.status})`)
  return data as T
}

export type ApiProduct = {
  id: number
  name: string
  internal_code?: string | null
  category?: string | null
  assigned_worker: string
  sort_group?: string | null
  sort_order: number
  active: boolean
  notes?: string | null
  bag_family?: 'Star' | 'Averx' | 'Plain' | null
  raw_3bag_qty?: number
  raw_2bag_qty?: number
  created_at?: string
  updated_at?: string
}

export type ApiWorker = {
  id: number
  name: string
  active: boolean
  phone?: string
  created_at?: string
}

export type ApiCategory = {
  id: number
  name: string
  description?: string
}

export type DashboardMetric = {
  current: number
  previous: number
  change: number
  percent: number
}

export type WorkerDailyProgress = {
  id: number
  name: string
  active: boolean
  status: string
  unique_labels: number
  items: number
  target_quota: number
  progress_percent: number
  label_progress_percent: number
  share_of_total: number
  items_per_label: number
  top_products: { name: string; quantity: number }[]
}

export type CategoryDailyProgress = {
  id: number
  name: string
  quantity: number
  unique_labels: number
  unique_products: number
  percentage_of_total: number
  target_quota: number
  progress_percent: number
  yesterday_quantity: number
  change: number
  growth_percent: number
  workers: Record<string, number>
}

export type ShiftOverview = {
  target_labels: number
  target_items: number
  label_progress_percent: number
  item_progress_percent: number
  mapping_accuracy_rate: number
  clean_shipment_rate: number
}

export type DashboardResponse = {
  date: string
  unique_labels: number
  total_items: number
  duplicate_labels: number
  unknown_skus: number
  worker_totals: Record<string, { unique_labels: number; items: number; products: Record<string, number> }>
  worker_progress?: WorkerDailyProgress[]
  mixed_progress?: WorkerDailyProgress
  category_progress?: CategoryDailyProgress[]
  shift_overview?: ShiftOverview
  product_stock_out: { name: string; quantity: number; category: string; worker: string }[]
  raw_material_requirements: Record<string, { "3-Bag": number; "2-Bag": number }>
  increments: {
    unique_labels: DashboardMetric
    total_items: DashboardMetric
    duplicate_labels: DashboardMetric
    unknown_skus: DashboardMetric
  }
  recent_batches: {
    id: number
    filename: string
    processing_date: string
    status: string
    unique_awbs: number
    duplicate_awbs: number
    total_items: number
    unknown_skus: number
    created_at: string
  }[]
}

export type UnknownSkuItem = {
  raw_sku: string
  description: string
  seen: number
  suggestion: {
    product_id: number
    product: string
    confidence: number
    matched_terms: string[]
    worker: string
    category: string
  } | null
}

export type TrainingStats = {
  total_unique_skus_seen: number
  mapped_skus: number
  unknown_skus: number
  recognition_percentage: number
}

export type TrainingHistoryItem = {
  id: number
  raw_sku: string
  old_product_name?: string | null
  new_product_name: string
  old_worker?: string | null
  new_worker: string
  action: 'Created Mapping' | 'Changed Mapping' | 'Removed Mapping' | 'Worker Override'
  created_at: string
}

export type PatternRule = {
  id: number
  rule_type: 'starts_with' | 'contains' | 'ends_with' | 'regex'
  value: string
  product_id?: number | null
  suggested_worker?: string | null
  priority: number
  active: boolean
}

export type ParsedLabelItem = {
  page: number
  awb: string
  order_id: string
  duplicate: boolean
  mismatch: boolean
  existing_items_desc?: string
  payment_mode?: 'COD' | 'PREPAID'
  customer_name?: string
  customer_city?: string
  items: {
    raw_sku: string
    product_id: number | null
    product: string | null
    description: string | null
    quantity: number
    assigned_worker: string | null
    mapping_status: 'mapped' | 'unknown' | 'override'
  }[]
}

export type ProcessBatchResponse = {
  batch_id: number
  status: 'draft' | 'needs_review' | 'confirmed' | 'cancelled'
  filename: string
  processing_date: string
  pages_scanned: number
  unique_awbs: number
  duplicate_awbs: number
  total_items: number
  unknown_skus: number
  labels: ParsedLabelItem[]
  cropped_labels_url: string
}

// Products APIs
export const getProducts = (includeInactive = false, category = "all", worker = "all") =>
  apiFetch<ApiProduct[]>(`/products?include_inactive=${includeInactive}&category=${encodeURIComponent(category)}&worker=${encodeURIComponent(worker)}`)
export const getProductById = (id: number) => apiFetch<ApiProduct>(`/products/${id}`)
export const createProduct = (payload: Partial<ApiProduct>) => apiFetch<ApiProduct>("/products", { method: "POST", body: JSON.stringify(payload) })
export const updateProduct = (id: number, payload: Partial<ApiProduct>) => apiFetch<ApiProduct>(`/products/${id}`, { method: "PUT", body: JSON.stringify(payload) })
export const deleteProduct = (id: number) => apiFetch<{ status: string }>(`/products/${id}`, { method: "DELETE" })

// Workers APIs
export const getWorkers = () => apiFetch<ApiWorker[]>("/workers")
export const createWorker = (payload: { name: string; phone?: string }) => apiFetch<ApiWorker>("/workers", { method: "POST", body: JSON.stringify(payload) })
export const updateWorker = (id: number, payload: Partial<ApiWorker>) => apiFetch<ApiWorker>(`/workers/${id}`, { method: "PUT", body: JSON.stringify(payload) })
export const deleteWorker = (id: number) => apiFetch<{ status: string }>(`/workers/${id}`, { method: "DELETE" })

// Categories APIs
export const getCategories = () => apiFetch<ApiCategory[]>("/categories")
export const createCategory = (payload: { name: string; description?: string }) => apiFetch<ApiCategory>("/categories", { method: "POST", body: JSON.stringify(payload) })
export const deleteCategory = (id: number) => apiFetch<{ status: string }>(`/categories/${id}`, { method: "DELETE" })

// Training APIs
export const getTrainingStats = () => apiFetch<TrainingStats>("/training/stats")
export const getUnknownSkus = () => apiFetch<UnknownSkuItem[]>("/training/unknown")
export const mapSku = (payload: {
  raw_sku: string
  product_id: number
  remember_mapping?: boolean
  optional_worker_override?: string
  replace?: boolean
}) => apiFetch<any>("/training/map", { method: "POST", body: JSON.stringify(payload) })
export const bulkMapSkus = (payload: {
  raw_skus: string[]
  product_id: number
  optional_worker_override?: string
}) => apiFetch<any>("/training/bulk-map", { method: "POST", body: JSON.stringify(payload) })
export const getTrainingHistory = () => apiFetch<TrainingHistoryItem[]>("/training/history")
export const undoTraining = (history_id: number) => apiFetch<any>("/training/history", { method: "POST", body: JSON.stringify({ action: "undo", history_id }) })
export const getPatternRules = () => apiFetch<PatternRule[]>("/training/rules")
export const createPatternRule = (payload: Partial<PatternRule>) => apiFetch<PatternRule>("/training/rules", { method: "POST", body: JSON.stringify(payload) })
export const deletePatternRule = (id: number) => apiFetch<{ status: string }>(`/training/rules?id=${id}`, { method: "DELETE" })

// Batch & Labels Processing APIs
export async function processLabels(files: File[]): Promise<ProcessBatchResponse> {
  const form = new FormData()
  files.forEach((file) => form.append("files", file))
  return apiFetch<ProcessBatchResponse>("/batches/process", { method: "POST", body: form })
}
export const confirmBatch = (id: number) => apiFetch<any>(`/batches/${id}/confirm`, { method: "POST" })
export const cancelBatch = (id: number) => apiFetch<any>(`/batches/${id}/cancel`, { method: "POST" })
export const recordPrintEvent = (id: number, printed_by = "Operator", print_type = "full_batch") =>
  apiFetch<any>(`/batches/${id}/print`, { method: "POST", body: JSON.stringify({ printed_by, print_type }) })

// Dashboard & History APIs
export const getDashboard = (date?: string) =>
  apiFetch<DashboardResponse>(`/dashboard${date ? `?date=${encodeURIComponent(date)}` : ""}`)
export const getBatches = (date?: string, status = "all") =>
  apiFetch<{ total: number; batches: any[] }>(`/batches?${date ? `date=${encodeURIComponent(date)}&` : ""}status=${encodeURIComponent(status)}`)
export const getBatchById = (id: number) =>
  apiFetch<any>(`/batches/${id}`)
export const deleteBatch = (id: number) =>
  apiFetch<any>(`/batches/${id}`, { method: "DELETE" })
export const getShipments = (date?: string, worker = "all", page = 1, limit = 100) =>
  apiFetch<{ total: number; page: number; limit: number; shipments: any[] }>(
    `/shipments?${date ? `date=${encodeURIComponent(date)}&` : ""}worker=${encodeURIComponent(worker)}&page=${page}&limit=${limit}`
  )
export const getShipmentById = (id: string | number) =>
  apiFetch<any>(`/shipments/${id}`)
export const updateShipment = (id: string | number, payload: Partial<any>) =>
  apiFetch<any>(`/shipments/${id}`, { method: "PUT", body: JSON.stringify(payload) })
export const deleteShipment = (id: string | number) =>
  apiFetch<any>(`/shipments/${id}`, { method: "DELETE" })
export const getHistory = (range = "today", startDate?: string, endDate?: string) =>
  apiFetch<any>(`/history?range=${range}${startDate ? `&start_date=${startDate}` : ""}${endDate ? `&end_date=${endDate}` : ""}`)
export const searchShipments = (q: string) =>
  apiFetch<any[]>(`/shipments/search?q=${encodeURIComponent(q)}`)
