# Gemini Frontend Context

## Stack
- React 19
- Next.js 16 App Router
- Tailwind CSS v4
- shadcn/ui style local wrappers
- Icons: `lucide-react`

## Goal
只改前端页面和视觉表现，保持现有业务逻辑、接口调用、上传/撤销/排序/删除行为完全不变。

## Core Files
把下面这些文件直接发给 Gemini，已经够它重构页面 UI：

- `src/app/layout.tsx`
- `src/app/globals.css`
- `src/app/page.tsx`
- `src/components/upload-panel.tsx`
- `src/components/exhibition-gallery.tsx`
- `src/components/gallery-entry-actions.tsx`

## Supporting Files
如果 Gemini 需要知道组件样式封装和辅助方法，再补这些：

- `src/components/ui/button.tsx`
- `src/components/ui/card.tsx`
- `src/components/ui/badge.tsx`
- `src/components/ui/separator.tsx`
- `src/lib/formatters.ts`
- `src/lib/gallery.ts`
- `src/lib/utils.ts`

## Pasteable Prompt
```text
你现在是一位资深的前端开发专家和 UI/UX 设计师。

我的前端技术栈是：
- React 19
- Next.js 16 App Router
- Tailwind CSS v4
- shadcn/ui 风格组件封装

请你帮我重写并美化我接下来给你的前端页面代码。

严格要求：
1. 保持原有业务逻辑和功能完全不变。
2. 不要修改接口路径、请求方式、字段结构、状态流和上传/删除/撤销/排序逻辑。
3. 只优化页面结构、视觉设计、交互细节、响应式布局和代码可读性。
4. 设计风格参考 Apple / Vercel：现代、极简、干净、克制、高级。
5. 深度利用 Tailwind CSS，优化留白、圆角、边框、阴影、层级、hover/focus/active/transition。
6. 优先使用 shadcn/ui 风格组件组织结构。
7. 尽量采用纵向堆叠、整齐的排版，不要做得花哨，也不要显得廉价。
8. 保证移动端优先，并兼顾桌面端。
9. 输出时请直接给出修改后的完整代码，不要只给建议。

下面是项目中的核心页面代码和相关组件，请基于这些代码直接改。
```

## Notes
- 页面主入口是 `src/app/page.tsx`
- 上传区逻辑在 `src/components/upload-panel.tsx`
- 照片墙列表在 `src/components/exhibition-gallery.tsx`
- 单组照片管理弹层在 `src/components/gallery-entry-actions.tsx`
- 这些 UI 组件不是官方原样文件，而是本地封装过的 `button/card/badge/separator`
