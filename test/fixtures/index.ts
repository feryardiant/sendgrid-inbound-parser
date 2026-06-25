import { globSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { ParsedMail } from 'mailparser'

export type Provider = 'gmail' | 'outlook' | 'yahoo'

export const providers: Provider[] = ['gmail', 'outlook', 'yahoo']

export async function fixture(provider: Provider) {
  const raw = readFileSync(resolve(`./${provider}.raw.txt`))
  const { email: parsed, ...body } = await import(`./${provider}.parsed.json`)
  const { email: normalized } = await import(`./${provider}.normalized.json`)

  return {
    email: { raw, parsed, normalized },
    body,
  }
}

export interface Fixture {
  raw: string
  normalized: Record<string, any>
  parsed: {
    email: ParsedMail
    [key: string]: any
  }
}

export function createFixtures() {
  const fixtures: Record<string, Fixture> = {}

  for (const filename of globSync('./*.{raw,normalized,parsed}.*', {
    cwd: import.meta.dirname,
  })) {
    const filepath = resolve(import.meta.dirname, filename)
    const [name, type, ext] = filename.split('.') as [
      string,
      keyof Fixture,
      'json' | 'txt',
    ]
    const content = readFileSync(filepath, 'utf8')

    fixtures[name] = fixtures[name] || {}

    if (type === 'raw' && ext === 'txt') {
      fixtures[name][type] = content
      continue
    }

    const obj = JSON.parse(content)
    // const headers = new Map()

    // for (const [key, value] of Object.entries(obj.email.headers)) {
    //   headers.set(key, value as string)
    // }

    // obj.email.headers = headers

    fixtures[name][type] = obj
  }

  return fixtures
}
