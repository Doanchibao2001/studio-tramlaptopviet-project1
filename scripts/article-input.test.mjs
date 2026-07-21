/* global URL */
import assert from 'node:assert/strict'
import test from 'node:test'
import {fileURLToPath} from 'node:url'
import {loadArticleInput, markdownToBlocks, stableDocumentId, validateArticleInput} from './lib/article-input.mjs'

test('converts Markdown headings, paragraphs, and bullets to Portable Text', () => {
  const blocks = markdownToBlocks('Intro\n\n## Heading\n\n- One')
  assert.deepEqual(blocks.map(({style, listItem}) => [style, listItem]), [['normal', undefined], ['h2', undefined], ['normal', 'bullet']])
})

test('loads and validates the Markdown fixture', async () => {
  const fixture = fileURLToPath(new URL('./fixtures/article.example.md', import.meta.url))
  const article = validateArticleInput(await loadArticleInput(fixture))
  assert.equal(article.slug, 'laptop-nong-quat-keu-to-nguyen-nhan-cach-kiem-tra')
  assert.equal(article.body.length, 6)
})

test('creates a stable Sanity-safe document id from a slug', () => {
  assert.equal(stableDocumentId('same-slug'), stableDocumentId('same-slug'))
  assert.match(stableDocumentId('same-slug'), /^article-[a-f0-9]{24}$/)
})

test('rejects schema-incompatible input', () => {
  assert.throws(() => validateArticleInput({title: '', slug: 'INVALID SLUG'}), /Article validation failed/)
})
