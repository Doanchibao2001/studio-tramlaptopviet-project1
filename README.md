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

## Xuất bản bài viết từ GitHub

Workflow **Publish article to Sanity** nhận một file JSON hoặc Markdown và một ảnh, kiểm tra schema trước rồi mới ghi vào dataset `production`. Workflow chỉ chạy thủ công; không tự xuất bản khi push code.

- Chạy dry-run trước (mặc định) để kiểm tra nội dung, ảnh và schema mà không cần token.
- Khi dry-run đạt, chạy lại với `dry_run = false`.
- Secret `SANITY_AUTH_TOKEN` phải nằm trong GitHub Environment `sanity-production`, dùng token Sanity có quyền ghi tối thiểu vào dataset `production`.
- Nên cấu hình Environment yêu cầu chủ thương hiệu/CSO duyệt trước khi job publish được chạy.
- Workflow có `contents: read`; token không được truyền vào job validate, log hoặc file trong repo.
- Publisher tìm bài theo slug rồi `createOrReplace`, vì vậy chạy lại cùng slug sẽ cập nhật đúng bài thay vì tạo bản sao.

File Markdown dùng front matter dạng `key: value`; object/array viết bằng JSON trên một dòng. Xem `scripts/fixtures/article.example.md`.

Chạy cục bộ:

```text
node scripts/publish-article.mjs --input scripts/fixtures/article.example.md --image static/example.jpg --dry-run
```

Để publish, đặt `SANITY_AUTH_TOKEN` trong biến môi trường của tiến trình (không ghi vào `.env` được commit), bỏ `--dry-run`, và giữ `SANITY_DATASET=production`.

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
