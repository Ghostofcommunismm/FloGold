import { describe, it, expect, beforeEach } from 'vitest'
import { loadData, STORAGE_KEY } from '../storage'

describe('loadData migration', () => {
  beforeEach(() => localStorage.clear())

  it('fills assets fields for old data without assets', () => {
    // 模拟老版本数据：无 assets/assetCategories/nextAssetId 字段
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ nextId: 5, transactions: [] }))
    const data = loadData()
    expect(data.assets.length).toBeGreaterThan(0)
    expect(data.assetCategories.length).toBeGreaterThan(0)
    expect(data.nextAssetId).toBe(16)
  })

  it('preserves existing assets fields when present', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      nextId: 5,
      assets: [{ id: 1, name: 'test', category: '数码', icon: '📷', purchasePrice: 1000, purchaseDate: '2024-01-01', currentValue: 800, createdAt: '', updatedAt: '' }],
      assetCategories: [{ name: '自定义', icon: '🎯' }],
      nextAssetId: 2,
    }))
    const data = loadData()
    expect(data.assets.length).toBe(1)
    expect(data.assets[0].name).toBe('test')
    expect(data.assetCategories[0].name).toBe('自定义')
    expect(data.nextAssetId).toBe(2)
  })

  it('default asset categories include 数码 and 交通工具', () => {
    const data = loadData()
    const names = data.assetCategories.map(c => c.name)
    expect(names).toContain('数码')
    expect(names).toContain('交通工具')
  })
})
