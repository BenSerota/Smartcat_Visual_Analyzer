const OpenAI = require('openai')

/**
 * Visual Analysis Module
 * Uses GPT-5 Nano to analyze slide images and understand visual context
 */

class VisualAnalyzer {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })
  }

  /**
   * Analyze a slide's visual context and text relationships
   * @param {Object} slideData - Slide data with image and text elements
   * @returns {Promise<Object>} Enhanced slide analysis with visual context
   */
  async analyzeSlide(slideData) {
    try {
      const { slideId, slideImage, textElements, overallContext } = slideData

      // Prepare the analysis prompt
      const prompt = this.buildAnalysisPrompt(textElements, overallContext)

      // Call GPT-5 Nano for visual analysis
      const response = await this.openai.chat.completions.create({
        model: "gpt-5-nano-2025-08-07",
        messages: [
          {
            role: "system",
            content: "You are an expert in document layout analysis and translation segmentation. Your task is to analyze PowerPoint slides and identify visual relationships between text elements to improve translation segmentation."
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt
              },
              {
                type: "image_url",
                image_url: {
                  url: slideImage,
                  detail: "high"
                }
              }
            ]
          }
        ],
        max_completion_tokens: 2000
      })

      const content = response.choices[0].message.content
      
      if (!content || content.trim() === '') {
        console.warn('Empty response from GPT-5 Nano, using fallback analysis')
        return this.createFallbackAnalysis(slideData)
      }

      let analysisResult
      try {
        analysisResult = JSON.parse(content)
      } catch (parseError) {
        console.warn('Failed to parse GPT response as JSON, using fallback analysis:', parseError.message)
        return this.createFallbackAnalysis(slideData)
      }
      
      // Enhance the slide data with visual analysis
      return this.enhanceSlideWithAnalysis(slideData, analysisResult)
    } catch (error) {
      console.error('Error in visual analysis:', error)
      // Return original data if analysis fails
      return slideData
    }
  }

  /**
   * Create fallback analysis when GPT-5 Nano fails
   * @param {Object} slideData - Slide data
   * @returns {Object} Enhanced slide data with fallback analysis
   */
  createFallbackAnalysis(slideData) {
    const { textElements } = slideData
    
    // Create basic visual contexts based on text analysis
    const visualContexts = []
    const textRelationships = []
    const segmentationRecommendations = []

    textElements.forEach((element, index) => {
      const contextType = this.inferVisualContextType(element)
      
      // Create individual visual context
      const contextId = `vc_${index + 1}`
      visualContexts.push({
        id: contextId,
        type: contextType,
        description: `Auto-detected ${contextType} context`,
        boundingBox: element.boundingBox,
        relatedElements: [element.id]
      })

      // Create segmentation recommendation
      segmentationRecommendations.push({
        segmentId: element.id,
        text: element.text,
        visualContext: contextType,
        confidence: 'medium',
        reasoning: 'Fallback analysis based on text characteristics'
      })
    })

    // Group similar elements
    const groupedElements = this.groupSimilarElements(textElements)
    groupedElements.forEach((group, groupIndex) => {
      if (group.length > 1) {
        const groupId = `group_${groupIndex + 1}`
        const combinedText = group.map(el => el.text).join(' ')
        
        textRelationships.push({
          group: groupId,
          elements: group.map(el => el.id),
          reason: 'Elements with similar characteristics grouped together'
        })

        segmentationRecommendations.push({
          segmentId: groupId,
          text: combinedText,
          visualContext: group[0].visualContext || 'other',
          confidence: 'high',
          reasoning: 'Grouped similar elements for better translation context'
        })
      }
    })

    return this.enhanceSlideWithAnalysis(slideData, {
      visualContexts,
      textRelationships,
      segmentationRecommendations
    })
  }

  /**
   * Infer visual context type from text element
   * @param {Object} element - Text element
   * @returns {string} Visual context type
   */
  inferVisualContextType(element) {
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
   * Group similar text elements
   * @param {Array} textElements - Array of text elements
   * @returns {Array} Array of grouped elements
   */
  groupSimilarElements(textElements) {
    const groups = []
    const processed = new Set()

    textElements.forEach((element, index) => {
      if (processed.has(index)) return

      const group = [element]
      processed.add(index)

      // Find similar elements
      textElements.forEach((otherElement, otherIndex) => {
        if (processed.has(otherIndex) || index === otherIndex) return

        if (this.areElementsSimilar(element, otherElement)) {
          group.push(otherElement)
          processed.add(otherIndex)
        }
      })

      groups.push(group)
    })

    return groups
  }

  /**
   * Check if two elements are similar
   * @param {Object} element1 - First element
   * @param {Object} element2 - Second element
   * @returns {boolean} True if elements are similar
   */
  areElementsSimilar(element1, element2) {
    // Check font size similarity
    const fontSizeDiff = Math.abs((element1.fontSize || 12) - (element2.fontSize || 12))
    if (fontSizeDiff > 4) return false

    // Check if both are bold or both are not bold
    if ((element1.isBold || false) !== (element2.isBold || false)) return false

    // Check spatial proximity
    const distance = this.calculateElementDistance(element1, element2)
    return distance < 100 // 100 pixels threshold
  }

  /**
   * Calculate distance between two elements
   * @param {Object} element1 - First element
   * @param {Object} element2 - Second element
   * @returns {number} Distance in pixels
   */
  calculateElementDistance(element1, element2) {
    const center1 = {
      x: element1.boundingBox.x + element1.boundingBox.width / 2,
      y: element1.boundingBox.y + element1.boundingBox.height / 2
    }

    const center2 = {
      x: element2.boundingBox.x + element2.boundingBox.width / 2,
      y: element2.boundingBox.y + element2.boundingBox.height / 2
    }

    return Math.sqrt(
      Math.pow(center1.x - center2.x, 2) + Math.pow(center1.y - center2.y, 2)
    )
  }

  /**
   * Build the analysis prompt for GPT-5 Nano
   * @param {Array} textElements - Array of text elements
   * @param {string} overallContext - Overall slide context
   * @returns {string} Formatted prompt
   */
  buildAnalysisPrompt(textElements, overallContext) {
    const textElementsInfo = textElements.map((element, index) => 
      `${index + 1}. Text: "${element.text}" | Position: (${element.boundingBox.x}, ${element.boundingBox.y}) | Size: ${element.boundingBox.width}x${element.boundingBox.height} | Font: ${element.fontSize}px ${element.fontFamily || 'default'}`
    ).join('\n')

    return `
Analyze this PowerPoint slide and identify visual relationships between text elements for optimal translation segmentation.

CONTEXT: ${overallContext}

TEXT ELEMENTS:
${textElementsInfo}

Please analyze the visual layout and provide:

1. VISUAL_CONTEXTS: Identify distinct visual areas and their purposes:
   - title_group: Multiple text boxes that form one title
   - body_text: Main content paragraphs
   - caption: Image/table captions
   - bullet_list: Bullet point groups
   - header_footer: Slide headers/footers
   - callout: Highlighted text boxes
   - navigation: Menu/navigation elements
   - other: Other visual contexts

2. TEXT_RELATIONSHIPS: Identify which text elements should be grouped together for translation

3. SEGMENTATION_RECOMMENDATIONS: Suggest optimal segmentation boundaries

Return your analysis as JSON in this format:
{
  "visualContexts": [
    {
      "id": "vc1",
      "type": "title_group",
      "description": "Main title spanning two text boxes",
      "boundingBox": {"x": 100, "y": 50, "width": 600, "height": 80},
      "relatedElements": ["s1_tb1", "s1_tb2"]
    }
  ],
  "textRelationships": [
    {
      "group": "title_group_1",
      "elements": ["s1_tb1", "s1_tb2"],
      "reason": "Two text boxes positioned side by side forming one title"
    }
  ],
  "segmentationRecommendations": [
    {
      "segmentId": "s1_tb1_tb2_combined",
      "text": "Combined title text",
      "visualContext": "title_group",
      "confidence": "high",
      "reasoning": "Visual analysis shows these elements form one cohesive title"
    }
  ]
}
`
  }

  /**
   * Enhance slide data with visual analysis results
   * @param {Object} slideData - Original slide data
   * @param {Object} analysisResult - GPT analysis result
   * @returns {Object} Enhanced slide data
   */
  enhanceSlideWithAnalysis(slideData, analysisResult) {
    const { visualContexts = [], textRelationships = [], segmentationRecommendations = [] } = analysisResult

    // Update visual contexts
    slideData.visualContexts = visualContexts

    // Update segments with visual analysis
    slideData.segments = slideData.segments.map(segment => {
      // Find matching recommendation
      const recommendation = segmentationRecommendations.find(rec => 
        rec.segmentId.includes(segment.textElementId)
      )

      if (recommendation) {
        return {
          ...segment,
          visualContext: recommendation.visualContext,
          confidence: recommendation.confidence,
          notes: recommendation.reasoning
        }
      }

      return segment
    })

    // Add combined segments for grouped elements
    textRelationships.forEach(relationship => {
      if (relationship.elements.length > 1) {
        const combinedText = relationship.elements
          .map(elementId => {
            const element = slideData.textElements.find(el => el.id === elementId)
            return element ? element.text : ''
          })
          .join(' ')

        const combinedSegment = {
          id: `${relationship.group}_combined`,
          slideId: slideData.slideId,
          textElementId: relationship.group,
          visualContextId: 'combined',
          coordinates: this.calculateCombinedBoundingBox(
            slideData.textElements.filter(el => relationship.elements.includes(el.id))
          ),
          text: combinedText,
          visualContext: relationship.type || 'other',
          confidence: 'high',
          notes: relationship.reason
        }

        slideData.segments.push(combinedSegment)
      }
    })

    return slideData
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
   * Analyze multiple slides in batch
   * @param {Array} slides - Array of slide data
   * @returns {Promise<Array>} Array of enhanced slide analyses
   */
  async analyzeSlides(slides) {
    const results = []
    
    for (const slide of slides) {
      try {
        const enhancedSlide = await this.analyzeSlide(slide)
        results.push(enhancedSlide)
        
        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100))
      } catch (error) {
        console.error(`Error analyzing slide ${slide.slideId}:`, error)
        results.push(slide) // Return original if analysis fails
      }
    }

    return results
  }
}

module.exports = VisualAnalyzer
