import React, { useState, useEffect } from 'react'
import { VisualSegment } from '../types'
import './SegmentationEditor.css'

interface SegmentationEditorProps {
  segments: VisualSegment[]
  onSegmentsChange: (segments: VisualSegment[]) => void
  onExport: () => void
  onBack: () => void
}

const SegmentationEditor: React.FC<SegmentationEditorProps> = ({
  segments,
  onSegmentsChange,
  onExport,
  onBack
}) => {
  const [editableSegments, setEditableSegments] = useState<VisualSegment[]>(segments)
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<string>('all')
  const [searchText, setSearchText] = useState('')

  useEffect(() => {
    setEditableSegments(segments)
  }, [segments])

  const handleSegmentEdit = (segmentId: string, field: keyof VisualSegment, value: any) => {
    const updatedSegments = editableSegments.map(segment => 
      segment.id === segmentId 
        ? { ...segment, [field]: value }
        : segment
    )
    setEditableSegments(updatedSegments)
    onSegmentsChange(updatedSegments)
  }

  const handleSegmentDelete = (segmentId: string) => {
    const updatedSegments = editableSegments.filter(segment => segment.id !== segmentId)
    setEditableSegments(updatedSegments)
    onSegmentsChange(updatedSegments)
  }

  const handleSegmentMerge = (segmentIds: string[]) => {
    const segmentsToMerge = editableSegments.filter(segment => segmentIds.includes(segment.id))
    if (segmentsToMerge.length < 2) return

    const mergedText = segmentsToMerge.map(s => s.text).join(' ')
    const mergedCoordinates = calculateMergedBoundingBox(segmentsToMerge)
    
    const mergedSegment: VisualSegment = {
      id: `merged_${Date.now()}`,
      slideId: segmentsToMerge[0].slideId,
      textElementId: `merged_${segmentIds.join('_')}`,
      visualContextId: 'merged',
      coordinates: mergedCoordinates,
      text: mergedText,
      visualContext: segmentsToMerge[0].visualContext,
      confidence: 'high',
      notes: `Merged ${segmentsToMerge.length} segments`,
      translation: segmentsToMerge.map(s => s.translation).filter(Boolean).join(' ')
    }

    const updatedSegments = editableSegments
      .filter(segment => !segmentIds.includes(segment.id))
      .concat(mergedSegment)
    
    setEditableSegments(updatedSegments)
    onSegmentsChange(updatedSegments)
  }

  const calculateMergedBoundingBox = (segments: VisualSegment[]) => {
    if (segments.length === 0) return { x: 0, y: 0, width: 0, height: 0 }

    const minX = Math.min(...segments.map(s => s.coordinates.x))
    const minY = Math.min(...segments.map(s => s.coordinates.y))
    const maxX = Math.max(...segments.map(s => s.coordinates.x + s.coordinates.width))
    const maxY = Math.max(...segments.map(s => s.coordinates.y + s.coordinates.height))

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    }
  }

  const filteredSegments = editableSegments.filter(segment => {
    const matchesType = filterType === 'all' || segment.visualContext === filterType
    const matchesSearch = searchText === '' || 
      segment.text.toLowerCase().includes(searchText.toLowerCase()) ||
      segment.translation?.toLowerCase().includes(searchText.toLowerCase())
    
    return matchesType && matchesSearch
  })

  const getVisualContextColor = (context: string) => {
    const colors: { [key: string]: string } = {
      'title_group': '#ff6b6b',
      'body_text': '#4ecdc4',
      'caption': '#45b7d1',
      'bullet_list': '#96ceb4',
      'header_footer': '#feca57',
      'callout': '#ff9ff3',
      'navigation': '#54a0ff',
      'other': '#5f27cd'
    }
    return colors[context] || '#95a5a6'
  }

  const getConfidenceIcon = (confidence: string) => {
    switch (confidence) {
      case 'high': return '🟢'
      case 'medium': return '🟡'
      case 'low': return '🔴'
      default: return '⚪'
    }
  }

  return (
    <div className="segmentation-editor">
      <div className="editor-header">
        <h2>Segmentation Editor</h2>
        <p>Review and edit the visual segmentation before export</p>
      </div>

      <div className="editor-controls">
        <div className="filter-controls">
          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Types</option>
            <option value="title_group">Titles</option>
            <option value="body_text">Body Text</option>
            <option value="bullet_list">Bullet Lists</option>
            <option value="caption">Captions</option>
            <option value="header_footer">Headers/Footers</option>
            <option value="callout">Callouts</option>
            <option value="navigation">Navigation</option>
            <option value="other">Other</option>
          </select>

          <input
            type="text"
            placeholder="Search segments..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="action-controls">
          <button 
            onClick={onBack}
            className="back-button"
          >
            ← Back to Preview
          </button>
          <button 
            onClick={onExport}
            className="export-button"
          >
            Export XLIFF
          </button>
        </div>
      </div>

      <div className="segments-list">
        {filteredSegments.length === 0 ? (
          <div className="no-segments">
            <p>No segments found matching your criteria.</p>
          </div>
        ) : (
          filteredSegments.map((segment, index) => (
            <div 
              key={segment.id}
              className={`segment-item ${selectedSegment === segment.id ? 'selected' : ''}`}
              onClick={() => setSelectedSegment(segment.id)}
            >
              <div className="segment-header">
                <div className="segment-info">
                  <span className="segment-id">#{index + 1}</span>
                  <span 
                    className="context-badge"
                    style={{ backgroundColor: getVisualContextColor(segment.visualContext) }}
                  >
                    {segment.visualContext}
                  </span>
                  <span className="confidence-badge">
                    {getConfidenceIcon(segment.confidence)} {segment.confidence}
                  </span>
                  <span className="slide-info">Slide {segment.slideId}</span>
                </div>
                <div className="segment-actions">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation()
                      handleSegmentDelete(segment.id)
                    }}
                    className="delete-button"
                    title="Delete segment"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              <div className="segment-content">
                <div className="text-section">
                  <label>Original Text:</label>
                  <textarea
                    value={segment.text}
                    onChange={(e) => handleSegmentEdit(segment.id, 'text', e.target.value)}
                    className="text-input"
                    rows={2}
                  />
                </div>

                <div className="translation-section">
                  <label>Translation:</label>
                  <textarea
                    value={segment.translation || ''}
                    onChange={(e) => handleSegmentEdit(segment.id, 'translation', e.target.value)}
                    className="translation-input"
                    rows={2}
                    placeholder="Enter translation..."
                  />
                </div>

                <div className="metadata-section">
                  <div className="coordinates">
                    <label>Position:</label>
                    <span>
                      ({segment.coordinates.x}, {segment.coordinates.y}) 
                      {segment.coordinates.width}×{segment.coordinates.height}
                    </span>
                  </div>

                  <div className="confidence-select">
                    <label>Confidence:</label>
                    <select
                      value={segment.confidence}
                      onChange={(e) => handleSegmentEdit(segment.id, 'confidence', e.target.value)}
                    >
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>

                  {segment.notes && (
                    <div className="notes">
                      <label>Notes:</label>
                      <span>{segment.notes}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="editor-footer">
        <div className="segment-stats">
          <span>Total Segments: {editableSegments.length}</span>
          <span>Filtered: {filteredSegments.length}</span>
        </div>
      </div>
    </div>
  )
}

export default SegmentationEditor
