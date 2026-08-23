<script setup>
import { computed } from 'vue'

const props = defineProps({
  selectedCity: { type: Object, default: null },
})

const statusText = computed(() => {
  if (!props.selectedCity) return '사업장을 선택해 주세요.'
  return props.selectedCity.name + '이 선택되었습니다.'
})
</script>

<template>
  <span class="status" :class="{ 'status--empty': !selectedCity }">{{ statusText }}</span>
</template>

<style scoped>
.status {
  font-weight: 500;
  color: #2f80ed;
}
.status--empty {
  font-weight: 400;
  color: #7b8794;
}
</style>
