import {PackageIcon} from '@sanity/icons/Package'
import {defineArrayMember, defineField, defineType} from 'sanity'
import {slugify} from './utils/slugify'

export const product = defineType({
  name: 'product',
  title: 'Sản phẩm',
  type: 'document',
  icon: PackageIcon,
  groups: [
    {name: 'basic', title: 'Thông tin chính', default: true},
    {name: 'pricing', title: 'Giá & tình trạng'},
    {name: 'details', title: 'Chi tiết'},
    {name: 'seo', title: 'SEO'},
  ],
  initialValue: {
    pricingMode: 'fixed',
    availability: 'inStock',
    promotionLevel: 'standard',
    sortOrder: 0,
  },
  fields: [
    defineField({
      name: 'title',
      title: 'Tên sản phẩm',
      type: 'string',
      group: 'basic',
      validation: (rule) => rule.required().max(120),
    }),
    defineField({
      name: 'slug',
      title: 'Đường dẫn',
      type: 'slug',
      group: 'basic',
      options: {source: 'title', slugify},
      validation: (rule) =>
        rule.required().custom((value) => {
          if (!value?.current) return 'Đường dẫn là bắt buộc.'
          return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.current)
            ? true
            : 'Chỉ dùng chữ thường không dấu, số và dấu gạch ngang.'
        }),
    }),
    defineField({
      name: 'sku',
      title: 'Mã sản phẩm',
      type: 'string',
      group: 'basic',
      validation: (rule) =>
        rule.required().max(64).regex(/^[A-Za-z0-9][A-Za-z0-9._-]*$/, {
          name: 'SKU',
          invert: false,
        }),
    }),
    defineField({
      name: 'category',
      title: 'Danh mục',
      type: 'reference',
      group: 'basic',
      to: [{type: 'category'}],
      options: {filter: 'scope == "product"'},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'summary',
      title: 'Mô tả ngắn',
      type: 'text',
      rows: 3,
      group: 'basic',
      validation: (rule) => rule.max(200),
    }),
    defineField({
      name: 'mainImage',
      title: 'Ảnh chính',
      type: 'image',
      group: 'basic',
      options: {hotspot: true},
      fields: [
        defineField({
          name: 'alt',
          title: 'Mô tả ảnh',
          type: 'string',
          validation: (rule) => rule.required().max(150),
        }),
      ],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'gallery',
      title: 'Thư viện ảnh',
      type: 'array',
      group: 'basic',
      of: [
        defineArrayMember({
          type: 'image',
          options: {hotspot: true},
          fields: [
            defineField({
              name: 'alt',
              title: 'Mô tả ảnh',
              type: 'string',
              validation: (rule) => rule.required().max(150),
            }),
          ],
        }),
      ],
      validation: (rule) => rule.max(8),
    }),
    defineField({
      name: 'pricingMode',
      title: 'Cách hiển thị giá',
      type: 'string',
      group: 'pricing',
      options: {
        layout: 'radio',
        list: [
          {title: 'Giá cố định', value: 'fixed'},
          {title: 'Liên hệ báo giá', value: 'contact'},
        ],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'price',
      title: 'Giá bán (VNĐ)',
      description: 'Nhập số nguyên, ví dụ 390000.',
      type: 'number',
      group: 'pricing',
      hidden: ({parent}) => parent?.pricingMode !== 'fixed',
      validation: (rule) =>
        rule.min(0).integer().custom((value, context) => {
          const parent = context.parent as {pricingMode?: string} | undefined
          if (parent?.pricingMode === 'fixed' && typeof value !== 'number') {
            return 'Giá bán là bắt buộc khi chọn giá cố định.'
          }
          return true
        }),
    }),
    defineField({
      name: 'compareAtPrice',
      title: 'Giá trước khuyến mãi (VNĐ)',
      type: 'number',
      group: 'pricing',
      hidden: ({parent}) => parent?.pricingMode !== 'fixed',
      validation: (rule) =>
        rule.min(0).integer().custom((value, context) => {
          if (typeof value !== 'number') return true
          const parent = context.parent as {price?: number} | undefined
          return typeof parent?.price !== 'number' || value >= parent.price
            ? true
            : 'Giá trước khuyến mãi phải lớn hơn hoặc bằng giá bán.'
        }),
    }),
    defineField({
      name: 'availability',
      title: 'Tình trạng hàng',
      type: 'string',
      group: 'pricing',
      options: {
        layout: 'radio',
        list: [
          {title: 'Còn hàng', value: 'inStock'},
          {title: 'Đặt trước', value: 'preorder'},
          {title: 'Hết hàng', value: 'outOfStock'},
        ],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'promotionLevel',
      title: 'Mức ưu tiên hiển thị',
      type: 'string',
      group: 'pricing',
      options: {
        layout: 'radio',
        list: [
          {title: 'Thông thường', value: 'standard'},
          {title: 'Nổi bật', value: 'featured'},
        ],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'brand',
      title: 'Thương hiệu',
      type: 'string',
      group: 'details',
      validation: (rule) => rule.max(80),
    }),
    defineField({
      name: 'compatibleModels',
      title: 'Dòng máy tương thích',
      type: 'array',
      group: 'details',
      of: [defineArrayMember({type: 'string'})],
      validation: (rule) => rule.unique().max(30),
    }),
    defineField({
      name: 'specifications',
      title: 'Thông số',
      type: 'array',
      group: 'details',
      of: [
        defineArrayMember({
          name: 'specification',
          title: 'Thông số',
          type: 'object',
          fields: [
            defineField({
              name: 'label',
              title: 'Tên thông số',
              type: 'string',
              validation: (rule) => rule.required().max(80),
            }),
            defineField({
              name: 'value',
              title: 'Giá trị',
              type: 'string',
              validation: (rule) => rule.required().max(160),
            }),
          ],
          preview: {select: {title: 'label', subtitle: 'value'}},
        }),
      ],
      validation: (rule) => rule.max(30),
    }),
    defineField({
      name: 'warranty',
      title: 'Bảo hành',
      type: 'string',
      group: 'details',
      validation: (rule) => rule.max(120),
    }),
    defineField({
      name: 'description',
      title: 'Nội dung chi tiết',
      type: 'blockContent',
      group: 'details',
    }),
    defineField({
      name: 'relatedProducts',
      title: 'Sản phẩm liên quan',
      type: 'array',
      group: 'details',
      of: [defineArrayMember({type: 'reference', to: [{type: 'product'}]})],
      validation: (rule) => rule.unique().max(8),
    }),
    defineField({
      name: 'sortOrder',
      title: 'Thứ tự hiển thị',
      type: 'number',
      group: 'details',
      validation: (rule) => rule.integer().min(0),
    }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'seo',
      group: 'seo',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      sku: 'sku',
      categoryTitle: 'category.title',
      pricingMode: 'pricingMode',
      price: 'price',
      media: 'mainImage',
    },
    prepare({title, sku, categoryTitle, pricingMode, price, media}) {
      const priceLabel =
        pricingMode === 'contact'
          ? 'Liên hệ'
          : typeof price === 'number'
            ? `${new Intl.NumberFormat('vi-VN').format(price)} đ`
            : 'Chưa có giá'
      return {
        title,
        subtitle: [sku, categoryTitle, priceLabel].filter(Boolean).join(' · '),
        media,
      }
    },
  },
})
