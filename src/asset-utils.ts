import type { Asset, Transaction } from './types'

/**
 * 计算资产当前估价
 * - manual: 直接返回 currentValue
 * - straight: 直线折旧 = max(购入价 - 年折旧*已用年数, 残值)
 *   年折旧 = 购入价 * (1 - 残值率) / 使用年限
 *   残值 = 购入价 * 残值率
 */
export function calculateCurrentValue(asset: Asset): number {
  if (asset.depreciationType === 'manual') {
    return asset.currentValue
  }
  // straight
  if (!asset.usefulLife || asset.usefulLife <= 0) {
    return asset.currentValue
  }
  const rate = asset.salvageRate ?? 0.1
  const purchaseTime = new Date(asset.purchaseDate).getTime()
  const yearsElapsed = (Date.now() - purchaseTime) / (1000 * 60 * 60 * 24 * 365)
  const annualDep = asset.purchasePrice * (1 - rate) / asset.usefulLife
  const depreciated = asset.purchasePrice - annualDep * yearsElapsed
  const salvage = asset.purchasePrice * rate
  return Math.max(depreciated, salvage)
}

/**
 * 把交易分类映射到资产分类
 * - subCategory 为 '数码' → '数码'
 * - txCategory '交通' → '交通工具'
 * - txCategory '居家' → '家具'
 * - 其他 → '其他'
 */
const TX_TO_ASSET_MAP: Record<string, string> = {
  '交通': '交通工具',
  '居家': '家具',
}

export function mapTxCategoryToAssetCategory(txCategory: string, subCategory?: string): string {
  if (subCategory === '数码') return '数码'
  return TX_TO_ASSET_MAP[txCategory] ?? '其他'
}

/**
 * 从交易 + 表单数据构建资产对象（用于记账联动生成资产）
 * 返回的 asset.id=0，由父组件分配
 */
export function buildAssetFromTransaction(
  tx: Transaction,
  form: {
    asAsset?: boolean
    assetCategory?: string
    assetLocation?: string
    assetOwner?: string
    assetUsefulLife?: number
    assetSalvageRate?: number
  }
): Asset {
  const now = new Date().toISOString()
  return {
    id: 0,
    name: tx.name,
    category: form.assetCategory ?? mapTxCategoryToAssetCategory(tx.category, tx.subCategory),
    icon: tx.icon,
    purchasePrice: tx.amount,
    purchaseDate: tx.date,
    currentValue: tx.amount,  // 初始等于购入价，calculateCurrentValue 会动态算
    location: form.assetLocation || undefined,
    owner: form.assetOwner || undefined,
    usefulLife: form.assetUsefulLife ?? 5,
    salvageRate: form.assetSalvageRate ?? 0.1,
    depreciationType: 'straight',
    transactionId: tx.id,
    createdAt: now,
    updatedAt: now,
  }
}
