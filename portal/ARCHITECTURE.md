# Lumino CBAM Portal 前端模块说明

> 更新日期：2026-10-11
> 适用范围：`Demo/lumino-cbam-site/portal/`

## 1. 当前结构

门户保持无构建工具的静态原型形态，但不再由单一 `app.js` 承担全部职责。

| 文件 | 职责 | 不应包含 |
|---|---|---|
| `domain/workflow-engine.js` | 业务对象状态、合法迁移、审计事件、年度聚合 | 页面文案与 DOM |
| `runtime/portal-config.js` | 角色、导航、年度 Mock、门户状态和工作流种子 | 页面模板与事件监听 |
| `runtime/portal-core.js` | 状态持久化、Shell、共享组件、Drawer、工作流视图适配 | 具体角色页面 |
| `pages/customer-pages.js` | 客户企业各角色页面 | 平台角色页面与全局事件 |
| `pages/role-pages.js` | 专家、复核、运营、商务、外部与平台治理页面 | 客户主流程实现 |
| `runtime/portal-events.js` | 登录、导航、表单、Drawer 和工作流操作事件 | 页面大段 HTML |
| `app.js` | 查询参数启动、在线/离线入口 | 业务规则、页面模板、组件样式 |

## 2. 脚本装载顺序

`index.html` 必须保持以下顺序：

1. `domain/workflow-engine.js`
2. `runtime/portal-config.js`
3. `runtime/portal-core.js`
4. `pages/customer-pages.js`
5. `pages/role-pages.js`
6. `runtime/portal-events.js`
7. `app.js`

当前文件使用经典 `defer` 脚本共享同一个全局词法环境。若未来改为 ES Modules，需要一次性显式导出/导入依赖，不得混用两种依赖方式。

## 3. 页面与组件约束

- 页面标题统一通过 `pageHeader()`；状态统一通过 `statusChip()`；操作统一使用 `.button--primary`、`.button--secondary` 或 `.text-button`。
- 同一工作区原则上只保留一个绿色主操作。相同动作同时出现在页头和下一步条时，页头或局部动作降为次级。
- 新增、编辑、上传和记录详情统一进入 Drawer；Toast 只确认结果，不替代表单或详情。
- 企业主档、年度管理和团队权限属于跨年度上下文，不显示年度/季度选择器。
- 宽表格在较窄桌面中只允许面板内部横向滚动，工作区本身不得横向溢出。
- 工作流详情中的状态路径必须来自 `LuminoWorkflow.definitions`，页面不得另造不完整状态集合。

## 4. 新增页面的最低验收

每个页面合并前至少验证：

1. 角色导航能进入，存在唯一 `h1`，主内容不是空白；
2. 页面上下文与对象粒度一致，跨年度页面不出现季度选择器；
3. 主要操作不超过一个，按钮使用统一组件和尺寸；
4. 表格、长标识和操作列在桌面宽度下不截断工作区；
5. 新增、编辑、上传或详情按钮能打开有内容的 Drawer；
6. 失败、锁定、无权限或待补资料都有恢复动作；
7. 控制台无错误，并通过 `node --check`、状态机测试与 `git diff --check`。

## 5. 下一步拆分边界

`styles.css` 仍然较大。下一轮若拆分，按 `tokens-and-base.css`、`shell-and-components.css`、`customer-pages.css`、`role-pages.css` 分层；只做机械迁移并保持装载顺序，不在同一提交中重做视觉方案。
