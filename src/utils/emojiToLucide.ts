// Emoji 到 Lucide 图标名称映射表
// 用于将emoji转换为Lucide图标名称

export const emojiToLucideMap: Record<string, string> = {
  // 餐饮
  '🍜': 'Utensils',
  '☕': 'Coffee',
  '🍔': 'Utensils',
  '🍕': 'Pizza',
  '🍣': 'Utensils',
  '🍰': 'Cake',
  '🧋': 'Coffee',
  '🍎': 'Apple',
  '🍦': 'IceCream',
  
  // 交通
  '🚗': 'Car',
  '🚇': 'Train',
  '✈️': 'Plane',
  '🚕': 'CarTaxiFront',
  '🚲': 'Bike',
  '⛽': 'Fuel', // Lucide 可能没有 Fuel，用其他替代
  '🅿️': 'Parking', // Lucide 可能没有，用 Car 替代
  
  // 购物
  '🛍️': 'ShoppingBag',
  '👔': 'Shirt',
  '👟': 'Shirt',
  '💻': 'Laptop',
  '📱': 'Smartphone',
  '🎧': 'Headphones',
  '💄': 'Handbag',
  
  // 居住
  '🏠': 'Home',
  '🛋️': 'Lamp',
  '💡': 'Lightbulb',
  '🏢': 'Building2',
  
  // 娱乐
  '🎮': 'Gamepad2',
  '🎬': 'Film',
  '🎵': 'Music',
  '⚽': 'Activity',
  '🏀': 'Activity',
  '🏊': 'Activity',
  '🎪': 'PartyPopper',
  
  // 教育
  '🏫': 'School',
  '✏️': 'Pencil',
  '📖': 'BookOpen',
  '🎓': 'GraduationCap',
  
  // 医疗
  '🏥': 'Hospital',
  '💉': 'Syringe',
  '💊': 'Pill',
  '🩺': 'Stethoscope',
  '🦷': 'Activity',
  
  // 收入理财
  '💰': 'Wallet',
  '💵': 'Banknote',
  '💳': 'CreditCard',
  '📈': 'TrendingUp',
  
  // 其他
  '📦': 'Package',
  '🎁': 'Gift',
  '🎉': 'PartyPopper',
  '🍻': 'Wine',
  '🌸': 'Activity',
  '🎨': 'Palette',
  '✂️': 'Scissors', // Lucide 可能没有，用 Edit 替代
  '🔧': 'Wrench',
  '🧹': 'Home',
  '🐶': 'Dog', // Lucide 可能有宠物图标
  '🐱': 'Cat',
  
  // 功能图标
  '🔍': 'Search',
  '📋': 'ClipboardList',
  '📊': 'ChartBar',
  '🎯': 'Target',
  '🔄': 'RefreshCw',
  '🏷️': 'Tag',
  '🔔': 'Bell',
  'ℹ️': 'Info',
  '📍': 'MapPin',
  '🗂️': 'Folder',
  '🌙': 'Moon',
  '☀️': 'Sun',
  '💎': 'Gem',
  '👋': 'Hand'
}

// 反向映射：Lucide图标名称到emoji（可选）
export const lucideToEmojiMap: Record<string, string> = Object.fromEntries(
  Object.entries(emojiToLucideMap).map(([emoji, lucide]) => [lucide, emoji])
)

// 根据emoji获取Lucide图标名称
export function getLucideIconName(emoji: string): string {
  return emojiToLucideMap[emoji] || 'Package' // 默认返回 Package
}

// 根据Lucide图标名称获取emoji（可选）
export function getEmoji(lucideName: string): string {
  return lucideToEmojiMap[lucideName] || '📦' // 默认返回包裹emoji
}