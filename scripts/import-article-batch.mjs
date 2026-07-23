#!/usr/bin/env node
/* global URLSearchParams, console, fetch, process */
import {readFile} from 'node:fs/promises'
import {markdownToBlocks, stableDocumentId} from './lib/article-input.mjs'

const PROJECT_ID = process.env.SANITY_PROJECT_ID || 'qnykgwoz'
const DATASET = process.env.SANITY_DATASET || 'production'
const API_VERSION = '2026-07-22'

function parseArgs(argv) {
  const result = {dryRun: false, startDate: '2026-07-23'}
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]
    if (argument === '--dry-run') result.dryRun = true
    else if (argument === '--input') result.input = argv[++index]
    else if (argument === '--start-date') result.startDate = argv[++index]
    else throw new Error(`Unknown argument: ${argument}`)
  }
  if (!result.input) throw new Error('Usage: node scripts/import-article-batch.mjs --input <batch.json> [--start-date YYYY-MM-DD] [--dry-run]')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(result.startDate)) throw new Error('start-date must use YYYY-MM-DD')
  return result
}

function log(event, details = {}) {
  console.log(JSON.stringify({time: new Date().toISOString(), event, ...details}))
}

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

export function assetReference(url) {
  if (!url) return null
  const match = /\/production\/([a-f0-9]+)-(\d+x\d+)\.(jpg|jpeg|png|webp)(?:\?|$)/i.exec(url)
  if (!match) throw new Error(`Unsupported Sanity image URL: ${url}`)
  const extension = match[3].toLowerCase() === 'jpeg' ? 'jpg' : match[3].toLowerCase()
  return `image-${match[1]}-${match[2]}-${extension}`
}

function imageValue(url, alt) {
  const ref = assetReference(url)
  return ref ? {_type: 'image', asset: {_type: 'reference', _ref: ref}, alt} : undefined
}

export function scheduledAt(startDate, position) {
  const dayOffset = Math.floor(position / 30)
  const slot = position % 30
  const hour = slot < 10 ? '08' : slot < 20 ? '13' : '19'
  const date = new Date(`${startDate}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + dayOffset)
  return `${date.toISOString().slice(0, 10)}T${hour}:00:00+07:00`
}

function validate(rows) {
  if (!Array.isArray(rows) || rows.length !== 330) throw new Error(`Expected 330 rows, received ${rows?.length ?? 0}`)
  const required = ['contentId', 'title', 'slug', 'excerpt', 'imageAlt', 'bodyMarkdown', 'category', 'categorySlug', 'seoTitle', 'seoDescription']
  const slugs = new Set()
  const ids = new Set()
  for (const row of rows) {
    const missing = required.filter((field) => !row[field])
    if (missing.length) throw new Error(`Row ${row.row} is missing: ${missing.join(', ')}`)
    if (slugs.has(row.slug)) throw new Error(`Duplicate slug: ${row.slug}`)
    if (ids.has(row.contentId)) throw new Error(`Duplicate contentId: ${row.contentId}`)
    slugs.add(row.slug)
    ids.add(row.contentId)
  }
}

function articleDraft(row, categoryId, date) {
  const coverImage = imageValue(row.imageUrl, row.imageAlt)
  const seoImage = imageValue(row.seoImageUrl || row.imageUrl, row.seoImageAlt || row.imageAlt)
  return {
    _id: `drafts.${stableDocumentId(row.slug)}`,
    _type: 'article',
    title: row.title,
    slug: {_type: 'slug', current: row.slug},
    excerpt: row.excerpt,
    ...(coverImage ? {coverImage} : {}),
    authorName: row.authorName || 'Trạm Laptop Việt',
    body: markdownToBlocks(row.bodyMarkdown),
    category: {_type: 'reference', _ref: categoryId},
    keywords: row.keywords.slice(0, 6),
    seo: {_type: 'seo', title: row.seoTitle, description: row.seoDescription, ...(seoImage ? {image: seoImage} : {}), noIndex: row.noIndex ?? false},
    workflowStatus: 'approved',
    scheduledAt: date,
    approvalNote: coverImage
      ? 'Bài thuộc batch đã được kiểm duyệt; chờ hệ thống xuất bản đúng lịch.'
      : 'Bài thuộc batch đã được kiểm duyệt nhưng thiếu ảnh; cần bổ sung ảnh trước giờ xuất bản.',
  }
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
  const args = parseArgs(process.argv.slice(2))
  const payload = JSON.parse(await readFile(args.input, 'utf8'))
  validate(payload.rows)
  const imageCount = payload.rows.filter((row) => row.imageUrl).length
  log('batch_validated', {rows: payload.rows.length, withImage: imageCount, withoutImage: payload.rows.length - imageCount, startDate: args.startDate, dryRun: args.dryRun})
  if (args.dryRun) return

  const slugs = payload.rows.map((row) => row.slug)
  const existing = await query('*[_type == "article" && slug.current in $slugs]{_id,"slug":slug.current}', {slugs})
  const publishedSlugs = new Set(existing.filter((item) => !item._id.startsWith('drafts.')).map((item) => item.slug))
  const existingDraftIds = new Map(existing.filter((item) => item._id.startsWith('drafts.')).map((item) => [item.slug, item._id]))
  const categories = [...new Map(payload.rows.map((row) => [row.categorySlug, row.category])).entries()]
  const existingCategories = await query('*[_type == "category" && scope == "article" && slug.current in $slugs]{_id,"slug":slug.current}', {slugs: categories.map(([slug]) => slug)})
  const categoryIds = new Map(existingCategories.map((item) => [item.slug, item._id.replace(/^drafts\./, '')]))
  const mutations = []
  for (const [slug, title] of categories) {
    if (categoryIds.has(slug)) continue
    const id = `category-${slug}`
    categoryIds.set(slug, id)
    mutations.push({createIfNotExists: {_id: id, _type: 'category', title, slug: {_type: 'slug', current: slug}, scope: 'article', sortOrder: 0, visibility: 'visible'}})
  }

  let scheduledPosition = 0
  let skippedPublished = 0
  let replacedDrafts = 0
  let createdDrafts = 0
  for (const row of payload.rows) {
    if (publishedSlugs.has(row.slug)) {
      skippedPublished += 1
      continue
    }
    const draft = articleDraft(row, categoryIds.get(row.categorySlug), scheduledAt(args.startDate, scheduledPosition++))
    if (existingDraftIds.has(row.slug)) {
      draft._id = existingDraftIds.get(row.slug)
      replacedDrafts += 1
    } else createdDrafts += 1
    mutations.push({createOrReplace: draft})
  }
  const transactions = await mutateInChunks(mutations)
  log('batch_import_completed', {createdDrafts, replacedDrafts, skippedPublished, categoryMutations: mutations.length - createdDrafts - replacedDrafts, transactions, scheduledDrafts: scheduledPosition})
}

if (process.argv[1]?.endsWith('import-article-batch.mjs')) {
  main().catch((error) => {
    console.error(JSON.stringify({time: new Date().toISOString(), event: 'batch_import_failed', message: error.message}))
    process.exitCode = 1
  })
}
