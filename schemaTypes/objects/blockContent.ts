import {BlockContentIcon} from '@sanity/icons/BlockContent'
import {defineArrayMember, defineField, defineType} from 'sanity'

export const blockContent = defineType({
  name: 'blockContent',
  title: 'Nội dung bài viết',
  type: 'array',
  icon: BlockContentIcon,
  of: [
    defineArrayMember({
      type: 'block',
      styles: [
        {title: 'Đoạn văn', value: 'normal'},
        {title: 'Tiêu đề cấp 2', value: 'h2'},
        {title: 'Tiêu đề cấp 3', value: 'h3'},
        {title: 'Trích dẫn', value: 'blockquote'},
      ],
      lists: [
        {title: 'Danh sách dấu chấm', value: 'bullet'},
        {title: 'Danh sách đánh số', value: 'number'},
      ],
      marks: {
        annotations: [
          defineArrayMember({
            name: 'link',
            title: 'Liên kết',
            type: 'object',
            fields: [
              defineField({
                name: 'href',
                title: 'Đường dẫn',
                type: 'url',
                validation: (rule) =>
                  rule.required().uri({
                    allowRelative: true,
                    scheme: ['http', 'https', 'mailto', 'tel'],
                  }),
              }),
              defineField({
                name: 'openInNewTab',
                title: 'Mở trong tab mới',
                type: 'boolean',
                initialValue: false,
              }),
            ],
          }),
        ],
      },
    }),
    defineArrayMember({
      name: 'contentImage',
      title: 'Ảnh minh họa',
      type: 'image',
      options: {hotspot: true},
      fields: [
        defineField({
          name: 'alt',
          title: 'Mô tả ảnh',
          type: 'string',
          validation: (rule) => rule.required().max(150),
        }),
        defineField({
          name: 'caption',
          title: 'Chú thích',
          type: 'string',
          validation: (rule) => rule.max(200),
        }),
      ],
    }),
  ],
})
