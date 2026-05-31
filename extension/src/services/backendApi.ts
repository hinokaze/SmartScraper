const DEFAULT_BACKEND_URL = 'http://127.0.0.1:3000'

type RequestOptions = {
  method?: 'GET' | 'POST'
  body?: unknown
}

export const backendApi = {
  baseUrl: DEFAULT_BACKEND_URL,

  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    })

    const payload = await response.json().catch(() => ({}))
    if (!response.ok) {
      throw new Error(payload?.error || '后端请求失败。')
    }

    return payload as T
  },

  health() {
    return this.request<{ ok: boolean; configured: boolean; model: string }>('/health')
  },
}
