import {readFile} from 'node:fs/promises'
import {basename, resolve} from 'node:path'
import {getCliClient} from 'sanity/cli'
import {newsArticles} from '../../clone/app/tin-tuc/news-data'
import {fallbackProducts} from '../../clone/sanity/fallback'

const client = getCliClient({apiVersion: '2026-07-20'})

type CategoryScope = 'product' | 'article'
type ImageValue = {
  _type: 'image'
  asset: {_type: 'reference'; _ref: string}
  alt: string
}

const categoryIds = new Map<string, string>()
const assetIds = new Map<string, string>()

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function cleanPrice(value: string) {
  if (value.toLowerCase().includes('liên hệ')) return null
  const digits = value.replace(/\D/g, '')
  return digits ? Number(digits) : null
}

function block(key: string, text: string, style = 'normal', listItem?: 'bullet') {
  return {
    _key: key,
    _type: 'block',
    style,
    ...(listItem ? {level: 1, listItem} : {}),
    markDefs: [],
    children: [{_key: `${key}-span`, _type: 'span', marks: [], text}],
  }
}

function articleBody(
  slug: string,
  sections: Array<{heading: string; paragraphs: string[]; bullets?: string[]}>,
) {
  return sections.flatMap((section, sectionIndex) => {
    const prefix = `${slug.slice(0, 24)}-${sectionIndex}`
    return [
      block(`${prefix}-h`, section.heading, 'h2'),
      ...section.paragraphs.map((paragraph, index) =>
        block(`${prefix}-p${index}`, paragraph),
      ),
      ...(section.bullets ?? []).map((item, index) =>
        block(`${prefix}-b${index}`, item, 'normal', 'bullet'),
      ),
    ]
  })
}

async function findBySlug(type: string, slug: string) {
  return client.fetch<string | null>(
    '*[_type == $type && slug.current == $slug][0]._id',
    {type, slug},
  )
}

async function ensureCategory(title: string, scope: CategoryScope, sortOrder: number) {
  const cacheKey = `${scope}:${title}`
  const cached = categoryIds.get(cacheKey)
  if (cached) return cached

  const slug = slugify(title)
  const existingId = await client.fetch<string | null>(
    '*[_type == "category" && scope == $scope && slug.current == $slug][0]._id',
    {scope, slug},
  )
  if (existingId) {
    categoryIds.set(cacheKey, existingId)
    return existingId
  }

  const created = await client.create({
    _type: 'category',
    title,
    slug: {_type: 'slug', current: slug},
    scope,
    sortOrder,
    visibility: 'visible',
  })
  categoryIds.set(cacheKey, created._id)
  console.log(`Created category: ${title}`)
  return created._id
}

async function uploadImage(publicPath: string, alt: string): Promise<ImageValue> {
  const normalized = publicPath.replace(/^\//, '')
  const filePath = resolve(process.cwd(), '../clone/public', normalized)
  let assetId = assetIds.get(filePath)
  if (!assetId) {
    const buffer = await readFile(filePath)
    const asset = await client.assets.upload('image', buffer, {filename: basename(filePath)})
    assetId = asset._id
    assetIds.set(filePath, assetId)
    console.log(`Uploaded image: ${basename(filePath)}`)
  }
  return {_type: 'image', asset: {_type: 'reference', _ref: assetId}, alt}
}

async function seedProducts() {
  for (const [index, product] of fallbackProducts.entries()) {
    const slug = slugify(product.name)
    if (await findBySlug('product', slug)) continue

    const categoryId = await ensureCategory(product.category, 'product', index)
    const price = cleanPrice(product.price)
    const mainImage = await uploadImage(product.image, product.name)
    await client.create({
      _type: 'product',
      title: product.name,
      slug: {_type: 'slug', current: slug},
      sku: `TLV-${String(index + 1).padStart(3, '0')}`,
      category: {_type: 'reference', _ref: categoryId},
      summary: 'Linh kiện được kiểm tra đúng mã, báo giá trước khi thay và có bảo hành rõ ràng.',
      mainImage,
      pricingMode: price === null ? 'contact' : 'fixed',
      ...(price === null ? {} : {price}),
      availability: 'inStock',
      promotionLevel: index < 3 ? 'featured' : 'standard',
      warranty: 'Bảo hành theo linh kiện và ghi rõ trên phiếu bàn giao.',
      sortOrder: index,
    })
    console.log(`Created product: ${product.name}`)
  }
}

async function seedArticles() {
  for (const [index, article] of newsArticles.entries()) {
    if (await findBySlug('article', article.slug)) continue

    const categoryId = await ensureCategory(article.category, 'article', index)
    const coverImage = await uploadImage(article.image, article.imageAlt)
    await client.create({
      _type: 'article',
      title: article.title,
      slug: {_type: 'slug', current: article.slug},
      excerpt: article.description,
      coverImage,
      publishedAt: `${article.publishedAt}T08:00:00+07:00`,
      authorName: 'Trạm Laptop Việt',
      body: articleBody(article.slug, article.sections),
      category: {_type: 'reference', _ref: categoryId},
      keywords: article.keywords,
      seo: {
        _type: 'seo',
        description: article.description,
        image: coverImage,
        noIndex: false,
      },
    })
    console.log(`Created article: ${article.title}`)
  }
}

async function seedSiteSettings() {
  const existing = await client.getDocument('siteSettings')
  if (existing) return

  const logo = await uploadImage('/tram-laptop-viet/logo-round.jpg', 'Logo Trạm Laptop Việt')
  const heroImage = await uploadImage(
    '/tram-laptop-viet/storefront-main.png',
    'Cửa hàng Trạm Laptop Việt',
  )
  await client.createIfNotExists({
    _id: 'siteSettings',
    _type: 'siteSettings',
    siteName: 'Trạm Laptop Việt',
    siteUrl: 'https://tramlaptopviet.vn',
    logo,
    hotline: '0343323865',
    zaloUrl: 'https://zalo.me/0343323865',
    heroEyebrow: 'TRẠM LAPTOP VIỆT',
    heroHeadline: 'Sửa Laptop & MacBook',
    heroSubheadline: 'Đúng lỗi · Đúng giá',
    heroDescription:
      'Máy không lên nguồn, chạy chậm, nóng hoặc vào nước? Kiểm tra miễn phí, báo rõ chi phí và chỉ sửa khi bạn đồng ý.',
    heroImage,
    socialProof: '+3.000 khách hàng tại TP.HCM đã tin tưởng giao máy',
    primaryCtaLabel: 'Kiểm tra lỗi miễn phí',
    secondaryCtaLabel: 'Gửi ảnh lỗi qua Zalo',
    popupHeadline: 'Chưa biết máy hỏng gì?',
    popupDescription:
      'Gửi ảnh, video hoặc mô tả dấu hiệu để kỹ thuật viên xem sơ bộ. Bạn biết lỗi và chi phí dự kiến trước khi quyết định.',
    popupPrimaryLabel: 'Gửi ảnh lỗi để kiểm tra nhanh',
    popupSecondaryLabel: 'Máy cần gấp? Gọi ngay',
    addresses: [
      {name: 'Quận 10', address: '642 đường 3/2, Phường 14', hours: 'Thứ 2–7 · 8:30–18:30'},
      {name: 'Quận 3', address: '514 Cách Mạng Tháng 8, P.11', hours: 'Thứ 2–7 · 8:30–18:30'},
      {name: 'Phú Nhuận', address: '167A Đào Duy Anh, P.9', hours: 'Thứ 2–7 · 8:30–18:30'},
      {name: 'Bình Thạnh', address: '203A Lê Quang Định, P.7', hours: 'Thứ 2–7 · 8:30–18:30'},
      {name: 'Gò Vấp', address: '457 Lê Văn Thọ, P.9', hours: 'Thứ 2–7 · 8:30–18:30'},
      {name: 'Thủ Đức', address: '678 Kha Vạn Cân, Linh Đông', hours: 'Thứ 2–7 · 8:30–18:30'},
    ].map((location, index) => ({_key: `store-${index + 1}`, _type: 'storeLocation', ...location})),
    footerDescription: 'Sửa chữa · Nâng cấp · Bảo hành laptop và MacBook tại TP.HCM.',
    socialLinks: [
      {
        _key: 'zalo',
        _type: 'socialLink',
        network: 'zalo',
        url: 'https://zalo.me/0343323865',
      },
    ],
    defaultSeo: {
      _type: 'seo',
      title: 'Trạm Laptop Việt',
      description: 'Sửa laptop và MacBook tại TP.HCM, kiểm tra đúng lỗi và báo giá trước khi sửa.',
      noIndex: false,
    },
  })
  console.log('Created site settings')
}

async function main() {
  await seedProducts()
  await seedArticles()
  await seedSiteSettings()
  console.log('Initial Sanity content is ready.')
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
