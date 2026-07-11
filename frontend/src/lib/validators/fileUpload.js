/**
 * File upload validation utilities for frontend.
 */

class FileUploadError extends Error {
  constructor(message, code = null) {
    super(message)
    this.name = 'FileUploadError'
    this.code = code
  }
}

class FileUploadValidator {
  static MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10MB
  static MAX_DOCUMENT_SIZE = 25 * 1024 * 1024 // 25MB
  static MAX_VIDEO_SIZE = 100 * 1024 * 1024 // 100MB
  static MAX_AUDIO_SIZE = 50 * 1024 * 1024 // 50MB

  static ALLOWED_IMAGE_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/bmp'
  ]

  static ALLOWED_DOCUMENT_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv'
  ]

  static ALLOWED_VIDEO_TYPES = [
    'video/mp4',
    'video/webm',
    'video/quicktime'
  ]

  static ALLOWED_AUDIO_TYPES = [
    'audio/mpeg',
    'audio/wav',
    'audio/ogg'
  ]

  static getAllowedTypes() {
    return [
      ...this.ALLOWED_IMAGE_TYPES,
      ...this.ALLOWED_DOCUMENT_TYPES,
      ...this.ALLOWED_VIDEO_TYPES,
      ...this.ALLOWED_AUDIO_TYPES
    ]
  }

  static getMaxSizeForType(mimeType) {
    if (this.ALLOWED_IMAGE_TYPES.includes(mimeType)) {
      return this.MAX_IMAGE_SIZE
    } else if (this.ALLOWED_DOCUMENT_TYPES.includes(mimeType)) {
      return this.MAX_DOCUMENT_SIZE
    } else if (this.ALLOWED_VIDEO_TYPES.includes(mimeType)) {
      return this.MAX_VIDEO_SIZE
    } else if (this.ALLOWED_AUDIO_TYPES.includes(mimeType)) {
      return this.MAX_AUDIO_SIZE
    }
    return this.MAX_DOCUMENT_SIZE
  }

  static formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  static validateFileSize(file, mimeType) {
    const maxSize = this.getMaxSizeForType(mimeType)
    
    if (file.size === 0) {
      throw new FileUploadError('File is empty', 'EMPTY_FILE')
    }

    if (file.size > maxSize) {
      throw new FileUploadError(
        `File size ${this.formatFileSize(file.size)} exceeds maximum allowed size of ${this.formatFileSize(maxSize)}`,
        'FILE_TOO_LARGE'
      )
    }

    return true
  }

  static validateMimeType(mimeType) {
    const allAllowed = this.getAllowedTypes()

    if (!allAllowed.includes(mimeType)) {
      throw new FileUploadError(
        `File type '${mimeType}' is not allowed`,
        'INVALID_TYPE'
      )
    }

    return true
  }

  static validateFilename(filename) {
    if (!filename) {
      throw new FileUploadError('Filename cannot be empty', 'INVALID_FILENAME')
    }

    // Check for path traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      throw new FileUploadError('Filename contains invalid characters', 'INVALID_FILENAME')
    }

    // Check length
    if (filename.length > 255) {
      throw new FileUploadError('Filename too long (max 255 characters)', 'INVALID_FILENAME')
    }

    return true
  }

  static sanitizeFilename(filename) {
    // Remove path components
    let sanitized = filename.split('/').pop().split('\\').pop()

    // Remove null bytes
    sanitized = sanitized.replace(/\x00/g, '')

    // Remove dangerous characters
    const dangerousChars = ['..', ':', '*', '?', '"', '<', '>', '|']
    dangerousChars.forEach(char => {
      sanitized = sanitized.replace(new RegExp(`\\${char}`, 'g'), '')
    })

    // Limit length
    const name = sanitized.substring(0, 100)
    const ext = sanitized.split('.').pop()
    
    if (ext && name.includes('.')) {
      return name.substring(0, name.lastIndexOf('.')) + '.' + ext
    }

    return name
  }

  static async validateFile(file) {
    // Validate filename
    this.validateFilename(file.name)

    // Validate MIME type
    this.validateMimeType(file.type)

    // Validate file size
    this.validateFileSize(file, file.type)

    return {
      valid: true,
      sanitizedFilename: this.sanitizeFilename(file.name),
      mimeType: file.type,
      size: file.size
    }
  }

  static async calculateFileHash(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = async () => {
        try {
          const buffer = await crypto.subtle.digest('SHA-256', reader.result)
          const hashArray = Array.from(new Uint8Array(buffer))
          const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
          resolve(hashHex)
        } catch (error) {
          reject(new FileUploadError('Failed to calculate file hash', 'HASH_ERROR'))
        }
      }
      reader.onerror = () => reject(new FileUploadError('Failed to read file', 'READ_ERROR'))
      reader.readAsArrayBuffer(file)
    })
  }

  static getFileIcon(mimeType) {
    if (this.ALLOWED_IMAGE_TYPES.includes(mimeType)) {
      return 'image'
    } else if (this.ALLOWED_DOCUMENT_TYPES.includes(mimeType)) {
      return 'file-text'
    } else if (this.ALLOWED_VIDEO_TYPES.includes(mimeType)) {
      return 'video'
    } else if (this.ALLOWED_AUDIO_TYPES.includes(mimeType)) {
      return 'music'
    }
    return 'file'
  }
}

export { FileUploadValidator, FileUploadError }
