const pptx2json = require('pptx2json')
const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

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

      // Parse the PowerPoint file
      console.log('Parsing PowerPoint presentation...')
      const presentation = await pptx2json(tempFilePath)
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
   * Process individual slide
   * @param {Object} slide - pptx2json slide object
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
   * Generate slide image (placeholder implementation)
   * In a real implementation, this would render the slide to an image
   * @param {Object} slide - Slide object
   * @param {number} slideId - Slide ID
   * @returns {Promise<string>} Base64 encoded image
   */
  async generateSlideImage(slide, slideId) {
    // For now, create a placeholder image
    // In production, you'd use a library like puppeteer or similar to render slides
    const placeholderSvg = `
      <svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
        <rect width="800" height="600" fill="#f0f0f0" stroke="#ccc" stroke-width="2"/>
        <text x="400" y="300" text-anchor="middle" font-family="Arial" font-size="24" fill="#666">
          Slide ${slideId} Preview
        </text>
        <text x="400" y="350" text-anchor="middle" font-family="Arial" font-size="16" fill="#999">
          Visual analysis will be performed here
        </text>
      </svg>
    `

    try {
      const buffer = Buffer.from(placeholderSvg)
      const pngBuffer = await sharp(buffer).png().toBuffer()
      return `data:image/png;base64,${pngBuffer.toString('base64')}`
    } catch (error) {
      console.error('Error generating slide image:', error)
      // Return a simple base64 placeholder
      return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
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
