# 演示版验证记录

验证日期：2026-10-30。

- Node.js 22 下 TypeScript 检查与 Vite 静态构建通过。
- 在无 FastAPI、无数据库、无 API 代理的静态文件服务上完成浏览器验收。
- 项目目标弹窗：不自动关闭、点击遮罩或关闭按钮关闭、一小时内刷新或同源重新打开不重复、超时后重新显示。过期测试通过调整演示冷却时间戳模拟；未来/损坏时间戳也能恢复。
- 默认预填登录与注册、样例客户和案件、案件详情和材料目录、任务完成与重开、刷新后状态保留、独立组织样例、取消/确认重置均通过。
- 重置保留与本应用无关的浏览器存储。
- 浏览器验收确认零 API 请求、零 fetch/XHR/WebSocket 请求、零 CSP 违规、零页面运行时错误。
- Windows PowerShell 访问本地静态入口返回 HTTP 200。

测试脚本为 `e2e/smoke.mjs`；不包含真实业务处理或后端验证。Cloudflare 线上部署由仓库持有人完成，本记录不代表已发布 Cloudflare 网站。

可选浏览器复验（先启动静态预览，在项目根目录）：

```bash
npm install --no-save --package-lock=false @playwright/test@1.64.1
npx playwright install chromium
# Linux 如缺浏览器系统依赖，可执行 npx playwright install-deps chromium
BASE_URL=http://localhost:4173 node e2e/smoke.mjs
```

`npm run build` 后可用 `npm run preview` 启动 Vite 静态预览。当前本地入口是 `http://172.26.185.13:8080`，WSL 地址可能随重启变化。
