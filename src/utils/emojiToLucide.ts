/**
 * Maps emoji strings to Lucide icon names.
 * If the input is already a Lucide icon name (PascalCase string),
 * it is returned as-is.
 */

const emojiToLucideMap: Record<string, string> = {
  // Food & Drink
  '🍜': 'Utensils', '🍝': 'Utensils', '🍲': 'CookingPot', '🥘': 'CookingPot',
  '🍱': 'Utensils', '🍚': 'Utensils', '🍛': 'Utensils', '☕': 'Coffee',
  '🍵': 'Coffee', '🥐': 'Croissant', '🥟': 'Cookie', '🌯': 'Burrito',
  '🥗': 'Salad', '🍔': 'Utensils', '🍟': 'Utensils', '🍕': 'Pizza',
  '🌭': 'Utensils', '🥪': 'Sandwich', '🌮': 'Burrito', '🍿': 'Popcorn',
  '🧂': 'Salt', '🥫': 'CookingPot', '🍰': 'Cake', '🎂': 'Cake',
  '🧁': 'Cake', '🍮': 'Candy', '🍬': 'Candy', '🍫': 'Cookie',
  '🍩': 'Donut', '🍪': 'Cookie', '🍎': 'Apple', '🍏': 'Apple',
  '🍊': 'Apple', '🍋': 'Apple', '🍌': 'Apple', '🍉': 'Apple',
  '🍇': 'Apple', '🍓': 'Apple', '🍒': 'Apple', '🍑': 'Apple',
  '🥭': 'Apple', '🍍': 'Apple', '🥥': 'Apple', '🥝': 'Apple',
  '🍷': 'Wine', '🍺': 'Beer', '🍻': 'Beer', '🥃': 'Wine',
  '🥂': 'Wine', '🍶': 'Wine', '🥤': 'CupSoda', '🧋': 'CupSoda',
  '🧃': 'CupSoda',

  // Transport
  '🚗': 'Car', '🚕': 'CarTaxiFront', '🚙': 'Car', '🚌': 'Bus',
  '🚎': 'Bus', '🏎️': 'Car', '🚓': 'Car', '🚑': 'Ambulance',
  '🚒': 'Truck', '🚐': 'Bus', '🛻': 'Truck', '🚚': 'Truck',
  '🚛': 'Truck', '🚜': 'Tractor', '🛵': 'Bike', '🏍️': 'Bike',
  '🚲': 'Bike', '🛴': 'Bike', '🚇': 'Train', '🚆': 'Train',
  '🚄': 'Train', '🚅': 'Train', '🚈': 'Train', '🚂': 'Train',
  '🚋': 'Train', '🚊': 'Train', '🚉': 'Train', '✈️': 'Plane',
  '🛫': 'Plane', '🛬': 'Plane', '🛩️': 'Plane', '🚁': 'Plane',
  '🚀': 'Rocket', '🛸': 'Rocket', '🚢': 'Ship', '🛥️': 'Ship',
  '🚤': 'Ship', '🚣': 'Ship', '🧭': 'Compass',

  // Shopping
  '🛍️': 'ShoppingBag', '🛒': 'ShoppingCart', '💳': 'CreditCard',
  '💰': 'Banknote', '💸': 'Banknote', '🪙': 'Coins', '💵': 'Banknote',
  '💶': 'Banknote', '💷': 'Banknote', '💱': 'CircleDollarSign',
  '💲': 'CircleDollarSign', '🧾': 'ReceiptText', '🏷️': 'Tag',
  '🏷': 'Tag', '🏬': 'Store', '🏪': 'Store', '🏗️': 'Building2',

  // Entertainment
  '🎮': 'Gamepad2', '🕹️': 'Gamepad2', '🎲': 'Dices', '🎯': 'Target',
  '🎳': 'Dices', '🎨': 'Palette', '🎭': 'Drama', '🎬': 'Film',
  '🎥': 'Video', '📹': 'Video', '🎞️': 'Film', '📽️': 'Projector',
  '🎵': 'Music', '🎶': 'Music', '🎤': 'Mic', '🎧': 'Headphones',
  '📻': 'Radio', '📺': 'Tv', '🎸': 'Guitar', '🎹': 'Piano',
  '🥁': 'Drum', '🎺': 'Trumpet', '🎻': 'Violin', '🎫': 'Ticket',
  '🎟️': 'Ticket', '🎪': 'Tent', '🪄': 'Wand2',

  // Home
  '🏠': 'Home', '🏡': 'Home', '🏘️': 'Home', '🏚️': 'Home',
  '🛋️': 'Sofa', '🛏️': 'Bed', '🛌': 'Bed', '🚪': 'DoorOpen',
  '🪑': 'Armchair', '🚽': 'Bath', '🚿': 'ShowerHead', '🛁': 'Bath',
  '🧴': 'SprayCan', '🧼': 'Soap', '🪒': 'Scissors', '🧹': 'Brush',
  '🧺': 'Basket', '🧻': 'Scroll', '🪣': 'Trash2', '🧷': 'Link',
  '💡': 'Lightbulb', '🔦': 'Flashlight', '🕯️': 'Flame', '🪔': 'Flame',
  '🧯': 'Flame', '🛎️': 'Bell', '🔑': 'Key', '🗝️': 'Key',
  '🚨': 'Siren', '🧊': 'Snowflake', '❄️': 'Snowflake', '🔥': 'Flame',
  '⚡': 'Zap', '🌊': 'Waves', '💧': 'Droplet', '🫧': 'Droplet',

  // Health & Medical
  '💊': 'Pill', '💉': 'Syringe', '🩹': 'Bandage', '🩺': 'Stethoscope',
  '🏥': 'Hospital', '🧬': 'Dna', '🩸': 'Droplet', '⚕️': 'Stethoscope',
  '🧘': 'Heart', '❤️': 'Heart', '🫀': 'HeartPulse', '🫁': 'Activity',
  '💪': 'Dumbbell', '🦷': 'Smile', '🦴': 'Bone', '🧠': 'Brain',

  // Education
  '📚': 'BookOpen', '📕': 'Book', '📗': 'Book', '📘': 'Book',
  '📙': 'Book', '📖': 'BookOpen', '📓': 'Notebook', '📒': 'Notebook',
  '📔': 'Notebook', '✏️': 'Pencil', '✏': 'Pencil', '🖊️': 'PenTool',
  '🖋️': 'PenTool', '🖌️': 'Brush', '🖍️': 'Brush', '📝': 'Pencil',
  '🎓': 'GraduationCap', '🧮': 'Calculator', '📌': 'Pin', '📍': 'MapPin',
  '📎': 'Paperclip', '📏': 'Ruler', '📐': 'Ruler', '✂️': 'Scissors',
  '🗃️': 'Archive', '🗄️': 'Archive', '📋': 'ClipboardList',
  '📁': 'Folder', '📂': 'FolderOpen', '🗂️': 'Folder',

  // Finance & Work
  '💼': 'Briefcase', '📈': 'TrendingUp', '📉': 'TrendingDown',
  '📊': 'ChartBar', '💹': 'TrendingUp', '🏦': 'Landmark',
  '🏧': 'Banknote', '🏭': 'Factory', '🏢': 'Building2',
  '🖥️': 'Monitor', '💻': 'Laptop', '⌨️': 'Keyboard', '🖱️': 'Mouse',
  '💽': 'HardDrive', '💾': 'Save', '💿': 'Disc', '📀': 'Disc',
  '📷': 'Camera', '📸': 'Camera', '📱': 'Smartphone', '📞': 'Phone',
  '☎️': 'Phone', '📟': 'Pager', '📠': 'Printer', '⏰': 'Clock',
  '⏳': 'Hourglass', '⌛': 'Hourglass', '🕰️': 'Clock', '🔔': 'Bell',
  '🔕': 'BellOff', '📅': 'Calendar', '📆': 'Calendar', '🗓️': 'Calendar',
  '📇': 'CardIndex', '🗳️': 'Vote', '🗒️': 'ClipboardList',

  // People & Social
  '👤': 'User', '👥': 'Users', '🧑': 'User', '👦': 'User',
  '👧': 'User', '👨': 'User', '👩': 'User', '👶': 'Baby',
  '🧓': 'User', '👴': 'User', '👵': 'User', '🤝': 'Handshake',
  '👋': 'Hand', '👍': 'ThumbsUp', '👎': 'ThumbsDown', '👌': 'Check',

  // Gifts & Events
  '🎁': 'Gift', '🎀': 'Gift', '🎉': 'PartyPopper', '🎊': 'PartyPopper',
  '🎈': 'PartyPopper', '🎆': 'Sparkles', '🎇': 'Sparkles', '🧨': 'Flame',
  '✨': 'Sparkles', '🌟': 'Star', '⭐': 'Star', '💫': 'Star',
  '🍀': 'Clover', '🌷': 'Flower', '🌹': 'Flower', '🌺': 'Flower',
  '🌸': 'Flower', '🌼': 'Flower', '🌻': 'Flower', '💐': 'Flower',
  '🪴': 'Flower', '🌳': 'Tree', '🌲': 'Tree', '🌴': 'Palmtree',
  '🌵': 'Cactus',

  // Animals
  '🐶': 'Dog', '🐱': 'Cat', '🐭': 'Mouse', '🐹': 'Rat',
  '🐰': 'Rabbit', '🦊': 'Fox', '🐻': 'Bear', '🐼': 'Panda',
  '🐨': 'Bear', '🐯': 'Cat', '🦁': 'Cat', '🐮': 'Cow',
  '🐷': 'Pig', '🐸': 'Frog', '🐵': 'Monkey', '🐔': 'Bird',
  '🐧': 'Bird', '🐦': 'Bird', '🦆': 'Duck', '🦅': 'Bird',
  '🦉': 'Bird', '🦇': 'Bat', '🐺': 'Wolf', '🐗': 'Pig',
  '🐴': 'Horse', '🦄': 'Horse', '🐝': 'Bee', '🐛': 'Bug',
  '🦋': 'Butterfly', '🐌': 'Snail', '🐞': 'Bug', '🐜': 'Bug',
  '🦗': 'Bug', '🕷️': 'Bug', '🦂': 'Bug', '🦀': 'Shell',
  '🦞': 'Shell', '🦐': 'Shell', '🦑': 'Fish', '🐙': 'Fish',

  // Sports
  '⚽': 'Volleyball', '🏀': 'Volleyball', '🏈': 'Volleyball',
  '⚾': 'Volleyball', '🥎': 'Volleyball', '🎾': 'Volleyball',
  '🏐': 'Volleyball', '🏉': 'Volleyball', '🥏': 'Frisbee',
  '🎱': 'Circle', '🏓': 'Volleyball', '🏸': 'Volleyball',
  '🥅': 'Goal', '🏒': 'Volleyball', '🏑': 'Volleyball',
  '🥍': 'Volleyball', '🏏': 'Volleyball', '⛳': 'Flag',
  '🏹': 'Target', '🎣': 'Fish', '🥊': 'Volleyball',
  '🥋': 'Volleyball', '🎽': 'Shirt', '🥌': 'Circle',
  '🛷': 'Snowflake', '🎿': 'Snowflake', '🏂': 'Snowflake',
  '🏋️': 'Dumbbell', '🤼': 'Dumbbell', '🤸': 'Activity',
  '🤺': 'Sword', '🏌️': 'Flag', '🏇': 'Horse',
  '🧗': 'Mountain', '🚴': 'Bike', '🚵': 'Bike', '🏃': 'Activity',

  // Nature & Weather
  '🌍': 'Globe', '🌎': 'Globe', '🌏': 'Globe', '🌐': 'Globe',
  '🌑': 'Moon', '🌒': 'Moon', '🌓': 'Moon', '🌔': 'Moon',
  '🌕': 'Moon', '🌖': 'Moon', '🌗': 'Moon', '🌘': 'Moon',
  '🌙': 'Moon', '☀️': 'Sun', '🌞': 'Sun', '☁️': 'Cloud',
  '⛅': 'CloudSun', '⛈️': 'CloudLightning', '🌤️': 'CloudSun',
  '🌥️': 'Cloud', '🌦️': 'CloudRain', '🌧️': 'CloudRain',
  '🌨️': 'CloudSnow', '🌩️': 'CloudLightning', '🌪️': 'Tornado',
  '🌫️': 'CloudFog', '🌬️': 'Wind', '🌈': 'Rainbow',
  '🌂': 'Umbrella', '☂️': 'Umbrella', '☔': 'CloudRain',
  '⛱️': 'Umbrella', '⛄': 'Snowflake', '🌡️': 'Thermometer',

  // Travel
  '🧳': 'Luggage', '🗺️': 'Map', '🏔️': 'Mountain', '⛰️': 'Mountain',
  '🌋': 'Mountain', '🗻': 'Mountain', '🏕️': 'Tent', '⛺': 'Tent',
  '🏖️': 'Palmtree', '🏝️': 'Palmtree', '🏜️': 'Sun', '🏞️': 'Trees',
  '🏟️': 'Trophy', '🏛️': 'Landmark', '🧱': 'BrickWall',
  '🪨': 'Mountain', '🪵': 'Tree', '🛖': 'Home', '💒': 'Home',
  '⛪': 'Building', '🕌': 'Building', '🕍': 'Building',
  '⛩️': 'Building', '🛕': 'Building', '🕋': 'Building',
  '🌁': 'Bridge', '🌃': 'Building2', '🌄': 'Mountain',
  '🌅': 'Sun', '🌆': 'Building2', '🌇': 'Sun', '🌉': 'Bridge',
  '🏫': 'School',

  // Clothing
  '👔': 'Shirt', '👕': 'Shirt', '👖': 'Shirt', '🧥': 'Shirt',
  '🥼': 'Shirt', '🦺': 'Shirt', '👚': 'Shirt', '👘': 'Shirt',
  '👙': 'Shirt', '🩱': 'Shirt', '🩲': 'Shirt', '🩳': 'Shirt',
  '🧦': 'Shirt', '🧢': 'Shirt', '👒': 'Shirt', '🎩': 'Shirt',
  '🧣': 'Shirt', '🪖': 'Shirt', '⛑️': 'HardHat', '👑': 'Crown',

  // Jewelry & Valuables
  '💎': 'Gem', '💍': 'Ring', '📿': 'Circle', '🔮': 'CrystalBall',
  '🏺': 'FlaskConical', '⚱️': 'Archive', '🪦': 'Archive',
  '🗿': 'Mountain', '🤑': 'Banknote',

  // Misc
  '📦': 'Package', '📭': 'Package', '📬': 'Package', '📫': 'Package',
  '📪': 'Package', '📮': 'Package', '📯': 'Bell', '📩': 'Package',
  '📨': 'Package', '📧': 'Mail', '📥': 'Package', '📤': 'Package',
  '📜': 'Scroll', '📄': 'FileText', '📃': 'FileText', '📑': 'Bookmark',
}

/** Emoji ranges for detecting emoji strings */
const emojiRegex = /[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F1E6}-\u{1F1FF}\u{2B00}-\u{2BFF}\u{2190}-\u{21FF}\u{2B05}-\u{2B07}]/u

/**
 * Convert an emoji or icon string to a Lucide icon name.
 * If the input is already a PascalCase identifier (Lucide icon name),
 * it is returned as-is.
 */
export function getLucideIconName(icon: string): string {
  if (!icon) return 'Package'

  // If it doesn't look like an emoji, assume it's already a Lucide icon name
  if (!emojiRegex.test(icon)) {
    return icon
  }

  // Try to look up the emoji in the map
  const mapped = emojiToLucideMap[icon]
  if (mapped) return mapped

  // Fallback: strip variation selectors and try again
  const stripped = icon.replace(/[\uFE00-\uFE0F\u200D]/g, '')
  const mappedStripped = emojiToLucideMap[stripped]
  if (mappedStripped) return mappedStripped

  return 'Package'
}
