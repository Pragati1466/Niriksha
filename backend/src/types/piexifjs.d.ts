declare module 'piexifjs' {
  interface ExifData {
    '0th'?: Record<string, any>
    'Exif'?: Record<string, any>
    'GPS'?: Record<string, any>
    'Interop'?: Record<string, any>
    '1st'?: Record<string, any>
    'thumbnail'?: Uint8Array | null
  }

  export function load(data: string): ExifData
  export function dump(exifData: ExifData): string
  export function insert(exifData: ExifData, jpegData: string): string
  export function remove(jpegData: string): string

  export const ImageIFD: {
    Software: number
    ImageDescription: number
    Make: number
    Model: number
    Orientation: number
    XResolution: number
    YResolution: number
    ResolutionUnit: number
    DateTime: number
    Artist: number
    Copyright: number
  }

  export const ExifIFD: {
    DateTimeOriginal: number
    DateTimeDigitized: number
    ExposureTime: number
    FNumber: number
    ExposureProgram: number
    ISOSpeedRatings: number
    ShutterSpeedValue: number
    ApertureValue: number
    BrightnessValue: number
    ExposureBiasValue: number
    MaxApertureValue: number
    SubjectDistance: number
    MeteringMode: number
    LightSource: number
    Flash: number
    FocalLength: number
    MakerNote: number
    UserComment: number
    SubsecTime: number
    SubsecTimeOriginal: number
    SubsecTimeDigitized: number
    FlashpixVersion: number
    ColorSpace: number
    PixelXDimension: number
    PixelYDimension: number
    Interoperability: number
  }

  export const GPSIFD: {
    GPSLatitudeRef: number
    GPSLatitude: number
    GPSLongitudeRef: number
    GPSLongitude: number
    GPSAltitudeRef: number
    GPSAltitude: number
    GPSTimeStamp: number
    GPSSatellites: number
    GPSStatus: number
    GPSMeasureMode: number
    GPSDOP: number
    GPSSpeedRef: number
    GPSSpeed: number
    GPSTrackRef: number
    GPSTrack: number
    GPSImgDirectionRef: number
    GPSImgDirection: number
    GPSMapDatum: number
    GPSDestLatitudeRef: number
    GPSDestLatitude: number
    GPSDestLongitudeRef: number
    GPSDestLongitude: number
    GPSDestBearingRef: number
    GPSDestBearing: number
    GPSDestDistanceRef: number
    GPSDestDistance: number
    GPSProcessingMethod: number
    GPSAreaInformation: number
    GPSDateStamp: number
    GPSDifferential: number
  }

  export const TagValues: any
  export const GPSHelper: any
}