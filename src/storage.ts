// ============================================================
// 兼容层：保持旧的 import 路径 './storage' 仍可用
//
// 真实实现已拆分到 src/storage/ 目录。
// 任何模块写 `import { xxx } from './storage'` 或 `'../storage'`
// 都会通过本文件转发到 storage/index.ts 的统一门面。
//
// 历史：原先所有存储逻辑都在这一个文件里。
// 这次重构拆成：
//   types.ts        —— StorageAdapter / AppDataSnapshot
//   defaults.ts     —— 默认数据 + AppData 转换
//   utils.ts        —— 日期工具
//   web-adapter.ts  —— localStorage 实现
//   sqlite-adapter.ts —— SQLite + Preferences 实现
//   index.ts        —— 选 adapter + 旧 API 兼容
// ============================================================

export * from './storage/index'