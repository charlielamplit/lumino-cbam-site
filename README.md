# Lumino · CBAM 官网与售前报价器原型

面向出口欧盟的钢铁与铝制品企业的 CBAM 合规服务站点，以及配套的售前报价器页面组。
由 [Claude Design](https://claude.ai/design) 生成的 `.dc.html` 组件，静态托管即可运行。

## 页面

**官网（6 页）**

| 页面 | 文件 |
|---|---|
| 首页 | `Lumino 官网.dc.html` |
| 平台 | `Lumino 平台.dc.html` |
| CBAM 指南 | `Lumino CBAM 指南.dc.html` |
| 指南文章 | `Lumino 指南文章.dc.html` |
| 关于 | `Lumino 关于.dc.html` |
| 联系 | `Lumino 联系.dc.html` |

**报价器页面组（入口 1 个 + 内嵌 8 个）**

入口：`Lumino 报价器.dc.html` —— 它通过 `dc-import` 内嵌下列页面并在内部切换：

| 页面 | 文件 |
|---|---|
| 设计系统 | `Lumino 设计系统.dc.html` |
| 签名组件 | `Lumino 签名组件.dc.html` |
| 四步向导 | `Lumino 四步向导.dc.html` |
| 方案书 | `Lumino 方案书.dc.html` |
| 客户确认页 | `Lumino 确认页.dc.html` |
| 设施填报页 | `Lumino 填报页.dc.html` |
| 售前流程原型 | `Lumino 报价器 售前流程.dc.html` |

官网首页的「获取报价 ↗」在导航、Hero、页脚三处出现，均以 `target="_blank"` 在新标签页打开报价器入口。

## 本地预览

`.dc.html` 需要经 HTTP 提供（`file://` 下 `fetch` 会被 CORS 拦截）：

```bash
python3 -m http.server 8080
# 打开 http://localhost:8080/
```

## 部署

已含 `vercel.json`。静态站点，无构建步骤。

```bash
npx vercel          # 预览
npx vercel --prod   # 生产
```

部署后可用的短路径：

- `/` → 首页（经 `index.html` 跳转）
- `/site` → 首页
- `/quote` → 报价器入口

## 注意事项

- **文件名不要改。** `Lumino 报价器.dc.html` 用 `dc-import name="..."` 按**文件名**解析其它页面的路径（`./<name>.dc.html`），重命名会导致页面组内嵌失败。
- **运行时依赖 unpkg。** `support.js` 在运行时从 `unpkg.com` 加载 React 18 / ReactDOM / Babel Standalone。首屏需要公网可达 unpkg，且因为要在浏览器里编译组件逻辑，首次渲染有可感知的延迟。若要上生产，应改为自托管这三个依赖。
- **页面内数据为演示值。** 报价器页面组中的客户名称、货量、单价、排放强度、证书价格等均为原型演示数据，不构成任何报价或合规结论。
- 法规相关表述以最新实施条例为准。

## 目录

```
.
├── index.html                  # 跳转到首页
├── vercel.json
├── Lumino *.dc.html            # 15 个页面组件
├── support.js                  # Claude Design 运行时
├── doc-page.js
├── i18n-wizard.js              # 报价器双语文案
├── i18n-internal.js
└── screenshots/                # 设计过程截图
```
