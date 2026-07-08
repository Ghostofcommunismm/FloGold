// ============================================================
// 存储层对外门面
//
// 1. 根据运行环境选择 adapter：
//    - native (Capacitor.isNativePlatform) → SQLite + Preferences
//    - web (浏览器开发 / vite preview)   → localStorage
// 2. getStorage() 异步初始化、返回单例
// 3. 老的 STORAGE_KEY / loadData / saveData 全部从这里再导出，
//    让 App.vue 与现有 import 不破坏
// ============================================================

import { Capacitor } from '@capacitor/core'
import type { StorageAdapter } from './types'
import { webAdapter, STORAGE_KEY } from './web-adapter'
import { getDefaultSnapshot, snapshotToAppData } from './defaults'

let _storage: StorageAdapter | null = null
let _initPromise: Promise<StorageAdapter> | null = null

/**
 * 异步获取当前环境下的 StorageAdapter 单例。
 * 多次调用只会初始化一次。
 */
export async function getStorage(): Promise<StorageAdapter> {
  if (_storage) return _storage
  if (_initPromise) return _initPromise

  _initPromise = (async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        const mod = await import('./sqlite-adapter')
        _storage = mod.sqliteAdapter
      } catch (e) {
        console.warn(
          '[storage] SQLite adapter unavailable, falling back to localStorage.',
          e,
        )
        _storage = webAdapter
      }
    } else {
      _storage = webAdapter
    }
    await _storage.init()
    return _storage
  })()

  return _initPromise
}

/**
 * 同步版（仅在 web 环境可用，APK 下调用会抛错）。
 * 给那些还没改成 async 的代码临时用——后续全替换成 await getStorage()。
 */
export function getStorageSync(): StorageAdapter {
  if (!_storage) {
    if (Capacitor.isNativePlatform()) {
      throw new Error(
        '[storage] Native adapter not yet initialized. Call await getStorage() first.',
      )
    }
    // web 模式：直接同步初始化
    _storage = webAdapter
    // init 是 async 但函数是同步——fire-and-forget
    void _storage.init()
  }
  return _storage
}

// 重新导出类型与默认数据，方便外部使用
export * from './types'
export * from './defaults'
export { webAdapter } from './web-adapter'
export { sqliteAdapter } from './sqlite-adapter'
export { STORAGE_KEY } from './web-adapter'
export * from './utils'

// ---------- 兼容旧 API ----------
// 原 storage.ts 暴露过 loadData / saveData / STORAGE_KEY。
// 新的对外契约是异步 adapter，但 App.vue 还在用同步的 loadData/saveData。
// 这里提供"同步包装"以最小化对 App.vue 改动。

import type { AppData } from '../types'

/**
 * 同步获取当前应用数据。
 * - web 模式：从 localStorage 同步读，返回完整 AppData
 * - native 模式：返回默认 snapshot（等待 onMounted 异步加载覆盖）
 *
 * 推荐新代码改用 await getStorage().then(s => s.exportAll())
 */
export function loadData(): AppData {
  if (!Capacitor.isNativePlatform()) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) {
        const def = snapshotToAppData(getDefaultSnapshot())
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(def)) } catch { /* ignore */ }
        return def
      }
      return mergeLegacy(JSON.parse(raw))
    } catch {
      return snapshotToAppData(getDefaultSnapshot())
    }
  }
  // native：返回默认值，等待 onMounted 异步覆盖
  return snapshotToAppData(getDefaultSnapshot())
}

/**
 * 同步保存（仅 web 模式有保证；native 下转异步 fire-and-forget）。
 * App.vue 里调用是 fire-and-forget，统一从这里走。
 */
export function saveData(data: AppData): void {
  const snap: any = {
    transactions: data.transactions,
    categories: data.categories,
    subCategories: data.subCategories,
    budget: data.budget,
    recurring: data.recurring,
    reminder: data.reminder,
    uiSettings: data.uiSettings,
    nextId: data.nextId,
    nextRecurringId: data.nextRecurringId,
    assets: data.assets,
    assetCategories: data.assetCategories,
    nextAssetId: data.nextAssetId,
  }
  if (!Capacitor.isNativePlatform()) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(snap))
    } catch (e) {
      console.error('[storage] saveData failed', e)
    }
    return
  }
  // native：异步保存，不阻塞调用方
  void getStorage()
    .then(s => s.importAll(snap))
    .catch(e => console.error('[storage] async save failed', e))
}

/**
 * 把旧的 localStorage JSON 解析成完整 AppData，补齐缺失字段。
 */
function mergeLegacy(parsed: any): AppData {
  const def = getDefaultSnapshot()
  return {
    transactions: parsed.transactions ?? def.transactions,
    categories: parsed.categories ?? def.categories,
    subCategories: parsed.subCategories ?? def.subCategories,
    budget: parsed.budget ?? def.budget,
    recurring: parsed.recurring ?? def.recurring,
    reminder: parsed.reminder ?? def.reminder,
    uiSettings: parsed.uiSettings ?? def.uiSettings,
    nextId: parsed.nextId ?? def.nextId,
    nextRecurringId: parsed.nextRecurringId ?? def.nextRecurringId,
    assets: parsed.assets ?? def.assets,
    assetCategories: parsed.assetCategories ?? def.assetCategories,
    nextAssetId: parsed.nextAssetId ?? def.nextAssetId,
  } as AppData
}