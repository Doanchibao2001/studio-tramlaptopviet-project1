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
      title: 'Tiêu đề SEO',
      description:
        'Viết cho kết quả Google, ưu tiên đặt từ khóa chính gần đầu câu. Chỉ dùng 1 từ khóa chính và viết tự nhiên. Để trống để dùng tiêu đề chính của nội dung.',
      type: 'string',
      validation: (rule) =>
        rule
          .min(30)
          .max(60)
          .warning('Tiêu đề SEO nên dài khoảng 30–60 ký tự.'),
    }),
    defineField({
      name: 'description',
      title: 'Mô tả SEO',
      description:
        'Tóm tắt đúng nội dung và lợi ích người đọc nhận được; nên nhắc từ khóa chính một lần tự nhiên. Để trống để dùng mô tả hoặc đoạn trích của nội dung.',
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
      title: 'Ẩn khỏi công cụ tìm kiếm',
      description: 'Chỉ bật khi không muốn Google lập chỉ mục nội dung này.',
      type: 'boolean',
      initialValue: false,
    }),
  ],
})
