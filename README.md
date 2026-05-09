# 分歧

分歧是一个中文事件概率站，使用积分记账，不接真实支付。站点围绕公开事件、公开来源和可复核结算运行，生产环境依赖 PostgreSQL、Better Auth 和一组受 `CRON_SECRET` 保护的同步任务。

## 项目概览
- 技术栈：Next.js 16 App Router、React 19、Drizzle ORM、PostgreSQL、Better Auth
- 运行模式：前台展示事件与盘口，后台负责运营管理、结算与健康检查
- 外部同步：Polymarket 目录同步、价格同步、新闻增强、价格快照
- 健康检查：`/api/health/live` 用于存活探针，`/api/health/ready` 用于上线前和运行中就绪检查

## 本地启动
### 前置条件
- Node.js 20+
- pnpm 10
- 可写的 PostgreSQL 数据库

### 启动步骤
```bash
cp .env.example .env
pnpm install
pnpm db:migrate
pnpm db:seed
pnpm dev
```

本地开发约定：
- 默认地址：`http://localhost:3000`
- 开发环境允许使用仓库内置默认值补全部分必填变量
- `pnpm db:seed` 仅用于开发环境；生产环境不要执行

## 环境变量
### 必填
- `DATABASE_URL`：PostgreSQL 连接串
- `BETTER_AUTH_SECRET`：认证服务端密钥
- `BETTER_AUTH_URL`：认证回调绝对地址
- `NEXT_PUBLIC_APP_URL`：前端公开访问地址
- `CRON_SECRET`：cron 接口 Bearer Token

### 认证与邮件
- `AUTH_ALLOW_PUBLIC_SIGNUP`：是否允许公开注册
- `AUTH_REQUIRE_EMAIL_VERIFICATION`：是否要求邮箱验证后交易
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASSWORD`
- `SMTP_FROM`

说明：只有在邮件能力完整可用时，才建议在生产环境开启公开注册和密码重置。

### 站点信息与运营参数
- `SUPPORT_EMAIL`：站点联系邮箱
- `APP_ORG_NAME`：运营主体名称
- `APP_ICP_LICENSE`：ICP备案号
- `APP_PUBLIC_SECURITY_LICENSE`：公安备案号
- `APP_TRUSTED_WRITE_ORIGINS`：生产环境额外允许的写请求来源，多个 origin 用英文逗号分隔；主站域名会自动来自 `NEXT_PUBLIC_APP_URL`
- `APP_ALLOW_CURATED_HOME_FALLBACK`：仅建议本地验收/演示设置为 `true`，在外部实时事件不足时允许首页显示本地策展事件；生产默认保持关闭
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME`：首个管理员初始化时可选使用
- `POLYMARKET_GAMMA_BASE_URL` / `POLYMARKET_CLOB_BASE_URL` / `POLYMARKET_FETCH_TIMEOUT_MS`：Polymarket 上游地址与超时控制
- `SOURCE_HEALTH_TIMEOUT_MS`：外部源探针超时，默认沿用 Polymarket 抓取超时
- `POLYMARKET_ALLOW_BUNDLED_FALLBACK`：仅用于冷启动兜底；生产首页不应依赖仓库内置快照填充
- `REPORTS_BASE_URL`、`REPORTS_LLM_BASE_URL`、`REPORTS_LLM_MODEL`、`REPORTS_LLM_API_KEY`、`REPORTS_SYNC_LIMIT`、`REPORTS_PER_PLATFORM_LIMIT`、`REPORTS_PLATFORM_ALLOWLIST`：LLM 生成事件同步的可选配置；未显式配置 `REPORTS_BASE_URL` 时不会访问报告服务

如果部署环境直连 Polymarket 超时，配置反向代理，不要开启示例 fallback 代替真实数据：

```bash
POLYMARKET_GAMMA_BASE_URL=https://your-proxy.example.com/gamma/events
POLYMARKET_CLOB_BASE_URL=https://your-proxy.example.com/clob
SOURCE_HEALTH_TIMEOUT_MS=3000
```

代理需要把 `/gamma/events` 转发到 `https://gamma-api.polymarket.com/events`，把 `/clob/*` 转发到 `https://clob.polymarket.com/*`。

## 管理员初始化
### 首次上线
```bash
pnpm db:migrate
pnpm bootstrap:admin --email admin@example.com --password 'StrongPass123!' --name '平台管理员'
```

脚本行为：
- 若邮箱不存在，会创建用户并提升为 `admin`
- 若邮箱已存在，会直接把该用户提升为 `admin`
- 会把 `emailVerified` 标记为已验证

### 使用环境变量初始化
```bash
ADMIN_EMAIL=admin@example.com \
ADMIN_PASSWORD='StrongPass123!' \
ADMIN_NAME='平台管理员' \
pnpm bootstrap:admin
```

## Cron 概览
### 路由与频率
- `POST /api/cron/sync-polymarket-catalog`：每 6 小时同步 Polymarket 目录
- `POST /api/cron/enrich-news`：每 6 小时补充新闻内容
- `POST /api/cron/generate-news-candidates`：每 6 小时从新闻源生成待审核候选
- `POST /api/cron/sync-polymarket-prices`：每 15 分钟同步盘口价格
- `POST /api/cron/probe-polymarket-sources`：每 10 分钟探测 Polymarket Gamma / CLOB 可达性
- `POST /api/cron/record-snapshots`：每 1 小时记录价格快照

### 鉴权
所有 cron 接口都要求：

```text
Authorization: Bearer <CRON_SECRET>
```

### 就绪阈值
`/api/health/ready` 会检查最近一次作业是否仍在有效期内，并把 Polymarket Gamma / CLOB 的可达性纳入就绪判断：
- `sync-polymarket-catalog`：6 小时内
- `enrich-news`：8 小时内
- `generate-news-candidates`：8 小时内
- `sync-polymarket-prices`：15 分钟内
- `probe-polymarket-sources`：10 分钟内
- `record-snapshots`：120 分钟内

任一关键作业 `stale`、`missing` 或 `error`，就绪检查会返回非 200。

### 外部源诊断
- `GET /api/health/sources`：返回 Polymarket Gamma 和 CLOB 的最新探针结果
- `/admin`：显示外部源可达性、最近同步时间和最新作业状态

## 健康检查
- `GET /api/health/live`：进程存活
- `GET /api/health/ready`：环境变量、数据库连接、关键 cron 新鲜度

上线后至少检查一次：
```bash
curl -fsS http://127.0.0.1:3000/api/health/live
curl -fsS http://127.0.0.1:3000/api/health/ready
```

## Docker 运行
仓库内置 `Dockerfile`，构建阶段会执行 `pnpm build`，因此即使只做镜像构建，也要提供构建期占位环境变量。

### 导出镜像
```bash
./scripts/export-image.sh
```

默认产物：
- `tmp/images/<image-tag>.tar`
- `tmp/images/<image-tag>.tar.sha256`

### 运行容器
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

## 发布前验证
```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```
