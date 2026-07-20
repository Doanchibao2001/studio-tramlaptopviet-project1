import {CogIcon} from '@sanity/icons/Cog'
import {defineArrayMember, defineField, defineType} from 'sanity'

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Cài đặt website',
  type: 'document',
  icon: CogIcon,
  groups: [
    {name: 'general', title: 'Thông tin chung', default: true},
    {name: 'hero', title: 'Hero & CTA'},
    {name: 'popup', title: 'Popup chuyển đổi'},
    {name: 'locations', title: 'Cửa hàng'},
    {name: 'footer', title: 'Footer'},
    {name: 'seo', title: 'SEO mặc định'},
  ],
  fields: [
    defineField({
      name: 'siteName',
      title: 'Tên website',
      type: 'string',
      group: 'general',
      validation: (rule) => rule.required().max(80),
    }),
    defineField({
      name: 'siteUrl',
      title: 'Tên miền chính',
      type: 'url',
      group: 'general',
      validation: (rule) => rule.required().uri({scheme: ['https']}),
    }),
    defineField({
      name: 'logo',
      title: 'Logo',
      type: 'image',
      group: 'general',
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
      name: 'hotline',
      title: 'Hotline',
      description: 'Nhập liền số điện thoại, ví dụ 0343323865.',
      type: 'string',
      group: 'general',
      validation: (rule) =>
        rule
          .required()
          .regex(/^(?:0\d{9}|\+84\d{9})$/, {name: 'số điện thoại Việt Nam'})
          .error('Nhập số dạng 0343323865 hoặc +84343323865.'),
    }),
    defineField({
      name: 'zaloUrl',
      title: 'Liên kết Zalo',
      type: 'url',
      group: 'general',
      validation: (rule) => rule.required().uri({scheme: ['https']}),
    }),
    defineField({
      name: 'email',
      title: 'Email',
      type: 'string',
      group: 'general',
      validation: (rule) => rule.email(),
    }),
    defineField({
      name: 'heroEyebrow',
      title: 'Dòng nhãn phía trên Hero',
      type: 'string',
      group: 'hero',
      validation: (rule) => rule.max(80),
    }),
    defineField({
      name: 'heroHeadline',
      title: 'Tiêu đề Hero',
      type: 'string',
      group: 'hero',
      validation: (rule) => rule.required().max(80),
    }),
    defineField({
      name: 'heroSubheadline',
      title: 'Tiêu đề nhấn mạnh',
      type: 'string',
      group: 'hero',
      validation: (rule) => rule.required().max(80),
    }),
    defineField({
      name: 'heroDescription',
      title: 'Mô tả Hero',
      type: 'text',
      rows: 3,
      group: 'hero',
      validation: (rule) => rule.required().max(240),
    }),
    defineField({
      name: 'heroImage',
      title: 'Ảnh Hero',
      type: 'image',
      group: 'hero',
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
      name: 'socialProof',
      title: 'Bằng chứng tin cậy',
      description: 'Ví dụ: +3.000 khách hàng tại TP.HCM đã tin tưởng gửi máy.',
      type: 'string',
      group: 'hero',
      validation: (rule) => rule.required().max(140),
    }),
    defineField({
      name: 'primaryCtaLabel',
      title: 'Nhãn CTA chính',
      type: 'string',
      group: 'hero',
      validation: (rule) => rule.required().max(40),
    }),
    defineField({
      name: 'secondaryCtaLabel',
      title: 'Nhãn CTA phụ',
      type: 'string',
      group: 'hero',
      validation: (rule) => rule.required().max(40),
    }),
    defineField({
      name: 'popupHeadline',
      title: 'Tiêu đề Popup',
      type: 'string',
      group: 'popup',
      validation: (rule) => rule.required().max(100),
    }),
    defineField({
      name: 'popupDescription',
      title: 'Mô tả Popup',
      type: 'text',
      rows: 3,
      group: 'popup',
      validation: (rule) => rule.required().max(240),
    }),
    defineField({
      name: 'popupPrimaryLabel',
      title: 'Nhãn nút chính',
      type: 'string',
      group: 'popup',
      validation: (rule) => rule.required().max(40),
    }),
    defineField({
      name: 'popupSecondaryLabel',
      title: 'Nhãn nút phụ',
      type: 'string',
      group: 'popup',
      validation: (rule) => rule.required().max(40),
    }),
    defineField({
      name: 'addresses',
      title: 'Địa chỉ cửa hàng',
      type: 'array',
      group: 'locations',
      of: [
        defineArrayMember({
          name: 'storeLocation',
          title: 'Cửa hàng',
          type: 'object',
          fields: [
            defineField({
              name: 'name',
              title: 'Tên chi nhánh',
              type: 'string',
              validation: (rule) => rule.required().max(80),
            }),
            defineField({
              name: 'address',
              title: 'Địa chỉ',
              type: 'string',
              validation: (rule) => rule.required().max(200),
            }),
            defineField({
              name: 'mapUrl',
              title: 'Liên kết Google Maps',
              type: 'url',
              validation: (rule) => rule.uri({scheme: ['http', 'https']}),
            }),
            defineField({
              name: 'hours',
              title: 'Giờ làm việc',
              type: 'string',
              validation: (rule) => rule.required().max(120),
            }),
          ],
          preview: {select: {title: 'name', subtitle: 'address'}},
        }),
      ],
      validation: (rule) => rule.min(1).unique(),
    }),
    defineField({
      name: 'footerDescription',
      title: 'Giới thiệu ở Footer',
      type: 'text',
      rows: 3,
      group: 'footer',
      validation: (rule) => rule.max(240),
    }),
    defineField({
      name: 'socialLinks',
      title: 'Mạng xã hội',
      type: 'array',
      group: 'footer',
      of: [
        defineArrayMember({
          name: 'socialLink',
          title: 'Mạng xã hội',
          type: 'object',
          fields: [
            defineField({
              name: 'network',
              title: 'Nền tảng',
              type: 'string',
              options: {
                list: [
                  {title: 'Facebook', value: 'facebook'},
                  {title: 'YouTube', value: 'youtube'},
                  {title: 'TikTok', value: 'tiktok'},
                  {title: 'Zalo', value: 'zalo'},
                ],
              },
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'url',
              title: 'Liên kết',
              type: 'url',
              validation: (rule) => rule.required().uri({scheme: ['http', 'https']}),
            }),
          ],
          preview: {select: {title: 'network', subtitle: 'url'}},
        }),
      ],
      validation: (rule) => rule.max(8),
    }),
    defineField({
      name: 'defaultSeo',
      title: 'SEO mặc định',
      type: 'seo',
      group: 'seo',
    }),
  ],
  preview: {
    select: {siteName: 'siteName', media: 'logo'},
    prepare({siteName, media}) {
      return {
        title: siteName || 'Cài đặt website',
        subtitle: 'Cấu hình dùng chung toàn website',
        media,
      }
    },
  },
})
