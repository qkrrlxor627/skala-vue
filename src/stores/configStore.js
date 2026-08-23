import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useConfigStore = defineStore('config', () => {
  const unit = ref('celsius')

  const unitSymbol = computed(() => (unit.value === 'celsius' ? '℃' : '℉'))

  function toggleUnit() {
    unit.value = unit.value === 'celsius' ? 'fahrenheit' : 'celsius'
  }

  const favorites = ref([])

  const favoriteCount = computed(() => favorites.value.length)

  function toggleFavorite(cityId) {
    const index = favorites.value.indexOf(cityId)
    if (index === -1) favorites.value.push(cityId)
    else favorites.value.splice(index, 1)
  }

  function isFavorite(cityId) {
    return favorites.value.includes(cityId)
  }

  return {
    unit,
    unitSymbol,
    toggleUnit,
    favorites,
    favoriteCount,
    toggleFavorite,
    isFavorite,
  }
})
