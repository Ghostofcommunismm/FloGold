import { describe, it, expect } from 'vitest'
import { calculateCurrentValue, mapTxCategoryToAssetCategory } from '../asset-utils'
import type { Asset, Transaction } from '../types'

// 辅助：构造 N 年前的日期字符串
function yearsAgoStr(years: number): string {
  const d = new Date()
  d.setFullYear(d.getFullYear() - years)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

describe('calculateCurrentValue', () => {
  it('manual type returns currentValue as-is', () => {
    const asset = {
      purchasePrice: 10000,
      currentValue: 8000,
      depreciationType: 'manual',
      purchaseDate: '2024-01-01',
    } as Asset
    expect(calculateCurrentValue(asset)).toBe(8000)
  })

  it('straight depreciation over 1 year', () => {
    // 购入 10000，残值 10%，年限 5 年，已用 1 年
    // 年折旧 = 10000 * (1 - 0.1) / 5 = 1800
    // 当前 = 10000 - 1800*1 = 8200
    const asset = {
      purchasePrice: 10000,
      currentValue: 10000,
      salvageRate: 0.1,
      usefulLife: 5,
      depreciationType: 'straight',
      purchaseDate: yearsAgoStr(1),
    } as Asset
    expect(calculateCurrentValue(asset)).toBeCloseTo(8200, -1)
  })

  it('straight never below salvage value', () => {
    // 已用 100 年，应等于残值 1000
    const asset = {
      purchasePrice: 10000,
      currentValue: 10000,
      salvageRate: 0.1,
      usefulLife: 5,
      depreciationType: 'straight',
      purchaseDate: '2000-01-01',
    } as Asset
    expect(calculateCurrentValue(asset)).toBe(1000)
  })

  it('straight with no usefulLife falls back to currentValue', () => {
    const asset = {
      purchasePrice: 10000,
      currentValue: 9500,
      depreciationType: 'straight',
      purchaseDate: '2024-01-01',
    } as Asset
    expect(calculateCurrentValue(asset)).toBe(9500)
  })

  it('straight with no salvageRate uses default 0.1', () => {
    // 购入 10000，年限 10 年，已用 1 年，残值率默认 10%
    // 年折旧 = 10000 * 0.9 / 10 = 900
    // 当前 = 10000 - 900 = 9100
    const asset = {
      purchasePrice: 10000,
      currentValue: 10000,
      usefulLife: 10,
      depreciationType: 'straight',
      purchaseDate: yearsAgoStr(1),
    } as Asset
    expect(calculateCurrentValue(asset)).toBeCloseTo(9100, -1)
  })
})

describe('mapTxCategoryToAssetCategory', () => {
  it('maps subCategory 数码 to 数码', () => {
    expect(mapTxCategoryToAssetCategory('购物', '数码')).toBe('数码')
  })

  it('maps 交通 to 交通工具', () => {
    expect(mapTxCategoryToAssetCategory('交通')).toBe('交通工具')
  })

  it('maps 居家 to 家具', () => {
    expect(mapTxCategoryToAssetCategory('居家')).toBe('家具')
  })

  it('falls back to 其他 for unmapped categories', () => {
    expect(mapTxCategoryToAssetCategory('餐饮')).toBe('其他')
    expect(mapTxCategoryToAssetCategory('娱乐', '电影')).toBe('其他')
  })
})

import { buildAssetFromTransaction } from '../asset-utils'

describe('buildAssetFromTransaction', () => {
  const tx = {
    id: 42,
    name: '相机',
    amount: 8000,
    date: '2026-07-05',
    category: '购物',
    subCategory: '数码',
    icon: '📷',
  } as Transaction

  const form = {
    asAsset: true,
    assetCategory: '数码',
    assetLocation: '客厅',
    assetOwner: '爸爸',
    assetUsefulLife: 5,
    assetSalvageRate: 0.1,
  } as any

  it('builds asset with transactionId linking back', () => {
    const asset = buildAssetFromTransaction(tx, form)
    expect(asset.transactionId).toBe(42)
  })

  it('copies purchasePrice and purchaseDate from transaction', () => {
    const asset = buildAssetFromTransaction(tx, form)
    expect(asset.purchasePrice).toBe(8000)
    expect(asset.purchaseDate).toBe('2026-07-05')
  })

  it('uses assetCategory from form, not tx category', () => {
    const asset = buildAssetFromTransaction(tx, form)
    expect(asset.category).toBe('数码')
  })

  it('copies icon and name from transaction', () => {
    const asset = buildAssetFromTransaction(tx, form)
    expect(asset.icon).toBe('📷')
    expect(asset.name).toBe('相机')
  })

  it('sets straight depreciation with form params', () => {
    const asset = buildAssetFromTransaction(tx, form)
    expect(asset.depreciationType).toBe('straight')
    expect(asset.usefulLife).toBe(5)
    expect(asset.salvageRate).toBe(0.1)
  })

  it('initial currentValue equals purchasePrice (will be recalculated)', () => {
    const asset = buildAssetFromTransaction(tx, form)
    expect(asset.currentValue).toBe(8000)
  })

  it('copies location and owner from form', () => {
    const asset = buildAssetFromTransaction(tx, form)
    expect(asset.location).toBe('客厅')
    expect(asset.owner).toBe('爸爸')
  })

  it('sets id=0 for parent to assign', () => {
    const asset = buildAssetFromTransaction(tx, form)
    expect(asset.id).toBe(0)
  })

  it('sets createdAt and updatedAt to same ISO timestamp', () => {
    const asset = buildAssetFromTransaction(tx, form)
    expect(asset.createdAt).toBe(asset.updatedAt)
    expect(new Date(asset.createdAt).getTime()).not.toBeNaN()
  })
})
