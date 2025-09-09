import { useState } from 'react'
import { PowerPointAnalysis, VisualSegment } from '../types'
import './ResultsDisplay.css'

interface ResultsDisplayProps {
  analysis: PowerPointAnalysis
  segments: VisualSegment[]
  fileName: string
  onReset: () => void
  onProceedToSegmentation: () => void
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ 
  analysis, 
  segments, 
  fileName, 
  onReset, 
  onProceedToSegmentation 
}) => {
  const [selectedSlide, setSelectedSlide] = useState(0)
  const [showVisualContexts, setShowVisualContexts] = useState(true)

  const visualContextColors = {
    title_group: '#4CAF50',
    body_text: '#2196F3',
    caption: '#FF9800',
    bullet_list: '#9C27B0',
    header_footer: '#607D8B',
    callout: '#E91E63',
    navigation: '#795548',
    other: '#9E9E9E'
  }

  const currentSlide = analysis.slides[selectedSlide]
  const slideSegments = segments.filter(segment => segment.slideId === currentSlide?.slideId)

  return (
    <div className="results-container">
      {/* Analysis Summary */}
      <div className="analysis-summary">
        <div className="visual-announce">
          <span className="visual-icon">👁️</span>
          <h2>Visual Analysis Complete!</h2>
        </div>
        <p className="file-name">📊 {fileName}</p>
        <div className="analysis-stats">
          <div className="stat">
            <span className="stat-number">{analysis.totalSlides}</span>
            <span className="stat-label">Slides</span>
          </div>
          <div className="stat">
            <span className="stat-number">{segments.length}</span>
            <span className="stat-label">Segments</span>
          </div>
          <div className="stat">
            <span className="stat-number">{new Set(segments.map(s => s.visualContext)).size}</span>
            <span className="stat-label">Context Types</span>
          </div>
        </div>
      </div>

      {/* Slide Navigation */}
      <div className="slide-navigation">
        <h3>Slide Preview</h3>
        <div className="slide-selector">
          {analysis.slides.map((slide, index) => (
            <button
              key={slide.slideId}
              className={`slide-btn ${selectedSlide === index ? 'active' : ''}`}
              onClick={() => setSelectedSlide(index)}
            >
              Slide {slide.slideId}
            </button>
          ))}
        </div>
      </div>

      {/* Visual Analysis Preview */}
      <div className="visual-preview">
        <div className="preview-header">
          <h3>Visual Context Analysis - Slide {currentSlide?.slideId}</h3>
          <button 
            className="context-toggle"
            onClick={() => setShowVisualContexts(!showVisualContexts)}
          >
            {showVisualContexts ? 'Hide' : 'Show'} Visual Contexts
          </button>
        </div>

        <div className="preview-content">
          {/* Slide Image with Visual Context Overlays */}
          <div className="slide-preview-container">
            <div className="slide-image-wrapper">
              <img 
                src={currentSlide?.slideImage} 
                alt={`Slide ${currentSlide?.slideId}`}
                className="slide-image"
              />
              
              {/* Visual Context Overlays */}
              {showVisualContexts && currentSlide?.visualContexts.map((context, index) => (
                <div
                  key={context.id}
                  className="visual-context-overlay"
                  style={{
                    left: `${(context.boundingBox.x / 800) * 100}%`,
                    top: `${(context.boundingBox.y / 600) * 100}%`,
                    width: `${(context.boundingBox.width / 800) * 100}%`,
                    height: `${(context.boundingBox.height / 600) * 100}%`,
                    backgroundColor: `${visualContextColors[context.type]}20`,
                    borderColor: visualContextColors[context.type],
                    borderWidth: '2px',
                    borderStyle: 'solid'
                  }}
                  title={`${context.type}: ${context.description}`}
                >
                  <span className="context-label" style={{ color: visualContextColors[context.type] }}>
                    {context.type.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Segments List */}
          <div className="segments-panel">
            <h4>Text Segments ({slideSegments.length})</h4>
            <div className="segments-list">
              {slideSegments.map((segment, index) => (
                <div 
                  key={segment.id} 
                  className={`segment-item confidence-${segment.confidence}`}
                >
                  <div className="segment-header">
                    <span 
                      className="context-badge"
                      style={{ backgroundColor: visualContextColors[segment.visualContext] }}
                    >
                      {segment.visualContext.replace('_', ' ')}
                    </span>
                    <span className={`confidence-badge ${segment.confidence}`}>
                      {segment.confidence}
                    </span>
                  </div>
                  <div className="segment-text">
                    {segment.text}
                  </div>
                  {segment.notes && (
                    <div className="segment-notes">
                      <small>AI Reasoning: {segment.notes}</small>
                    </div>
                  )}
                  <div className="segment-coordinates">
                    <small>
                      Position: ({segment.coordinates.x}, {segment.coordinates.y}) 
                      Size: {segment.coordinates.width}×{segment.coordinates.height}
                    </small>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="action-buttons">
        <button onClick={onProceedToSegmentation} className="primary-btn">
          Review & Edit Segmentation
        </button>
        <button onClick={onReset} className="secondary-btn">
          Analyze New File
        </button>
      </div>

      {/* Visual Context Legend */}
      <div className="context-legend">
        <h4>Visual Context Types</h4>
        <div className="legend-items">
          {Object.entries(visualContextColors).map(([type, color]) => (
            <div key={type} className="legend-item">
              <div 
                className="legend-color" 
                style={{ backgroundColor: color }}
              ></div>
              <span>{type.replace('_', ' ')}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ResultsDisplay