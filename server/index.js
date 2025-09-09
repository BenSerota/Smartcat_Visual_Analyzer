require('dotenv').config()
const express = require('express')
const cors = require('cors')
const multer = require('multer')
const path = require('path')
const pdfParse = require('pdf-parse')
const mammoth = require('mammoth')
const { parse } = require('node-html-parser')
const { analyzeDocument } = require('./analyzer')
const PowerPointProcessor = require('./powerpoint-processor')
const VisualAnalyzer = require('./visual-analyzer')

const app = express()
const PORT = process.env.PORT || 3001

// Initialize processors
const pptProcessor = new PowerPointProcessor()
const visualAnalyzer = new VisualAnalyzer()

// Middleware
app.use(cors())
app.use(express.json())

// Configure multer for file uploads
const storage = multer.memoryStorage()
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit for PowerPoint files
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'text/plain',
      'text/html',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ]
    const allowedExtensions = ['.txt', '.html', '.htm', '.pdf', '.docx', '.pptx']
    const fileExtension = path.extname(file.originalname).toLowerCase()
    
    if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
      cb(null, true)
    } else {
      cb(new Error('Only .txt, .html, .pdf, .docx, and .pptx files are supported'))
    }
  }
})

// Routes
app.post('/api/analyze', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OpenAI API key not configured' })
    }

    // Extract text based on file type
    let text = ''
    const fileExtension = path.extname(req.file.originalname).toLowerCase()
    
    try {
      switch (fileExtension) {
        case '.txt':
          text = req.file.buffer.toString('utf-8')
          break
          
        case '.pdf':
          const pdfData = await pdfParse(req.file.buffer)
          text = pdfData.text
          break
          
        case '.docx':
          const docxResult = await mammoth.extractRawText({ buffer: req.file.buffer })
          text = docxResult.value
          break
          
        case '.html':
        case '.htm':
          const htmlContent = req.file.buffer.toString('utf-8')
          const root = parse(htmlContent)
          // Remove script and style tags
          root.querySelectorAll('script, style').forEach(el => el.remove())
          text = root.text.replace(/\s+/g, ' ').trim()
          break
          
        default:
          throw new Error(`Unsupported file type: ${fileExtension}`)
      }
      
      if (!text || text.trim().length === 0) {
        throw new Error('Could not extract any text from the file')
      }
      
    } catch (parseError) {
      console.error('Error parsing file:', parseError)
      return res.status(400).json({ 
        error: `Failed to parse ${fileExtension} file: ${parseError.message}` 
      })
    }
    
    // Analyze the document
    const results = await analyzeDocument(text)
    
    res.json(results)
  } catch (error) {
    console.error('Error analyzing document:', error)
    res.status(500).json({ 
      error: error.message || 'Failed to analyze document' 
    })
  }
})

// Global error handler for multer errors
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        error: 'File too large. Maximum file size is 10MB.' 
      })
    }
    return res.status(400).json({ 
      error: `File upload error: ${error.message}` 
    })
  }
  next(error)
})

// PowerPoint Analysis Route
app.post('/api/analyze-powerpoint', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    // Check for multer errors
    if (req.file === undefined) {
      return res.status(400).json({ error: 'File upload failed - file may be too large (max 10MB)' })
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OpenAI API key not configured' })
    }

    const fileExtension = path.extname(req.file.originalname).toLowerCase()
    
    if (fileExtension !== '.pptx') {
      return res.status(400).json({ 
        error: 'Only PowerPoint (.pptx) files are supported for visual analysis' 
      })
    }

    console.log(`Processing PowerPoint file: ${req.file.originalname}`)

    // Step 1: Process PowerPoint file
    const pptData = await pptProcessor.processPowerPoint(req.file.buffer, req.file.originalname)
    console.log(`Extracted ${pptData.slides.length} slides`)

    // Step 2: Perform visual analysis on each slide
    console.log('Starting visual analysis...')
    const analyzedSlides = await visualAnalyzer.analyzeSlides(pptData.slides)
    console.log('Visual analysis complete')

    // Step 3: Collect all segments
    const allSegments = []
    analyzedSlides.forEach(slide => {
      allSegments.push(...slide.segments)
    })

    // Step 4: Generate translations for proof of concept
    const segmentsWithTranslations = await generateTranslations(allSegments)

    res.json({
      analysis: {
        fileName: pptData.fileName,
        slides: analyzedSlides,
        totalSlides: pptData.totalSlides,
        analysisTimestamp: pptData.analysisTimestamp
      },
      segments: segmentsWithTranslations
    })

  } catch (error) {
    console.error('Error analyzing PowerPoint:', error)
    res.status(500).json({ 
      error: error.message || 'Failed to analyze PowerPoint file' 
    })
  }
})

// Helper function to generate translations for proof of concept
async function generateTranslations(segments) {
  // For now, return segments without translation
  // In production, you'd integrate with your translation engine
  return segments.map(segment => ({
    ...segment,
    translation: `[Translation for: ${segment.text}]`
  }))
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    hasApiKey: !!process.env.OPENAI_API_KEY 
  })
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  if (!process.env.OPENAI_API_KEY) {
    console.warn('⚠️  WARNING: OPENAI_API_KEY not found in environment variables')
  }
})
