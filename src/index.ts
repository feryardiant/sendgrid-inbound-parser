import type { RequestHandler } from 'express'
import type { ParsedEmail } from './parser'
import { parseEmail } from './parser'

export * from './normalizer'
export * from './parser'

export interface Options {
  field: string
}

const defaultOptions: Options = {
  field: 'email',
}

/**
 * Express middleware to parse request body.
 */
export function inboundParser(
  options: Options = defaultOptions,
): RequestHandler<any, any, ParsedEmail> {
  const { field } = { ...defaultOptions, ...options }

  return (req, _, next) => {
    if (req.method !== 'POST') return next()

    parseEmail(req, field)
      .then((parsed) => {
        req.body = parsed
        next()
      })
      .catch((err) => {
        next(err)
      })
  }
}
