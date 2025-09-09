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

export interface PowerPointAnalysis {
  fileName: string
  slides: SlideAnalysis[]
  totalSlides: number
  analysisTimestamp: string
}
