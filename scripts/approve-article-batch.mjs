#!/usr/bin/env node
/* global URLSearchParams, console, fetch, process */
import {readFile} from 'node:fs/promises'

const PROJECT_ID = process.env.SANITY_PROJECT_ID || 'qnykgwoz'
const DATASET = process.env.SANITY_DATASET || 'production'
const API_VERSION = '2026-07-22'
const FALLBACK_ASSET = 'image-f0a6c9e22fa30bf626fecf330e56e9de5d802570-1280x426-jpg'

async function sanityRequest(route, {method = 'GET', body} = {}) {
  const token = process.env.SANITY_AUTH_TOKEN
  if (!token) throw new Error('SANITY_AUTH_TOKEN is required')
  const response = await fetch(`https://${PROJECT_ID}.api.sanity.io/v${API_VERSION}${route}`, {
    method,
    headers: {Authorization: `Bearer ${token}`, ...(body ? {'Content-Type': 'application/json'} : {})},
    body: body ? JSON.stringify(body) : undefined,
  })
  const result = await response.json()
  if (!response.ok) throw new Error(`Sanity API ${response.status}: ${JSON.stringify(result)}`)
  return result
}

async function query(groq, params = {}) {
  const search = new URLSearchParams({query: groq})
  for (const [key, value] of Object.entries(params)) search.set(`$${key}`, JSON.stringify(value))
  return (await sanityRequest(`/data/query/${DATASET}?${search}`)).result
}

async function mutateInChunks(mutations, size = 40) {
  let transactions = 0
  for (let index = 0; index < mutations.length; index += size) {
    await sanityRequest(`/data/mutate/${DATASET}?returnIds=true&visibility=sync`, {method: 'POST', body: {mutations: mutations.slice(index, index + size)}})
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

  const slugs = payload.rows.map((row) => row.slug)
  const drafts = await query(
    '*[_type == "article" && _id in path("drafts.**") && slug.current in $slugs]{_id,"slug":slug.current,scheduledAt,"hasCover":defined(coverImage.asset._ref),"hasSeoImage":defined(seo.image.asset._ref)}',
    {slugs},
  )
  if (drafts.length !== 326) throw new Error(`Expected 326 imported drafts, found ${drafts.length}`)
  const missingSchedule = drafts.filter((draft) => !draft.scheduledAt)
  if (missingSchedule.length) throw new Error(`${missingSchedule.length} drafts are missing scheduledAt`)
  const fallbackImage = {_type: 'image', asset: {_type: 'reference', _ref: FALLBACK_ASSET}, alt: 'Dịch vụ kiểm tra và sửa chữa laptop tại Trạm Laptop Việt'}
  const mutations = drafts.map((draft) => ({
    patch: {
      id: draft._id,
      set: {
        workflowStatus: 'approved',
        approvalNote: 'Chủ thương hiệu xác nhận batch 330 bài đã được duyệt ngày 22/07/2026. Bài tự xuất bản theo lịch 08:00, 13:00 và 19:00.',
      },
      setIfMissing: {
        coverImage: fallbackImage,
        'seo.image': fallbackImage,
      },
    },
  }))
  console.log(JSON.stringify({event: 'batch_approval_validated', drafts: drafts.length, missingCoverImages: drafts.filter((draft) => !draft.hasCover).length, missingSeoImages: drafts.filter((draft) => !draft.hasSeoImage).length, dryRun}))
  if (dryRun) return
  const transactions = await mutateInChunks(mutations)
  const approvedCount = await query('count(*[_type == "article" && _id in path("drafts.**") && slug.current in $slugs && workflowStatus == "approved" && defined(scheduledAt) && defined(coverImage.asset._ref)])', {slugs})
  if (approvedCount !== 326) throw new Error(`Approval verification failed: expected 326, found ${approvedCount}`)
  console.log(JSON.stringify({event: 'batch_approval_completed', approvedDrafts: approvedCount, transactions}))
}

main().catch((error) => {
  console.error(JSON.stringify({event: 'batch_approval_failed', message: error.message}))
  process.exitCode = 1
})
