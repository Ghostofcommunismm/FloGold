// Lucide Icons 配置文件
// 所有图标已通过验证测试（2026-07-08）

// 从主包导入所有图标（仅导入验证存在的图标）
import {
  // 餐饮（7个）
  Utensils,
  Coffee,
  Pizza,
  Wine,
  Cake,
  Apple,
  IceCream,
  
  // 交通（8个，包含出租车专用图标）
  Car,
  CarFront,
  CarTaxiFront, // 出租车专用图标
  Plane,
  Truck,
  Bike,
  Train,
  Bus,
  Ship,
  
  // 购物（12个）
  ShoppingCart,
  ShoppingBag,
  ShoppingBasket,
  Store,
  Package,
  Gift,
  Tag,
  Shirt,
  Watch,
  Smartphone,
  Headphones,
  Handbag,
  
  // 收入理财（13个）
  Banknote,
  Wallet,
  WalletCards,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Landmark,
  CreditCard,
  Coins,
  CircleDollarSign,
  BadgePercent,
  BadgeDollarSign,
  Receipt,
  
  // 娱乐（10个）
  Film,
  Music,
  Gamepad2,
  Tv,
  Monitor,
  Ticket,
  PartyPopper,
  Video,
  Radio,
  Clapperboard,
  Guitar,
  
  // 医疗健康（9个）
  HeartPulse,
  Pill,
  Stethoscope,
  Activity,
  Thermometer,
  Cross,
  Hospital,
  HeartPlus,
  Syringe,
  
  // 居住生活（11个）
  Home,
  Building2,
  Building,
  Lamp,
  Bed,
  Bath,
  Plug,
  DoorOpen,
  Key,
  KeyRound,
  Warehouse,
  
  // 教育学习（12个）
  BookOpen,
  GraduationCap,
  Pencil,
  Notebook,
  Library,
  LibraryBig,
  Presentation,
  Calculator,
  Lightbulb,
  Bookmark,
  Book,
  School,
  
  // 其他常用图标（17个）
  Plus,
  Minus,
  Check,
  X,
  Edit,
  Trash,
  Trash2,
  Search,
  Settings,
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  LayoutGrid,
  Heart,
  List,
  Grid2x2
} from '@lucide/vue'

// 导出所有图标
export {
  // 餐饮
  Utensils,
  Coffee,
  Pizza,
  Wine,
  Cake,
  Apple,
  IceCream,
  
  // 交通（包含出租车专用图标 CarTaxiFront）
  Car,
  CarFront,
  CarTaxiFront,
  Plane,
  Truck,
  Bike,
  Train,
  Bus,
  Ship,
  
  // 购物
  ShoppingCart,
  ShoppingBag,
  ShoppingBasket,
  Store,
  Package,
  Gift,
  Tag,
  Shirt,
  Watch,
  Smartphone,
  Headphones,
  Handbag,
  
  // 收入理财
  Banknote,
  Wallet,
  WalletCards,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Landmark,
  CreditCard,
  Coins,
  CircleDollarSign,
  BadgePercent,
  BadgeDollarSign,
  Receipt,
  
  // 娱乐
  Film,
  Music,
  Gamepad2,
  Tv,
  Monitor,
  Ticket,
  PartyPopper,
  Video,
  Radio,
  Clapperboard,
  Guitar,
  
  // 医疗健康
  HeartPulse,
  Pill,
  Stethoscope,
  Activity,
  Thermometer,
  Cross,
  Hospital,
  HeartPlus,
  Syringe,
  
  // 居住生活
  Home,
  Building2,
  Building,
  Lamp,
  Bed,
  Bath,
  Plug,
  DoorOpen,
  Key,
  KeyRound,
  Warehouse,
  
  // 教育学习
  BookOpen,
  GraduationCap,
  Pencil,
  Notebook,
  Library,
  LibraryBig,
  Presentation,
  Calculator,
  Lightbulb,
  Bookmark,
  Book,
  School,
  
  // 其他常用图标
  Plus,
  Minus,
  Check,
  X,
  Edit,
  Trash,
  Trash2,
  Search,
  Settings,
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  LayoutGrid,
  Heart,
  List,
  Grid2x2
}

// 图标映射表 - 用于分类选择（共102个有效图标）
export const categoryIconMap = {
  // 支出分类
  '全部': { icon: LayoutGrid, color: '#9C27B0' },
  '餐饮': { icon: Utensils, color: '#FF6B6B' },
  '交通': { icon: Car, color: '#4ECDC4' },
  '购物': { icon: ShoppingBag, color: '#FF9F43' },
  '娱乐': { icon: Gamepad2, color: '#A55EEA' },
  '医疗': { icon: HeartPulse, color: '#26de81' },
  '居住': { icon: Home, color: '#45AAF2' },
  '教育': { icon: BookOpen, color: '#2d98da' },
  '人情': { icon: Gift, color: '#F7B731' },
  '其他': { icon: Package, color: '#778CA3' },
  
  // 收入分类
  '工资': { icon: Wallet, color: '#20BF6B' },
  '理财': { icon: TrendingUp, color: '#0FB9B1' },
  '兼职': { icon: Banknote, color: '#2d98da' },
  '奖金': { icon: Gift, color: '#F7B731' },
  '红包': { icon: Coins, color: '#EB3B5A' },
  '报销': { icon: CreditCard, color: '#A55EEA' },
  '其他收入': { icon: CircleDollarSign, color: '#778CA3' }
}

// 交通图标细分（包含出租车专用图标）
export const transportIconMap = {
  '汽车': Car,
  '出租车': CarTaxiFront, // 出租车专用图标
  '公交车': Bus,
  '火车': Train,
  '飞机': Plane,
  '自行车': Bike,
  '轮船': Ship,
  '卡车': Truck,
  '车头': CarFront
}

// 餐饮图标细分
export const foodIconMap = {
  '餐具': Utensils,
  '咖啡': Coffee,
  '披萨': Pizza,
  '酒水': Wine,
  '蛋糕': Cake,
  '苹果': Apple,
  '冰淇淋': IceCream
}

// 娱乐图标细分
export const entertainmentIconMap = {
  '电影': Film,
  '音乐': Music,
  '游戏': Gamepad2,
  '电视': Tv,
  '显示器': Monitor,
  '门票': Ticket,
  '派对': PartyPopper,
  '视频': Video,
  '广播': Radio,
  '拍板': Clapperboard,
  '吉他': Guitar
}