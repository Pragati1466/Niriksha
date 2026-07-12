import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
})

const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'niriksha-inspections'

export async function uploadToS3(
  key: string,
  body: Buffer,
  contentType: string
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: body,
    ContentType: contentType,
  })

  await s3Client.send(command)
  return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`
}

export async function deleteFromS3(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  })

  await s3Client.send(command)
}

export async function getS3Url(key: string): Promise<string> {
  return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`
}

export function generateS3Key(inspectionId: string, imageId: string, originalName: string): string {
  const timestamp = Date.now()
  const extension = originalName.split('.').pop()
  return `inspections/${inspectionId}/${imageId}-${timestamp}.${extension}`
}
