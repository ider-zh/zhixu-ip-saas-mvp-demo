# 本地运行与 Cloudflare Pages 部署

这是独立根目录的 React + Vite 静态项目。仓库：

[ider-zh/zhixu-ip-saas-mvp-demo](https://github.com/ider-zh/zhixu-ip-saas-mvp-demo)

## 本地运行

使用 Node.js 22：

```bash
npm ci
npm run dev
```

开发服务地址以 Vite 终端输出为准。构建命令：

```bash
npm run build
```

构建包含 TypeScript 检查，输出目录为 `dist/`。静态文件应由 HTTP 服务提供，不直接双击 `index.html`。

## 方式一：连接 Git 仓库

在自己的 Cloudflare 控制台新建 **Pages** 项目并连接上述 GitHub 仓库，使用以下配置：

| 配置项 | 值 |
| --- | --- |
| 项目类型 | Pages 静态网站 |
| 根目录 | 仓库根目录，留空或 `/` |
| 框架 | React / Vite |
| 构建命令 | `npm run build` |
| 构建输出目录 | `dist` |
| Node 版本 | 22 |

如需显式指定构建环境 Node 版本，可在 Cloudflare 构建配置中设置 `NODE_VERSION=22`；这属于构建工具选项，不是应用密钥。业务运行无需环境变量或服务绑定。

由仓库持有人在 Cloudflare 内完成仓库连接和部署，不需要把 Cloudflare API Token 提供给协作者或写入源码。后续是否自动部署由所选 Pages 项目设置决定；本仓库 CI 本身不执行发布。

参考 [Cloudflare React 部署指南](https://developers.cloudflare.com/pages/framework-guides/deploy-a-react-site/)。

## 方式二：Direct Upload

也可以先在本地执行 `npm ci` 和 `npm run build`，再在 Cloudflare Pages 创建 Direct Upload 项目，上传 `dist/` 的内容或其压缩包。压缩包根层应直接包含 `index.html` 和资源目录，不要嵌套整个源码仓库。

本项目不需要 Functions、Worker、D1、R2 或任何 API 密钥。Cloudflare 的 Git 集成与 Direct Upload 属于不同项目创建方式；按官方说明选择，后续要改用另一方式时可新建项目。

参考 [Cloudflare Direct Upload 指南](https://developers.cloudflare.com/pages/get-started/direct-upload/)。

## GitHub Actions

`.github/workflows/ci.yml` 在推送和 Pull Request 时使用 Node.js 22、`npm ci` 和 `npm run build`，并将 `dist/` 保存为构建产物，便于下载和手动部署。

工作流不部署 Cloudflare，不需要仓库 Secrets。CI 是否通过、线上站点是否已部署，应以对应平台的实际结果为准。

## 部署后的检查

1. 页面可打开，静态资源无 404。
2. 使用预填演示账号进入工作台。
3. 打开案件详情，并完成或重新打开一项任务。
4. 刷新后任务修改仍存在于当前浏览器。
5. 创建新演示团队和组织，确认示例可浏览。
6. 在组织设置重置，恢复初始场景。

不同部署域名拥有各自独立的浏览器存储，更换域名不会搬迁原站点的本地演示内容。
