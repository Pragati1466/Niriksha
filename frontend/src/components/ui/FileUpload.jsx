import React, { useState, useCallback, useRef } from 'react'
import { Upload, X, File, AlertCircle, CheckCircle, Loader2, Camera, Image as ImageIcon, ZoomIn } from 'lucide-react'
import { FileUploadValidator, FileUploadError } from '../../lib/validators/fileUpload'
import api from '../../lib/api'
import Button from './Button'
import Badge from './Badge'

const FileUpload = ({
  onUploadComplete,
  onUploadError,
  acceptedTypes = [],
  maxSize = null,
  multiple = false,
  inspectionId = null,
  disabled = false,
  enableCamera = false
}) => {
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState({})
  const [validationErrors, setValidationErrors] = useState({})
  const [previewImage, setPreviewImage] = useState(null)
  const cameraInputRef = useRef(null)
  const fileInputRef = useRef(null)

  const handleFileSelect = useCallback(async (selectedFiles) => {
    const newFiles = []
    const newErrors = {}

    for (const file of selectedFiles) {
      try {
        const validation = await FileUploadValidator.validateFile(file)
        newFiles.push({
          id: Math.random().toString(36).substring(7),
          file,
          ...validation,
          status: 'pending'
        })
      } catch (error) {
        newErrors[file.name] = error.message
      }
    }

    setValidationErrors(newErrors)
    setFiles(prev => [...prev, ...newFiles])
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    const selectedFiles = Array.from(e.dataTransfer.files)
    handleFileSelect(selectedFiles)
  }, [handleFileSelect])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleInputChange = useCallback((e) => {
    const selectedFiles = Array.from(e.target.files)
    handleFileSelect(selectedFiles)
  }, [handleFileSelect])

  const handleCameraCapture = useCallback((e) => {
    const selectedFiles = Array.from(e.target.files)
    handleFileSelect(selectedFiles)
  }, [handleFileSelect])

  const openCamera = useCallback(() => {
    cameraInputRef.current?.click()
  }, [])

  const openFileSelector = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const removeFile = useCallback((fileId) => {
    setFiles(prev => prev.filter(f => f.id !== fileId))
    setValidationErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[fileId]
      return newErrors
    })
  }, [])

  const uploadFiles = useCallback(async () => {
    setUploading(true)
    const results = []

    for (const fileData of files) {
      if (fileData.status !== 'pending') continue

      try {
        setUploadProgress(prev => ({ ...prev, [fileData.id]: 0 }))

        const formData = new FormData()
        formData.append('file', fileData.file)
        formData.append('filename', fileData.sanitizedFilename)
        if (inspectionId) {
          formData.append('inspection_id', inspectionId)
        }

        const response = await api.post('/evidence/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (progressEvent) => {
            const progress = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            )
            setUploadProgress(prev => ({ ...prev, [fileData.id]: progress }))
          }
        })

        setFiles(prev => prev.map(f => 
          f.id === fileData.id 
            ? { ...f, status: 'completed', serverData: response.data }
            : f
        ))

        results.push({ success: true, file: fileData, data: response.data })

        if (onUploadComplete) {
          onUploadComplete(response.data)
        }
      } catch (error) {
        setFiles(prev => prev.map(f => 
          f.id === fileData.id 
            ? { ...f, status: 'error', error: error.message }
            : f
        ))

        if (onUploadError) {
          onUploadError(error, fileData)
        }
      }
    }

    setUploading(false)
    return results
  }, [files, inspectionId, onUploadComplete, onUploadError])

  const getFileIcon = (mimeType) => {
    return FileUploadValidator.getFileIcon(mimeType)
  }

  const isImageFile = (mimeType) => {
    return mimeType.startsWith('image/')
  }

  const handlePreview = (fileData) => {
    if (isImageFile(fileData.mimeType)) {
      const reader = new FileReader()
      reader.onload = (e) => setPreviewImage(e.target.result)
      reader.readAsDataURL(fileData.file)
    }
  }

  const closePreview = () => {
    setPreviewImage(null)
  }

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          disabled 
            ? 'border-border bg-muted/50 cursor-not-allowed' 
            : 'border-border hover:border-primary/50 cursor-pointer'
        }`}
        onDrop={disabled ? undefined : handleDrop}
        onDragOver={disabled ? undefined : handleDragOver}
      >
        <input
          type="file"
          multiple={multiple}
          accept={acceptedTypes.join(',')}
          onChange={handleInputChange}
          disabled={disabled || uploading}
          className="hidden"
          id="file-upload"
          ref={fileInputRef}
        />
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleCameraCapture}
          disabled={disabled || uploading}
          className="hidden"
          id="camera-upload"
          ref={cameraInputRef}
        />
        <div className="flex flex-col items-center gap-4">
          <div className="flex gap-4">
            <button
              type="button"
              onClick={openFileSelector}
              disabled={disabled || uploading}
              className="flex flex-col items-center gap-2 p-4 hover:bg-accent rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload className="w-12 h-12 text-muted-foreground" />
              <span className="text-sm font-medium">Upload Files</span>
            </button>
            {enableCamera && (
              <button
                type="button"
                onClick={openCamera}
                disabled={disabled || uploading}
                className="flex flex-col items-center gap-2 p-4 hover:bg-accent rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Camera className="w-12 h-12 text-muted-foreground" />
                <span className="text-sm font-medium">Camera</span>
              </button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {acceptedTypes.length > 0 
              ? `Accepted: ${acceptedTypes.join(', ')}`
              : 'All file types accepted'}
          </p>
          {maxSize && (
            <p className="text-xs text-muted-foreground">
              Max size: {FileUploadValidator.formatFileSize(maxSize)}
            </p>
          )}
        </div>
      </div>

      {/* Validation Errors */}
      {Object.keys(validationErrors).length > 0 && (
        <div className="space-y-2">
          {Object.entries(validationErrors).map(([filename, error]) => (
            <div key={filename} className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="w-4 h-4" />
              <span>{filename}: {error}</span>
            </div>
          ))}
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map(fileData => (
            <div
              key={fileData.id}
              className="flex items-center justify-between p-3 border border-border rounded-lg bg-background"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {isImageFile(fileData.mimeType) ? (
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    <img
                      src={URL.createObjectURL(fileData.file)}
                      alt={fileData.sanitizedFilename}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <File className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {fileData.sanitizedFilename}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {FileUploadValidator.formatFileSize(fileData.size)} • {fileData.mimeType}
                  </p>
                  {uploadProgress[fileData.id] !== undefined && (
                    <div className="mt-2">
                      <div className="w-full bg-muted rounded-full h-1.5">
                        <div
                          className="bg-primary h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress[fileData.id]}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {uploadProgress[fileData.id]}%
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {fileData.status === 'pending' && (
                  <Badge variant="secondary">Pending</Badge>
                )}
                {fileData.status === 'uploading' && (
                  <Badge variant="secondary">
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    Uploading
                  </Badge>
                )}
                {fileData.status === 'completed' && (
                  <Badge variant="success">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Uploaded
                  </Badge>
                )}
                {fileData.status === 'error' && (
                  <Badge variant="error">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Error
                  </Badge>
                )}
                {isImageFile(fileData.mimeType) && (
                  <button
                    onClick={() => handlePreview(fileData)}
                    className="p-1 hover:bg-accent rounded transition-colors"
                    title="Preview"
                  >
                    <ZoomIn className="w-4 h-4 text-muted-foreground" />
                  </button>
                )}
                {!uploading && (
                  <button
                    onClick={() => removeFile(fileData.id)}
                    className="p-1 hover:bg-accent rounded transition-colors"
                    title="Remove"
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={closePreview}
              className="absolute -top-12 right-0 p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={previewImage}
              alt="Preview"
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
            />
          </div>
        </div>
      )}

      {/* Upload Button */}
      {files.some(f => f.status === 'pending') && !uploading && (
        <Button onClick={uploadFiles} disabled={disabled}>
          <Upload className="w-4 h-4 mr-2" />
          Upload {files.filter(f => f.status === 'pending').length} File(s)
        </Button>
      )}
    </div>
  )
}

export default FileUpload
