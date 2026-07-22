import {SearchIcon} from '@sanity/icons/Search'
import {defineField, defineType} from 'sanity'
import {SeoPreviewInput} from '../../components/SeoPreviewInput'

export const seo = defineType({
  name: 'seo',
  title: 'SEO',
  type: 'object',
  icon: SearchIcon,
  components: {input: SeoPreviewInput},
  fields: [
    defineField({
      name: 'title',
      title: 'Dòng tiêu đề khách thấy trên Google (SEO Title)',
      description:
        'Viết ngắn gọn để khách muốn bấm xem. Nên dài khoảng 30–60 ký tự.',
      type: 'string',
      validation: (rule) =>
        rule
          .min(30)
          .max(60)
          .warning('Tiêu đề SEO nên dài khoảng 30–60 ký tự.'),
    }),
    defineField({
      name: 'description',
      title: 'Dòng giới thiệu khách thấy trên Google (Meta Description)',
      description:
        'Nói ngắn gọn khách sẽ biết hoặc làm được gì sau khi đọc bài. Nên dài khoảng 110–160 ký tự.',
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
      title: 'Ảnh hiện khi chia sẻ bài (Open Graph Image)',
      description: 'Ảnh khách thấy khi bài được chia sẻ lên Facebook, Zalo hoặc ứng dụng khác. Nên dùng ảnh 1200 × 630 px.',
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
      title: 'Không cho bài xuất hiện trên Google (Noindex)',
      description: 'Bình thường hãy để TẮT. Chỉ bật khi bạn thật sự không muốn khách tìm thấy bài này trên Google.',
      type: 'boolean',
      initialValue: false,
    }),
  ],
})
