# 分歧

中文事件概率站。站点使用积分记账，不接真实支付；事件、概率、来源和结算都以公开可复核信息为准。

## 技术栈
- Next.js 16 App Router
- React 19
- Drizzle ORM + PostgreSQL
- Better Auth
- Vitest + ESLint + TypeScript

## 本地启动
1. 复制环境变量模板。
2. 填写数据库、认证密钥和站点地址。
3. 执行迁移与开发 seed。
4. 启动开发服务。

```bash
cp .env.example .env
pnpm install
pnpm db:migrate
pnpm db:seed
pnpm dev
```

## 必需环境变量
- `DATABASE_URL`: PostgreSQL 连接串
- `BETTER_AUTH_SECRET`: Better Auth 服务端密钥
- `BETTER_AUTH_URL`: 认证服务绝对地址
- `NEXT_PUBLIC_APP_URL`: 前端公开地址
- `CRON_SECRET`: cron 鉴权密钥

## 可选环境变量
- `SUPPORT_EMAIL`: 页脚投诉与联系邮箱
- `APP_ORG_NAME`: 运营主体名称
- `APP_ICP_LICENSE`: ICP 备案号
- `APP_PUBLIC_SECURITY_LICENSE`: 公安备案号
- `AUTH_ALLOW_PUBLIC_SIGNUP`: 是否允许公开注册
- `AUTH_REQUIRE_EMAIL_VERIFICATION`: 是否要求邮箱验证后交易
- `SMTP_*`: 事务邮件配置；只有接入邮件后才建议开放公开注册和密码重置

## 生产初始化
不要在生产运行 `pnpm db:seed`。

首次创建管理员：

```bash
pnpm bootstrap:admin --email admin@example.com --password 'StrongPass123!' --name '平台管理员'
```

## 定时任务
- `POST /api/cron/sync-polymarket-catalog`: 6 小时
- `POST /api/cron/enrich-news`: 6 小时
- `POST /api/cron/sync-polymarket-prices`: 15 分钟
- `POST /api/cron/record-snapshots`: 1 小时

所有 cron 接口都要求：

```text
Authorization: Bearer <CRON_SECRET>
```

## 健康检查
- `GET /api/health/live`: 进程存活
- `GET /api/health/ready`: 环境变量、数据库、关键作业新鲜度

## 导出 Docker 镜像（ClawCloud 可用）
仓库已内置 `Dockerfile` 和导出脚本，可直接生成镜像 tar 上传到云服务器导入。

```bash
# 生成镜像并导出 tar + sha256
./scripts/export-image.sh
```

默认产物位置：
- `tmp/images/<image-tag>.tar`
- `tmp/images/<image-tag>.tar.sha256`

在云服务器导入并运行：

```bash
docker load -i <image-tag>.tar

docker run -d --name fenqi \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e DATABASE_URL='postgres://<user>:<pass>@<host>:5432/<db>' \
  -e BETTER_AUTH_SECRET='<secret>' \
  -e BETTER_AUTH_URL='https://<your-domain>' \
  -e NEXT_PUBLIC_APP_URL='https://<your-domain>' \
  -e CRON_SECRET='<cron-secret>' \
  -e SUPPORT_EMAIL='ops@example.com' \
  <image-tag>
```

## 验证命令
```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```
