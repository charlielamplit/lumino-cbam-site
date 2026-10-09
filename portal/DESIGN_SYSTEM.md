# Lumino CBAM Portal · UI Contract

> 适用范围：`portal/` 登录页与登录后客户、专家、运营、商务页面。
> 设计语气：清晰、可信、克制严谨；像一名会把复杂事情讲清楚的合规同事。

## 1. 界面原则

1. 客户先看到业务任务，专业字段逐步展开。
2. 每个页面只有一个明确的主操作，其余使用次操作或文字操作。
3. 深绿用于当前结论、重要上下文与年度控制；暖黄只表达待处理、不确定或需要关注。
4. 卡片只用于存在明确对象边界的内容，不为装饰而套卡片。
5. 动态结果必须告知用户；正式状态不只靠颜色表达。

## 2. Token 层级

`styles.css` 的 `:root` 分为四层：

| 层级 | 代表 Token | 使用方式 |
|---|---|---|
| 品牌原语 | `--forest` `--green` `--yellow` `--mint` | 不直接表达业务状态 |
| 语义颜色 | `--surface-*` `--text-*` `--status-*` | 组件优先使用本层 |
| 尺寸与节奏 | `--space-*` `--control-*` `--radius-*` | 禁止为新组件随意新增 13px/17px 等数值 |
| 交互 | `--duration-fast` `--ease-out` `--focus-ring` | 所有焦点和快速反馈共用 |

新增 token 前先检查它是否有跨 3 个组件的复用价值。

## 3. 字体

- Display：Archivo，用于品牌和页面级标题。
- Body：Atkinson Hyperlegible Next + Noto Sans SC，用于表单、表格和说明。
- Label：Azeret Mono，只用于短小的英文 eyebrow、编号和记录代码。
- 应用内页标题使用固定尺寸，不使用大幅流式字号；登录叙事区可使用 `clamp()`。

## 4. 基础组件

### Page Header

所有一级页面通过 `pageHeader(eyebrow, title, aside)` 生成：

- 左侧：短 eyebrow + 唯一 `h1`；
- 右侧：只能是主操作、当前状态或角色视图说明；
- 不在页头重复主体页面已经显示的指标。

### Button

| 变体 | 类名 | 场景 |
|---|---|---|
| Primary | `.button.button--primary` | 创建、上传、确认、邀请 |
| Secondary | `.button.button--secondary` | 编辑、取消、预览、非破坏性备选操作 |
| Text | `.text-button` | 页内导航、展开解释；仍需 44px 触控区 |
| Icon | `.icon-button` / `.round-action` | 必须有可理解的 `aria-label` |

`.action.primary-action` / `.action.secondary-action` 是已有原型的兼容别名；新建页面只使用 `.button` 命名。

### Status

- 年度/项目阶段：`statusChip(label, tone)` / `.status-chip`。
- 行级处理状态：`.record-state`。
- `warn` 只表达需注意，不与错误或拒绝混用。
- 所有状态必须同时包含文字，不能只显示彩色点。

### Panel

- `.panel` 只定义边界与表面；
- `.panel-head` 是标准容器标题；
- `.section-heading` 仅用于复合对象内部区域，不作为新的页面标题变体；
- 禁止纯装饰性卡片嵌套。

## 5. 可访问性契约

- 导航当前项使用 `aria-current="page"`；
- 年度路线当前步使用 `aria-current="step"`；
- 可切换对象使用 `aria-pressed`；
- 按钮和选择控件最小高度 44px；
- 页面动态反馈通过 `#toast[role=status][aria-live=polite]` 播报；
- 不以颜色作为唯一状态线索；
- 强制颜色模式下，当前导航、步骤和产品保留轮廓。

## 6. 响应式契约

- `>1120px`：桌面多栏，侧边导航常驻。
- `821–1120px`：平板/窄屏，次要上下文换行。
- `561–820px`：单栏主体，导航抽屉。
- `320–560px`：触控优先，主体文字不小于 14px，核心功能不隐藏。
- 表格可在自身容器内滚动，不允许撬开整页宽度。

## 7. 新页面检查清单

- [ ] 使用 `pageHeader()` 且只有一个 `h1`
- [ ] 页面最多一个主操作
- [ ] 新样式使用语义 token，没有新的硬编码品牌色
- [ ] 当前项有 ARIA 状态
- [ ] 390px 无整页横向溢出
- [ ] 键盘焦点可见
- [ ] 动态操作有成功/失败反馈
- [ ] `prefers-reduced-motion` 下不依赖动画理解状态
