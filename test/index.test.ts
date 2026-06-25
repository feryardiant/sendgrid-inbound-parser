import { inboundParser } from '@feryardiant/sendgrid-inbound-parser'
import type { Express } from 'express'
import express from 'express'
import request from 'supertest'
import { beforeEach, describe, expect, it } from 'vitest'

import { createFixtures } from './fixtures'

describe('integration', () => {
  let app: Express
  const fixtures = createFixtures()

  beforeEach(() => {
    app = express()

    app.all('/', inboundParser(), (req, res) => {
      const ret: { ok: boolean; parsed?: Omit<typeof req.body, 'headers'> } = {
        ok: true,
      }

      if (req.body) {
        ret.parsed = req.body
      }

      res.json(ret)
    })
  })

  it('should not have email body', async () => {
    const res = await request(app).get('/')

    expect(res.status).equal(200)
    expect(res.body.ok).equal(true)
    expect(res.body.parsed).toBeUndefined()
  })

  for (const [key, fixture] of Object.entries(fixtures)) {
    it(`should parse "${key}"`, async () => {
      const keys = [
        'dkim',
        'subject',
        'SPF',
        'sender_ip',
        'spam_report',
        'spam_score',
      ]
      const input: Record<string, any> = {
        email: fixture.raw,
      }

      for (const key of keys) {
        input[key] = fixture.parsed[key]
      }

      const res = await request(app)
        .post('/')
        .set('Content-Type', 'multipart/form-data')
        .field(input)

      expect(res.status).equal(200)
      expect(res.body.ok).equal(true)
      expect(res.body.parsed).has.keys(Object.keys(input))

      for (const [key, value] of Object.entries(fixture.normalized.email)) {
        if (['headers', 'attachments'].includes(key)) continue

        const { email } = res.body.parsed

        expect(email[key]).toEqual(value)
      }
    })
  }
})
