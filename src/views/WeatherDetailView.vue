<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import SiteShadeMap from '@/components/SiteShadeMap.vue'
import { useConfigStore } from '@/stores/configStore'

const props = defineProps({
  cityId: { type: String, required: true },
})

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
    let message = '날씨 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'
    if (status === 401) message = 'API 키가 아직 활성화되지 않았습니다. (최대 2시간 소요)'
    else if (status === 404) message = '해당 지점을 찾을 수 없습니다.'
    else if (status === 429) message = 'API 호출 한도를 초과했습니다.'
    return Promise.reject(new Error(message))
  },
)

const cityList = ref([
  { id: 'site_01', name: '가상 A 사업장', region: '경기 남부', lat: 37.2, lon: 127.2 },
  { id: 'site_02', name: '가상 B 사업장', region: '충청 중부', lat: 36.6, lon: 127.5 },
  { id: 'site_03', name: '가상 C 사업장', region: '영남 동부', lat: 35.5, lon: 129.3 },
  { id: 'site_04', name: '가상 D 사업장', region: '호남 서부', lat: 35.2, lon: 126.9 },
  { id: 'site_05', name: '가상 E 사업장', region: '영남 북부', lat: 36.1, lon: 128.4 },
])

const cityInfo = ref(null)
const isLoading = ref(true)
const isMockFallback = ref(false)
const errorMessage = ref('')

const weatherInfo = ref({
  temp: 27,
  feelsLike: 29,
  status: '맑음',
  humidity: 45,
  wind: 2.4,
  pressure: 1008,
})

const forecastList = ref([
  { key: 'mock_1', time: '03:00', temp: 22, pop: 0.1, status: '맑음' },
  { key: 'mock_2', time: '06:00', temp: 23, pop: 0.2, status: '맑음' },
  { key: 'mock_3', time: '09:00', temp: 26, pop: 0.3, status: '구름 조금' },
  { key: 'mock_4', time: '12:00', temp: 29, pop: 0.5, status: '구름 조금' },
  { key: 'mock_5', time: '15:00', temp: 30, pop: 0.4, status: '맑음' },
  { key: 'mock_6', time: '18:00', temp: 28, pop: 0.2, status: '흐림' },
  { key: 'mock_7', time: '21:00', temp: 25, pop: 0.1, status: '흐림' },
  { key: 'mock_8', time: '24:00', temp: 23, pop: 0.0, status: '맑음' },
])

const airQualityIndex = ref(2)

const RISK_DANGER_POP = 0.7
const RISK_WARN_POP = 0.4

const judgeRisk = (forecast) => {
  if (!forecast || forecast.length === 0) return 'safe'
  const maxPop = Math.max(...forecast.map((f) => f.pop ?? 0))
  if (maxPop >= RISK_DANGER_POP) return 'danger'
  if (maxPop >= RISK_WARN_POP) return 'warn'
  return 'safe'
}

const riskLevel = computed(() => judgeRisk(forecastList.value))

function toDisplayTemp(rawTemp) {
  if (configStore.unit === 'fahrenheit') return Math.round((rawTemp * 9) / 5 + 32)
  return rawTemp
}

const displayTemp = computed(() => toDisplayTemp(weatherInfo.value.temp))
const displayFeelsLike = computed(() => toDisplayTemp(weatherInfo.value.feelsLike))

const airQualityLabel = computed(() => {
  const labels = ['좋음', '보통', '나쁨', '매우 나쁨', '최악']
  return labels[airQualityIndex.value - 1] ?? '알 수 없음'
})

async function loadDetail(city) {
  isLoading.value = true
  errorMessage.value = ''
  isMockFallback.value = false

  const [weatherResult, forecastResult, airResult] = await Promise.allSettled([
    weatherApi.get('/weather', { params: { lat: city.lat, lon: city.lon } }),
    weatherApi.get('/forecast', { params: { lat: city.lat, lon: city.lon } }),
    weatherApi.get('/air_pollution', { params: { lat: city.lat, lon: city.lon } }),
  ])

  const failedMessages = []

  if (weatherResult.status === 'fulfilled') {
    const data = weatherResult.value.data
    weatherInfo.value = {
      temp: Math.round(data.main.temp),
      feelsLike: Math.round(data.main.feels_like),
      status: data.weather[0].description,
      humidity: data.main.humidity,
      wind: data.wind.speed,
      pressure: data.main.pressure,
    }
  } else {
    failedMessages.push(weatherResult.reason?.message ?? '현재 날씨 조회 실패')
  }

  if (forecastResult.status === 'fulfilled') {
    forecastList.value = forecastResult.value.data.list.slice(0, 8).map((item) => ({
      key: String(item.dt),
      time: new Date(item.dt * 1000).toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }),
      temp: Math.round(item.main.temp),
      pop: item.pop ?? 0,
      status: item.weather[0].description,
    }))
  } else {
    failedMessages.push(forecastResult.reason?.message ?? '예보 조회 실패')
  }

  if (airResult.status === 'fulfilled') {
    airQualityIndex.value = airResult.value.data.list[0].main.aqi
  } else {
    failedMessages.push(airResult.reason?.message ?? '대기질 조회 실패')
  }

  if (failedMessages.length > 0) {
    isMockFallback.value = true
    errorMessage.value = failedMessages[0]
  }

  isLoading.value = false
}

onMounted(() => {
  cityInfo.value = cityList.value.find((city) => city.id === props.cityId) ?? null

  if (!cityInfo.value) {
    isLoading.value = false
    return
  }

  loadDetail(cityInfo.value)
})
</script>

<template>
  <div class="detail">
    <div v-if="!cityInfo" class="empty">
      <h1 class="empty__title">사업장을 찾을 수 없습니다</h1>
      <p class="empty__desc">
        <code>{{ cityId }}</code> 에 해당하는 사업장이 없습니다.
      </p>
      <RouterLink class="btn btn--primary" to="/">메인으로 돌아가기</RouterLink>
    </div>

    <template v-else>
      <RouterLink class="back" to="/">← 메인 대시보드</RouterLink>

      <div v-if="!isLoading && isMockFallback" class="alert">
        {{ errorMessage }} — 일부 항목은 Mock 데이터로 표시됩니다.
      </div>

      <p v-if="isLoading" class="state">상세 정보를 불러오는 중입니다...</p>

      <template v-else>
        <section class="panel">
          <header class="panel__head">
            <h1 class="panel__title">{{ cityInfo.name }}</h1>
            <span class="panel__region">{{ cityInfo.region }}</span>
            <span class="panel__status">{{ weatherInfo.status }}</span>
          </header>

          <p class="panel__temp">
            {{ displayTemp }}<span class="panel__unit">{{ configStore.unitSymbol }}</span>
          </p>
          <p class="panel__feels">체감온도 {{ displayFeelsLike }}{{ configStore.unitSymbol }}</p>

          <dl class="facts">
            <div class="facts__item">
              <dt>습도</dt>
              <dd>{{ weatherInfo.humidity }}%</dd>
            </div>
            <div class="facts__item">
              <dt>풍속</dt>
              <dd>{{ weatherInfo.wind }}m/s</dd>
            </div>
            <div class="facts__item">
              <dt>기압</dt>
              <dd>{{ weatherInfo.pressure }}hPa</dd>
            </div>
            <div class="facts__item">
              <dt>대기질</dt>
              <dd>{{ airQualityLabel }} ({{ airQualityIndex }})</dd>
            </div>
          </dl>
        </section>

        <el-card class="panel" shadow="never">
          <template #header>
            <h2 class="panel__subtitle panel__subtitle--flush">현장 이동 경로 안내</h2>
          </template>
          <SiteShadeMap
            :lat="cityInfo.lat"
            :lon="cityInfo.lon"
            :site-name="cityInfo.name"
            :risk-level="riskLevel"
            :forecast="forecastList"
          />
        </el-card>

        <section class="panel">
          <h2 class="panel__subtitle">24시간 예보</h2>
          <ul class="forecast">
            <li v-for="item in forecastList" :key="item.key" class="forecast__item">
              <span class="forecast__time">{{ item.time }}</span>
              <span class="forecast__temp">
                {{ toDisplayTemp(item.temp) }}{{ configStore.unitSymbol }}
              </span>
              <span class="forecast__status">{{ item.status }}</span>
            </li>
          </ul>
        </section>
      </template>
    </template>
  </div>
</template>

<style scoped>
.detail {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.back {
  align-self: flex-start;
  font-size: 14px;
  color: #2f80ed;
  text-decoration: none;
}
.back:hover {
  text-decoration: underline;
}
.alert {
  padding: 12px 16px;
  font-size: 13px;
  line-height: 1.6;
  color: #8a6116;
  background: #fff7e6;
  border: 1px solid #f5d99a;
  border-radius: 10px;
}
.state {
  margin: 0;
  padding: 44px 0;
  text-align: center;
  font-size: 14px;
  color: #7b8794;
}
.panel {
  background: #fff;
  border: 1px solid #e3e8ee;
  border-radius: 14px;
  padding: 22px;
}
.panel__head {
  display: flex;
  align-items: baseline;
  gap: 10px;
}
.panel__title {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
  color: #1f2933;
}
.panel__region {
  font-size: 13px;
  color: #7b8794;
}
.panel__status {
  font-size: 14px;
  color: #52606d;
}
.panel__temp {
  margin: 14px 0 0;
  font-size: 52px;
  font-weight: 600;
  line-height: 1;
  color: #1f2933;
}
.panel__unit {
  font-size: 24px;
  font-weight: 400;
  color: #7b8794;
  margin-left: 3px;
}
.panel__feels {
  margin: 8px 0 0;
  font-size: 14px;
  color: #7b8794;
}
.panel__subtitle {
  margin: 0 0 14px;
  font-size: 15px;
  font-weight: 600;
  color: #1f2933;
}
.facts {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
  margin: 22px 0 0;
  padding-top: 18px;
  border-top: 1px solid #eef2f6;
}
.facts__item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.facts__item dt {
  font-size: 12px;
  color: #7b8794;
}
.facts__item dd {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #3e4c59;
}
.forecast {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(96px, 1fr));
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.forecast__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  padding: 13px 6px;
  background: #f7f9fb;
  border: 1px solid #eef2f6;
  border-radius: 10px;
}
.forecast__time {
  font-size: 12px;
  color: #7b8794;
}
.forecast__temp {
  font-size: 17px;
  font-weight: 600;
  color: #1f2933;
}
.forecast__status {
  font-size: 11px;
  color: #52606d;
  text-align: center;
}
.empty {
  background: #fff;
  border: 1px solid #e3e8ee;
  border-radius: 14px;
  padding: 56px 26px;
  text-align: center;
}
.empty__title {
  margin: 0 0 10px;
  font-size: 20px;
  font-weight: 600;
  color: #1f2933;
}
.empty__desc {
  margin: 0 0 24px;
  font-size: 14px;
  color: #7b8794;
}
.empty__desc code {
  padding: 2px 6px;
  color: #b23c17;
  background: #f7f9fb;
  border-radius: 5px;
}
.btn {
  display: inline-block;
  padding: 10px 20px;
  font-size: 14px;
  border-radius: 8px;
  text-decoration: none;
}
.btn--primary {
  color: #fff;
  background: #2f80ed;
}
.btn--primary:hover {
  background: #1c68cc;
}
</style>
