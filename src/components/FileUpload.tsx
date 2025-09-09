import { useState, useRef, DragEvent } from 'react'
import './FileUpload.css'

interface FileUploadProps {
  onFileUpload: (file: File) => void
  isProcessing: boolean
  error: string | null
  acceptedTypes?: string
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload, isProcessing, error, acceptedTypes = ".pptx" }) => {
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
    // Validate file type based on accepted types
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ]
    const validExtensions = ['.pptx']
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()
    
    if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
      alert('Please upload a PowerPoint (.pptx) file')
      return
    }

    // Validate file size (10MB limit for PowerPoint files)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB')
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
          accept={acceptedTypes}
          onChange={handleFileInput}
          style={{ display: 'none' }}
          disabled={isProcessing}
        />

        {isProcessing ? (
          <div className="processing-indicator">
            <div className="spinner"></div>
            <p>Analyzing PowerPoint presentation...</p>
            <p className="processing-note">Performing visual analysis - this may take up to 2 minutes</p>
          </div>
        ) : (
          <>
            <div className="upload-icon">📊</div>
            <h2>Upload PowerPoint Presentation</h2>
            <p>Drop your .pptx file here, or click to browse</p>
            <p className="file-types">Supports PowerPoint (.pptx) files only</p>
            <p className="file-size">Maximum file size: 10MB</p>
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
