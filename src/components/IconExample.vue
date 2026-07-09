<template>
  <div class="icon-demo">
    <h3>记账分类图标示例</h3>

    <!-- 餐饮 -->
    <div class="category-section">
      <h4>餐饮</h4>
      <div class="icons-grid">
        <div class="icon-item">
          <Utensils :size="24" :stroke-width="2" />
          <span>餐具</span>
        </div>
        <div class="icon-item">
          <Coffee :size="24" :stroke-width="2" />
          <span>咖啡</span>
        </div>
        <div class="icon-item">
          <Pizza :size="24" :stroke-width="2" />
          <span>披萨</span>
        </div>
        <div class="icon-item">
          <Wine :size="24" :stroke-width="2" />
          <span>酒水</span>
        </div>
        <div class="icon-item">
          <Cake :size="24" :stroke-width="2" />
          <span>蛋糕</span>
        </div>
        <div class="icon-item">
          <Apple :size="24" :stroke-width="2" />
          <span>水果</span>
        </div>
        <div class="icon-item">
          <IceCream :size="24" :stroke-width="2" />
          <span>冰淇淋</span>
        </div>
      </div>
    </div>

    <!-- 交通 -->
    <div class="category-section">
      <h4>交通出行</h4>
      <div class="icons-grid">
        <div class="icon-item">
          <Car :size="24" :stroke-width="2" />
          <span>汽车</span>
        </div>
        <div class="icon-item">
          <Bike :size="24" :stroke-width="2" />
          <span>自行车</span>
        </div>
        <div class="icon-item">
          <Train :size="24" :stroke-width="2" />
          <span>火车</span>
        </div>
        <div class="icon-item">
          <Bus :size="24" :stroke-width="2" />
          <span>公交</span>
        </div>
        <div class="icon-item">
          <Plane :size="24" :stroke-width="2" />
          <span>飞机</span>
        </div>
        <div class="icon-item">
          <CarTaxiFront :size="24" :stroke-width="2" />
          <span>出租</span>
        </div>
        <div class="icon-item">
          <Ship :size="24" :stroke-width="2" />
          <span>轮船</span>
        </div>
      </div>
    </div>

    <!-- 购物 -->
    <div class="category-section">
      <h4>购物消费</h4>
      <div class="icons-grid">
        <div class="icon-item">
          <ShoppingCart :size="24" :stroke-width="2" />
          <span>购物车</span>
        </div>
        <div class="icon-item">
          <ShoppingBag :size="24" :stroke-width="2" />
          <span>购物袋</span>
        </div>
        <div class="icon-item">
          <Store :size="24" :stroke-width="2" />
          <span>商店</span>
        </div>
        <div class="icon-item">
          <Package :size="24" :stroke-width="2" />
          <span>包裹</span>
        </div>
        <div class="icon-item">
          <Gift :size="24" :stroke-width="2" />
          <span>礼物</span>
        </div>
        <div class="icon-item">
          <Tag :size="24" :stroke-width="2" />
          <span>标签</span>
        </div>
        <div class="icon-item">
          <Shirt :size="24" :stroke-width="2" />
          <span>服装</span>
        </div>
        <div class="icon-item">
          <Watch :size="24" :stroke-width="2" />
          <span>手表</span>
        </div>
        <div class="icon-item">
          <Smartphone :size="24" :stroke-width="2" />
          <span>手机</span>
        </div>
        <div class="icon-item">
          <Headphones :size="24" :stroke-width="2" />
          <span>耳机</span>
        </div>
      </div>
    </div>

    <!-- 收入理财 -->
    <div class="category-section">
      <h4>收入理财</h4>
      <div class="icons-grid">
        <div class="icon-item">
          <Banknote :size="24" :stroke-width="2" />
          <span>钞票</span>
        </div>
        <div class="icon-item">
          <Wallet :size="24" :stroke-width="2" />
          <span>钱包</span>
        </div>
        <div class="icon-item">
          <TrendingUp :size="24" :stroke-width="2" />
          <span>收入</span>
        </div>
        <div class="icon-item">
          <PiggyBank :size="24" :stroke-width="2" />
          <span>储蓄罐</span>
        </div>
        <div class="icon-item">
          <Landmark :size="24" :stroke-width="2" />
          <span>银行</span>
        </div>
        <div class="icon-item">
          <CreditCard :size="24" :stroke-width="2" />
          <span>信用卡</span>
        </div>
        <div class="icon-item">
          <Coins :size="24" :stroke-width="2" />
          <span>硬币</span>
        </div>
        <div class="icon-item">
          <CircleDollarSign :size="24" :stroke-width="2" />
          <span>美元</span>
        </div>
        <div class="icon-item">
          <BadgePercent :size="24" :stroke-width="2" />
          <span>利息</span>
        </div>
      </div>
    </div>

    <!-- 娱乐 -->
    <div class="category-section">
      <h4>娱乐休闲</h4>
      <div class="icons-grid">
        <div class="icon-item">
          <Film :size="24" :stroke-width="2" />
          <span>电影</span>
        </div>
        <div class="icon-item">
          <Music :size="24" :stroke-width="2" />
          <span>音乐</span>
        </div>
        <div class="icon-item">
          <Gamepad2 :size="24" :stroke-width="2" />
          <span>游戏</span>
        </div>
        <div class="icon-item">
          <Tv :size="24" :stroke-width="2" />
          <span>电视</span>
        </div>
        <div class="icon-item">
          <Ticket :size="24" :stroke-width="2" />
          <span>门票</span>
        </div>
        <div class="icon-item">
          <Guitar :size="24" :stroke-width="2" />
          <span>吉他</span>
        </div>
        <div class="icon-item">
          <PartyPopper :size="24" :stroke-width="2" />
          <span>派对</span>
        </div>
      </div>
    </div>

    <!-- 医疗 -->
    <div class="category-section">
      <h4>医疗健康</h4>
      <div class="icons-grid">
        <div class="icon-item">
          <HeartPulse :size="24" :stroke-width="2" />
          <span>心脏</span>
        </div>
        <div class="icon-item">
          <Pill :size="24" :stroke-width="2" />
          <span>药片</span>
        </div>
        <div class="icon-item">
          <Stethoscope :size="24" :stroke-width="2" />
          <span>听诊器</span>
        </div>
        <div class="icon-item">
          <Syringe :size="24" :stroke-width="2" />
          <span>注射器</span>
        </div>
        <div class="icon-item">
          <Activity :size="24" :stroke-width="2" />
          <span>活动</span>
        </div>
        <div class="icon-item">
          <Thermometer :size="24" :stroke-width="2" />
          <span>体温计</span>
        </div>
        <div class="icon-item">
          <Cross :size="24" :stroke-width="2" />
          <span>十字</span>
        </div>
        <div class="icon-item">
          <Hospital :size="24" :stroke-width="2" />
          <span>医院</span>
        </div>
      </div>
    </div>

    <!-- 居住 -->
    <div class="category-section">
      <h4>居住生活</h4>
      <div class="icons-grid">
        <div class="icon-item">
          <Home :size="24" :stroke-width="2" />
          <span>家</span>
        </div>
        <div class="icon-item">
          <Building2 :size="24" :stroke-width="2" />
          <span>建筑</span>
        </div>
        <div class="icon-item">
          <Lamp :size="24" :stroke-width="2" />
          <span>灯</span>
        </div>
        <div class="icon-item">
          <Bed :size="24" :stroke-width="2" />
          <span>床</span>
        </div>
        <div class="icon-item">
          <Bath :size="24" :stroke-width="2" />
          <span>浴缸</span>
        </div>
        <div class="icon-item">
          <Plug :size="24" :stroke-width="2" />
          <span>插头</span>
        </div>
        <div class="icon-item">
          <DoorOpen :size="24" :stroke-width="2" />
          <span>门</span>
        </div>
        <div class="icon-item">
          <Key :size="24" :stroke-width="2" />
          <span>钥匙</span>
        </div>
      </div>
    </div>

    <!-- 教育 -->
    <div class="category-section">
      <h4>教育学习</h4>
      <div class="icons-grid">
        <div class="icon-item">
          <BookOpen :size="24" :stroke-width="2" />
          <span>书</span>
        </div>
        <div class="icon-item">
          <GraduationCap :size="24" :stroke-width="2" />
          <span>学位帽</span>
        </div>
        <div class="icon-item">
          <Pencil :size="24" :stroke-width="2" />
          <span>铅笔</span>
        </div>
        <div class="icon-item">
          <Notebook :size="24" :stroke-width="2" />
          <span>笔记本</span>
        </div>
        <div class="icon-item">
          <Library :size="24" :stroke-width="2" />
          <span>图书馆</span>
        </div>
        <div class="icon-item">
          <Presentation :size="24" :stroke-width="2" />
          <span>演讲</span>
        </div>
        <div class="icon-item">
          <Calculator :size="24" :stroke-width="2" />
          <span>计算器</span>
        </div>
        <div class="icon-item">
          <Lightbulb :size="24" :stroke-width="2" />
          <span>灯泡</span>
        </div>
        <div class="icon-item">
          <Bookmark :size="24" :stroke-width="2" />
          <span>书签</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 导入所有图标
import {
  Utensils, Coffee, Pizza, Wine, Cake, Apple, IceCream,
  Car, Bike, Train, Bus, Plane, CarTaxiFront, Ship,
  ShoppingCart, ShoppingBag, Store, Package, Gift, Tag, Shirt, Watch, Smartphone, Headphones,
  Banknote, Wallet, TrendingUp, PiggyBank, Landmark, CreditCard, Coins, CircleDollarSign, BadgePercent,
  Film, Music, Gamepad2, Tv, Ticket, Guitar, PartyPopper,
  HeartPulse, Pill, Stethoscope, Syringe, Activity, Thermometer, Cross, Hospital,
  Home, Building2, Lamp, Bed, Bath, Plug, DoorOpen, Key,
  BookOpen, GraduationCap, Pencil, Notebook, Library, Presentation, Calculator, Lightbulb, Bookmark
} from '../utils/icons'
</script>

<style scoped>
.icon-demo {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.icon-demo h3 {
  text-align: center;
  margin-bottom: 30px;
  font-size: 24px;
  color: #34495e;
}

.category-section {
  margin-bottom: 25px;
}

.category-section h4 {
  font-size: 18px;
  margin-bottom: 15px;
  color: #42b883;
  border-bottom: 2px solid #42b883;
  padding-bottom: 8px;
}

.icons-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 15px;
}

.icon-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 10px;
  background: white;
  border-radius: 8px;
  transition: all 0.2s;
}

.icon-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.icon-item svg {
  color: #2c3e50;
}

.icon-item span {
  font-size: 12px;
  color: #7f8c8d;
}
</style>