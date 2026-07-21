const projectId = 'qnykgwoz'
const dataset = 'production'
const apiVersion = '2026-07-20'
const token = process.env.SANITY_AUTH_TOKEN

if (!token) throw new Error('Missing SANITY_AUTH_TOKEN')

const categoryId = 'category-cham-soc-laptop'
const articleId = 'article-laptop-nong-quat-keu-to'
const coverImageUrl =
  'https://tramlaptopviet.vn/tram-laptop-viet/service-banner.jpg'

function block(key, text, style = 'normal', listItem) {
  return {
    _key: key,
    _type: 'block',
    style,
    ...(listItem ? {level: 1, listItem} : {}),
    markDefs: [],
    children: [{_key: `${key}-span`, _type: 'span', marks: [], text}],
  }
}

async function uploadImageFromUrl(url, filename) {
  const source = await fetch(url)
  if (!source.ok) {
    throw new Error(`Cannot download cover image: ${source.status} ${source.statusText}`)
  }

  const contentType = source.headers.get('content-type') || 'image/jpeg'
  const imageBytes = await source.arrayBuffer()
  const upload = await fetch(
    `https://${projectId}.api.sanity.io/v${apiVersion}/assets/images/${dataset}?filename=${encodeURIComponent(filename)}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': contentType,
      },
      body: imageBytes,
    },
  )

  const result = await upload.json()
  if (!upload.ok || !result?.document?._id) {
    throw new Error(`Sanity image upload failed: ${JSON.stringify(result)}`)
  }
  return result.document._id
}

const body = [
  block('intro', 'Laptop nóng và quạt kêu to không phải lúc nào cũng đồng nghĩa quạt đã hỏng. Nhiệt độ cao có thể xuất phát từ bụi bám trong cụm tản nhiệt, keo tản nhiệt đã khô, ứng dụng chạy nền hoặc hệ thống đang phải xử lý vượt quá khả năng hiện tại. Xác định đúng nguyên nhân trước khi thay linh kiện giúp tránh tốn chi phí không cần thiết.'),
  block('h2-dau-hieu', 'Dấu hiệu laptop đang tản nhiệt không hiệu quả', 'h2'),
  block('p-dau-hieu-1', 'Nhiệt độ của laptop thay đổi theo cấu hình, môi trường và tác vụ sử dụng. Tuy nhiên, nếu máy nóng rõ rệt dù chỉ mở trình duyệt, quạt quay lớn trong thời gian dài hoặc hiệu năng giảm sau vài phút làm việc, hệ thống tản nhiệt nên được kiểm tra.'),
  block('b-dau-hieu-1', 'Quạt quay lớn liên tục dù máy không chạy tác vụ nặng.', 'normal', 'bullet'),
  block('b-dau-hieu-2', 'Khu vực bàn phím hoặc đáy máy nóng nhanh hơn bình thường.', 'normal', 'bullet'),
  block('b-dau-hieu-3', 'Máy chậm, giật hoặc tự giảm hiệu năng khi làm việc lâu.', 'normal', 'bullet'),
  block('b-dau-hieu-4', 'Laptop tự tắt, khởi động lại hoặc báo nhiệt độ cao.', 'normal', 'bullet'),
  block('h2-nguyen-nhan', 'Những nguyên nhân thường gặp', 'h2'),
  block('p-nguyen-nhan-1', 'Bụi tích tụ trong quạt và lá tản nhiệt là nguyên nhân phổ biến, đặc biệt với máy sử dụng trong môi trường nhiều bụi hoặc đã lâu chưa vệ sinh. Khi khe thoát gió bị cản, quạt phải quay nhanh hơn nhưng lượng nhiệt thoát ra vẫn giảm.'),
  block('p-nguyen-nhan-2', 'Keo tản nhiệt giữa CPU, GPU và cụm heatsink có thể khô theo thời gian. Ngoài ra, phần mềm chạy nền, trình duyệt mở quá nhiều tab, driver lỗi hoặc pin xuống cấp cũng có thể khiến máy sinh nhiệt nhiều hơn.'),
  block('b-nguyen-nhan-1', 'Bụi bám trong quạt, khe hút gió hoặc lá tản nhiệt.', 'normal', 'bullet'),
  block('b-nguyen-nhan-2', 'Keo tản nhiệt đã khô hoặc tiếp xúc tản nhiệt không tốt.', 'normal', 'bullet'),
  block('b-nguyen-nhan-3', 'CPU hoặc GPU hoạt động cao do ứng dụng chạy nền.', 'normal', 'bullet'),
  block('b-nguyen-nhan-4', 'Quạt yếu, kẹt hoặc phát tiếng bất thường.', 'normal', 'bullet'),
  block('h2-tu-kiem-tra', 'Các bước kiểm tra an toàn tại nhà', 'h2'),
  block('p-tu-kiem-tra-1', 'Bạn có thể đặt laptop trên mặt phẳng cứng, kiểm tra khe gió có bị che và tắt các ứng dụng không cần thiết. Mở Task Manager để quan sát CPU, Memory và Disk khi máy đang ở trạng thái nghỉ. Nếu một tiến trình sử dụng tài nguyên cao liên tục, hãy đóng ứng dụng hoặc khởi động lại máy để kiểm tra lại.'),
  block('p-tu-kiem-tra-2', 'Không nên tự dùng máy thổi công suất lớn vào khe tản nhiệt, nhỏ dầu vào quạt hoặc tháo heatsink khi chưa có dụng cụ phù hợp. Việc lắp sai lực siết hoặc làm rách cáp quạt có thể khiến lỗi nặng hơn.'),
  block('h2-khi-nao', 'Khi nào nên mang máy đi kiểm tra?', 'h2'),
  block('p-khi-nao-1', 'Nên dừng sử dụng và mang máy đi kiểm tra khi quạt phát tiếng cạ, máy tự tắt, có mùi khét hoặc nhiệt độ tăng đột ngột sau khi rơi, va đập hay vào nước. Kỹ thuật viên cần kiểm tra cụm quạt, heatsink, keo tản nhiệt và mức tiêu thụ tài nguyên trước khi kết luận có cần thay linh kiện hay không.'),
  block('p-khi-nao-2', 'Tại Trạm Laptop Việt, máy được kiểm tra đúng tình trạng và báo giá trước khi thực hiện. Chỉ vệ sinh, sửa chữa hoặc thay linh kiện sau khi khách hàng đã đồng ý với phương án.'),
]

const assetId = await uploadImageFromUrl(
  coverImageUrl,
  'laptop-nong-quat-keu-to-service-banner.jpg',
)
const coverImage = {
  _type: 'image',
  asset: {_type: 'reference', _ref: assetId},
  alt: 'Kiểm tra laptop nóng và quạt kêu to tại Trạm Laptop Việt',
}

const mutations = [
  {
    createIfNotExists: {
      _id: categoryId,
      _type: 'category',
      title: 'Chăm sóc laptop',
      slug: {_type: 'slug', current: 'cham-soc-laptop'},
      scope: 'article',
      sortOrder: 10,
      visibility: 'visible',
    },
  },
  {
    createOrReplace: {
      _id: articleId,
      _type: 'article',
      title: 'Laptop nóng và quạt kêu to: Nguyên nhân, cách kiểm tra an toàn',
      slug: {_type: 'slug', current: 'laptop-nong-quat-keu-to-nguyen-nhan-cach-kiem-tra'},
      excerpt: 'Nhận biết nguyên nhân laptop nóng, quạt kêu lớn và các bước kiểm tra an toàn trước khi quyết định vệ sinh, sửa chữa hoặc thay quạt.',
      coverImage,
      publishedAt: '2026-07-21T18:00:00+07:00',
      authorName: 'Trạm Laptop Việt',
      body,
      category: {_type: 'reference', _ref: categoryId},
      keywords: ['laptop nóng', 'quạt laptop kêu to', 'vệ sinh laptop', 'tản nhiệt laptop'],
      seo: {
        _type: 'seo',
        title: 'Laptop nóng, quạt kêu to: Nguyên nhân và cách kiểm tra',
        description: 'Tìm hiểu nguyên nhân laptop nóng, quạt kêu lớn và cách kiểm tra an toàn trước khi vệ sinh, sửa chữa hoặc thay linh kiện.',
        image: coverImage,
        noIndex: false,
      },
    },
  },
]

const response = await fetch(
  `https://${projectId}.api.sanity.io/v${apiVersion}/data/mutate/${dataset}?returnIds=true&visibility=sync`,
  {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({mutations}),
  },
)

const result = await response.json()
if (!response.ok) throw new Error(`Sanity publish failed: ${JSON.stringify(result)}`)
console.log(JSON.stringify(result, null, 2))
