export interface GlossaryTerm {
  id: string
  term: string
  category: 'company' | 'product' | 'technical' | 'acronym' | 'other'
  confidence: 'high' | 'medium' | 'low'
  context?: string
  frequency?: number
}

export interface DocumentContext {
  origin?: string
  authorRole?: string
  targetAudience?: string
  timeContext?: string
  domain?: string
  documentType?: string
  geographicContext?: string
  formalityLevel?: string
  technicalDepth?: string
  businessStage?: string
  regulatoryContext?: string
}
