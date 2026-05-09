# 分歧 运营 Runbook

## 1. 首个管理员初始化
### 首次部署顺序
1. 配置生产环境变量，至少包括 `DATABASE_URL`、`BETTER_AUTH_SECRET`、`BETTER_AUTH_URL`、`NEXT_PUBLIC_APP_URL`、`CRON_SECRET`。如有预览域、灰度域或运营后台独立域，额外配置 `APP_TRUSTED_WRITE_ORIGINS`。
2. 执行 `pnpm db:migrate`。
3. 执行 `pnpm bootstrap:admin --email admin@example.com --password 'StrongPass123!' --name '平台管理员'`。
4. 启动应用并确认 `/api/health/live` 返回 200。
5. 依次触发四个 cron，确认后台或就绪检查中已有成功记录。

### 初始化结果确认
- 目标账号可以登录后台
- 用户角色已经是 `admin`
- `/api/health/ready` 中 `env`、`database` 为 `ok`
- 四个 tracked jobs 都已出现最近一次成功时间

## 2. 同步失败排查
### Polymarket 目录同步失败
1. 查看 `/admin` 系统状态卡，确认失败的是 `sync-polymarket-catalog` 还是其他任务。
2. 手动请求 `POST /api/cron/sync-polymarket-catalog`，携带 `Authorization: Bearer <CRON_SECRET>`。
3. 检查返回体中的 `error` 字段，区分鉴权失败、数据库失败、上游网络失败。
4. 检查 `DATABASE_URL` 是否可用，以及部署环境是否能访问外部 Polymarket 数据源。
5. 如果部署网络暂时无法访问 Gamma，可临时配置 `POLYMARKET_ALLOW_BUNDLED_FALLBACK=true` 做冷启动填充；恢复上游后再切回 `false`。
6. 恢复后再看 `/api/health/ready`，确认该任务重新回到 `fresh`。

### 价格同步失败
1. 手动请求 `POST /api/cron/sync-polymarket-prices`。
2. 重点检查最近 15 分钟内是否有成功记录；超过 15 分钟会触发 readiness 失败。
3. 若上游短时不可用，前台应继续展示最近一次有效价格，并把相关市场标记为 stale。
4. 若冷启动期间还没有外部价格，可临时启用 `POLYMARKET_ALLOW_BUNDLED_FALLBACK=true`，让价格任务基于内置热点快照写入初始盘口。
5. 恢复后确认 `/api/health/ready` 恢复为 200，再抽查一条市场详情页的时间戳与价格是否更新。

### 新闻增强失败
1. 手动请求 `POST /api/cron/enrich-news`。
2. 检查部署环境的外网访问能力，以及新闻增强依赖的上游服务是否可达。
3. 新闻增强失败通常不影响站点基本可用性，但会导致事件卡片继续使用旧内容或 fallback 内容。
4. 恢复后确认最近一次 `enrich-news` 记录为成功。

### 快照任务失败
1. 手动请求 `POST /api/cron/record-snapshots`。
2. 检查数据库写入是否正常。
3. 若超过 120 分钟没有成功记录，`/api/health/ready` 会降级失败。

## 3. Stale 处理
### 判定阈值
- `sync-polymarket-catalog`：6 小时
- `enrich-news`：8 小时
- `generate-news-candidates`：8 小时
- `sync-polymarket-prices`：15 分钟
- `record-snapshots`：120 分钟

### 处理原则
- `stale` 优先视为同步链路问题，不要先改前台展示逻辑掩盖问题。
- 先恢复 cron 或外部依赖，再确认 readiness 恢复。
- 在价格同步恢复前，不要把带外部锚点的市场强制切到纯本地模式，避免价格与外部基准长期偏离。

### 恢复动作
1. 重新执行对应 cron。
2. 如连续失败，检查最近一次部署是否改动了数据库连接、鉴权密钥或网络出口。
3. 如 readiness 仍失败，直接查看后台系统状态卡和作业日志，确认是否是 `missing`、`stale` 还是 `error`。

## 4. Cron 频率
### 生产建议频率
- `POST /api/cron/sync-polymarket-catalog`：每 6 小时一次
- `POST /api/cron/enrich-news`：每 6 小时一次，建议与目录同步错峰执行
- `POST /api/cron/generate-news-candidates`：每 6 小时一次，建议与新闻增强错峰执行
- `POST /api/cron/sync-polymarket-prices`：每 15 分钟一次
- `POST /api/cron/record-snapshots`：每 1 小时一次

### 当前 Vercel 配置
- `sync-polymarket-catalog`：`0 */6 * * *`
- `sync-polymarket-prices`：`*/15 * * * *`
- `enrich-news`：`15 */6 * * *`
- `generate-news-candidates`：`30 */6 * * *`
- `record-snapshots`：`5 * * * *`

## 5. 回滚步骤
1. 暂停四个外部同步 cron，避免旧版本回滚期间继续写入新状态。
2. 回滚应用版本到上一稳定镜像或上一稳定部署。
3. 如果本次发布包含数据库迁移，按迁移版本执行数据库回滚，或者直接恢复发布前备份。
4. 重新启动应用。
5. 验证 `GET /api/health/live` 和 `GET /api/health/ready`。
6. 抽查首页、事件详情页、后台 `/admin`、结算相关页面是否恢复正常。
7. 按顺序恢复 cron：目录同步、新闻增强、价格同步、快照。

## 6. 手动触发示例
```bash
curl -X POST 'https://<your-domain>/api/cron/sync-polymarket-catalog' \
  -H 'Authorization: Bearer <CRON_SECRET>'

curl -X POST 'https://<your-domain>/api/cron/sync-polymarket-prices' \
  -H 'Authorization: Bearer <CRON_SECRET>'

curl -X POST 'https://<your-domain>/api/cron/enrich-news' \
  -H 'Authorization: Bearer <CRON_SECRET>'

curl -X POST 'https://<your-domain>/api/cron/generate-news-candidates' \
  -H 'Authorization: Bearer <CRON_SECRET>'

curl -X POST 'https://<your-domain>/api/cron/record-snapshots' \
  -H 'Authorization: Bearer <CRON_SECRET>'
```

## 7. 发布前检查单
```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```
