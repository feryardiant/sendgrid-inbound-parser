import type { IncomingMessage } from 'node:http'
import type { BusboyEvents } from 'busboy'
import busboy from 'busboy'
import { simpleParser } from 'mailparser'
import type { NormalizedMail } from './normalizer'
import { normalize } from './normalizer'

export interface ParsedEmail extends Record<string, any> {
  email: NormalizedMail
}

/**
 * Parse email field in inbound mail body.
 */
export async function parseEmail(
  req: IncomingMessage,
  field: string = 'email',
) {
  const parsed = await parse(req)
  const result: Record<string, any> = {}

  for (const [key, value] of Object.entries(parsed)) {
    if (key !== field) {
      result[key] = value
      continue
    }

    const email = await simpleParser(value)

    result[key] = normalize(email)
  }

  return result as ParsedEmail
}

/**
 * Parse inbound mail body.
 */
function parse(req: IncomingMessage): Promise<Record<string, any>> {
  const bb = busboy({ headers: req.headers })
  const body: Record<string, any> = {}

  const onField: BusboyEvents['field'] = (field, value) => {
    body[field] = value
  }

  const onFile: BusboyEvents['file'] = (filename, _, info) => {
    body.attachments.push({ filename, info })
  }

  const cleanUp = () => {
    bb.off('field', onField)
    bb.off('file', onFile)
  }

  return new Promise((resolve, reject) => {
    bb.on('field', onField)
    bb.on('file', onFile)

    bb.on('error', (error) => {
      cleanUp()
      reject(error)
    })

    bb.on('finish', () => {
      cleanUp()
      resolve(body)
    })

    req.pipe(bb)
  })
}
