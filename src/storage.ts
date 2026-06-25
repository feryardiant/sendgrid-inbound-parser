import type { Bucket, File } from '@google-cloud/storage'
import type { Attachment } from 'mailparser'
import { extname } from 'node:path'
import { extension } from 'mime-types'

/**
 * Store the attachment file to google storage bucket.
 */
export function storeAttachment(attachment: Attachment, bucket: Bucket): Promise<File> {
  const file = bucket.file(`attachments/${getFilename(attachment)}`)

  const stream = file.createWriteStream({
    public: true,
    metadata: {
      contentType: attachment.contentType,
    },
  })

  return new Promise((resolve, reject) => {
    stream.on('error', (err) => {
      reject(err)
    })

    stream.on('finish', () => {
      resolve(file)
    })

    stream.end(attachment.content)
  })
}

function getFilename(attachment: Attachment): string {
  const ext = attachment.filename
    ? extname(attachment.filename).toLowerCase()
    : extension(attachment.contentType)

  return `${attachment.checksum}${ext}`
}
