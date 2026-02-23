export type SequenceInput = {
  id: string
  sequence: string
}

export type ModelConfig = {
  type: string
  confidence_threshold: number
  batch_size: number
  enable_ood: boolean
  ood_threshold: number
}

export type SequenceResult = {
  sequence_id: string
  length: number
  gc_content: number
  prediction: 'Virus' | 'Host' | 'Novel'
  confidence: number
  sequence_preview: string
  organism_name?: string
  explanation?: string
  mahalanobis_distance?: number
  energy_score?: number
  ood_score?: number
}

export type ClassificationResponse = {
  total_sequences: number
  virus_count: number
  host_count: number
  novel_count: number
  detailed_results: SequenceResult[]
  source: string
  timestamp: string
  processing_time: number
}

export type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

export type ChatPayload = {
  messages: ChatMessage[]
  mode?: string
}
