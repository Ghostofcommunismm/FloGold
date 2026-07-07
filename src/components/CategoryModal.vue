<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
        <div class="modal-card">
          <!-- 顶部操作栏 -->
          <div class="modal-top-row">
            <button class="modal-cancel" @click="$emit('close')">返回</button>
            <h3 class="modal-title">分类管理</h3>
            <button class="modal-save" @click="showAdd = !showAdd">添加</button>
          </div>

          <!-- 添加分类区域 -->
          <Transition name="expand">
            <div v-if="showAdd" class="add-section">
              <div class="add-row">
                <div class="icon-picker" @click="pickIcon">
                  <span class="picked-icon">{{ newIcon }}</span>
                </div>
                <input
                  v-model="newName"
                  type="text"
                  class="name-input"
                  placeholder="分类名称"
                  maxlength="6"
                />
                <button class="add-confirm" :disabled="!newName.trim()" @click="addCategory">确认</button>
              </div>
              <!-- 图标选择 -->
              <div v-if="showIconPicker" class="icon-grid">
                <button
                  v-for="emoji in iconList"
                  :key="emoji"
                  class="icon-option"
                  :class="{ active: newIcon === emoji }"
                  @click="selectIcon(emoji)"
                >{{ emoji }}</button>
              </div>
            </div>
          </Transition>

          <!-- 分类列表 -->
          <div class="cat-list">
            <div
              v-for="cat in localCategories"
              :key="cat.name"
              class="cat-list-item"
            >
              <div class="cat-list-left">
                <span class="cat-list-icon">{{ cat.icon }}</span>
                <span class="cat-list-name">{{ cat.name }}</span>
                <span v-if="cat.isDefault" class="cat-list-default">默认</span>
              </div>
              <button
                v-if="!cat.isDefault"
                class="cat-list-delete"
                @click="deleteCategory(cat.name)"
              >删除</button>
            </div>
          </div>

          <!-- 二级分类管理 -->
          <div class="sub-section">
            <h4 class="sub-title">二级分类管理</h4>
            <div
              v-for="cat in localCategories"
              :key="'sub-' + cat.name"
              class="sub-cat-group"
            >
              <div class="sub-cat-header">{{ cat.icon }} {{ cat.name }}</div>
              <div class="sub-cat-tags">
                <span
                  v-for="sub in (localSubCategories[cat.name] || [])"
                  :key="sub"
                  class="sub-tag"
                >
                  {{ sub }}
                  <button
                    v-if="(localSubCategories[cat.name] || []).length > 1"
                    class="sub-tag-del"
                    @click="deleteSub(cat.name, sub)"
                  >×</button>
                </span>
                <button class="sub-tag-add" @click="openAddSub(cat.name)">+ 添加</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 添加二级分类弹窗 -->
    <Transition name="modal">
      <div v-if="showAddSub" class="modal-overlay sub-modal-overlay" @click.self="closeAddSub">
        <div class="sub-modal-card">
          <div class="sub-modal-header">
            <h4 class="sub-modal-title">添加二级分类</h4>
            <p class="sub-modal-desc">为「{{ addSubCatName }}」添加新的二级分类</p>
          </div>
          <input
            ref="subInputRef"
            v-model="newSubName"
            type="text"
            class="sub-modal-input"
            placeholder="请输入二级分类名称"
            maxlength="10"
            @keyup.enter="confirmAddSub"
          />
          <div v-if="subNameError" class="sub-modal-error">{{ subNameError }}</div>
          <div class="sub-modal-actions">
            <button class="sub-modal-btn cancel" @click="closeAddSub">取消</button>
            <button class="sub-modal-btn confirm" :disabled="!canAddSub" @click="confirmAddSub">确认添加</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, computed, nextTick } from 'vue'
import type { Category, SubCategories } from '../types'

const props = defineProps<{
  show: boolean
  categories: Category[]
  subCategories: SubCategories
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save', categories: Category[], subCategories: SubCategories): void
}>()

const localCategories = ref<{ name: string; icon: string; isDefault: boolean }[]>([])
const localSubCategories = ref<SubCategories>({})
const showAdd = ref(false)
const newName = ref('')
const newIcon = ref('📦')
const showIconPicker = ref(false)

const showAddSub = ref(false)
const addSubCatName = ref('')
const newSubName = ref('')
const subNameError = ref('')
const subInputRef = ref<HTMLInputElement | null>(null)

const iconList = ['🍜','🚗','🛍️','🎮','🏠','💊','📚','🎁','📦','☕','🍔','🍕','🍜','🍣','🍰','🧋','🚇','✈️','🚕','🚲','⛽','🅿️','👔','👟','💻','📱','🎧','💄','🛋️','💡','🎬','🎵','⚽','🏀','🏊','🎮','🎪','🏫','✏️','📖','🎓','🏥','💉','💊','🩺','🦷','💰','💵','💳','📈','🏠','🏢','🐶','🐱','🌸','🎨','✂️','🔧','🧹','🎁','🎉','🍻']

watch(() => props.show, (v) => {
  if (v) {
    const defaultNames = ['餐饮','交通','购物','娱乐','居家','医疗','教育','人情','其他']
    localCategories.value = props.categories.map(c => ({ ...c, isDefault: defaultNames.includes(c.name) }))
    localSubCategories.value = JSON.parse(JSON.stringify(props.subCategories))
    showAdd.value = false
    showIconPicker.value = false
    newName.value = ''
    newIcon.value = '📦'
  }
})

function pickIcon() {
  showIconPicker.value = !showIconPicker.value
}

function selectIcon(emoji: string) {
  newIcon.value = emoji
  showIconPicker.value = false
}

function addCategory() {
  const name = newName.value.trim()
  if (!name) return
  if (localCategories.value.some(c => c.name === name)) return
  localCategories.value.push({ name, icon: newIcon.value, isDefault: false })
  localSubCategories.value[name] = ['其他']
  newName.value = ''
  newIcon.value = '📦'
  showAdd.value = false
  emitSave()
}

function deleteCategory(name: string) {
  localCategories.value = localCategories.value.filter(c => c.name !== name)
  delete localSubCategories.value[name]
  emitSave()
}

function deleteSub(catName: string, sub: string) {
  const subs = localSubCategories.value[catName]
  if (!subs || subs.length <= 1) return
  localSubCategories.value[catName] = subs.filter(s => s !== sub)
  emitSave()
}

function openAddSub(catName: string) {
  addSubCatName.value = catName
  newSubName.value = ''
  subNameError.value = ''
  showAddSub.value = true
  nextTick(() => {
    subInputRef.value?.focus()
  })
}

function closeAddSub() {
  showAddSub.value = false
  newSubName.value = ''
  subNameError.value = ''
}

const canAddSub = computed(() => {
  const trimmed = newSubName.value.trim()
  if (!trimmed) return false
  const subs = localSubCategories.value[addSubCatName.value] || []
  return !subs.includes(trimmed)
})

function confirmAddSub() {
  const trimmed = newSubName.value.trim()
  if (!trimmed) {
    subNameError.value = '请输入二级分类名称'
    return
  }
  const subs = localSubCategories.value[addSubCatName.value] || []
  if (subs.includes(trimmed)) {
    subNameError.value = '该二级分类已存在'
    return
  }
  if (!localSubCategories.value[addSubCatName.value]) {
    localSubCategories.value[addSubCatName.value] = []
  }
  localSubCategories.value[addSubCatName.value].push(trimmed)
  emitSave()
  closeAddSub()
}

function emitSave() {
  emit('save',
    localCategories.value.map(({ name, icon }) => ({ name, icon })),
    { ...localSubCategories.value }
  )
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

.add-section { display: flex; flex-direction: column; gap: 10px; padding: 12px; border-radius: 16px; background: var(--bg-card); box-shadow: var(--shadow-sm); }
.add-row { display: flex; align-items: center; gap: 8px; }
.icon-picker { width: 44px; height: 44px; border-radius: 14px; background: var(--bg-primary); display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: var(--shadow-inset); flex-shrink: 0; }
.picked-icon { font-size: 22px; }
.name-input { flex: 1; padding: 10px 14px; border: none; border-radius: 12px; background: var(--bg-primary); box-shadow: var(--shadow-inset); font-size: 15px; font-family: var(--sans); color: var(--text-primary); outline: none; }
.add-confirm { padding: 8px 16px; border: none; border-radius: 12px; background: var(--accent); color: #fff; font-size: 13px; font-weight: 600; cursor: pointer; font-family: var(--sans); flex-shrink: 0; }
.add-confirm:disabled { opacity: 0.4; }
.icon-grid { display: flex; flex-wrap: wrap; gap: 6px; max-height: 140px; overflow-y: auto; padding-top: 4px; border-top: 1px solid rgba(0,0,0,0.05); }
.icon-option { width: 36px; height: 36px; border: 2px solid transparent; border-radius: 10px; background: var(--bg-primary); font-size: 18px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
.icon-option.active { border-color: var(--accent); background: var(--accent-light); }

.cat-list { display: flex; flex-direction: column; gap: 8px; }
.cat-list-item { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-radius: 14px; background: var(--bg-card); box-shadow: var(--shadow-sm); }
.cat-list-left { display: flex; align-items: center; gap: 10px; }
.cat-list-icon { font-size: 20px; }
.cat-list-name { font-size: 15px; font-weight: 600; color: var(--text-primary); }
.cat-list-default { font-size: 10px; color: var(--text-muted); background: rgba(0,0,0,0.05); padding: 1px 8px; border-radius: 8px; }
.cat-list-delete { padding: 4px 12px; border: none; border-radius: 10px; background: var(--expense-bg); color: var(--expense); font-size: 12px; font-weight: 600; cursor: pointer; font-family: var(--sans); }

.sub-section { display: flex; flex-direction: column; gap: 10px; }
.sub-title { font-size: 15px; font-weight: 700; color: var(--text-primary); margin: 0; }
.sub-cat-group { padding: 10px 14px; border-radius: 14px; background: var(--bg-card); box-shadow: var(--shadow-sm); }
.sub-cat-header { font-size: 13px; font-weight: 600; color: var(--text-primary); margin-bottom: 8px; }
.sub-cat-tags { display: flex; flex-wrap: wrap; gap: 6px; }
.sub-tag { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 10px; background: var(--bg-primary); font-size: 12px; color: var(--text-secondary); box-shadow: var(--shadow-inset); }
.sub-tag-del { border: none; background: none; color: var(--text-muted); font-size: 14px; cursor: pointer; line-height: 1; padding: 0; }
.sub-tag-del:hover { color: var(--expense); }
.sub-tag-add { padding: 4px 10px; border: 1px dashed var(--text-muted); border-radius: 10px; background: transparent; font-size: 12px; color: var(--accent-dark); cursor: pointer; font-family: var(--sans); }

.expand-enter-active, .expand-leave-active { transition: all 0.3s ease; overflow: hidden; }
.expand-enter-from, .expand-leave-to { opacity: 0; max-height: 0; }
.expand-enter-to, .expand-leave-from { opacity: 1; max-height: 300px; }

.modal-enter-active { transition: all 0.35s cubic-bezier(0.4,0,0.2,1); }
.modal-leave-active { transition: all 0.25s cubic-bezier(0.4,0,0.2,1); }
.modal-enter-from { opacity: 0; }
.modal-enter-from .modal-card { transform: translateY(100%); }
.modal-leave-to { opacity: 0; }
.modal-leave-to .modal-card { transform: translateY(50%); }

.sub-modal-overlay {
  align-items: center;
  z-index: 250;
}
.sub-modal-card {
  width: calc(100% - 48px);
  max-width: 340px;
  background: var(--bg-primary);
  border-radius: 20px;
  padding: 24px 20px 20px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.2);
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.sub-modal-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
  text-align: center;
}
.sub-modal-title {
  font-size: 17px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}
.sub-modal-desc {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0;
}
.sub-modal-input {
  width: 100%;
  padding: 12px 16px;
  border: none;
  border-radius: 12px;
  background: var(--bg-card);
  box-shadow: var(--shadow-inset);
  font-size: 15px;
  font-family: var(--sans);
  color: var(--text-primary);
  outline: none;
  box-sizing: border-box;
}
.sub-modal-input::placeholder {
  color: var(--text-muted);
}
.sub-modal-error {
  font-size: 12px;
  color: var(--expense);
  text-align: center;
  margin-top: -8px;
}
.sub-modal-actions {
  display: flex;
  gap: 10px;
  margin-top: 4px;
}
.sub-modal-btn {
  flex: 1;
  padding: 11px 0;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  font-family: var(--sans);
  transition: all 0.2s;
}
.sub-modal-btn:active {
  transform: scale(0.96);
}
.sub-modal-btn.cancel {
  background: var(--bg-card);
  color: var(--text-secondary);
  box-shadow: var(--shadow-sm);
}
.sub-modal-btn.confirm {
  background: var(--accent);
  color: #fff;
  box-shadow: 0 2px 8px rgba(212,165,116,0.35);
}
.sub-modal-btn.confirm:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.sub-modal-overlay.modal-enter-from .sub-modal-card {
  transform: scale(0.9);
  opacity: 0;
}
.sub-modal-overlay.modal-leave-to .sub-modal-card {
  transform: scale(0.9);
  opacity: 0;
}
</style>
