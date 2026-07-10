<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="show" class="modal-mask" @click.self="handleClose">
        <div class="modal-container">
          <div class="modal-header">
            <h2 class="modal-title">基金详情</h2>
            <button class="close-btn" @click="handleClose">✕</button>
          </div>
          
          <div v-if="loading" class="modal-loading">
            <div class="spinner"></div>
          </div>
          
          <div v-else-if="fundDetail" class="modal-content">
            <!-- 基本信息 -->
            <section class="info-section">
              <div class="fund-name-large">{{ fundDetail.name }}</div>
              <div class="fund-meta">
                <span class="fund-code-large">{{ fundDetail.code }}</span>
                <span class="fund-type-badge">{{ fundDetail.type }}</span>
              </div>
            </section>
            
            <!-- 收益率卡片 -->
            <section class="returns-section">
              <div class="return-card">
                <div class="return-label">近1月</div>
                <div class="return-value" :class="{ positive: fundDetail.monthReturn >= 0, negative: fundDetail.monthReturn < 0 }">
                  <span class="arrow">{{ fundDetail.monthReturn >= 0 ? '↑' : '↓' }}</span>
                  <span>{{ Math.abs(fundDetail.monthReturn * 100).toFixed(2) }}%</span>
                </div>
              </div>
              <div class="return-card">
                <div class="return-label">近半年</div>
                <div class="return-value" :class="{ positive: fundDetail.halfYearReturn >= 0, negative: fundDetail.halfYearReturn < 0 }">
                  <span class="arrow">{{ fundDetail.halfYearReturn >= 0 ? '↑' : '↓' }}</span>
                  <span>{{ Math.abs(fundDetail.halfYearReturn * 100).toFixed(2) }}%</span>
                </div>
              </div>
              <div class="return-card">
                <div class="return-label">近1年</div>
                <div class="return-value" :class="{ positive: fundDetail.yearReturn >= 0, negative: fundDetail.yearReturn < 0 }">
                  <span class="arrow">{{ fundDetail.yearReturn >= 0 ? '↑' : '↓' }}</span>
                  <span>{{ Math.abs(fundDetail.yearReturn * 100).toFixed(2) }}%</span>
                </div>
              </div>
            </section>
            
            <!-- 详细信息 -->
            <section class="detail-section">
              <div class="detail-row">
                <span class="detail-label">当前净值</span>
                <span class="detail-value">{{ fundDetail.nav.toFixed(4) }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">基金规模</span>
                <span class="detail-value">{{ fundDetail.scale.toFixed(2) }} 亿元</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">基金经理</span>
                <span class="detail-value">{{ fundDetail.manager }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">基金公司</span>
                <span class="detail-value">{{ fundDetail.company }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">成立日期</span>
                <span class="detail-value">{{ fundDetail.establishDate }}</span>
              </div>
            </section>
          </div>
          
          <div v-else class="modal-empty">
            <p>加载失败，请重试</p>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { FundDetail } from '../types/fund'
import { fetchFundDetail } from '../api/fundApi'

const props = defineProps<{
  show: boolean
  fundCode: string | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const fundDetail = ref<FundDetail | null>(null)
const loading = ref(false)

// 监听显示状态，加载详情
watch(() => props.show, async (show) => {
  if (show && props.fundCode) {
    loading.value = true
    try {
      fundDetail.value = await fetchFundDetail(props.fundCode)
    } catch (error) {
      console.error('加载基金详情失败:', error)
      fundDetail.value = null
    } finally {
      loading.value = false
    }
  }
})

function handleClose() {
  emit('close')
}
</script>

<style scoped>
.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.modal-container {
  width: 100%;
  max-width: 480px;
  max-height: 85vh;
  background: var(--bg);
  border-radius: 20px 20px 0 0;
  box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

:root[data-theme="dark"] .modal-mask {
  background: rgba(0, 0, 0, 0.6);
}

:root[data-theme="dark"] .modal-container {
  background: var(--bg);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
}

.modal-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--text);
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background: var(--card);
  color: var(--text-secondary);
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s ease;
}

.close-btn:hover {
  background: var(--hover);
}

.modal-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.modal-loading,
.modal-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: rotate 0.8s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 基本信息 */
.info-section {
  margin-bottom: 20px;
}

.fund-name-large {
  font-size: 22px;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 8px;
}

.fund-meta {
  display: flex;
  align-items: center;
  gap: 10px;
}

.fund-code-large {
  font-size: 14px;
  color: var(--text-secondary);
  font-family: 'SF Mono', 'Monaco', monospace;
}

.fund-type-badge {
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 12px;
  background: var(--accent);
  color: #fff;
}

/* 收益率卡片 */
.returns-section {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 20px;
}

.return-card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 14px 12px;
  text-align: center;
}

.return-label {
  font-size: 11px;
  color: var(--text-secondary);
  margin-bottom: 6px;
}

.return-value {
  font-size: 15px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
}

.return-value .arrow {
  font-size: 14px;
}

.return-value.positive {
  color: var(--income, #4f8869);
}

.return-value.negative {
  color: var(--expense, #e88b8b);
}

/* 详细信息 */
.detail-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: var(--card);
  border-radius: 10px;
}

.detail-label {
  font-size: 13px;
  color: var(--text-secondary);
}

.detail-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
}

/* 动画 */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-active .modal-container,
.modal-fade-leave-active .modal-container {
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-from .modal-container,
.modal-fade-leave-to .modal-container {
  transform: translateY(100%);
}
</style>