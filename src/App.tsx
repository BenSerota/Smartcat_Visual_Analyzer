import { useState } from 'react'
import './App.css'
import FileUpload from './components/FileUpload'
import ResultsDisplay from './components/ResultsDisplay'
import SegmentationEditor from './components/SegmentationEditor'
import { PowerPointAnalysis, VisualSegment } from './types'

function App() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [analysis, setAnalysis] = useState<PowerPointAnalysis | null>(null)
  const [segments, setSegments] = useState<VisualSegment[] | null>(null)
  const [optimizedSegments, setOptimizedSegments] = useState<VisualSegment[] | null>(null)
  const [fileName, setFileName] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState<'upload' | 'analysis' | 'preview' | 'segmentation' | 'export'>('upload')

  const handleFileUpload = async (file: File) => {
    setIsProcessing(true)
    setError(null)
    setAnalysis(null)
    setSegments(null)
    setOptimizedSegments(null)
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
      setOptimizedSegments(data.optimizedSegments || data.segments)
      setCurrentStep('preview')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
      setCurrentStep('upload')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSegmentsChange = (updatedSegments: VisualSegment[]) => {
    setOptimizedSegments(updatedSegments)
  }

  const handleExportXLIFF = async () => {
    if (!optimizedSegments || optimizedSegments.length === 0) {
      setError('No segments available for export')
      return
    }

    try {
      setIsProcessing(true)
      
      const response = await fetch('/api/export-xliff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          segments: optimizedSegments,
          fileName: fileName,
          sourceLanguage: 'en',
          targetLanguage: 'es'
        }),
      })

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`)
      }

      // Get the filename from the response headers
      const contentDisposition = response.headers.get('Content-Disposition')
      const filename = contentDisposition 
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
        : `${fileName.replace(/\.[^/.]+$/, '')}_visual_segmented.xlf`

      // Create blob and download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      setCurrentStep('export')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleProceedToSegmentation = () => {
    setCurrentStep('segmentation')
  }

  const handleBackToPreview = () => {
    setCurrentStep('preview')
  }

  const handleBackToUpload = () => {
    setCurrentStep('upload')
    setAnalysis(null)
    setSegments(null)
    setOptimizedSegments(null)
    setFileName('')
    setError(null)
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
            onReset={handleBackToUpload}
            onProceedToSegmentation={handleProceedToSegmentation}
          />
        )}

        {currentStep === 'segmentation' && optimizedSegments && (
          <SegmentationEditor
            segments={optimizedSegments}
            onSegmentsChange={handleSegmentsChange}
            onExport={handleExportXLIFF}
            onBack={handleBackToPreview}
          />
        )}

        {currentStep === 'export' && (
          <div className="export-container">
            <div className="export-success">
              <div className="success-icon">🎉</div>
              <h2>Export Complete!</h2>
              <p>Your XLIFF file has been generated with visual context-aware segmentation</p>
              <div className="export-details">
                <p><strong>File:</strong> {fileName}</p>
                <p><strong>Segments:</strong> {optimizedSegments?.length || 0}</p>
                <p><strong>Format:</strong> XLIFF 1.2 with visual metadata</p>
              </div>
              <div className="export-actions">
                <button 
                  onClick={handleBackToUpload}
                  className="reset-button"
                >
                  Process Another File
                </button>
              </div>
            </div>
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
