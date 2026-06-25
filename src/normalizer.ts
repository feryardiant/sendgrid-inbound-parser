import type {
  AddressObject,
  Attachment,
  EmailAddress,
  Headers,
  MessageText,
  ParsedMail,
} from 'mailparser'

export interface Envelope extends Record<string, any> {
  from: EmailAddress
  to: EmailAddress[]
  cc?: EmailAddress[]
  bcc?: EmailAddress[]
  replyTo?: EmailAddress | EmailAddress[]
}

export interface NormalizedMail extends Record<string, any> {
  headers: Map<string, any>
  date: Date
  // headerLines: HeaderLines
  attachments: Attachment[]
  messageId: string
  subject: string
  topic?: string
  references: string[]
  inReplyTo?: string
  envelope: Envelope
  message: Record<keyof MessageText | string, string>
}

export type { Attachment, EmailAddress, Headers, MessageText, ParsedMail }

/**
 * Normalize parsed-mail from 'mailparser' package
 */
export function normalize(
  email: ParsedMail & Record<string, any>,
): NormalizedMail {
  const normalized: NormalizedMail = {
    headers: new Map<string, any>(),
    date: email.date as Date,
    attachments: email.attachments,
    messageId: email.messageId as string,
    subject: email.subject as string,
    topic: normalizeTopic(email),
    references: normalizeReferences(email.references),
    envelope: {
      from: email.from?.value[0] as EmailAddress,
      to: normalizeAddress(email.to) as EmailAddress[],
    },
    message: {},
  }

  email.headers.forEach((value, key) => {
    normalized.headers.set(key, value)
  })

  const participants = ['cc', 'bcc', 'replyTo']
  const messages = ['html', 'text', 'textAsHtml']

  for (const key of ['inReplyTo', ...participants, ...messages]) {
    if (!email[key]) continue

    if (participants.includes(key)) {
      normalized.envelope[key] = normalizeAddress(email[key])
      continue
    }

    if (messages.includes(key)) {
      normalized.message[key] = email[key]
      continue
    }

    normalized[key] = email[key]
  }

  return normalized
}

function normalizeTopic(email: ParsedMail): string | undefined {
  if ('topic' in email) {
    // Gmail and Outlook
    return email.topic as string
  }

  if (email.headers.has('thread-topic')) {
    // Outlook only
    return email.headers.get('thread-topic')?.toString()
  }

  if (email.subject?.toLowerCase().startsWith('re: ')) {
    // Yahoo
    return email.subject.slice(4)
  }

  return email.subject
}

function normalizeAddress(recipient?: AddressObject | AddressObject[]) {
  if (typeof recipient === 'undefined') return undefined

  const address: AddressObject[] = Array.isArray(recipient)
    ? recipient
    : [recipient]

  return address.reduce((res, addr) => {
    res.push(...addr.value)

    return res
  }, [] as EmailAddress[])
}

function normalizeReferences(refs?: string | string[]) {
  if (!refs) return []

  const references = Array.isArray(refs) ? refs : refs.split(',')

  return references
    .reduce((arr, ref) => {
      arr.push(...ref.split(','))
      return arr.filter((ref) => !ref.includes('.ref@mail.yahoo.com'))
    }, [] as string[])
    .filter((ref) => ref.length > 0)
}
