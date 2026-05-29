export type EventNode = {
  id: string
  label: string
  description: string
  sources: { url: string; title: string }[]
}

export type EventNodeMetadata = {
  isFirst: boolean
  isLast: boolean
}

export type EventWithMetadata = EventNode & EventNodeMetadata
