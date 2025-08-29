import { useState } from 'react'
import './App.css'
import FileUpload from './components/FileUpload'
import ResultsDisplay from './components/ResultsDisplay'
import { GlossaryTerm } from './types'

function App() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [results, setResults] = useState<GlossaryTerm[] | null>(null)
  const [documentContext, setDocumentContext] = useState<any | null>(null)
  const [fileName, setFileName] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  const handleFileUpload = async (file: File) => {
    setIsProcessing(true)
    setError(null)
    setResults(null)
    setFileName(file.name)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Server error: ${response.statusText}`)
      }

      const data = await response.json()
      setResults(data.terms)
      setDocumentContext(data.context)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="jester-logo">🃏</div>
        <h1>Jester the Glossary Suggester</h1>
        <p>Your witty AI companion for identifying terms that should not be translated</p>
      </header>

      <main className="app-main">
        {!results && (
          <FileUpload 
            onFileUpload={handleFileUpload} 
            isProcessing={isProcessing}
            error={error}
          />
        )}

        {results && (
          <ResultsDisplay 
            terms={results}
            fileName={fileName}
            documentContext={documentContext}
            onReset={() => {
              setResults(null)
              setError(null)
              setDocumentContext(null)
              setFileName('')
            }}
          />
        )}
      </main>

      <footer className="app-footer">
        <p>Powered by OpenAI GPT-5-nano</p>
      </footer>
    </div>
  )
}

export default App
