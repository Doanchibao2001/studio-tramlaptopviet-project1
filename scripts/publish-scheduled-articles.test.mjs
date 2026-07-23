import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildPublishedDocument,
  normalizeReviewedBatchDraft,
  validateDraft,
} from './publish-scheduled-articles.mjs'

const validDraft = {
  _id: 'drafts.article-test',
  _type: 'article',
  title: 'Bài kiểm tra',
  slug: {_type: 'slug', current: 'bai-kiem-tra'},
  excerpt: 'Mô tả bài kiểm tra đầy đủ.',
  coverImage: {_type: 'image', asset: {_type: 'reference', _ref: 'image-test'}},
  body: [{_type: 'block', _key: 'a', children: []}],
  category: {_type: 'reference', _ref: 'category-test'},
  seo: {_type: 'seo', title: 'Bài kiểm tra', description: 'Mô tả SEO bài kiểm tra.'},
  workflowStatus: 'approved',
  scheduledAt: '2026-07-22T08:00:00+07:00',
}

test('accepts a complete approved draft', () => {
  assert.equal(validateDraft(validDraft), true)
})

test('rejects an incomplete approved draft', () => {
  assert.throws(() => validateDraft({...validDraft, coverImage: undefined}), /coverImage/)
})

test('normalizes an existing reviewed batch draft without a manual approval step', () => {
  const pendingDraft = {...validDraft, workflowStatus: 'pendingReview'}
  const normalized = normalizeReviewedBatchDraft(pendingDraft, new Set(['bai-kiem-tra']))
  assert.equal(normalized.workflowStatus, 'approved')
  assert.match(normalized.approvalNote, /đã được kiểm duyệt/)
})

test('does not approve a draft outside the reviewed batch', () => {
  const pendingDraft = {...validDraft, workflowStatus: 'pendingReview'}
  const normalized = normalizeReviewedBatchDraft(pendingDraft, new Set(['bai-khac']))
  assert.equal(normalized.workflowStatus, 'pendingReview')
})

test('converts a draft into a published document without changing content fields', () => {
  const published = buildPublishedDocument(validDraft)
  assert.equal(published._id, 'article-test')
  assert.equal(published.workflowStatus, 'published')
  assert.equal(published.publishedAt, validDraft.scheduledAt)
  assert.equal(published.title, validDraft.title)
})
