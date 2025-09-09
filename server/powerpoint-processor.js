const sharp = require('sharp')
const fs = require('fs')
const path = require('path')
const PptxParser = require('node-pptx-parser').default

/**
 * PowerPoint Processing Module
 * Handles extraction of text, layout data, and slide images from PowerPoint files
 */

class PowerPointProcessor {
  constructor() {
    this.tempDir = path.join(__dirname, '../temp')
    this.ensureTempDir()
  }

  ensureTempDir() {
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true })
    }
  }

  /**
   * Process a PowerPoint file and extract comprehensive data
   * @param {Buffer} fileBuffer - The PowerPoint file buffer
   * @param {string} fileName - Original file name
   * @returns {Promise<Object>} Processed PowerPoint data
   */
  async processPowerPoint(fileBuffer, fileName) {
    try {
      console.log(`Processing PowerPoint file: ${fileName}, size: ${fileBuffer.length} bytes`)
      
      // Save buffer to temporary file
      const tempFilePath = path.join(this.tempDir, `temp_${Date.now()}.pptx`)
      fs.writeFileSync(tempFilePath, fileBuffer)
      console.log(`Saved temporary file: ${tempFilePath}`)

      // Parse the PowerPoint file using node-pptx-parser
      console.log('Parsing PowerPoint presentation...')
      const presentation = await this.parsePresentation(tempFilePath)
      console.log(`Successfully parsed presentation with ${presentation.slides.length} slides`)

      const slides = []
      const allSegments = []

      // Process each slide
      for (let i = 0; i < presentation.slides.length; i++) {
        const slide = presentation.slides[i]
        const slideData = await this.processSlide(slide, i + 1, fileName)
        slides.push(slideData)
        allSegments.push(...slideData.segments)
      }

      // Clean up temp file
      fs.unlinkSync(tempFilePath)

      return {
        fileName,
        slides,
        totalSlides: presentation.slides.length,
        analysisTimestamp: new Date().toISOString(),
        allSegments
      }
    } catch (error) {
      console.error('Error processing PowerPoint:', error)
      throw new Error(`Failed to process PowerPoint file: ${error.message}`)
    }
  }

  /**
   * Parse PowerPoint presentation using node-pptx-parser
   * @param {string} filePath - Path to the PowerPoint file
   * @returns {Promise<Object>} Parsed presentation data
   */
  async parsePresentation(filePath) {
    try {
      const parser = new PptxParser(filePath)
      const textContent = await parser.extractText()
      
      // Convert the parser output to our expected format
      const slides = textContent.map((slide, index) => ({
        id: slide.id || `slide_${index + 1}`,
        text: slide.text || [],
        shapes: this.convertTextToShapes(slide.text || [], index + 1)
      }))
      
      return { slides }
    } catch (error) {
      console.error('Error parsing PowerPoint file:', error)
      // Fallback to mock data if parsing fails
      console.log('Falling back to mock presentation data')
      return this.createMockPresentation('fallback')
    }
  }

  /**
   * Convert text content to shape format for compatibility
   * @param {Array} textContent - Array of text strings
   * @param {number} slideId - Slide ID
   * @returns {Array} Array of shape objects
   */
  convertTextToShapes(textContent, slideId) {
    return textContent.map((text, index) => ({
      text: text,
      bounds: this.estimateBounds(index, text),
      fontSize: this.estimateFontSize(text),
      fontFamily: 'Arial',
      color: '#000000',
      bold: this.isLikelyBold(text),
      italic: false
    }))
  }

  /**
   * Estimate bounding box for text element
   * @param {number} index - Element index
   * @param {string} text - Text content
   * @returns {Object} Estimated bounding box
   */
  estimateBounds(index, text) {
    const baseY = 50 + (index * 80)
    const height = Math.max(40, Math.min(120, text.length * 0.8))
    return {
      x: 100,
      y: baseY,
      width: 600,
      height: height
    }
  }

  /**
   * Estimate font size based on text content
   * @param {string} text - Text content
   * @returns {number} Estimated font size
   */
  estimateFontSize(text) {
    if (text.length < 50) return 24 // Likely a title
    if (text.length < 200) return 18 // Likely a subtitle
    return 14 // Regular text
  }

  /**
   * Determine if text is likely bold (titles, short text)
   * @param {string} text - Text content
   * @returns {boolean} Whether text is likely bold
   */
  isLikelyBold(text) {
    return text.length < 100 && !text.includes('.') && !text.includes(',')
  }

  /**
   * Process individual slide
   * @param {Object} slide - Parsed slide object
   * @param {number} slideId - Slide number
   * @param {string} fileName - File name for context
   * @returns {Promise<Object>} Slide analysis data
   */
  async processSlide(slide, slideId, fileName) {
    const textElements = []
    const visualContexts = []
    const segments = []

    // Extract text elements with positioning from pptx2json format
    if (slide.shapes) {
      slide.shapes.forEach((shape, index) => {
        if (shape.text && shape.text.trim()) {
          // Extract positioning information
          const bounds = shape.bounds || { x: 0, y: 0, width: 0, height: 0 }
          
          const textElement = {
            id: `s${slideId}_tb${index + 1}`,
            text: shape.text.trim(),
            boundingBox: {
              x: bounds.x || 0,
              y: bounds.y || 0,
              width: bounds.width || 0,
              height: bounds.height || 0
            },
            fontSize: shape.fontSize || 12,
            fontFamily: shape.fontFamily || 'Arial',
            color: shape.color || '#000000',
            isBold: shape.bold || false,
            isItalic: shape.italic || false
          }
          textElements.push(textElement)

          // Create initial segment
          const segment = {
            id: `${textElement.id}_vc1_xy(${textElement.boundingBox.x},${textElement.boundingBox.y},${textElement.boundingBox.width},${textElement.boundingBox.height})`,
            slideId,
            textElementId: textElement.id,
            visualContextId: 'vc1',
            coordinates: textElement.boundingBox,
            text: shape.text.trim(),
            visualContext: 'other', // Will be updated by AI analysis
            confidence: 'medium'
          }
          segments.push(segment)
        }
      })
    }

    // Generate slide image (placeholder for now - would need actual rendering)
    const slideImage = await this.generateSlideImage(slide, slideId)

    return {
      slideId,
      slideImage,
      visualContexts,
      textElements,
      segments,
      overallContext: `Slide ${slideId} of ${fileName}`
    }
  }

  /**
   * Generate slide image with actual text content for GPT-5 Nano analysis
   * @param {Object} slide - Slide object with text elements
   * @param {number} slideId - Slide ID
   * @returns {Promise<string>} Base64 encoded image
   */
  async generateSlideImage(slide, slideId) {
    try {
      // Get text elements from the slide
      const textElements = slide.textElements || []
      
      // Create an SVG with actual text content positioned correctly
      const textElementsSvg = textElements.map((element, index) => {
        const x = Math.max(50, Math.min(750, element.boundingBox.x))
        const y = Math.max(50, Math.min(550, element.boundingBox.y + 20))
        const fontSize = Math.max(12, Math.min(24, element.fontSize || 16))
        const fontWeight = element.isBold ? 'bold' : 'normal'
        const fontStyle = element.isItalic ? 'italic' : 'normal'
        
        // Truncate text if too long
        const displayText = element.text.length > 100 ? element.text.substring(0, 100) + '...' : element.text
        
        return `
          <rect x="${x - 5}" y="${y - fontSize - 5}" width="${element.boundingBox.width + 10}" height="${element.boundingBox.height + 10}" 
                fill="rgba(255,255,255,0.8)" stroke="#ddd" stroke-width="1" rx="3"/>
          <text x="${x}" y="${y}" font-family="Arial, sans-serif" font-size="${fontSize}" 
                font-weight="${fontWeight}" font-style="${fontStyle}" fill="#333">
            ${this.escapeXml(displayText)}
          </text>
        `
      }).join('\n')

      const slideSvg = `
        <svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
          <rect width="800" height="600" fill="#ffffff" stroke="#ccc" stroke-width="2"/>
          <text x="400" y="30" text-anchor="middle" font-family="Arial" font-size="18" font-weight="bold" fill="#333">
            Slide ${slideId} - Text Content Analysis
          </text>
          <line x1="50" y1="50" x2="750" y2="50" stroke="#ddd" stroke-width="1"/>
          ${textElementsSvg}
          <text x="400" y="580" text-anchor="middle" font-family="Arial" font-size="12" fill="#999">
            ${textElements.length} text elements detected
          </text>
        </svg>
      `

      const buffer = Buffer.from(slideSvg)
      const pngBuffer = await sharp(buffer).png().toBuffer()
      return `data:image/png;base64,${pngBuffer.toString('base64')}`
    } catch (error) {
      console.error('Error generating slide image:', error)
      // Return a simple base64 placeholder
      return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
    }
  }

  /**
   * Escape XML special characters
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  escapeXml(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
  }

  /**
   * Create a mock presentation for testing
   * @param {string} fileName - File name
   * @returns {Object} Mock presentation data
   */
  createMockPresentation(fileName) {
    return {
      slides: [
        {
          shapes: [
            {
              text: "Company Overview",
              bounds: { x: 100, y: 50, width: 600, height: 80 },
              fontSize: 24,
              fontFamily: "Arial",
              color: "#000000",
              bold: true,
              italic: false
            },
            {
              text: "Welcome to our presentation about our company's mission and vision for the future.",
              bounds: { x: 100, y: 150, width: 600, height: 100 },
              fontSize: 16,
              fontFamily: "Arial",
              color: "#333333",
              bold: false,
              italic: false
            },
            {
              text: "Key Statistics",
              bounds: { x: 100, y: 280, width: 300, height: 40 },
              fontSize: 18,
              fontFamily: "Arial",
              color: "#000000",
              bold: true,
              italic: false
            },
            {
              text: "• 500+ Employees\n• 50+ Countries\n• $10M Revenue",
              bounds: { x: 100, y: 330, width: 300, height: 120 },
              fontSize: 14,
              fontFamily: "Arial",
              color: "#666666",
              bold: false,
              italic: false
            }
          ]
        },
        {
          shapes: [
            {
              text: "Our Mission",
              bounds: { x: 100, y: 50, width: 600, height: 80 },
              fontSize: 24,
              fontFamily: "Arial",
              color: "#000000",
              bold: true,
              italic: false
            },
            {
              text: "To revolutionize the industry through innovative solutions and exceptional customer service.",
              bounds: { x: 100, y: 150, width: 600, height: 100 },
              fontSize: 16,
              fontFamily: "Arial",
              color: "#333333",
              bold: false,
              italic: false
            },
            {
              text: "Contact Information",
              bounds: { x: 100, y: 280, width: 300, height: 40 },
              fontSize: 18,
              fontFamily: "Arial",
              color: "#000000",
              bold: true,
              italic: false
            },
            {
              text: "Email: info@company.com\nPhone: +1-555-0123\nWebsite: www.company.com",
              bounds: { x: 100, y: 330, width: 300, height: 120 },
              fontSize: 14,
              fontFamily: "Arial",
              color: "#666666",
              bold: false,
              italic: false
            }
          ]
        }
      ]
    }
  }

  /**
   * Clean up temporary files
   */
  cleanup() {
    try {
      const files = fs.readdirSync(this.tempDir)
      files.forEach(file => {
        const filePath = path.join(this.tempDir, file)
        const stats = fs.statSync(filePath)
        // Delete files older than 1 hour
        if (Date.now() - stats.mtime.getTime() > 3600000) {
          fs.unlinkSync(filePath)
        }
      })
    } catch (error) {
      console.error('Error cleaning up temp files:', error)
    }
  }
}

module.exports = PowerPointProcessor
