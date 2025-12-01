import type {
  ChatPayload,
  ClassificationResponse,
  ModelConfig,
  SequenceInput,
} from './types'

const API_BASE =
  import.meta.env.VITE_API_BASE?.replace(/\/$/, '') || 'http://localhost:8080'

type ClassificationPayload = {
  sequences: SequenceInput[]
  config?: ModelConfig
  source?: string
}

async function request<T>(path: string, options: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })

  if (!res.ok) {
    const detail = await res
      .json()
      .catch(() => ({ detail: res.statusText || 'Request failed' }))
    throw new Error(detail.detail || `Request failed with ${res.status}`)
  }

  return res.json() as Promise<T>
}

export async function classifySequences(
  payload: ClassificationPayload,
): Promise<ClassificationResponse> {
  return request<ClassificationResponse>('/classify', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function sendChat(
  payload: ChatPayload,
): Promise<{ reply: string }> {
  return request<{ reply: string }>('/chat', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function checkHealth(): Promise<boolean> {
  try {
    await request('/health', { method: 'GET' })
    return true
  } catch {
    return false
  }
}
