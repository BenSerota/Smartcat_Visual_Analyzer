import { useState } from 'react'
import './App.css'
import FileUpload from './components/FileUpload'
import ResultsDisplay from './components/ResultsDisplay'
import { PowerPointAnalysis, VisualSegment } from './types'

function App() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [analysis, setAnalysis] = useState<PowerPointAnalysis | null>(null)
  const [segments, setSegments] = useState<VisualSegment[] | null>(null)
  const [fileName, setFileName] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState<'upload' | 'analysis' | 'preview' | 'segmentation' | 'export'>('upload')

  const handleFileUpload = async (file: File) => {
    setIsProcessing(true)
    setError(null)
    setAnalysis(null)
    setSegments(null)
    setFileName(file.name)
    setCurrentStep('analysis')

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/analyze-powerpoint', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Server error: ${response.statusText}`)
      }

      const data = await response.json()
      setAnalysis(data.analysis)
      setSegments(data.segments)
      setCurrentStep('preview')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
      setCurrentStep('upload')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="visual-logo">👁️</div>
        <h1>Visual Segmenter</h1>
        <p>AI-powered PowerPoint segmentation using visual context analysis</p>
      </header>

      <main className="app-main">
        {currentStep === 'upload' && (
          <FileUpload 
            onFileUpload={handleFileUpload} 
            isProcessing={isProcessing}
            error={error}
            acceptedTypes=".pptx"
          />
        )}

        {currentStep === 'analysis' && isProcessing && (
          <div className="processing-container">
            <div className="processing-spinner"></div>
            <h2>Analyzing PowerPoint file...</h2>
            <p>Extracting slides and performing visual analysis</p>
          </div>
        )}

        {currentStep === 'preview' && analysis && (
          <ResultsDisplay 
            analysis={analysis}
            segments={segments}
            fileName={fileName}
            onReset={() => {
              setAnalysis(null)
              setSegments(null)
              setError(null)
              setFileName('')
              setCurrentStep('upload')
            }}
            onProceedToSegmentation={() => setCurrentStep('segmentation')}
          />
        )}

        {currentStep === 'segmentation' && segments && (
          <div className="segmentation-editor">
            <h2>Review and Edit Segmentation</h2>
            <p>Review the AI-generated segmentation and make adjustments as needed</p>
            {/* Segmentation editor component will go here */}
            <button onClick={() => setCurrentStep('export')}>
              Export XLIFF
            </button>
          </div>
        )}

        {currentStep === 'export' && (
          <div className="export-container">
            <h2>Export Complete</h2>
            <p>Your XLIFF file has been generated with visual context-aware segmentation</p>
            <button onClick={() => setCurrentStep('upload')}>
              Process Another File
            </button>
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>Powered by OpenAI GPT-5-nano • Visual Context Analysis</p>
      </footer>
    </div>
  )
}

export default App
