<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="modal-overlay" @click.self="emit('close')">
        <div class="modal-card">
          <!-- 顶部操作栏 -->
          <div class="modal-top-row">
            <button class="modal-cancel" @click="emit('close')">取消</button>
            <h3 class="modal-title">{{ isEdit ? '编辑资产' : '新增资产' }}</h3>
            <button class="modal-save" :disabled="!canSave" @click="handleSave">完成</button>
          </div>

          <div class="modal-body">
            <!-- 名称 -->
            <div class="form-row">
              <label class="form-label">物品名称 *</label>
              <input v-model="form.name" type="text" class="form-input" placeholder="如：Sony 相机" maxlength="30" />
            </div>

            <!-- 分类选择 -->
            <div class="form-row">
              <label class="form-label">分类</label>
              <div class="category-chips">
                <button
                  v-for="cat in assetCategories"
                  :key="cat.name"
                  type="button"
                  class="cat-chip"
                  :class="{ active: form.category === cat.name }"
                  @click="selectCategory(cat)"
                >
                  <span class="chip-icon">{{ cat.icon }}</span>
                  <span>{{ cat.name }}</span>
                </button>
              </div>
            </div>

            <!-- 购入价格 + 日期 -->
            <div class="form-row-pair">
              <div class="form-col">
                <label class="form-label">购入价格 *</label>
                <input v-model="form.purchasePrice" type="number" class="form-input" placeholder="0" min="0" step="0.01" />
              </div>
              <div class="form-col">
                <label class="form-label">购入日期</label>
                <input v-model="form.purchaseDate" type="date" class="form-input" />
              </div>
            </div>

            <!-- 品牌型号 -->
            <div class="form-row-pair">
              <div class="form-col">
                <label class="form-label">品牌</label>
                <input v-model="form.brand" type="text" class="form-input" placeholder="选填" maxlength="20" />
              </div>
              <div class="form-col">
                <label class="form-label">型号</label>
                <input v-model="form.model" type="text" class="form-input" placeholder="选填" maxlength="30" />
              </div>
            </div>

            <!-- 位置 + 归属人 -->
            <div class="form-row-pair">
              <div class="form-col">
                <label class="form-label">存放位置</label>
                <input v-model="form.location" type="text" class="form-input" placeholder="如：客厅" maxlength="20" />
              </div>
              <div class="form-col">
                <label class="form-label">归属人</label>
                <input v-model="form.owner" type="text" class="form-input" placeholder="如：爸爸" maxlength="20" />
              </div>
            </div>

            <!-- 序列号 + 渠道 -->
            <div class="form-row-pair">
              <div class="form-col">
                <label class="form-label">序列号</label>
                <input v-model="form.serialNumber" type="text" class="form-input" placeholder="选填" maxlength="30" />
              </div>
              <div class="form-col">
                <label class="form-label">购买渠道</label>
                <input v-model="form.channel" type="text" class="form-input" placeholder="选填" maxlength="20" />
              </div>
            </div>

            <!-- 折旧方式 -->
            <div class="form-row">
              <label class="form-label">折旧方式</label>
              <div class="seg-control">
                <button type="button" :class="{ active: form.depreciationType === 'straight' }" @click="form.depreciationType = 'straight'">直线折旧</button>
                <button type="button" :class="{ active: form.depreciationType === 'manual' }" @click="form.depreciationType = 'manual'">手动估价</button>
              </div>
            </div>

            <!-- 直线折旧参数 -->
            <div v-if="form.depreciationType === 'straight'" class="form-row-pair">
              <div class="form-col">
                <label class="form-label">使用年限（年）</label>
                <input v-model.number="form.usefulLife" type="number" class="form-input" min="1" max="100" />
              </div>
              <div class="form-col">
                <label class="form-label">残值率</label>
                <input v-model.number="form.salvageRate" type="number" class="form-input" min="0" max="1" step="0.05" />
              </div>
            </div>

            <!-- 手动估价 -->
            <div v-else class="form-row">
              <label class="form-label">当前估价</label>
              <input v-model="form.currentValue" type="number" class="form-input" placeholder="0" min="0" step="0.01" />
            </div>

            <!-- 状态 -->
            <div class="form-row">
              <label class="form-label">状态</label>
              <div class="seg-control">
                <button type="button" :class="{ active: form.status === '在用' }" @click="form.status = '在用'">在用</button>
                <button type="button" :class="{ active: form.status === '闲置' }" @click="form.status = '闲置'">闲置</button>
                <button type="button" :class="{ active: form.status === '已出售' }" @click="form.status = '已出售'">已出售</button>
              </div>
            </div>

            <!-- 备注 -->
            <div class="form-row">
              <label class="form-label">备注</label>
              <textarea v-model="form.note" class="form-input form-textarea" placeholder="选填" maxlength="100"></textarea>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { Asset, Category } from '../types'
import { todayStr } from '../storage'

const props = defineProps<{
  show: boolean
  asset?: Asset | null      // 编辑时传入，新增时不传
  assetCategories: Category[]
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save', asset: Asset): void
}>()

const isEdit = computed(() => !!props.asset)

const form = ref({
  name: '',
  category: '',
  icon: '📦',
  purchasePrice: '' as string | number,
  purchaseDate: todayStr(),
  currentValue: '' as string | number,
  brand: '',
  model: '',
  serialNumber: '',
  location: '',
  owner: '',
  channel: '',
  usefulLife: 5,
  salvageRate: 0.1,
  depreciationType: 'straight' as 'straight' | 'manual',
  note: '',
})

// 当 show 变为 true 时，初始化表单
watch(() => props.show, (v) => {
  if (!v) return
  if (props.asset) {
    // 编辑模式：填充已有值
    Object.assign(form.value, {
      name: props.asset.name,
      category: props.asset.category,
      icon: props.asset.icon,
      purchasePrice: props.asset.purchasePrice,
      purchaseDate: props.asset.purchaseDate,
      currentValue: props.asset.currentValue,
      brand: props.asset.brand ?? '',
      model: props.asset.model ?? '',
      serialNumber: props.asset.serialNumber ?? '',
      location: props.asset.location ?? '',
      owner: props.asset.owner ?? '',
      channel: props.asset.channel ?? '',
      usefulLife: props.asset.usefulLife ?? 5,
      salvageRate: props.asset.salvageRate ?? 0.1,
      depreciationType: props.asset.depreciationType ?? 'straight',
      status: props.asset.status ?? '在用',
      note: props.asset.note ?? '',
    })
  } else {
    // 新增模式：默认值
    Object.assign(form.value, {
      name: '', category: props.assetCategories[0]?.name ?? '其他', icon: props.assetCategories[0]?.icon ?? '📦',
      purchasePrice: '', purchaseDate: todayStr(), currentValue: '',
      brand: '', model: '', serialNumber: '', location: '', owner: '', channel: '',
      usefulLife: 5, salvageRate: 0.1, depreciationType: 'straight', note: '',
    })
  }
})

const canSave = computed(() => {
  return form.value.name.trim() !== '' && Number(form.value.purchasePrice) > 0
})

function selectCategory(cat: Category) {
  form.value.category = cat.name
  form.value.icon = cat.icon
}

function handleSave() {
  if (!canSave.value) return
  const now = new Date().toISOString()
  const asset: Asset = {
    id: props.asset?.id ?? 0,  // 新增时由父组件分配
    name: form.value.name.trim(),
    category: form.value.category,
    icon: form.value.icon,
    purchasePrice: Number(form.value.purchasePrice),
    purchaseDate: form.value.purchaseDate,
    currentValue: form.value.depreciationType === 'manual' ? Number(form.value.currentValue) : Number(form.value.purchasePrice),
    brand: form.value.brand || undefined,
    model: form.value.model || undefined,
    serialNumber: form.value.serialNumber || undefined,
    location: form.value.location || undefined,
    owner: form.value.owner || undefined,
    channel: form.value.channel || undefined,
    usefulLife: form.value.depreciationType === 'straight' ? Number(form.value.usefulLife) : undefined,
    salvageRate: form.value.depreciationType === 'straight' ? Number(form.value.salvageRate) : undefined,
    depreciationType: form.value.depreciationType,
    note: form.value.note || undefined,
    transactionId: props.asset?.transactionId,
    createdAt: props.asset?.createdAt ?? now,
    updatedAt: now,
  }
  emit('save', asset)
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
  border-radius: 28px 28px 16px 16px; padding: 20px 16px 24px;
  box-shadow: 0 -8px 32px rgba(0,0,0,0.12), 0 20px 60px rgba(0,0,0,0.2);
  display: flex; flex-direction: column; gap: 16px; max-height: 85vh; overflow-y: auto;
}
.modal-top-row { display: flex; align-items: center; justify-content: space-between; padding: 0 4px; }
.modal-cancel { background: none; border: none; font-size: 15px; color: var(--text-secondary); cursor: pointer; font-family: var(--sans); padding: 4px 8px; }
.modal-title { font-size: 18px; font-weight: 700; color: var(--text-primary); margin: 0; }
.modal-save { background: var(--accent); border: none; font-size: 14px; font-weight: 600; color: #fff; cursor: pointer; font-family: var(--sans); padding: 6px 16px; border-radius: 16px; box-shadow: 0 2px 8px rgba(212,165,116,0.35); }
.modal-save:active { transform: scale(0.95); }
.modal-save:disabled { opacity: 0.4; cursor: not-allowed; box-shadow: none; }

.modal-body { display: flex; flex-direction: column; gap: 14px; }

.form-row, .form-row-pair { display: flex; flex-direction: column; gap: 6px; }
.form-row-pair { flex-direction: row; gap: 12px; }
.form-col { flex: 1; display: flex; flex-direction: column; gap: 6px; }

.form-label { font-size: 12px; color: var(--text-secondary); font-weight: 500; }

.form-input {
  width: 100%; padding: 10px 14px; border: none; border-radius: 12px;
  background: var(--bg-card); box-shadow: var(--shadow-inset);
  font-size: 14px; font-family: var(--sans); color: var(--text-primary);
  outline: none; box-sizing: border-box; transition: box-shadow 0.2s;
}
.form-input:focus { box-shadow: var(--shadow-inset), 0 0 0 2px var(--accent); }
.form-input::placeholder { color: var(--text-muted); }

.form-textarea { resize: vertical; min-height: 60px; font-family: var(--sans); }

.category-chips { display: flex; flex-wrap: wrap; gap: 8px; }
.cat-chip {
  display: flex; align-items: center; gap: 4px;
  padding: 6px 12px; border: none; border-radius: 16px;
  background: var(--bg-card); box-shadow: var(--shadow-sm);
  font-size: 13px; cursor: pointer; font-family: var(--sans); color: var(--text-primary);
  transition: all 0.2s;
}
.cat-chip:active { transform: scale(0.95); }
.cat-chip.active {
  background: var(--accent); color: #fff;
  box-shadow: 0 2px 8px rgba(212,165,116,0.35);
}
.chip-icon { font-size: 16px; }

.seg-control {
  display: flex; border-radius: 12px; overflow: hidden;
  background: var(--bg-card); box-shadow: var(--shadow-inset);
}
.seg-control button {
  flex: 1; padding: 10px; border: none; background: transparent;
  font-size: 13px; cursor: pointer; font-family: var(--sans); color: var(--text-secondary);
  transition: all 0.2s;
}
.seg-control button.active {
  background: var(--accent); color: #fff; font-weight: 500;
}

.modal-enter-active { transition: all 0.35s cubic-bezier(0.4,0,0.2,1); }
.modal-leave-active { transition: all 0.25s cubic-bezier(0.4,0,0.2,1); }
.modal-enter-from { opacity: 0; }
.modal-enter-from .modal-card { transform: translateY(100%); }
.modal-leave-to { opacity: 0; }
.modal-leave-to .modal-card { transform: translateY(50%); }
</style>
