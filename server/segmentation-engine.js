/**
 * Visual Segmentation Engine
 * Combines visual analysis with intelligent text segmentation for optimal translation boundaries
 */

class SegmentationEngine {
  constructor() {
    this.segmentIdCounter = 1
  }

  /**
   * Generate intelligent segmentation from visual analysis
   * @param {Array} slides - Array of analyzed slides with visual context
   * @returns {Array} Array of optimized visual segments
   */
  generateSegmentation(slides) {
    const allSegments = []

    slides.forEach(slide => {
      const slideSegments = this.processSlideSegmentation(slide)
      allSegments.push(...slideSegments)
    })

    return this.optimizeSegmentation(allSegments)
  }

  /**
   * Process segmentation for a single slide
   * @param {Object} slide - Slide with visual analysis
   * @returns {Array} Array of segments for this slide
   */
  processSlideSegmentation(slide) {
    const segments = []
    const { slideId, textElements, visualContexts, segments: existingSegments } = slide

    // Group text elements by visual context
    const contextGroups = this.groupElementsByVisualContext(textElements, visualContexts)

    // Create segments for each visual context group
    contextGroups.forEach((group, contextId) => {
      const contextSegments = this.createContextSegments(group, slideId, contextId)
      segments.push(...contextSegments)
    })

    // Add individual text element segments for fine-grained control
    textElements.forEach((element, index) => {
      const segment = this.createTextElementSegment(element, slideId, index)
      segments.push(segment)
    })

    return segments
  }

  /**
   * Group text elements by their visual context
   * @param {Array} textElements - Array of text elements
   * @param {Array} visualContexts - Array of visual contexts
   * @returns {Map} Map of context ID to grouped elements
   */
  groupElementsByVisualContext(textElements, visualContexts) {
    const contextGroups = new Map()

    // Initialize groups for each visual context
    visualContexts.forEach(context => {
      contextGroups.set(context.id, {
        context,
        elements: [],
        boundingBox: context.boundingBox
      })
    })

    // Assign text elements to visual contexts based on spatial proximity
    textElements.forEach(element => {
      const bestContext = this.findBestVisualContext(element, visualContexts)
      if (bestContext && contextGroups.has(bestContext.id)) {
        contextGroups.get(bestContext.id).elements.push(element)
      }
    })

    return contextGroups
  }

  /**
   * Find the best visual context for a text element
   * @param {Object} element - Text element
   * @param {Array} visualContexts - Array of visual contexts
   * @returns {Object|null} Best matching visual context
   */
  findBestVisualContext(element, visualContexts) {
    let bestContext = null
    let bestScore = 0

    visualContexts.forEach(context => {
      const score = this.calculateContextScore(element, context)
      if (score > bestScore) {
        bestScore = score
        bestContext = context
      }
    })

    return bestContext
  }

  /**
   * Calculate how well a text element fits in a visual context
   * @param {Object} element - Text element
   * @param {Object} context - Visual context
   * @returns {number} Score (0-1)
   */
  calculateContextScore(element, context) {
    const elementBox = element.boundingBox
    const contextBox = context.boundingBox

    // Calculate overlap percentage
    const overlap = this.calculateOverlap(elementBox, contextBox)
    const elementArea = elementBox.width * elementBox.height
    const contextArea = contextBox.width * contextBox.height

    // Score based on overlap percentage
    const overlapScore = overlap / Math.max(elementArea, contextArea)

    // Bonus for elements that are completely within context
    const withinContext = this.isWithinBounds(elementBox, contextBox)
    const withinScore = withinContext ? 0.3 : 0

    return overlapScore + withinScore
  }

  /**
   * Calculate overlap area between two bounding boxes
   * @param {Object} box1 - First bounding box
   * @param {Object} box2 - Second bounding box
   * @returns {number} Overlap area
   */
  calculateOverlap(box1, box2) {
    const left = Math.max(box1.x, box2.x)
    const right = Math.min(box1.x + box1.width, box2.x + box2.width)
    const top = Math.max(box1.y, box2.y)
    const bottom = Math.min(box1.y + box1.height, box2.y + box2.height)

    if (left < right && top < bottom) {
      return (right - left) * (bottom - top)
    }
    return 0
  }

  /**
   * Check if element is within context bounds
   * @param {Object} elementBox - Element bounding box
   * @param {Object} contextBox - Context bounding box
   * @returns {boolean} True if element is within context
   */
  isWithinBounds(elementBox, contextBox) {
    return elementBox.x >= contextBox.x &&
           elementBox.y >= contextBox.y &&
           elementBox.x + elementBox.width <= contextBox.x + contextBox.width &&
           elementBox.y + elementBox.height <= contextBox.y + contextBox.height
  }

  /**
   * Create segments for a visual context group
   * @param {Object} group - Group of elements in a visual context
   * @param {number} slideId - Slide ID
   * @param {string} contextId - Visual context ID
   * @returns {Array} Array of segments
   */
  createContextSegments(group, slideId, contextId) {
    const segments = []
    const { context, elements } = group

    if (elements.length === 0) return segments

    // Create combined segment for the entire context
    const combinedText = elements.map(el => el.text).join(' ')
    const combinedBoundingBox = this.calculateCombinedBoundingBox(elements)

    const combinedSegment = {
      id: `s${slideId}_vc${contextId}_combined_${this.segmentIdCounter++}`,
      slideId,
      textElementId: `vc${contextId}_combined`,
      visualContextId: contextId,
      coordinates: combinedBoundingBox,
      text: combinedText,
      visualContext: context.type,
      confidence: 'high',
      notes: `Combined ${context.type} context with ${elements.length} elements`,
      isCombined: true,
      elementCount: elements.length
    }

    segments.push(combinedSegment)

    // Create individual segments for each element within the context
    elements.forEach((element, index) => {
      const segment = {
        id: `s${slideId}_vc${contextId}_elem${index}_${this.segmentIdCounter++}`,
        slideId,
        textElementId: element.id,
        visualContextId: contextId,
        coordinates: element.boundingBox,
        text: element.text,
        visualContext: context.type,
        confidence: 'medium',
        notes: `Individual element within ${context.type} context`,
        isCombined: false,
        parentContextId: contextId
      }
      segments.push(segment)
    })

    return segments
  }

  /**
   * Create a segment for an individual text element
   * @param {Object} element - Text element
   * @param {number} slideId - Slide ID
   * @param {number} index - Element index
   * @returns {Object} Segment object
   */
  createTextElementSegment(element, slideId, index) {
    return {
      id: `s${slideId}_elem${index}_${this.segmentIdCounter++}`,
      slideId,
      textElementId: element.id,
      visualContextId: 'individual',
      coordinates: element.boundingBox,
      text: element.text,
      visualContext: this.inferVisualContext(element),
      confidence: 'medium',
      notes: 'Individual text element',
      isCombined: false
    }
  }

  /**
   * Infer visual context type from text element properties
   * @param {Object} element - Text element
   * @returns {string} Inferred visual context type
   */
  inferVisualContext(element) {
    const text = element.text.toLowerCase()
    const fontSize = element.fontSize || 12
    const isBold = element.isBold || false

    // Title detection
    if (fontSize >= 20 || isBold) {
      if (text.length < 100 && !text.includes('.')) {
        return 'title_group'
      }
    }

    // Bullet list detection
    if (text.includes('•') || text.includes('-') || text.includes('*')) {
      return 'bullet_list'
    }

    // Caption detection
    if (text.length < 200 && (text.includes('figure') || text.includes('table'))) {
      return 'caption'
    }

    // Default to body text
    return 'body_text'
  }

  /**
   * Calculate combined bounding box for multiple elements
   * @param {Array} elements - Array of text elements
   * @returns {Object} Combined bounding box
   */
  calculateCombinedBoundingBox(elements) {
    if (elements.length === 0) {
      return { x: 0, y: 0, width: 0, height: 0 }
    }

    const minX = Math.min(...elements.map(el => el.boundingBox.x))
    const minY = Math.min(...elements.map(el => el.boundingBox.y))
    const maxX = Math.max(...elements.map(el => el.boundingBox.x + el.boundingBox.width))
    const maxY = Math.max(...elements.map(el => el.boundingBox.y + el.boundingBox.height))

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    }
  }

  /**
   * Optimize segmentation by removing duplicates and merging similar segments
   * @param {Array} segments - Array of segments
   * @returns {Array} Optimized segments
   */
  optimizeSegmentation(segments) {
    // Remove duplicate segments (same text and coordinates)
    const uniqueSegments = this.removeDuplicates(segments)

    // Merge overlapping segments with similar content
    const mergedSegments = this.mergeSimilarSegments(uniqueSegments)

    // Sort segments by slide and position
    return this.sortSegments(mergedSegments)
  }

  /**
   * Remove duplicate segments
   * @param {Array} segments - Array of segments
   * @returns {Array} Segments without duplicates
   */
  removeDuplicates(segments) {
    const seen = new Set()
    return segments.filter(segment => {
      const key = `${segment.slideId}_${segment.text}_${segment.coordinates.x}_${segment.coordinates.y}`
      if (seen.has(key)) {
        return false
      }
      seen.add(key)
      return true
    })
  }

  /**
   * Merge similar segments that overlap or are very close
   * @param {Array} segments - Array of segments
   * @returns {Array} Merged segments
   */
  mergeSimilarSegments(segments) {
    const merged = []
    const processed = new Set()

    segments.forEach((segment, index) => {
      if (processed.has(index)) return

      const similarSegments = [segment]
      processed.add(index)

      // Find similar segments
      segments.forEach((otherSegment, otherIndex) => {
        if (processed.has(otherIndex) || index === otherIndex) return

        if (this.areSegmentsSimilar(segment, otherSegment)) {
          similarSegments.push(otherSegment)
          processed.add(otherIndex)
        }
      })

      // Merge similar segments
      if (similarSegments.length > 1) {
        const mergedSegment = this.mergeSegments(similarSegments)
        merged.push(mergedSegment)
      } else {
        merged.push(segment)
      }
    })

    return merged
  }

  /**
   * Check if two segments are similar enough to merge
   * @param {Object} segment1 - First segment
   * @param {Object} segment2 - Second segment
   * @returns {boolean} True if segments are similar
   */
  areSegmentsSimilar(segment1, segment2) {
    // Same slide and visual context
    if (segment1.slideId !== segment2.slideId || segment1.visualContext !== segment2.visualContext) {
      return false
    }

    // Check if segments are close spatially
    const distance = this.calculateSegmentDistance(segment1, segment2)
    return distance < 50 // 50 pixels threshold
  }

  /**
   * Calculate distance between two segments
   * @param {Object} segment1 - First segment
   * @param {Object} segment2 - Second segment
   * @returns {number} Distance in pixels
   */
  calculateSegmentDistance(segment1, segment2) {
    const box1 = segment1.coordinates
    const box2 = segment2.coordinates

    const center1 = {
      x: box1.x + box1.width / 2,
      y: box1.y + box1.height / 2
    }

    const center2 = {
      x: box2.x + box2.width / 2,
      y: box2.y + box2.height / 2
    }

    return Math.sqrt(
      Math.pow(center1.x - center2.x, 2) + Math.pow(center1.y - center2.y, 2)
    )
  }

  /**
   * Merge multiple segments into one
   * @param {Array} segments - Array of segments to merge
   * @returns {Object} Merged segment
   */
  mergeSegments(segments) {
    const firstSegment = segments[0]
    const combinedText = segments.map(s => s.text).join(' ')
    const combinedBoundingBox = this.calculateCombinedBoundingBox(
      segments.map(s => ({ boundingBox: s.coordinates }))
    )

    return {
      ...firstSegment,
      id: `merged_${this.segmentIdCounter++}`,
      text: combinedText,
      coordinates: combinedBoundingBox,
      notes: `Merged ${segments.length} similar segments`,
      isMerged: true,
      originalSegments: segments.map(s => s.id)
    }
  }

  /**
   * Sort segments by slide ID and position
   * @param {Array} segments - Array of segments
   * @returns {Array} Sorted segments
   */
  sortSegments(segments) {
    return segments.sort((a, b) => {
      // First by slide ID
      if (a.slideId !== b.slideId) {
        return a.slideId - b.slideId
      }

      // Then by Y position (top to bottom)
      if (a.coordinates.y !== b.coordinates.y) {
        return a.coordinates.y - b.coordinates.y
      }

      // Finally by X position (left to right)
      return a.coordinates.x - b.coordinates.x
    })
  }
}

module.exports = SegmentationEngine
