<script setup>
import { computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useConfigStore } from '@/stores/configStore'

const props = defineProps({
  cityItem: { type: Object, required: true },
})

const emit = defineEmits(['select-card', 'click-detail'])

const configStore = useConfigStore()

const displayTemp = computed(() => {
  const rawTemp = props.cityItem.temp
  if (configStore.unit === 'fahrenheit') return Math.round((rawTemp * 9) / 5 + 32)
  return rawTemp
})

function onToggleFavorite() {
  const willBeFavorite = !configStore.isFavorite(props.cityItem.id)
  configStore.toggleFavorite(props.cityItem.id)
  ElMessage.success(
    props.cityItem.name +
      (willBeFavorite ? ' 즐겨찾기에 추가했습니다.' : ' 즐겨찾기에서 뺐습니다.'),
  )
}
</script>

<template>
  <el-card class="card" shadow="hover" @click="emit('select-card', cityItem)">
    <template #header>
      <div class="card__head">
        <div class="card__title">
          <h3 class="card__name">{{ cityItem.name }}</h3>
          <p class="card__region">{{ cityItem.region }}</p>
        </div>

        <button
          class="card__star"
          type="button"
          :class="{ 'card__star--on': configStore.isFavorite(cityItem.id) }"
          :aria-label="configStore.isFavorite(cityItem.id) ? '즐겨찾기 해제' : '즐겨찾기 추가'"
          @click.stop="onToggleFavorite"
        >
          {{ configStore.isFavorite(cityItem.id) ? '★' : '☆' }}
        </button>
      </div>
    </template>

    <el-tag v-if="cityItem.risk.level === 'danger'" type="danger" size="small">
      {{ cityItem.risk.label }}
    </el-tag>
    <el-tag v-else-if="cityItem.risk.level === 'warn'" type="warning" size="small">
      {{ cityItem.risk.label }}
    </el-tag>
    <el-tag v-else type="success" size="small">
      {{ cityItem.risk.label }}
    </el-tag>

    <p class="card__temp">
      {{ displayTemp }}<span class="card__unit">{{ configStore.unitSymbol }}</span>
    </p>
    <p class="card__status">{{ cityItem.status }}</p>

    <dl class="card__meta">
      <div>
        <dt>습도</dt>
        <dd>{{ cityItem.humidity }}%</dd>
      </div>
      <div>
        <dt>풍속</dt>
        <dd>{{ cityItem.wind }}m/s</dd>
      </div>
    </dl>

    <el-button
      class="card__detail"
      type="primary"
      plain
      @click.stop="emit('click-detail', cityItem)"
    >
      상세보기
    </el-button>
  </el-card>
</template>

<style scoped>
.card {
  cursor: pointer;
}
.card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.card__title {
  min-width: 0;
}
.card__name {
  margin: 0;
  font-size: 17px;
  font-weight: 600;
}
.card__region {
  margin: 2px 0 0;
  font-size: 12px;
  color: #7b8794;
}
.card__star {
  padding: 2px 4px;
  font-size: 18px;
  line-height: 1;
  color: #cbd4dd;
  background: none;
  border: none;
  cursor: pointer;
}
.card__star--on {
  color: #f0a202;
}
.card__temp {
  margin: 10px 0 0;
  font-size: 34px;
  font-weight: 600;
  line-height: 1;
}
.card__unit {
  font-size: 18px;
  font-weight: 400;
  color: #7b8794;
  margin-left: 2px;
}
.card__status {
  margin: 4px 0 0;
  font-size: 14px;
  color: #52606d;
}
.card__meta {
  display: flex;
  gap: 16px;
  margin: 14px 0 0;
  padding-top: 12px;
  border-top: 1px solid #eef2f6;
  font-size: 12px;
  color: #7b8794;
}
.card__meta div {
  display: flex;
  gap: 5px;
}
.card__meta dt,
.card__meta dd {
  margin: 0;
}
.card__meta dd {
  color: #3e4c59;
  font-weight: 500;
}
.card__detail {
  width: 100%;
  margin-top: 14px;
}
</style>
