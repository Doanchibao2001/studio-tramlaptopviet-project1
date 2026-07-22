#!/usr/bin/env node
/* global console, fetch, process, URLSearchParams */

const PROJECT_ID = process.env.SANITY_PROJECT_ID || 'qnykgwoz'
const DATASET = process.env.SANITY_DATASET || 'production'
const API_VERSION = '2026-07-21'
const DEFAULT_LIMIT = 10

function parseArgs(argv) {
  const result = {dryRun: false, limit: DEFAULT_LIMIT}
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]
    if (argument === '--dry-run') result.dryRun = true
    else if (argument === '--limit') result.limit = Number.parseInt(argv[++index], 10)
    else throw new Error(`Unknown argument: ${argument}`)
  }
  if (!Number.isInteger(result.limit) || result.limit < 1 || result.limit > 10) {
    throw new Error('--limit must be an integer from 1 to 10')
  }
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
  const search = new URLSearchParams({
    query: groq,
    perspective: 'raw',
    ...Object.fromEntries(Object.entries(params).map(([key, value]) => [`$${key}`, JSON.stringify(value)])),
  })
  return (await sanityRequest(`/data/query/${DATASET}?${search}`)).result
}

export function validateDraft(document) {
  const missing = []
  if (!document?.title) missing.push('title')
  if (!document?.slug?.current) missing.push('slug')
  if (!document?.excerpt) missing.push('excerpt')
  if (!document?.coverImage?.asset?._ref) missing.push('coverImage')
  if (!Array.isArray(document?.body) || document.body.length === 0) missing.push('body')
  if (!document?.category?._ref) missing.push('category')
  if (!document?.seo?.title) missing.push('seo.title')
  if (!document?.seo?.description) missing.push('seo.description')
  if (!document?.scheduledAt) missing.push('scheduledAt')
  if (document?.workflowStatus !== 'approved') missing.push('workflowStatus=approved')
  if (missing.length) throw new Error(`${document?._id || 'Unknown draft'} is not publishable: ${missing.join(', ')}`)
  return true
}

export function buildPublishedDocument(draft) {
  validateDraft(draft)
  const publishedId = draft._id.replace(/^drafts\./, '')
  const {_rev, _createdAt, _updatedAt, ...content} = draft
  void _rev
  void _createdAt
  void _updatedAt
  return {
    ...content,
    _id: publishedId,
    workflowStatus: 'published',
    publishedAt: draft.scheduledAt,
  }
}

async function ensureSlugAvailable(draft) {
  const publishedId = draft._id.replace(/^drafts\./, '')
  const collision = await query(
    '*[_type == "article" && !(_id in path("drafts.**")) && slug.current == $slug && _id != $id][0]._id',
    {slug: draft.slug.current, id: publishedId},
  )
  if (collision) throw new Error(`Slug collision for ${draft.slug.current}: ${collision}`)
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const drafts = await query(
    `*[_type == "article" && _id in path("drafts.**") && workflowStatus == "approved" && defined(scheduledAt) && scheduledAt <= now()]
      | order(scheduledAt asc)[0...${args.limit}]`,
  )
  log('scheduled_batch_found', {count: drafts.length, limit: args.limit, dryRun: args.dryRun})
  if (drafts.length === 0) return

  const seenSlugs = new Set()
  for (const draft of drafts) {
    validateDraft(draft)
    if (seenSlugs.has(draft.slug.current)) throw new Error(`Duplicate slug in batch: ${draft.slug.current}`)
    seenSlugs.add(draft.slug.current)
    await ensureSlugAvailable(draft)
  }

  if (args.dryRun) {
    log('scheduled_batch_validated', {ids: drafts.map((draft) => draft._id)})
    return
  }

  const mutations = drafts.flatMap((draft) => [
    {createOrReplace: buildPublishedDocument(draft)},
    {delete: {id: draft._id}},
  ])
  const result = await sanityRequest(`/data/mutate/${DATASET}?returnIds=true&visibility=sync`, {
    method: 'POST',
    body: {mutations},
  })
  log('scheduled_batch_published', {
    count: drafts.length,
    transactionId: result.transactionId,
    ids: drafts.map((draft) => draft._id.replace(/^drafts\./, '')),
  })
}

if (process.argv[1]?.endsWith('publish-scheduled-articles.mjs')) {
  main().catch((error) => {
    console.error(JSON.stringify({time: new Date().toISOString(), event: 'scheduled_batch_failed', message: error.message}))
    process.exitCode = 1
  })
}
