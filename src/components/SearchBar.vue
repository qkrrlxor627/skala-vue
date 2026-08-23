<script setup>
defineProps({
  query: { type: String, required: true },
})

const emit = defineEmits(['update-query'])

function onInput(value) {
  emit('update-query', value)
}

function onKeyup(event) {
  emit('update-query', event.target.value)
}
</script>

<template>
  <div class="search">
    <label class="search__label" for="city-search">사업장 검색</label>
    <el-input
      id="city-search"
      :model-value="query"
      clearable
      placeholder="사업장명 또는 지역으로 검색하세요"
      @input="onInput"
      @keyup="onKeyup"
    />

    <p class="search__echo">
      입력한 검색어 :
      <strong v-if="query">{{ query }}</strong>
      <span v-else class="search__empty">(없음)</span>
    </p>
  </div>
</template>

<style scoped>
.search {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.search__label {
  font-size: 13px;
  font-weight: 600;
  color: #3e4c59;
}
.search__echo {
  margin: 2px 0 0;
  font-size: 13px;
  color: #52606d;
}
.search__echo strong {
  color: #2f80ed;
}
.search__empty {
  color: #9aa5b1;
}
</style>
