#!/usr/bin/env node
/* global Buffer, URL, URLSearchParams, console, fetch, process */
import {createHash} from 'node:crypto'
import {readFile} from 'node:fs/promises'
import path from 'node:path'
import {loadArticleInput, stableDocumentId, validateArticleInput} from './lib/article-input.mjs'

const PROJECT_ID = process.env.SANITY_PROJECT_ID || 'qnykgwoz'
const DATASET = process.env.SANITY_DATASET || 'production'
const API_VERSION = '2026-07-21'
const MAX_IMAGE_BYTES = 10 * 1024 * 1024

function repositoryPath(source) {
  const resolved = path.resolve(source)
  const relative = path.relative(process.cwd(), resolved)
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`Local path must stay inside the repository: ${source}`)
  }
  return resolved
}

function parseArgs(argv) {
  const result = {dryRun: false}
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]
    if (argument === '--dry-run') result.dryRun = true
    else if (argument === '--input' || argument === '--image') result[argument.slice(2)] = argv[++index]
    else throw new Error(`Unknown argument: ${argument}`)
  }
  if (!result.input) throw new Error('Usage: node scripts/publish-article.mjs --input <article.json|article.md> [--image <path|url>] [--dry-run]')
  return result
}

function log(event, details = {}) {
  console.log(JSON.stringify({time: new Date().toISOString(), event, ...details}))
}

async function sanityRequest(route, {method = 'GET', body, contentType = 'application/json'} = {}) {
  const token = process.env.SANITY_AUTH_TOKEN
  if (!token) throw new Error('SANITY_AUTH_TOKEN is required for publishing')
  const response = await fetch(`https://${PROJECT_ID}.api.sanity.io/v${API_VERSION}${route}`, {
    method,
    headers: {Authorization: `Bearer ${token}`, ...(body ? {'Content-Type': contentType} : {})},
    body: body && (contentType === 'application/json' ? JSON.stringify(body) : body),
  })
  const result = await response.json()
  if (!response.ok) throw new Error(`Sanity API ${response.status}: ${JSON.stringify(result)}`)
  return result
}

async function loadImage(imageSource) {
  let image
  if (/^https:\/\//.test(imageSource)) {
    const response = await fetch(imageSource)
    if (!response.ok) throw new Error(`Cannot download image: ${response.status} ${response.statusText}`)
    image = {bytes: Buffer.from(await response.arrayBuffer()), contentType: response.headers.get('content-type') || 'application/octet-stream', filename: path.basename(new URL(imageSource).pathname) || 'article-image'}
  } else {
    const localPath = repositoryPath(imageSource)
    image = {bytes: await readFile(localPath), contentType: localPath.endsWith('.png') ? 'image/png' : localPath.endsWith('.webp') ? 'image/webp' : 'image/jpeg', filename: path.basename(localPath)}
  }
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(image.contentType)) throw new Error(`Unsupported image content type: ${image.contentType}`)
  if (image.bytes.length > MAX_IMAGE_BYTES) throw new Error('Image exceeds the 10 MB upload limit')
  return image
}

async function uploadImage(imageSource) {
  const image = await loadImage(imageSource)
  const digest = createHash('sha256').update(image.bytes).digest('hex')
  log('image_upload_started', {filename: image.filename, sha256: digest})
  const result = await sanityRequest(`/assets/images/${DATASET}?filename=${encodeURIComponent(image.filename)}`, {method: 'POST', body: image.bytes, contentType: image.contentType})
  log('image_upload_completed', {assetId: result.document._id})
  return result.document._id
}

async function query(query, params = {}) {
  const search = new URLSearchParams({query, ...Object.fromEntries(Object.entries(params).map(([key, value]) => [`$${key}`, JSON.stringify(value)]))})
  return (await sanityRequest(`/data/query/${DATASET}?${search}`)).result
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const input = validateArticleInput(await loadArticleInput(repositoryPath(args.input)))
  const imageSource = args.image || input.image
  if (!imageSource) throw new Error('An image is required via --image or the input image field')
  const proposedId = stableDocumentId(input.slug)
  log('input_validated', {input: args.input, slug: input.slug, proposedId, dryRun: args.dryRun, dataset: DATASET})
  if (args.dryRun) {
    await loadImage(imageSource)
    log('dry_run_completed', {message: 'No network writes were made'})
    return
  }

  const existingArticle = await query('*[_type == "article" && slug.current == $slug][0]{_id}', {slug: input.slug})
  const articleId = existingArticle?._id?.replace(/^drafts\./, '') || proposedId
  const categorySlug = input.categorySlug || input.category.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  const existingCategory = await query('*[_type == "category" && scope == "article" && slug.current == $slug][0]{_id}', {slug: categorySlug})
  const categoryId = existingCategory?._id?.replace(/^drafts\./, '') || `category-${categorySlug}`
  const assetId = await uploadImage(imageSource)
  const image = {_type: 'image', asset: {_type: 'reference', _ref: assetId}, alt: input.imageAlt}
  const publishedAt = input.publishedAt || new Date().toISOString()
  const article = {
    _id: articleId,
    _type: 'article',
    title: input.title,
    slug: {_type: 'slug', current: input.slug},
    excerpt: input.excerpt,
    coverImage: image,
    publishedAt,
    authorName: input.authorName || 'Trạm Laptop Việt',
    body: input.body,
    category: {_type: 'reference', _ref: categoryId},
    keywords: input.keywords || [],
    seo: {_type: 'seo', title: input.seo?.title, description: input.seo?.description, image, noIndex: input.seo?.noIndex ?? false},
  }
  const mutations = []
  if (!existingCategory) mutations.push({createIfNotExists: {_id: categoryId, _type: 'category', title: input.category, slug: {_type: 'slug', current: categorySlug}, scope: 'article', sortOrder: 0, visibility: 'visible'}})
  mutations.push({createOrReplace: article})
  log('publish_started', {articleId, categoryId, replacingExisting: Boolean(existingArticle)})
  const result = await sanityRequest(`/data/mutate/${DATASET}?returnIds=true&visibility=sync`, {method: 'POST', body: {mutations}})
  log('publish_completed', {articleId, transactionId: result.transactionId, documentIds: result.results?.map((item) => item.id)})
}

main().catch((error) => {
  console.error(JSON.stringify({time: new Date().toISOString(), event: 'publish_failed', message: error.message}))
  process.exitCode = 1
})
