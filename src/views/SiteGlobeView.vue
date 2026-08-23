<script setup>
import { ref, computed } from 'vue'
import SiteGlobe from '@/components/SiteGlobe.vue'

const SITE_LIST = [
  { id: 'site_01', name: '가상 A 사업장', region: '경기 남부', lat: 37.2, lon: 127.2 },
  { id: 'site_02', name: '가상 B 사업장', region: '충청 중부', lat: 36.6, lon: 127.5 },
  { id: 'site_03', name: '가상 C 사업장', region: '영남 동부', lat: 35.5, lon: 129.3 },
  { id: 'site_04', name: '가상 D 사업장', region: '호남 서부', lat: 35.2, lon: 126.9 },
  { id: 'site_05', name: '가상 E 사업장', region: '영남 북부', lat: 36.1, lon: 128.4 },
]

const highlightId = ref('')

const spread = computed(() => {
  const lats = SITE_LIST.map((s) => s.lat)
  const lons = SITE_LIST.map((s) => s.lon)
  const latSpan = Math.max(...lats) - Math.min(...lats)
  const lonSpan = Math.max(...lons) - Math.min(...lons)
  return {
    latKm: Math.round(latSpan * 111),
    lonKm: Math.round(lonSpan * 111 * Math.cos(36 * (Math.PI / 180))),
  }
})
</script>

<template>
  <div class="globe-page">
    <header class="globe-page__head">
      <h1 class="globe-page__title">사업장 위치</h1>
      <span class="globe-page__sub">지구본과 확대 사업장 위치 파악</span>
    </header>

    <div class="globe-page__panels">
      <section class="panel">
        <h2 class="panel__title">지구본</h2>
        <SiteGlobe :sites="SITE_LIST" mode="globe" :highlight-id="highlightId" />
        <p class="panel__note">현재 시각에서 태양영역을 계산하여 밤 영역을 어둡게 칠했습니다.</p>
      </section>

      <section class="panel">
        <h2 class="panel__title">사업장 위치 확대</h2>
        <SiteGlobe :sites="SITE_LIST" mode="inset" :highlight-id="highlightId" />
        <p class="panel__note">
          사업장이 흩어진 범위는 약 {{ spread.lonKm }}km × {{ spread.latKm }}km 입니다. 지구본
          배율로는 구분되지 않아 확대해서 표시합니다.
        </p>
      </section>
    </div>

    <section class="list">
      <h2 class="panel__title">사업장 목록</h2>
      <ul class="list__items">
        <li
          v-for="site in SITE_LIST"
          :key="site.id"
          class="list__item"
          :class="{ 'list__item--on': site.id === highlightId }"
          @mouseenter="highlightId = site.id"
          @mouseleave="highlightId = ''"
        >
          <div class="list__main">
            <strong class="list__name">{{ site.name }}</strong>
            <span class="list__region">{{ site.region }}</span>
          </div>
          <RouterLink
            class="list__link"
            :to="{ name: 'WeatherDetail', params: { cityId: site.id } }"
          >
            상세 보기
          </RouterLink>
        </li>
      </ul>
    </section>

    <p class="notice">사업장 명칭과 좌표는 학습용으로 임의 생성한 가상 데이터입니다.</p>
  </div>
</template>

<style scoped>
.globe-page {
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.globe-page__head {
  display: flex;
  align-items: baseline;
  gap: 10px;
}
.globe-page__title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #1f2933;
}
.globe-page__sub {
  font-size: 13px;
  color: #7b8794;
}
.globe-page__panels {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(290px, 1fr));
  gap: 16px;
}
.panel {
  background: #fff;
  border: 1px solid #e3e8ee;
  border-radius: 14px;
  padding: 18px;
}
.panel__title {
  margin: 0 0 12px;
  font-size: 15px;
  font-weight: 600;
  color: #1f2933;
}
.panel__note {
  margin: 12px 0 0;
  font-size: 12px;
  line-height: 1.7;
  color: #7b8794;
}
.list {
  background: #fff;
  border: 1px solid #e3e8ee;
  border-radius: 14px;
  padding: 18px;
}
.list__items {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.list__item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border: 1px solid #eef2f6;
  border-radius: 9px;
  transition:
    border-color 0.15s,
    background 0.15s;
}
.list__item--on {
  border-color: #e8833a;
  background: #fdf3ea;
}
.list__main {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}
.list__name {
  font-size: 14px;
  color: #1f2933;
}
.list__region {
  font-size: 12px;
  color: #7b8794;
}
.list__link {
  font-size: 13px;
  color: #2f80ed;
  text-decoration: none;
  white-space: nowrap;
}
.list__link:hover {
  text-decoration: underline;
}
.notice {
  margin: 0;
  font-size: 11px;
  line-height: 1.6;
  color: #9aa5b1;
}
</style>
