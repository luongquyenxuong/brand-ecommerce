# Brand Ecommerce

Dự án thương mại điện tử full-stack.

## Công nghệ

- Next.js, TypeScript, Tailwind CSS
- NestJS
- PostgreSQL, Prisma
- Docker Compose, Mailpit
- pnpm workspace

## Yêu cầu

- Node.js và pnpm tương thích với phiên bản đã dùng trong dự án
- Docker Desktop với Linux Engine đang chạy
- Git

## Cài đặt lần đầu

Chạy tại thư mục gốc repository:

```powershell
Copy-Item .env.example .env
pnpm install
pnpm infra:up
pnpm db:generate
pnpm --filter @brand/api exec prisma migrate deploy
pnpm db:seed
```

Chỉ sao chép `.env.example` khi chưa có `.env`.
Kiểm tra các giá trị trong `.env` khớp với Docker Compose trước khi chạy.

Nếu pnpm báo chặn build script, chạy `pnpm approve-builds`,
chọn đúng gói được báo lỗi rồi chạy lại `pnpm install`.

## Chạy phát triển

Terminal thứ nhất:

```powershell
pnpm dev:api
```

Terminal thứ hai:

```powershell
pnpm dev:web
```

- Frontend: http://localhost:3000
- API health: http://localhost:4000/api/health
- Database health: http://localhost:4000/api/health/db

## Kiểm tra dự án

```powershell
pnpm check
```

Hiện tại test tự động mới có test mặc định của backend,
chưa bao phủ nghiệp vụ thương mại điện tử.

## Thay đổi database

Sau khi sửa schema:

```powershell
pnpm --filter @brand/api exec prisma migrate dev --name ten_thay_doi
pnpm db:generate
```

Commit schema và thư mục migrations.
Prisma Client được sinh lại, không lưu trong Git.

## Cấu trúc

- apps/web: frontend
- apps/api: backend
- apps/api/prisma: schema, migrations và seed
- packages: phần dùng chung khi cần

## Trạng thái

Đã có frontend, backend, hạ tầng local và kết nối database.
Chưa triển khai chức năng bán hàng và xác thực người dùng.