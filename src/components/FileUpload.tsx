import { useState, useRef, DragEvent } from 'react'
import './FileUpload.css'

interface FileUploadProps {
  onFileUpload: (file: File) => void
  isProcessing: boolean
  error: string | null
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload, isProcessing, error }) => {
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFile(files[0])
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFile(files[0])
    }
  }

  const handleFile = (file: File) => {
    // Validate file type
    const validTypes = ['text/plain', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!validTypes.includes(file.type) && !file.name.endsWith('.txt')) {
      alert('Please upload a .txt, .pdf, or .docx file')
      return
    }

    // Validate file size (100KB for MVP)
    if (file.size > 100 * 1024) {
      alert('File size must be less than 100KB for the MVP version')
      return
    }

    onFileUpload(file)
  }

  return (
    <div className="file-upload-container">
      <div
        className={`file-upload-area ${isDragOver ? 'drag-over' : ''} ${isProcessing ? 'processing' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isProcessing && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.pdf,.docx"
          onChange={handleFileInput}
          style={{ display: 'none' }}
          disabled={isProcessing}
        />

        {isProcessing ? (
          <div className="processing-indicator">
            <div className="spinner"></div>
            <p>Analyzing document...</p>
            <p className="processing-note">This may take up to 30 seconds</p>
          </div>
        ) : (
          <>
            <div className="upload-icon">📄</div>
            <h2>Drop your file here</h2>
            <p>or click to browse</p>
            <p className="file-types">Supports .txt files (PDF and DOCX coming soon)</p>
            <p className="file-size">Maximum file size: 100KB</p>
          </>
        )}
      </div>

      {error && (
        <div className="error-message">
          <p>❌ {error}</p>
        </div>
      )}
    </div>
  )
}

export default FileUpload
