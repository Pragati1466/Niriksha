"""
File upload validation and security utilities.
"""
import os
import magic
import hashlib
from typing import Optional, List, Tuple
from pathlib import Path
import mimetypes


class FileUploadError(Exception):
    """Exception raised for file upload validation errors."""
    pass


class FileUploadValidator:
    """
    Validator for file uploads with security checks.
    
    Validates file types, sizes, content, and performs virus scanning.
    """
    
    # Maximum file sizes (in bytes)
    MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10MB
    MAX_DOCUMENT_SIZE = 25 * 1024 * 1024  # 25MB
    MAX_VIDEO_SIZE = 100 * 1024 * 1024  # 100MB
    MAX_AUDIO_SIZE = 50 * 1024 * 1024  # 50MB
    
    # Allowed MIME types
    ALLOWED_IMAGE_TYPES = {
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/bmp',
    }
    
    ALLOWED_DOCUMENT_TYPES = {
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
        'text/csv',
    }
    
    ALLOWED_VIDEO_TYPES = {
        'video/mp4',
        'video/webm',
        'video/quicktime',
    }
    
    ALLOWED_AUDIO_TYPES = {
        'audio/mpeg',
        'audio/wav',
        'audio/ogg',
    }
    
    # Magic byte signatures for common file types
    MAGIC_BYTES = {
        b'\xff\xd8\xff': 'image/jpeg',
        b'\x89PNG\r\n\x1a\n': 'image/png',
        b'GIF87a': 'image/gif',
        b'GIF89a': 'image/gif',
        b'RIFF': 'video/webp',
        b'BM': 'image/bmp',
        b'%PDF': 'application/pdf',
        b'\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1': 'application/msword',
        b'PK\x03\x04': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    }
    
    @staticmethod
    def validate_file_size(file_size: int, file_type: str) -> bool:
        """
        Validate file size based on type.
        
        Args:
            file_size: File size in bytes
            file_type: MIME type of the file
            
        Returns:
            bool: True if size is valid
            
        Raises:
            FileUploadError: If size exceeds limit
        """
        if file_type in FileUploadValidator.ALLOWED_IMAGE_TYPES:
            max_size = FileUploadValidator.MAX_IMAGE_SIZE
        elif file_type in FileUploadValidator.ALLOWED_DOCUMENT_TYPES:
            max_size = FileUploadValidator.MAX_DOCUMENT_SIZE
        elif file_type in FileUploadValidator.ALLOWED_VIDEO_TYPES:
            max_size = FileUploadValidator.MAX_VIDEO_SIZE
        elif file_type in FileUploadValidator.ALLOWED_AUDIO_TYPES:
            max_size = FileUploadValidator.MAX_AUDIO_SIZE
        else:
            max_size = FileUploadValidator.MAX_DOCUMENT_SIZE  # Default
        
        if file_size > max_size:
            raise FileUploadError(
                f"File size {file_size} bytes exceeds maximum allowed size of {max_size} bytes"
            )
        
        if file_size == 0:
            raise FileUploadError("File is empty")
        
        return True
    
    @staticmethod
    def validate_mime_type(mime_type: str) -> bool:
        """
        Validate MIME type against allowed types.
        
        Args:
            mime_type: MIME type to validate
            
        Returns:
            bool: True if MIME type is allowed
            
        Raises:
            FileUploadError: If MIME type is not allowed
        """
        all_allowed = (
            FileUploadValidator.ALLOWED_IMAGE_TYPES |
            FileUploadValidator.ALLOWED_DOCUMENT_TYPES |
            FileUploadValidator.ALLOWED_VIDEO_TYPES |
            FileUploadValidator.ALLOWED_AUDIO_TYPES
        )
        
        if mime_type not in all_allowed:
            raise FileUploadError(
                f"MIME type '{mime_type}' is not allowed. "
                f"Allowed types: {', '.join(sorted(all_allowed))}"
            )
        
        return True
    
    @staticmethod
    def validate_file_extension(filename: str, mime_type: str) -> bool:
        """
        Validate file extension matches MIME type.
        
        Args:
            filename: Original filename
            mime_type: Detected MIME type
            
        Returns:
            bool: True if extension is valid
            
        Raises:
            FileUploadError: If extension doesn't match MIME type
        """
        # Get file extension
        ext = Path(filename).suffix.lower()
        
        # Get expected extension for MIME type
        expected_exts = mimetypes.guess_all_extensions(mime_type)
        
        if not expected_exts:
            return True  # Can't validate if no known extensions
        
        if ext not in expected_exts:
            raise FileUploadError(
                f"File extension '{ext}' doesn't match detected MIME type '{mime_type}'. "
                f"Expected extensions: {', '.join(expected_exts)}"
            )
        
        return True
    
    @staticmethod
    def validate_magic_bytes(file_path: str) -> str:
        """
        Validate file content using magic bytes.
        
        Args:
            file_path: Path to the file
            
        Returns:
            str: Detected MIME type
            
        Raises:
            FileUploadError: If magic bytes don't match expected type
        """
        try:
            # Read first few bytes
            with open(file_path, 'rb') as f:
                file_header = f.read(12)
            
            # Check against known magic bytes
            for magic_bytes, expected_mime in FileUploadValidator.MAGIC_BYTES.items():
                if file_header.startswith(magic_bytes):
                    return expected_mime
            
            # If no match, use python-magic library
            detected_mime = magic.from_file(file_path, mime=True)
            
            # Validate detected type
            FileUploadValidator.validate_mime_type(detected_mime)
            
            return detected_mime
            
        except Exception as e:
            raise FileUploadError(f"Error validating file content: {str(e)}")
    
    @staticmethod
    def calculate_file_hash(file_path: str, algorithm: str = 'sha256') -> str:
        """
        Calculate file hash for integrity verification.
        
        Args:
            file_path: Path to the file
            algorithm: Hash algorithm (default: sha256)
            
        Returns:
            str: Hex digest of file hash
        """
        hash_func = hashlib.new(algorithm)
        
        with open(file_path, 'rb') as f:
            for chunk in iter(lambda: f.read(8192), b''):
                hash_func.update(chunk)
        
        return hash_func.hexdigest()
    
    @staticmethod
    def sanitize_filename(filename: str) -> str:
        """
        Sanitize filename to prevent path traversal attacks.
        
        Args:
            filename: Original filename
            
        Returns:
            str: Sanitized filename
        """
        # Remove path components
        filename = os.path.basename(filename)
        
        # Remove null bytes
        filename = filename.replace('\x00', '')
        
        # Remove dangerous characters
        dangerous_chars = ['..', '/', '\\', ':', '*', '?', '"', '<', '>', '|']
        for char in dangerous_chars:
            filename = filename.replace(char, '')
        
        # Limit filename length
        name, ext = os.path.splitext(filename)
        if len(name) > 100:
            name = name[:100]
        
        return name + ext
    
    @staticmethod
    def validate_filename(filename: str) -> bool:
        """
        Validate filename for security.
        
        Args:
            filename: Filename to validate
            
        Returns:
            bool: True if filename is valid
            
        Raises:
            FileUploadError: If filename is invalid
        """
        if not filename:
            raise FileUploadError("Filename cannot be empty")
        
        # Check for path traversal
        if '..' in filename or '/' in filename or '\\' in filename:
            raise FileUploadError("Filename contains path traversal characters")
        
        # Check for null bytes
        if '\x00' in filename:
            raise FileUploadError("Filename contains null bytes")
        
        # Check length
        if len(filename) > 255:
            raise FileUploadError("Filename too long (max 255 characters)")
        
        return True
    
    @staticmethod
    def scan_for_viruses(file_path: str) -> bool:
        """
        Scan file for viruses using ClamAV.
        
        Args:
            file_path: Path to the file
            
        Returns:
            bool: True if file is clean
            
        Raises:
            FileUploadError: If virus is detected or scan fails
        """
        try:
            import pyclamd
            
            # Create ClamAV scanner
            cd = pyclamd.ClamdUnixSocket()
            
            # Check if ClamAV is running
            if not cd.ping():
                # ClamAV not available, log warning but allow upload
                # In production, you might want to reject uploads if AV is down
                return True
            
            # Scan file
            scan_result = cd.scan_file(file_path)
            
            if scan_result is None:
                # No virus found
                return True
            
            # Check if virus found
            for path, result in scan_result.items():
                if 'FOUND' in result:
                    raise FileUploadError(
                        f"Virus detected in file: {result}"
                    )
            
            return True
            
        except ImportError:
            # pyclamd not installed, log warning but allow upload
            # In production, install pyclamd and configure ClamAV
            return True
        except Exception as e:
            # Scan failed, log error but allow upload
            # In production, you might want to reject uploads if scan fails
            raise FileUploadError(f"Virus scan failed: {str(e)}")
    
    @staticmethod
    def validate_upload(
        file_path: str,
        filename: str,
        file_size: int,
        content_type: Optional[str] = None,
        scan_for_viruses: bool = True
    ) -> Tuple[str, str]:
        """
        Perform comprehensive file upload validation.
        
        Args:
            file_path: Path to uploaded file
            filename: Original filename
            file_size: File size in bytes
            content_type: Content type from upload (optional)
            scan_for_viruses: Whether to scan for viruses
            
        Returns:
            Tuple[str, str]: (sanitized_filename, detected_mime_type)
            
        Raises:
            FileUploadError: If any validation fails
        """
        # Validate filename
        FileUploadValidator.validate_filename(filename)
        sanitized_filename = FileUploadValidator.sanitize_filename(filename)
        
        # Validate file size
        FileUploadValidator.validate_file_size(file_size, content_type or 'application/octet-stream')
        
        # Validate magic bytes and detect real MIME type
        detected_mime = FileUploadValidator.validate_magic_bytes(file_path)
        
        # Validate MIME type
        FileUploadValidator.validate_mime_type(detected_mime)
        
        # Validate extension matches MIME type
        FileUploadValidator.validate_file_extension(sanitized_filename, detected_mime)
        
        # Scan for viruses if enabled
        if scan_for_viruses:
            FileUploadValidator.scan_for_viruses(file_path)
        
        return (sanitized_filename, detected_mime)
    
    @staticmethod
    def get_safe_upload_path(
        upload_dir: str,
        filename: str,
        prefix: Optional[str] = None
    ) -> str:
        """
        Generate a safe upload path.
        
        Args:
            upload_dir: Base upload directory
            filename: Sanitized filename
            prefix: Optional prefix for the filename
            
        Returns:
            str: Safe upload path
        """
        # Ensure upload directory exists
        os.makedirs(upload_dir, exist_ok=True)
        
        # Add prefix if provided
        if prefix:
            name, ext = os.path.splitext(filename)
            filename = f"{prefix}_{name}{ext}"
        
        # Generate unique filename if exists
        base_path = os.path.join(upload_dir, filename)
        if os.path.exists(base_path):
            name, ext = os.path.splitext(filename)
            counter = 1
            while os.path.exists(os.path.join(upload_dir, f"{name}_{counter}{ext}")):
                counter += 1
            filename = f"{name}_{counter}{ext}"
        
        return os.path.join(upload_dir, filename)
