<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import WeatherCard from '@/components/WeatherCard.vue'
import EmptyState from '@/components/EmptyState.vue'
import { useConfigStore } from '@/stores/configStore'

const router = useRouter()
const configStore = useConfigStore()

const weatherApi = axios.create({
  baseURL: 'https://api.openweathermap.org/data/2.5',
  params: {
    appid: import.meta.env.VITE_OPENWEATHER_KEY,
    units: 'metric',
    lang: 'kr',
  },
})

weatherApi.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    let message = '기상 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'
    if (status === 401) message = 'API 키가 아직 활성화되지 않았습니다. (최대 2시간 소요)'
    else if (status === 404) message = '해당 지점을 찾을 수 없습니다.'
    else if (status === 429) message = 'API 호출 한도를 초과했습니다.'
    return Promise.reject(new Error(message))
  },
)

const SITE_LIST = [
  { id: 'site_01', name: '가상 A 사업장', region: '경기 남부', lat: 37.2, lon: 127.2 },
  { id: 'site_02', name: '가상 B 사업장', region: '충청 중부', lat: 36.6, lon: 127.5 },
  { id: 'site_03', name: '가상 C 사업장', region: '영남 동부', lat: 35.5, lon: 129.3 },
  { id: 'site_04', name: '가상 D 사업장', region: '호남 서부', lat: 35.2, lon: 126.9 },
  { id: 'site_05', name: '가상 E 사업장', region: '영남 북부', lat: 36.1, lon: 128.4 },
]

const RISK_DANGER_POP = 0.7
const RISK_WARN_POP = 0.4

const judgeRisk = (forecast) => {
  const maxPop = Math.max(...forecast.map((f) => f.pop))
  if (maxPop >= RISK_DANGER_POP) return { level: 'danger', label: '작업 중단 권고' }
  if (maxPop >= RISK_WARN_POP) return { level: 'warn', label: '주의 권고' }
  return { level: 'safe', label: '작업 가능' }
}

function buildMockForecast(baseTemp, pops) {
  return pops.map((pop, index) => ({
    time: '08-23 ' + String((index + 1) * 3).padStart(2, '0') + ':00',
    temp: baseTemp + index - 3,
    pop,
    status: pop >= RISK_DANGER_POP ? '비' : pop >= RISK_WARN_POP ? '구름많음' : '맑음',
  }))
}

const MOCK_SITES = [
  {
    ...SITE_LIST[0],
    temp: 27,
    status: '비',
    humidity: 88,
    wind: 4.2,
    pressure: 1005,
    forecast: buildMockForecast(27, [0.2, 0.5, 0.8, 0.9, 0.7, 0.4, 0.2, 0.1]),
  },
  {
    ...SITE_LIST[1],
    temp: 26,
    status: '구름많음',
    humidity: 72,
    wind: 2.6,
    pressure: 1009,
    forecast: buildMockForecast(26, [0.1, 0.2, 0.4, 0.5, 0.3, 0.2, 0.1, 0.0]),
  },
  {
    ...SITE_LIST[2],
    temp: 29,
    status: '맑음',
    humidity: 55,
    wind: 1.8,
    pressure: 1012,
    forecast: buildMockForecast(29, [0.0, 0.0, 0.1, 0.1, 0.0, 0.0, 0.0, 0.0]),
  },
  {
    ...SITE_LIST[3],
    temp: 24,
    status: '비',
    humidity: 91,
    wind: 5.4,
    pressure: 1003,
    forecast: buildMockForecast(24, [0.6, 0.8, 0.9, 0.8, 0.6, 0.5, 0.3, 0.2]),
  },
  {
    ...SITE_LIST[4],
    temp: 22,
    status: '흐림',
    humidity: 64,
    wind: 3.1,
    pressure: 1011,
    forecast: buildMockForecast(22, [0.1, 0.1, 0.2, 0.3, 0.2, 0.1, 0.0, 0.0]),
  },
]

const weatherList = ref(MOCK_SITES.map((site) => ({ ...site, risk: judgeRisk(site.forecast) })))

const isLoading = ref(true)
const errorMessage = ref('')
const isMockFallback = ref(false)

const favoriteWeatherList = computed(() =>
  weatherList.value.filter((site) => configStore.isFavorite(site.id)),
)

function formatForecastTime(unixSeconds) {
  const date = new Date(unixSeconds * 1000)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  return month + '-' + day + ' ' + hour + ':' + minute
}

function mapSiteWeather(data) {
  const current = data.list[0]
  const forecast = data.list.slice(0, 8).map((item) => ({
    time: formatForecastTime(item.dt),
    temp: Math.round(item.main.temp),
    pop: item.pop ?? 0,
    status: item.weather[0].description,
  }))

  return {
    temp: Math.round(current.main.temp),
    status: current.weather[0].description,
    humidity: current.main.humidity,
    wind: current.wind.speed,
    pressure: current.main.pressure,
    forecast,
    risk: judgeRisk(forecast),
  }
}

async function loadAllWeather() {
  isLoading.value = true
  errorMessage.value = ''
  isMockFallback.value = false

  const results = await Promise.allSettled(
    SITE_LIST.map((site) =>
      weatherApi.get('/forecast', { params: { lat: site.lat, lon: site.lon } }),
    ),
  )

  const fulfilled = []
  const rejected = []
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') fulfilled.push({ index, data: result.value.data })
    else rejected.push({ index, reason: result.reason })
  })

  if (fulfilled.length === 0) {
    isMockFallback.value = true
    errorMessage.value = rejected[0]?.reason?.message ?? '기상 정보를 불러오지 못했습니다.'
  } else {
    const next = [...weatherList.value]
    fulfilled.forEach(({ index, data }) => {
      next[index] = { ...next[index], ...mapSiteWeather(data) }
    })
    weatherList.value = next

    if (rejected.length > 0) {
      isMockFallback.value = true
      errorMessage.value =
        rejected.length + '개 사업장은 실시간 조회에 실패해 Mock 데이터로 표시됩니다.'
    }
  }

  isLoading.value = false
}

function onClickDetail(site) {
  router.push({ name: 'WeatherDetail', params: { cityId: site.id } })
}

onMounted(loadAllWeather)
</script>

<template>
  <div class="favorites">
    <div v-if="!isLoading && isMockFallback" class="alert">
      <span class="alert__text">{{ errorMessage }}</span>
      <button class="alert__retry" type="button" @click="loadAllWeather()">다시 시도</button>
    </div>

    <header class="favorites__head">
      <h1 class="favorites__title">즐겨찾기</h1>
      <span class="favorites__count">{{ configStore.favoriteCount }}개</span>
    </header>

    <el-skeleton v-if="isLoading" class="panel" :rows="3" animated :throttle="300" />
    <EmptyState
      v-else-if="favoriteWeatherList.length === 0"
      class="panel"
      message="아직 즐겨찾기한 사업장이 없습니다. 대시보드에서 카드의 별 아이콘을 눌러 추가하세요."
    />
    <div v-else class="grid">
      <WeatherCard
        v-for="site in favoriteWeatherList"
        :key="site.id"
        :city-item="site"
        @click-detail="onClickDetail"
      />
    </div>
  </div>
</template>

<style scoped>
.favorites {
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.alert {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  font-size: 13px;
  color: #8a6116;
  background: #fff7e6;
  border: 1px solid #f5d99a;
  border-radius: 10px;
}
.alert__retry {
  flex-shrink: 0;
  padding: 6px 13px;
  font-size: 13px;
  color: #8a6116;
  background: #fff;
  border: 1px solid #e0be74;
  border-radius: 7px;
  cursor: pointer;
}
.alert__retry:hover {
  background: #fdf3df;
}
.favorites__head {
  display: flex;
  align-items: baseline;
  gap: 10px;
}
.favorites__title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #1f2933;
}
.favorites__count {
  font-size: 13px;
  color: #7b8794;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 14px;
}
.panel {
  padding: 24px;
  background: #fff;
  border: 1px solid #e3e8ee;
  border-radius: 14px;
}
</style>
