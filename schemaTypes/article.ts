import {DocumentTextIcon} from '@sanity/icons/DocumentText'
import {defineArrayMember, defineField, defineType} from 'sanity'
import {slugify} from './utils/slugify'

export const article = defineType({
  name: 'article',
  title: 'Bài viết',
  type: 'document',
  icon: DocumentTextIcon,
  groups: [
    {name: 'content', title: '1. Viết bài', default: true},
    {name: 'google', title: '2. Khách thấy trên Google (SEO)'},
    {name: 'planning', title: '3. Gợi ý để viết bài (Keyword Plan)'},
    {name: 'relations', title: '4. Sắp xếp bài viết'},
    {name: 'workflow', title: '5. Duyệt & hẹn giờ đăng'},
  ],
  initialValue: () => ({workflowStatus: 'draft'}),
  fields: [
    defineField({
      name: 'title',
      title: 'Tên bài viết (H1)',
      description:
        'Đây là dòng chữ lớn khách thấy khi mở bài. Viết rõ bài nói về việc gì; ví dụ: “Pin laptop bị chai: Dấu hiệu và cách xử lý”.',
      type: 'string',
      group: 'content',
      validation: (rule) => rule.required().max(120),
    }),
    defineField({
      name: 'slug',
      title: 'Đường dẫn bài viết (Slug)',
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
      title: 'Đoạn giới thiệu ngắn (Excerpt)',
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
      title: 'Ngày đã đăng',
      description: 'Hệ thống tự điền khi bài được xuất bản. Không dùng ô này để hẹn lịch.',
      type: 'datetime',
      group: 'workflow',
      readOnly: true,
    }),
    defineField({
      name: 'workflowStatus',
      title: 'Trạng thái duyệt',
      description: 'Chỉ bài “Đã duyệt – sẵn sàng đăng” mới được lịch tự động xuất bản.',
      type: 'string',
      group: 'workflow',
      initialValue: 'draft',
      options: {
        layout: 'radio',
        list: [
          {title: 'Bản nháp', value: 'draft'},
          {title: 'Chờ duyệt', value: 'pendingReview'},
          {title: 'Cần sửa', value: 'changesRequested'},
          {title: 'Đã duyệt – sẵn sàng đăng', value: 'approved'},
          {title: 'Đã xuất bản', value: 'published'},
        ],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'scheduledAt',
      title: 'Giờ dự kiến xuất bản',
      description: 'Chọn một trong ba khung giờ: 08:00, 13:00 hoặc 19:00 (giờ Việt Nam).',
      type: 'datetime',
      group: 'workflow',
      validation: (rule) =>
        rule.custom((value, context) => {
          const status = (context.parent as {workflowStatus?: string} | undefined)?.workflowStatus
          return status === 'approved' && !value
            ? 'Bài đã duyệt phải có giờ dự kiến xuất bản.'
            : true
        }),
    }),
    defineField({
      name: 'approvalNote',
      title: 'Ghi chú duyệt',
      type: 'text',
      rows: 2,
      group: 'workflow',
      validation: (rule) => rule.max(500),
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
      title: 'Nội dung bài viết',
      description: 'Chia bài thành các đoạn có tiêu đề nhỏ (H2/H3), trả lời đúng điều khách đang muốn biết và viết tự nhiên.',
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
      title: 'Những câu khách có thể tìm (Keyword Cluster)',
      description:
        'Dòng đầu nhập câu quan trọng nhất. Các dòng sau nhập 2–5 câu liên quan. Đây là gợi ý cho người viết; khách không nhìn thấy ô này.',
      type: 'array',
      group: 'planning',
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
          .warning('Nhập câu quan trọng nhất ở dòng đầu và 2–5 câu liên quan bên dưới.'),
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
      title: 'Cách bài xuất hiện trên Google (SEO)',
      type: 'seo',
      group: 'google',
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
