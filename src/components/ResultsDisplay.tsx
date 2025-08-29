import { useState } from 'react'
import { GlossaryTerm } from '../types'
import './ResultsDisplay.css'

interface ResultsDisplayProps {
  terms: GlossaryTerm[]
  onReset: () => void
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ terms: initialTerms, onReset }) => {
  const [terms, setTerms] = useState(initialTerms)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  const categoryColors = {
    company: '#4CAF50',
    product: '#2196F3',
    technical: '#FF9800',
    acronym: '#9C27B0',
    other: '#607D8B'
  }

  const handleEdit = (term: GlossaryTerm) => {
    setEditingId(term.id)
    setEditValue(term.term)
  }

  const handleSaveEdit = (id: string) => {
    setTerms(terms.map(term => 
      term.id === id ? { ...term, term: editValue } : term
    ))
    setEditingId(null)
  }

  const handleDelete = (id: string) => {
    setTerms(terms.filter(term => term.id !== id))
  }

  const handleExportCSV = () => {
    const csv = [
      ['Term', 'Category', 'Confidence', 'Context', 'Frequency'],
      ...terms.map(term => [
        term.term,
        term.category,
        term.confidence,
        term.context || '',
        term.frequency?.toString() || ''
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'glossary.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleExportJSON = () => {
    const json = JSON.stringify(terms, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'glossary.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const groupedTerms = terms.reduce((acc, term) => {
    if (!acc[term.category]) acc[term.category] = []
    acc[term.category].push(term)
    return acc
  }, {} as Record<string, GlossaryTerm[]>)

  return (
    <div className="results-container">
      <div className="results-header">
        <h2>Suggested Glossary Terms</h2>
        <div className="header-actions">
          <button onClick={handleExportCSV} className="export-btn">
            Export CSV
          </button>
          <button onClick={handleExportJSON} className="export-btn">
            Export JSON
          </button>
          <button onClick={onReset} className="reset-btn">
            Analyze New File
          </button>
        </div>
      </div>

      <div className="results-summary">
        <p>Found {terms.length} terms across {Object.keys(groupedTerms).length} categories</p>
      </div>

      <div className="terms-grid">
        {Object.entries(groupedTerms).map(([category, categoryTerms]) => (
          <div key={category} className="category-section">
            <h3 style={{ color: categoryColors[category as keyof typeof categoryColors] }}>
              {category.charAt(0).toUpperCase() + category.slice(1)} ({categoryTerms.length})
            </h3>
            
            <div className="terms-list">
              {categoryTerms.map(term => (
                <div key={term.id} className={`term-card confidence-${term.confidence}`}>
                  <div className="term-header">
                    {editingId === term.id ? (
                      <input
                        type="text"
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSaveEdit(term.id)}
                        className="term-edit-input"
                        autoFocus
                      />
                    ) : (
                      <span className="term-text">{term.term}</span>
                    )}
                    <span className={`confidence-badge ${term.confidence}`}>
                      {term.confidence}
                    </span>
                  </div>
                  
                  {term.context && (
                    <p className="term-context">"{term.context}"</p>
                  )}
                  
                  <div className="term-actions">
                    {editingId === term.id ? (
                      <>
                        <button onClick={() => handleSaveEdit(term.id)} className="action-btn save">
                          Save
                        </button>
                        <button onClick={() => setEditingId(null)} className="action-btn cancel">
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => handleEdit(term)} className="action-btn edit">
                          Edit
                        </button>
                        <button onClick={() => handleDelete(term.id)} className="action-btn delete">
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ResultsDisplay
