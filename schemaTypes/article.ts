import {DocumentTextIcon} from '@sanity/icons/DocumentText'
import {defineArrayMember, defineField, defineType} from 'sanity'
import {slugify} from './utils/slugify'

export const article = defineType({
  name: 'article',
  title: 'Bài viết',
  type: 'document',
  icon: DocumentTextIcon,
  groups: [
    {name: 'content', title: 'Nội dung', default: true},
    {name: 'relations', title: 'Phân loại & liên quan'},
    {name: 'seo', title: 'SEO'},
  ],
  initialValue: () => ({publishedAt: new Date().toISOString()}),
  fields: [
    defineField({
      name: 'title',
      title: '👀🤖 Tiêu đề bài — Khách và Google đều đọc',
      description: 'Đây là H1 trên trang. Viết rõ chủ đề và có từ khóa chính một cách tự nhiên.',
      type: 'string',
      group: 'content',
      validation: (rule) => rule.required().max(120),
    }),
    defineField({
      name: 'slug',
      title: 'Đường dẫn',
      type: 'slug',
      group: 'content',
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
      name: 'excerpt',
      title: 'Đoạn giới thiệu',
      description: 'Dùng ở danh sách bài viết và làm mô tả SEO dự phòng.',
      type: 'text',
      rows: 3,
      group: 'content',
      validation: (rule) =>
        rule.required().max(200).warning('Nên giữ khoảng 120–160 ký tự để hiển thị tốt.'),
    }),
    defineField({
      name: 'coverImage',
      title: 'Ảnh đại diện',
      type: 'image',
      group: 'content',
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
      name: 'publishedAt',
      title: 'Ngày đăng',
      type: 'datetime',
      group: 'content',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'authorName',
      title: 'Tác giả',
      type: 'string',
      group: 'content',
      initialValue: 'Trạm Laptop Việt',
      validation: (rule) => rule.required().max(80),
    }),
    defineField({
      name: 'body',
      title: '🤖 Nội dung bài — Google đọc để hiểu chủ đề',
      description: 'Chia nội dung bằng H2/H3, trả lời đúng câu hỏi của khách và không lặp từ khóa máy móc.',
      type: 'blockContent',
      group: 'content',
      validation: (rule) => rule.required().min(1),
    }),
    defineField({
      name: 'category',
      title: 'Danh mục tin tức',
      type: 'reference',
      group: 'relations',
      to: [{type: 'category'}],
      options: {filter: 'scope == "article"'},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'keywords',
      title: '🧭 DÀNH CHO NGƯỜI VIẾT: Từ khóa & cụm content',
      description:
        'Khách không nhìn thấy trường này. DÒNG 1 = TỪ KHÓA CHÍNH; dòng sau = 2–5 cụm bài liên quan. Google chỉ hiểu tốt khi các cụm này được giải đáp thật trong nội dung.',
      type: 'array',
      group: 'seo',
      of: [
        defineArrayMember({
          type: 'string',
          validation: (rule) =>
            rule.min(3).max(80).warning('Mỗi từ khóa nên là một cụm rõ nghĩa, tối đa 80 ký tự.'),
        }),
      ],
      validation: (rule) =>
        rule
          .unique()
          .max(6)
          .warning('Nhập 1 từ khóa chính ở dòng đầu và 2–5 cụm liên quan bên dưới.'),
    }),
    defineField({
      name: 'relatedProducts',
      title: 'Sản phẩm liên quan',
      type: 'array',
      group: 'relations',
      of: [defineArrayMember({type: 'reference', to: [{type: 'product'}]})],
      validation: (rule) => rule.unique().max(8),
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
      publishedAt: 'publishedAt',
      categoryTitle: 'category.title',
      media: 'coverImage',
    },
    prepare({title, publishedAt, categoryTitle, media}) {
      const dateLabel = publishedAt
        ? new Date(publishedAt).toLocaleDateString('vi-VN')
        : 'Chưa đặt ngày đăng'
      return {
        title,
        subtitle: [categoryTitle, dateLabel].filter(Boolean).join(' · '),
        media,
      }
    },
  },
})
