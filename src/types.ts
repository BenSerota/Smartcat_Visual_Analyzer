export interface VisualSegment {
  id: string
  slideId: number
  textElementId: string
  visualContextId: string
  coordinates: BoundingBox
  text: string
  visualContext: VisualContextType
  confidence: 'high' | 'medium' | 'low'
  translation?: string
  notes?: string
  // Enhanced semantic context
  topic?: string
  semanticContext?: string
  contentElements?: ContentElement[]
}

export interface BoundingBox {
  x: number
  y: number
  width: number
  height: number
}

export type VisualContextType = 
  | 'title_group'
  | 'body_text' 
  | 'caption'
  | 'bullet_list'
  | 'header_footer'
  | 'callout'
  | 'navigation'
  | 'other'

export interface SlideAnalysis {
  slideId: number
  slideImage: string // base64 encoded image
  visualContexts: VisualContext[]
  textElements: TextElement[]
  overallContext: string
}

export interface VisualContext {
  id: string
  type: VisualContextType
  description: string
  boundingBox: BoundingBox
  relatedElements: string[] // IDs of related text elements
  // Enhanced semantic context
  topic?: string
  semanticContext?: string
  contentElements?: ContentElement[]
}

export interface TextElement {
  id: string
  text: string
  boundingBox: BoundingBox
  fontSize?: number
  fontFamily?: string
  color?: string
  isBold?: boolean
  isItalic?: boolean
}

export interface ContentElement {
  type: 'text' | 'image' | 'chart' | 'shape' | 'other'
  content?: string // For text elements
  description?: string // For images, charts, etc.
  boundingBox?: BoundingBox
}

export interface PowerPointAnalysis {
  fileName: string
  slides: SlideAnalysis[]
  totalSlides: number
  analysisTimestamp: string
}
