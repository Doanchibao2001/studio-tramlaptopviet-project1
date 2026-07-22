import {SearchIcon} from '@sanity/icons/Search'
import {defineField, defineType} from 'sanity'

export const seo = defineType({
  name: 'seo',
  title: 'SEO',
  type: 'object',
  icon: SearchIcon,
  fields: [
    defineField({
      name: 'title',
      title: '👀 KHÁCH THẤY: Tiêu đề trên Google',
      description:
        'Dòng chữ lớn trong kết quả tìm kiếm. Đặt từ khóa chính gần đầu câu, khoảng 30–60 ký tự.',
      type: 'string',
      validation: (rule) =>
        rule
          .min(30)
          .max(60)
          .warning('Tiêu đề SEO nên dài khoảng 30–60 ký tự.'),
    }),
    defineField({
      name: 'description',
      title: '👀 KHÁCH THẤY: Mô tả trên Google',
      description:
        'Đoạn chữ dưới tiêu đề tìm kiếm. Nêu lợi ích, nhắc từ khóa chính 1 lần, khoảng 110–160 ký tự.',
      type: 'text',
      rows: 3,
      validation: (rule) =>
        rule
          .min(110)
          .max(160)
          .warning('Mô tả SEO nên dài khoảng 110–160 ký tự.'),
    }),
    defineField({
      name: 'image',
      title: 'Ảnh chia sẻ mạng xã hội',
      description: 'Khuyến nghị tỷ lệ 1200 × 630 px.',
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
      name: 'noIndex',
      title: '🤖 GOOGLE ĐỌC: Ẩn bài khỏi tìm kiếm',
      description: 'Bình thường phải để TẮT. Chỉ bật khi không muốn bài xuất hiện trên Google.',
      type: 'boolean',
      initialValue: false,
    }),
  ],
})
