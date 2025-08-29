require('dotenv').config()
const express = require('express')
const cors = require('cors')
const multer = require('multer')
const path = require('path')
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
    fileSize: 100 * 1024 // 100KB limit for MVP
  },
  fileFilter: (req, file, cb) => {
    // For MVP, only accept .txt files
    if (file.mimetype === 'text/plain' || path.extname(file.originalname).toLowerCase() === '.txt') {
      cb(null, true)
    } else {
      cb(new Error('Only .txt files are currently supported'))
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

    // Convert buffer to text
    const text = req.file.buffer.toString('utf-8')
    
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
