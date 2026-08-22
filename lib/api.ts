const API_URL = process.env.NEXT_PUBLIC_API_URL || ""

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { ...(options?.body instanceof FormData ? {} : { "Content-Type": "application/json" }), ...options?.headers },
  })
  const data = await response.json().catch(() => null)
  if (!response.ok) throw new Error(data?.detail || `API request failed (${response.status})`)
  return data as T
}

export type ApiProduct = { id: number; name: string; internal_code?: string; category?: string; assigned_worker: string; sort_order: number; active: boolean }
export type DashboardMetric = { current: number; previous: number; change: number; percent: number }
export type DashboardResponse = { date: string; unique_labels: number; total_items: number; duplicate_labels: number; unknown_skus: number; worker_totals: Record<string, number>; product_stock_out: { product: string; quantity: number }[]; raw_material_requirements: Record<string, Record<string, number>>; increments: Record<string, DashboardMetric>; recent_batches: { id: number; filename: string; status: string; unique_awbs: number }[] }
export const getProducts = () => apiFetch<ApiProduct[]>("/products")
export const getDashboard = (date?: string) => apiFetch<DashboardResponse>(`/dashboard${date ? `?date=${encodeURIComponent(date)}` : ""}`)
export const getHistory = () => apiFetch<any[]>("/history")
export const getTrainingStats = () => apiFetch<any>("/training/stats")
export async function processLabels(files: File[]) { const form = new FormData(); files.forEach(file => form.append("files", file)); return apiFetch<any>("/batches/process", { method: "POST", body: form }) }
export const confirmBatch = (id: number) => apiFetch<any>(`/batches/${id}/confirm`, { method: "POST" })
export const mapSku = (payload: { raw_sku: string; product_id: number; remember_mapping?: boolean; optional_worker_override?: string; replace?: boolean }) => apiFetch<any>("/training/map", { method: "POST", body: JSON.stringify(payload) })
export const createProduct = (payload: Omit<ApiProduct, "id" | "active">) => apiFetch<ApiProduct>("/products", { method: "POST", body: JSON.stringify(payload) })
