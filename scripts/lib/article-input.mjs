import {createHash} from 'node:crypto'
import {readFile} from 'node:fs/promises'
import path from 'node:path'

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

function scalar(value) {
  const trimmed = value.trim()
  if (trimmed === 'true') return true
  if (trimmed === 'false') return false
  if (trimmed === 'null') return null
  if (trimmed.startsWith('[') || trimmed.startsWith('{') || trimmed.startsWith('"')) {
    return JSON.parse(trimmed)
  }
  return trimmed.replace(/^['"]|['"]$/g, '')
}

function parseFrontMatter(source) {
  if (!source.startsWith('---\n')) throw new Error('Markdown input must start with --- front matter')
  const end = source.indexOf('\n---\n', 4)
  if (end < 0) throw new Error('Markdown front matter is missing its closing ---')
  const header = source.slice(4, end)
  const metadata = {}
  for (const [index, line] of header.split('\n').entries()) {
    if (!line.trim() || line.trimStart().startsWith('#')) continue
    const separator = line.indexOf(':')
    if (separator < 1) throw new Error(`Invalid front matter at line ${index + 2}`)
    metadata[line.slice(0, separator).trim()] = scalar(line.slice(separator + 1))
  }
  return {metadata, markdown: source.slice(end + 5).trim()}
}

function span(key, text) {
  return {_key: `${key}-span`, _type: 'span', marks: [], text}
}

export function markdownToBlocks(markdown) {
  const blocks = []
  let paragraph = []
  let sequence = 0
  const flush = () => {
    if (!paragraph.length) return
    const key = `p-${sequence++}`
    blocks.push({_key: key, _type: 'block', style: 'normal', markDefs: [], children: [span(key, paragraph.join(' '))]})
    paragraph = []
  }
  for (const rawLine of markdown.replace(/\r/g, '').split('\n')) {
    const line = rawLine.trim()
    if (!line) {
      flush()
      continue
    }
    const heading = /^(#{2,3})\s+(.+)$/.exec(line)
    const bullet = /^[-*]\s+(.+)$/.exec(line)
    if (heading) {
      flush()
      const key = `h-${sequence++}`
      blocks.push({_key: key, _type: 'block', style: heading[1] === '##' ? 'h2' : 'h3', markDefs: [], children: [span(key, heading[2])]})
    } else if (bullet) {
      flush()
      const key = `li-${sequence++}`
      blocks.push({_key: key, _type: 'block', style: 'normal', level: 1, listItem: 'bullet', markDefs: [], children: [span(key, bullet[1])]})
    } else {
      paragraph.push(line)
    }
  }
  flush()
  return blocks
}

export async function loadArticleInput(inputPath) {
  const source = await readFile(inputPath, 'utf8')
  if (path.extname(inputPath).toLowerCase() === '.json') return JSON.parse(source)
  const {metadata, markdown} = parseFrontMatter(source.replace(/\r/g, ''))
  return {...metadata, body: markdownToBlocks(markdown)}
}

export function validateArticleInput(value) {
  const errors = []
  const requiredString = (field, max) => {
    if (typeof value[field] !== 'string' || !value[field].trim()) errors.push(`${field} is required`)
    else if (value[field].length > max) errors.push(`${field} must be at most ${max} characters`)
  }
  requiredString('title', 120)
  requiredString('slug', 120)
  requiredString('excerpt', 200)
  requiredString('imageAlt', 150)
  requiredString('category', 80)
  if (value.slug && !slugPattern.test(value.slug)) errors.push('slug must contain lowercase ASCII letters, numbers, and hyphens only')
  if (!Array.isArray(value.body) || value.body.length === 0) errors.push('body must contain at least one Portable Text block')
  if (value.keywords && (!Array.isArray(value.keywords) || value.keywords.length > 10)) errors.push('keywords must be an array with at most 10 values')
  if (value.seo?.title?.length > 60) errors.push('seo.title must be at most 60 characters')
  if (value.seo?.description?.length > 160) errors.push('seo.description must be at most 160 characters')
  if (errors.length) throw new Error(`Article validation failed:\n- ${errors.join('\n- ')}`)
  return value
}

export function stableDocumentId(slug) {
  return `article-${createHash('sha256').update(slug).digest('hex').slice(0, 24)}`
}
