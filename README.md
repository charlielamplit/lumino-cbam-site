# Lumino · CBAM 官网与售前报价器原型

面向出口欧盟的钢铁与铝制品企业的 CBAM 合规服务站点，以及配套的售前报价器页面组。
由 [Claude Design](https://claude.ai/design) 生成的 `.dc.html` 组件，静态托管即可运行。

官网另集成了可交互的 CBAM 成本试算器，核心规则与数据源自 `sumaorong/CBAM` 原型，并按 Lumino 品牌与线索转化路径重构。

仓库还包含登录后 CBAM 工作门户的交互原型，用于验证 Agent-first 工作方式、多年度项目和不同角色的信息边界。该原型使用演示数据，不连接真实认证、核算或报告接口。

## 页面

**免费试算器**

- 页面：`calculator/index.html`
- 短路径：`/calculator`
- 支持：行业 / CN Code、年份、年出口量、已付碳价、免费配额及缺省值 / 实测参考对比
- 试算参数在浏览器内计算，基础试算不上传用户输入
- 线索表单会将联系方式与当次试算摘要一并发送给服务端

**登录后工作门户原型**

- 页面：`portal/index.html`
- 短路径：`/portal`
- 支持：客户企业管理员 / 项目协调人 / 数据贡献者 / 内部审批人、制备专家 / 独立复核专家、运营与商务视图，2025–2028 年度流程，客户 Agent 问答与响应式布局
- 客户链路：企业与设施长期主档、产品增删改查原型、同一产品多生产配置、季度数据采集、合规交付和团队权限
- 履约链路：区分 Lumino 服务订单与客户出口订单，展示合同转订单、年度项目、专家工作包、跨角色交接和客户验收边界
- 年度引导：7 步合规路线图、当前步骤、阻塞项、下一步门槛与新年度变化确认
- 成本决策：纯默认值、前体默认 + 自身实测、全链路实测三情景同口径对比，并区分已确认与待核查的成本变化
- 内部工作台：专家 Findings / 独立复核、运营 SLA / 资源、商务报价 / 客户关系
- 权限演示：客户内部角色最小可见、制备与复核职责分离、锁定年度只读、专家工作包授权与运营履约范围
- 免费试算结果可携带年度、CN Code、数量和估算摘要进入登录页；仍需登录确认后才建立正式项目
- 登录页可使用任意演示入口；不会校验或提交页面中的演示账号
- 页面数据均为原型演示值，不代表真实客户、项目状态或合规结论
- Portal 的颜色、字体、间距、页头、按钮、状态和响应式契约见 `portal/DESIGN_SYSTEM.md`

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
- `/calculator` → CBAM 成本试算器
- `/portal` → 登录后 CBAM 工作门户原型
- `/quote` → 报价器入口

### 线索接收配置

Vercel 部署时配置 `LEAD_WEBHOOK_URL`，`/api/leads` 会将 JSON 线索数据 POST 到该地址。可对接 CRM、飞书机器人、Zapier 或 Make。未配置时接口会明确返回 `503`，前端引导用户改用预约诊断页，不会伪造提交成功。

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
├── portal/                     # 登录后工作门户交互原型
├── calculator/                 # CBAM 成本试算器
├── Lumino *.dc.html            # 15 个页面组件
├── support.js                  # Claude Design 运行时
├── doc-page.js
├── i18n-wizard.js              # 报价器双语文案
├── i18n-internal.js
└── screenshots/                # 设计过程截图
```
