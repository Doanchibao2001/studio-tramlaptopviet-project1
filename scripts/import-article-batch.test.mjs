import assert from 'node:assert/strict'
import test from 'node:test'
import {assetReference, scheduledAt} from './import-article-batch.mjs'

test('maps Sanity CDN URLs to existing asset references', () => {
  assert.equal(
    assetReference('https://cdn.sanity.io/images/qnykgwoz/production/f0a6c9e22fa30bf626fecf330e56e9de5d802570-1280x426.jpg'),
    'image-f0a6c9e22fa30bf626fecf330e56e9de5d802570-1280x426-jpg',
  )
})

test('schedules ten articles in each Vietnam publishing slot', () => {
  assert.equal(scheduledAt('2026-07-23', 0), '2026-07-23T08:00:00+07:00')
  assert.equal(scheduledAt('2026-07-23', 9), '2026-07-23T08:00:00+07:00')
  assert.equal(scheduledAt('2026-07-23', 10), '2026-07-23T13:00:00+07:00')
  assert.equal(scheduledAt('2026-07-23', 20), '2026-07-23T19:00:00+07:00')
  assert.equal(scheduledAt('2026-07-23', 30), '2026-07-24T08:00:00+07:00')
})
