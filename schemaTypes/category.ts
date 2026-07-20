import {TagIcon} from '@sanity/icons/Tag'
import {defineField, defineType} from 'sanity'
import {slugify} from './utils/slugify'

export const category = defineType({
  name: 'category',
  title: 'Danh mục',
  type: 'document',
  icon: TagIcon,
  initialValue: {
    scope: 'product',
    visibility: 'visible',
  },
  fields: [
    defineField({
      name: 'title',
      title: 'Tên danh mục',
      type: 'string',
      validation: (rule) => rule.required().max(80),
    }),
    defineField({
      name: 'slug',
      title: 'Đường dẫn',
      type: 'slug',
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
      name: 'scope',
      title: 'Loại danh mục',
      type: 'string',
      options: {
        layout: 'radio',
        list: [
          {title: 'Sản phẩm', value: 'product'},
          {title: 'Tin tức', value: 'article'},
        ],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Mô tả',
      type: 'text',
      rows: 3,
      validation: (rule) => rule.max(300),
    }),
    defineField({
      name: 'image',
      title: 'Ảnh đại diện',
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
    defineField({
      name: 'parent',
      title: 'Danh mục cha',
      description: 'Chỉ chọn khi cần tạo danh mục con.',
      type: 'reference',
      to: [{type: 'category'}],
      validation: (rule) =>
        rule.custom((value, context) => {
          if (!value?._ref || !context.document?._id) return true
          const parentId = value._ref.replace(/^drafts\./, '')
          const currentId = context.document._id.replace(/^drafts\./, '')
          return parentId !== currentId || 'Danh mục không thể là cha của chính nó.'
        }),
    }),
    defineField({
      name: 'sortOrder',
      title: 'Thứ tự hiển thị',
      type: 'number',
      initialValue: 0,
      validation: (rule) => rule.integer().min(0),
    }),
    defineField({
      name: 'visibility',
      title: 'Hiển thị',
      type: 'string',
      options: {
        layout: 'radio',
        list: [
          {title: 'Hiển thị', value: 'visible'},
          {title: 'Ẩn', value: 'hidden'},
        ],
      },
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: {
      title: 'title',
      scope: 'scope',
      parentTitle: 'parent.title',
      media: 'image',
    },
    prepare({title, scope, parentTitle, media}) {
      const scopeLabel = scope === 'article' ? 'Tin tức' : 'Sản phẩm'
      return {
        title,
        subtitle: parentTitle ? `${scopeLabel} · Thuộc ${parentTitle}` : scopeLabel,
        media,
      }
    },
  },
})
