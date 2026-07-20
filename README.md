# Trạm Laptop Việt — Sanity Studio

Studio quản trị nội dung độc lập cho website Trạm Laptop Việt.

- Sanity project: `qnykgwoz`
- Dataset: `production`
- Studio online: https://studio-tramlaptopviet-project1.sanity.studio
- Frontend nằm ở thư mục sibling `../clone`; không nhúng Studio vào ứng dụng Next.js.

## Nội dung quản trị

- **Cài đặt website:** hotline, Zalo, Hero, CTA, social proof, popup, cửa hàng và SEO mặc định.
- **Sản phẩm:** danh mục, ảnh, giá, tình trạng hàng, thông số, bảo hành và SEO.
- **Bài viết:** ảnh đại diện, nội dung Portable Text, danh mục tin tức, từ khóa và SEO.
- **Danh mục:** dùng chung một kiểu tài liệu, phân biệt bằng trường `scope` (`product` hoặc `article`).

`siteSettings` là singleton có document ID cố định `siteSettings`. Các tài liệu thông thường để Sanity tự tạo `_id`.

## Chạy local

```bash
pnpm install
pnpm dev
```

## Kiểm tra và triển khai schema

```bash
pnpm build
pnpm schema:validate
pnpm schema:deploy
pnpm seed
```

Lệnh `pnpm seed` lấy nội dung ban đầu từ ứng dụng sibling `../clone`, tải ảnh lên Sanity
và chỉ tạo những tài liệu còn thiếu. Chạy lại lệnh này không ghi đè nội dung đã chỉnh sửa.

Project ID và dataset là thông tin công khai của Sanity nên được khai báo trực tiếp trong `sanity.config.ts` và `sanity.cli.ts`. Không lưu token ghi dữ liệu trong repository.
