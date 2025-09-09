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
        max_tokens: 2000,
        temperature: 0.1
      })

      const analysisResult = JSON.parse(response.choices[0].message.content)
      
      // Enhance the slide data with visual analysis
      return this.enhanceSlideWithAnalysis(slideData, analysisResult)
    } catch (error) {
      console.error('Error in visual analysis:', error)
      // Return original data if analysis fails
      return slideData
    }
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
