<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show && asset" class="modal-overlay" @click.self="emit('close')">
        <div class="modal-card">
          <!-- 顶部 -->
          <div class="modal-top-row">
            <button class="modal-cancel" @click="emit('close')">关闭</button>
            <h3 class="modal-title">资产详情</h3>
            <button class="modal-edit" @click="emit('edit')">编辑</button>
          </div>

          <div class="modal-body" v-if="asset">
            <!-- 名称行 -->
            <div class="detail-section">
              <div class="name-row">
                <div class="item-icon">{{ asset.icon || '📦' }}</div>
                <div class="detail-name">{{ asset.name }}</div>
              </div>
              <div class="detail-badges">
                <span class="cat-badge">{{ asset.category }}</span>
                <span v-if="status" class="status-badge" :class="statusClass">{{ status }}</span>
              </div>
            </div>

            <!-- 价格信息 -->
            <div class="detail-section">
              <div class="section-label">价格信息</div>
              <div class="detail-grid">
                <div class="detail-grid-item">
                  <div class="dg-label">购入价格</div>
                  <div class="dg-value">¥{{ formatMoney(asset.purchasePrice) }}</div>
                </div>
                <div class="detail-grid-item">
                  <div class="dg-label">当前估值</div>
                  <div class="dg-value accent">¥{{ formatMoney(currentValue) }}</div>
                </div>
                <div class="detail-grid-item">
                  <div class="dg-label">折旧金额</div>
                  <div class="dg-value loss">¥{{ formatMoney(depreciatedAmount) }}</div>
                </div>
                <div class="detail-grid-item">
                  <div class="dg-label">折旧比例</div>
                  <div class="dg-value accent">{{ deprRate }}%</div>
                </div>
              </div>
            </div>

            <!-- 折旧进度 -->
            <div v-if="asset.depreciationType === 'straight'" class="detail-section">
              <div class="section-label">折旧进度</div>
              <div class="depr-gauge">
                <div class="gauge-bar">
                  <div class="fill" :style="{ width: deprRate + '%', background: deprColor }"></div>
                </div>
                <div class="gauge-labels">
                  <span>0%</span>
                  <span>{{ deprRate }}%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>

            <!-- 详细信息 -->
            <div class="detail-section">
              <div class="section-label">详细信息</div>
              <div class="detail-info-row" v-if="asset.owner">
                <span class="dil">归属人</span>
                <span class="div">{{ asset.owner }}</span>
              </div>
              <div class="detail-info-row">
                <span class="dil">购入日期</span>
                <span class="div">{{ asset.purchaseDate }}</span>
              </div>
              <div class="detail-info-row" v-if="asset.usefulLife">
                <span class="dil">使用年限</span>
                <span class="div">{{ asset.usefulLife }} 年</span>
              </div>
              <div class="detail-info-row" v-if="asset.location">
                <span class="dil">存放位置</span>
                <span class="div">{{ asset.location }}</span>
              </div>
              <div class="detail-info-row" v-if="asset.brand">
                <span class="dil">品牌</span>
                <span class="div">{{ asset.brand }}</span>
              </div>
              <div class="detail-info-row" v-if="asset.model">
                <span class="dil">型号</span>
                <span class="div">{{ asset.model }}</span>
              </div>
              <div class="detail-info-row" v-if="asset.channel">
                <span class="dil">购买渠道</span>
                <span class="div">{{ asset.channel }}</span>
              </div>
              <div class="detail-info-row" v-if="asset.serialNumber">
                <span class="dil">序列号</span>
                <span class="div">{{ asset.serialNumber }}</span>
              </div>
              <div class="detail-info-row" v-if="asset.note">
                <span class="dil">备注</span>
                <span class="div">{{ asset.note }}</span>
              </div>
            </div>

            <!-- 关联交易 -->
            <button
              v-if="asset.transactionId"
              class="link-btn"
              @click="emit('view-transaction', asset.transactionId)"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                <polyline points="15 3 21 3 21 9"/>
                <line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
              查看关联交易
            </button>
          </div>

          <!-- 底部操作 -->
          <div class="modal-footer">
            <button class="btn-outline" @click="emit('close')">关闭</button>
            <button class="btn-danger" @click="emit('delete')">删除资产</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { calculateCurrentValue } from '../asset-utils'
import type { Asset } from '../types'

const props = defineProps<{
  show: boolean
  asset: Asset | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'edit'): void
  (e: 'delete'): void
  (e: 'view-transaction', id: number): void
}>()

const currentValue = computed(() =>
  props.asset ? calculateCurrentValue(props.asset) : 0
)
const depreciatedAmount = computed(() =>
  props.asset ? props.asset.purchasePrice - currentValue.value : 0
)
const status = computed(() => props.asset?.status ?? '在用')

const statusClass = computed(() => {
  const s = status.value
  if (s === '在用') return 'using'
  if (s === '闲置') return 'idle'
  return 'sold'
})

const deprRate = computed(() => {
  if (!props.asset || props.asset.purchasePrice <= 0) return 0
  const rate = (depreciatedAmount.value / props.asset.purchasePrice) * 100
  return Math.max(0, Math.min(100, Math.round(rate)))
})

const deprColor = computed(() => {
  const r = deprRate.value
  if (r < 20) return '#6b9e7a'
  if (r < 40) return 'var(--accent)'
  return '#c47a5a'
})

function formatMoney(n: number): string {
  if (n >= 10000) return (n / 10000).toFixed(2) + '万'
  return n.toLocaleString('zh-CN', { maximumFractionDigits: 2 })
}
</script>

<style scoped>
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.35);
  backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px);
  display: flex; align-items: flex-end; justify-content: center; z-index: 200;
  padding-bottom: env(safe-area-inset-bottom, 0px);
}
.modal-card {
  width: 100%; max-width: 420px; background: var(--bg-primary);
  border-radius: 28px 28px 16px 16px; padding: 20px 16px 16px;
  box-shadow: 0 -8px 32px rgba(0,0,0,0.12), 0 20px 60px rgba(0,0,0,0.2);
  display: flex; flex-direction: column; max-height: 90vh; overflow: hidden;
}
.modal-top-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 4px 12px; border-bottom: 1px solid rgba(174,168,155,0.15);
  flex-shrink: 0;
}
.modal-cancel, .modal-edit {
  background: none; border: none; font-size: 15px; cursor: pointer;
  font-family: var(--sans); padding: 4px 8px;
}
.modal-cancel { color: var(--text-secondary); }
.modal-edit { color: var(--accent); font-weight: 600; }
.modal-title { font-size: 18px; font-weight: 700; color: var(--text-primary); margin: 0; }

.modal-body {
  flex: 1; overflow-y: auto; -webkit-overflow-scrolling: touch;
  padding: 16px 4px; display: flex; flex-direction: column; gap: 20px;
}

.detail-section { display: flex; flex-direction: column; gap: 10px; }
.section-label {
  font-size: 12px; color: var(--text-muted, #999);
  font-weight: 500; margin-bottom: 4px;
}

.name-row {
  display: flex; align-items: center; gap: 14px; margin-bottom: 4px;
}
.item-icon {
  width: 48px; height: 48px; border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
  font-size: 26px; flex-shrink: 0;
  background: rgba(212, 165, 116, 0.15);
}
.detail-name {
  font-size: 22px; font-weight: 600; color: var(--text-primary);
  line-height: 1.2; flex: 1; min-width: 0;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}

.detail-badges {
  display: flex; gap: 8px; flex-wrap: wrap;
}
.cat-badge {
  font-size: 11px; color: var(--text-muted, #999);
  display: flex; align-items: center; gap: 3px;
  padding: 4px 10px; background: rgba(174,168,155,0.1); border-radius: 99px;
}
.cat-badge::before {
  content: ''; width: 5px; height: 5px; border-radius: 50%;
  background: var(--accent);
}
.status-badge {
  font-size: 11px; padding: 4px 10px; border-radius: 99px;
  font-weight: 500;
}
.status-badge.using { background: rgba(107,158,122,0.15); color: #5a8a6a; }
.status-badge.idle { background: rgba(212,165,116,0.15); color: var(--accent-dark, #b8895a); }
.status-badge.sold { background: rgba(150,150,150,0.15); color: var(--text-muted, #999); }

.detail-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
}
.detail-grid-item {
  background: var(--bg-card); border-radius: 12px; padding: 14px;
  box-shadow: var(--shadow-inset);
}
.dg-label {
  font-size: 11px; color: var(--text-muted, #999); margin-bottom: 4px;
}
.dg-value {
  font-size: 15px; font-weight: 600; color: var(--text-primary);
  font-family: 'SF Mono', Menlo, 'Courier New', monospace;
}
.dg-value.loss { color: #c47a5a; }
.dg-value.accent { color: var(--accent-dark, #b8895a); }

.depr-gauge { margin-top: 4px; }
.gauge-bar {
  height: 8px; border-radius: 99px;
  background: rgba(174,168,155,0.2); overflow: hidden;
  margin-top: 8px;
}
.gauge-bar .fill {
  height: 100%; border-radius: 99px; transition: width 0.8s ease-out;
}
.gauge-labels {
  display: flex; justify-content: space-between;
  font-size: 11px; color: var(--text-muted, #999); margin-top: 4px;
}

.detail-info-row {
  display: flex; justify-content: space-between;
  padding: 10px 0; border-bottom: 1px solid rgba(174,168,155,0.1);
  gap: 12px;
}
.detail-info-row:last-child { border-bottom: none; }
.dil { color: var(--text-muted, #999); font-size: 13px; flex-shrink: 0; }
.div {
  font-size: 13px; color: var(--text-primary); text-align: right;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}

.link-btn {
  display: flex; align-items: center; justify-content: center; gap: 6px;
  width: 100%; padding: 12px; border: 1px solid var(--accent);
  border-radius: 12px; background: transparent; color: var(--accent);
  font-size: 14px; font-weight: 500; cursor: pointer;
  font-family: var(--sans); transition: all 0.2s;
}
.link-btn:hover { background: var(--accent); color: #fff; }

.modal-footer {
  display: flex; gap: 10px; padding: 12px 4px 0;
  border-top: 1px solid rgba(174,168,155,0.15);
  flex-shrink: 0;
}
.btn-outline {
  flex: 1; height: 44px; border-radius: 12px;
  border: 1px solid rgba(174,168,155,0.25); background: transparent;
  color: var(--text-secondary); font-size: 14px; font-weight: 500;
  cursor: pointer; transition: all 0.15s; font-family: var(--sans);
}
.btn-outline:active { background: rgba(174,168,155,0.1); transform: scale(0.97); }
.btn-danger {
  flex: 1; height: 44px; border-radius: 12px;
  border: 1px solid #c47a5a; background: rgba(196,122,90,0.1);
  color: #c47a5a; font-size: 14px; font-weight: 500;
  cursor: pointer; transition: all 0.15s; font-family: var(--sans);
}
.btn-danger:active { background: #c47a5a; color: #fff; transform: scale(0.97); }

.modal-enter-active { transition: all 0.35s cubic-bezier(0.4,0,0.2,1); }
.modal-leave-active { transition: all 0.25s cubic-bezier(0.4,0,0.2,1); }
.modal-enter-from { opacity: 0; }
.modal-enter-from .modal-card { transform: translateY(100%); }
.modal-leave-to { opacity: 0; }
.modal-leave-to .modal-card { transform: translateY(50%); }
</style>
