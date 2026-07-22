#!/usr/bin/env node
/* global URLSearchParams, console, fetch, process */
import {createHash} from 'node:crypto'
import {readFile} from 'node:fs/promises'
import path from 'node:path'

const PROJECT_ID = process.env.SANITY_PROJECT_ID || 'qnykgwoz'
const DATASET = process.env.SANITY_DATASET || 'production'
const API_VERSION = '2026-07-22'
const BANNERS = [
  'scripts/assets/TLV_Hiflex_4x1.2m_DUYET_v01.png',
  'scripts/assets/TLV_Banner_FacebookCover_DUYET_v03.png',
]

async function sanityRequest(route, {method = 'GET', body, contentType} = {}) {
  const token = process.env.SANITY_AUTH_TOKEN
  if (!token) throw new Error('SANITY_AUTH_TOKEN is required')
  const response = await fetch(`https://${PROJECT_ID}.api.sanity.io/v${API_VERSION}${route}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? {'Content-Type': contentType || 'application/json'} : {}),
    },
    body: body && contentType === 'application/json' ? JSON.stringify(body) : body,
  })
  const result = await response.json()
  if (!response.ok) throw new Error(`Sanity API ${response.status}: ${JSON.stringify(result)}`)
  return result
}

async function query(groq, params = {}) {
  const search = new URLSearchParams({query: groq, perspective: 'raw'})
  for (const [key, value] of Object.entries(params)) search.set(`$${key}`, JSON.stringify(value))
  return (await sanityRequest(`/data/query/${DATASET}?${search}`)).result
}

async function uploadBanner(filename) {
  const bytes = await readFile(filename)
  const digest = createHash('sha256').update(bytes).digest('hex')
  const result = await sanityRequest(
    `/assets/images/${DATASET}?filename=${encodeURIComponent(path.basename(filename))}`,
    {method: 'POST', body: bytes, contentType: 'image/png'},
  )
  return {assetId: result.document._id, digest}
}

async function mutateInChunks(mutations, size = 40) {
  let transactions = 0
  for (let index = 0; index < mutations.length; index += size) {
    await sanityRequest(`/data/mutate/${DATASET}?returnIds=true&visibility=sync`, {
      method: 'POST',
      body: {mutations: mutations.slice(index, index + size)},
      contentType: 'application/json',
    })
    transactions += 1
  }
  return transactions
}

async function main() {
  const inputIndex = process.argv.indexOf('--input')
  if (inputIndex < 0 || !process.argv[inputIndex + 1]) throw new Error('--input is required')
  const dryRun = process.argv.includes('--dry-run')
  const payload = JSON.parse(await readFile(process.argv[inputIndex + 1], 'utf8'))
  if (!Array.isArray(payload.rows) || payload.rows.length !== 330) throw new Error('Expected exactly 330 batch rows')

  const rowsBySlug = new Map(payload.rows.map((row) => [row.slug, row]))
  const slugs = [...rowsBySlug.keys()]
  const drafts = await query(
    '*[_type == "article" && _id in path("drafts.**") && slug.current in $slugs]{_id,"slug":slug.current,workflowStatus,scheduledAt}',
    {slugs},
  )
  if (drafts.length !== 326) throw new Error(`Expected 326 imported drafts, found ${drafts.length}`)
  const invalid = drafts.filter((draft) => draft.workflowStatus !== 'approved' || !draft.scheduledAt)
  if (invalid.length) throw new Error(`${invalid.length} drafts are not approved and scheduled`)

  console.log(JSON.stringify({event: 'batch_image_replacement_validated', drafts: drafts.length, banners: BANNERS, dryRun}))
  if (dryRun) return

  const assets = []
  for (const banner of BANNERS) assets.push(await uploadBanner(banner))
  const mutations = drafts.map((draft, index) => {
    const row = rowsBySlug.get(draft.slug)
    const asset = assets[index % assets.length]
    const image = {
      _type: 'image',
      asset: {_type: 'reference', _ref: asset.assetId},
      alt: row.imageAlt || `${row.title} - Trạm Laptop Việt`,
    }
    return {
      patch: {
        id: draft._id,
        set: {
          coverImage: image,
          'seo.image': image,
          approvalNote: 'Đã duyệt nội dung và thay ảnh bài viết bằng banner thương hiệu từ Google Drive ngày 22/07/2026. Giữ nguyên lịch tự xuất bản.',
        },
      },
    }
  })
  const transactions = await mutateInChunks(mutations)
  const assetIds = assets.map((asset) => asset.assetId)
  const verified = await query(
    'count(*[_type == "article" && _id in path("drafts.**") && slug.current in $slugs && coverImage.asset._ref in $assetIds && seo.image.asset._ref in $assetIds])',
    {slugs, assetIds},
  )
  if (verified !== 326) throw new Error(`Image replacement verification failed: expected 326, found ${verified}`)
  console.log(JSON.stringify({event: 'batch_image_replacement_completed', drafts: verified, assets, transactions}))
}

main().catch((error) => {
  console.error(JSON.stringify({event: 'batch_image_replacement_failed', message: error.message}))
  process.exitCode = 1
})
