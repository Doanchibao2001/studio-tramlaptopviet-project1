import {defineField, defineType} from 'sanity'

const eventLabels: Record<string, string> = {
  page_view: 'Xem trang',
  navigation_click: 'Nhấp điều hướng',
  cta_click: 'Nhấp CTA',
  phone_click: 'Nhấp gọi điện',
  zalo_click: 'Nhấp Zalo',
  product_inquiry: 'Hỏi giá sản phẩm',
  form_submit: 'Gửi biểu mẫu',
  scroll_50: 'Cuộn 50%',
  scroll_90: 'Cuộn 90%',
  engaged_30s: 'Ở lại trên 30 giây',
}

export const webEvent = defineType({
  name: 'webEvent',
  title: 'Sự kiện website',
  type: 'document',
  fields: [
    defineField({
      name: 'occurredAt',
      title: 'Thời điểm',
      type: 'datetime',
      readOnly: true,
    }),
    defineField({
      name: 'eventName',
      title: 'Loại sự kiện',
      type: 'string',
      readOnly: true,
      options: {
        list: Object.entries(eventLabels).map(([value, title]) => ({title, value})),
      },
    }),
    defineField({
      name: 'path',
      title: 'Trang',
      type: 'string',
      readOnly: true,
    }),
    defineField({
      name: 'title',
      title: 'Tiêu đề trang',
      type: 'string',
      readOnly: true,
    }),
    defineField({
      name: 'label',
      title: 'Nhãn hành động',
      type: 'string',
      readOnly: true,
    }),
    defineField({
      name: 'target',
      title: 'Đích đến',
      type: 'string',
      readOnly: true,
    }),
    defineField({
      name: 'sessionId',
      title: 'Mã phiên ẩn danh',
      type: 'string',
      readOnly: true,
    }),
    defineField({
      name: 'referrerHost',
      title: 'Nguồn giới thiệu',
      type: 'string',
      readOnly: true,
    }),
    defineField({
      name: 'utmSource',
      title: 'UTM Source',
      type: 'string',
      readOnly: true,
    }),
    defineField({
      name: 'utmMedium',
      title: 'UTM Medium',
      type: 'string',
      readOnly: true,
    }),
    defineField({
      name: 'utmCampaign',
      title: 'UTM Campaign',
      type: 'string',
      readOnly: true,
    }),
    defineField({
      name: 'deviceType',
      title: 'Thiết bị',
      type: 'string',
      readOnly: true,
      options: {
        list: [
          {title: 'Điện thoại', value: 'mobile'},
          {title: 'Máy tính bảng', value: 'tablet'},
          {title: 'Máy tính', value: 'desktop'},
          {title: 'Không xác định', value: 'unknown'},
        ],
      },
    }),
    defineField({
      name: 'viewportWidth',
      title: 'Chiều rộng màn hình',
      type: 'number',
      readOnly: true,
    }),
    defineField({
      name: 'language',
      title: 'Ngôn ngữ trình duyệt',
      type: 'string',
      readOnly: true,
    }),
  ],
  orderings: [
    {
      title: 'Mới nhất',
      name: 'occurredAtDesc',
      by: [{field: 'occurredAt', direction: 'desc'}],
    },
  ],
  preview: {
    select: {
      eventName: 'eventName',
      path: 'path',
      label: 'label',
      occurredAt: 'occurredAt',
      deviceType: 'deviceType',
    },
    prepare({eventName, path, label, occurredAt, deviceType}) {
      const eventLabel = eventLabels[eventName] ?? eventName ?? 'Sự kiện website'
      const time = occurredAt
        ? new Date(occurredAt).toLocaleString('vi-VN', {
            dateStyle: 'short',
            timeStyle: 'short',
          })
        : 'Chưa có thời gian'
      return {
        title: label ? `${eventLabel} · ${label}` : eventLabel,
        subtitle: [path, deviceType, time].filter(Boolean).join(' · '),
      }
    },
  },
})
