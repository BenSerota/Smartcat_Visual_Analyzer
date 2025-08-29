require('dotenv').config()
const express = require('express')
const cors = require('cors')
const multer = require('multer')
const path = require('path')
const pdfParse = require('pdf-parse')
const mammoth = require('mammoth')
const { parse } = require('node-html-parser')
const { analyzeDocument } = require('./analyzer')

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json())

// Configure multer for file uploads
const storage = multer.memoryStorage()
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit to handle PDFs and DOCX
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'text/plain',
      'text/html',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
    const allowedExtensions = ['.txt', '.html', '.htm', '.pdf', '.docx']
    const fileExtension = path.extname(file.originalname).toLowerCase()
    
    if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
      cb(null, true)
    } else {
      cb(new Error('Only .txt, .html, .pdf, and .docx files are supported'))
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
