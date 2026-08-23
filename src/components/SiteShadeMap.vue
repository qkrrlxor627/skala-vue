<script setup>
import { ref, computed } from 'vue'
import * as SunCalc from 'suncalc'

const props = defineProps({
  lat: { type: Number, required: true },
  lon: { type: Number, required: true },
  siteName: { type: String, required: true },
  riskLevel: { type: String, required: true },
  forecast: { type: Array, required: true },
})

const ZONES = [
  { id: 'yard', name: '야적장', x: 60, y: 40, w: 150, h: 90, height: 0, casts: false },
  { id: 'warehouse', name: '자재창고', x: 250, y: 35, w: 90, h: 70, height: 12, casts: true },
  {
    id: 'canopy',
    name: '그늘막',
    x: 230,
    y: 188,
    w: 110,
    h: 58,
    height: 4,
    casts: false,
    shade: true,
  },
  { id: 'main', name: '본관', x: 400, y: 180, w: 120, h: 100, height: 20, casts: true },
]

const CANOPY = ZONES.find((z) => z.shade)
const START = { x: 135, y: 130 }
const WALKWAY = { x1: 40, y1: 155, x2: 575, y2: 155 }

const ROUTES = [
  {
    id: 'r1',
    name: '주통로 경유',
    path: 'M 135 130 L 135 155 L 460 155 L 460 180',
    checkpoints: [
      [135, 155],
      [300, 155],
      [460, 155],
    ],
    exposedLength: 325,
    elevated: true,
    covered: false,
    shelter: false,
  },
  {
    id: 'r2',
    name: '그늘막 경유',
    path: 'M 135 130 L 135 155 L 285 155 L 285 188',
    checkpoints: [
      [135, 155],
      [285, 155],
      [285, 188],
    ],
    exposedLength: 150,
    elevated: false,
    covered: false,
    shelter: true,
  },
  {
    id: 'r3',
    name: '실내 연결통로',
    path: 'M 135 130 L 135 300 L 400 300 L 400 280',
    checkpoints: [
      [135, 220],
      [135, 300],
      [300, 300],
    ],
    exposedLength: 60,
    elevated: true,
    covered: true,
    shelter: false,
  },
]

const CONDITIONS = [
  { value: 'heat', label: '폭염', color: '#e8833a' },
  { value: 'rain', label: '폭우', color: '#2f80ed' },
  { value: 'snow', label: '폭설', color: '#17a2b8' },
]

const MIN_ALTITUDE_DEG = 3
const MAX_SHADOW_M = 200
const RAD = Math.PI / 180

const now = new Date()

const autoCondition = computed(() => {
  const list = props.forecast
  if (!list || list.length === 0) return 'heat'
  const maxPop = Math.max(...list.map((f) => f.pop ?? 0))
  const maxTemp = Math.max(...list.map((f) => f.temp ?? 0))
  if (maxTemp <= 0 && maxPop >= 0.4) return 'snow'
  if (maxPop >= 0.6) return 'rain'
  if (maxTemp >= 31) return 'heat'
  return 'heat'
})

const manualCondition = ref(null)
const condition = computed(() => manualCondition.value ?? autoCondition.value)
const isAuto = computed(() => manualCondition.value === null)

function onChangeCondition(value) {
  manualCondition.value = value
}

const sunPosition = computed(() => SunCalc.getPosition(now, props.lat, props.lon))
const isDaylight = computed(() => sunPosition.value.altitude > MIN_ALTITUDE_DEG)

// suncalc 2.x 의 azimuth 는 "북쪽 기준 시계방향 각도(도)"다. 0=북, 90=동, 180=남, 270=서.
// (1.x 는 남쪽 기준 라디안이었다. 규약을 헷갈리면 그림자가 정확히 180도 반대로 간다.)
// SVG 는 y축이 아래로 증가하므로 남쪽이 +y 다. 방위 B 의 태양 방향은 (sin B, -cos B),
// 그림자는 그 반대이므로 (-sin B, +cos B) 가 된다.
function shadowVector(heightMeters) {
  const { altitude, azimuth } = sunPosition.value
  if (altitude <= MIN_ALTITUDE_DEG) return null
  const length = Math.min(heightMeters / Math.tan(altitude * RAD), MAX_SHADOW_M)
  return { dx: -length * Math.sin(azimuth * RAD), dy: length * Math.cos(azimuth * RAD) }
}

function convexHull(points) {
  const pts = [...points].sort((a, b) => a.x - b.x || a.y - b.y)
  const cross = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x)
  const build = (source) => {
    const chain = []
    for (const p of source) {
      while (chain.length >= 2 && cross(chain[chain.length - 2], chain[chain.length - 1], p) <= 0) {
        chain.pop()
      }
      chain.push(p)
    }
    chain.pop()
    return chain
  }
  return build(pts).concat(build([...pts].reverse()))
}

function pointInPolygon(pt, poly) {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x
    const yi = poly[i].y
    const xj = poly[j].x
    const yj = poly[j].y
    const crosses = yi > pt.y !== yj > pt.y
    if (crosses && pt.x < ((xj - xi) * (pt.y - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

const shadows = computed(() => {
  const result = []
  for (const zone of ZONES) {
    if (!zone.casts) continue
    const vector = shadowVector(zone.height)
    if (!vector) continue
    const corners = [
      { x: zone.x, y: zone.y },
      { x: zone.x + zone.w, y: zone.y },
      { x: zone.x + zone.w, y: zone.y + zone.h },
      { x: zone.x, y: zone.y + zone.h },
    ]
    const moved = corners.map((c) => ({ x: c.x + vector.dx, y: c.y + vector.dy }))
    result.push({ id: zone.id, points: convexHull([...corners, ...moved]) })
  }
  return result
})

function polygonAttr(points) {
  return points.map((p) => p.x + ',' + p.y).join(' ')
}

function inCanopy(pt) {
  return (
    pt.x >= CANOPY.x &&
    pt.x <= CANOPY.x + CANOPY.w &&
    pt.y >= CANOPY.y &&
    pt.y <= CANOPY.y + CANOPY.h
  )
}

function shadedCount(route) {
  return route.checkpoints
    .map(([x, y]) => ({ x, y }))
    .filter((p) => inCanopy(p) || shadows.value.some((s) => pointInPolygon(p, s.points))).length
}

function scoreOf(route, ratio) {
  if (condition.value === 'heat') {
    return ratio * 5 + (route.shelter ? 3 : 0) + (400 - route.exposedLength) / 100
  }
  if (condition.value === 'rain') {
    return (route.elevated ? 4 : 0) + (route.covered ? 2 : 0)
  }
  return (route.covered ? 4 : 0) + (400 - route.exposedLength) / 100
}

const scoredRoutes = computed(() =>
  ROUTES.map((route) => {
    const shaded = isDaylight.value ? shadedCount(route) : 0
    const ratio = route.checkpoints.length === 0 ? 0 : shaded / route.checkpoints.length
    return { ...route, shaded, ratio, score: scoreOf(route, ratio) }
  }),
)

const bestRoute = computed(() =>
  scoredRoutes.value.reduce((best, route) => (route.score > best.score ? route : best)),
)

const otherRoutes = computed(() => scoredRoutes.value.filter((r) => r.id !== bestRoute.value.id))

const activeColor = computed(
  () => CONDITIONS.find((c) => c.value === condition.value)?.color ?? '#e8833a',
)

const summaryText = computed(() => {
  if (!isDaylight.value) return '일몰 후 | 그늘 판정 없음'
  const time = now.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  return time + ' | 태양고도 ' + Math.round(sunPosition.value.altitude) + '°'
})

function reasonFor(route) {
  const total = route.checkpoints.length
  if (condition.value === 'heat') {
    if (!isDaylight.value) {
      return '일몰 후라 그늘 판정 없이 노출 구간 ' + route.exposedLength + 'm 로만 비교했습니다.'
    }
    const shade = '체크포인트 ' + total + '곳 중 ' + route.shaded + '곳이 그늘에 듭니다.'
    const rest = route.shelter ? ' 중간 휴식도 가능합니다.' : ''
    return shade + rest + ' 그늘 없는 구간은 ' + route.exposedLength + 'm 입니다.'
  }
  if (condition.value === 'rain') {
    const high = route.elevated ? '고지대라 침수를 피합니다' : '저지대라 침수 위험이 있습니다'
    const roof = route.covered ? '지붕이 있습니다' : '지붕이 없습니다'
    return high + '. ' + roof + '.'
  }
  const roof = route.covered
    ? '지붕이 있어 적설과 결빙을 피합니다'
    : '지붕이 없어 적설에 노출됩니다'
  return roof + '. 노출 구간은 ' + route.exposedLength + 'm 입니다.'
}

const svgDescription = computed(
  () =>
    props.siteName +
    ' 가상 평면도. ' +
    summaryText.value +
    '. 권장 경로는 ' +
    bestRoute.value.name +
    ' 입니다.',
)
</script>

<template>
  <div class="shade">
    <div class="shade__bar">
      <div class="shade__left">
        <el-radio-group :model-value="condition" size="small" @change="onChangeCondition">
          <el-radio-button v-for="item in CONDITIONS" :key="item.value" :value="item.value">
            {{ item.label }}
          </el-radio-button>
        </el-radio-group>
        <span v-if="isAuto" class="shade__auto">예보 기준 자동 선택</span>
      </div>
      <span class="shade__summary">{{ summaryText }}</span>
    </div>

    <svg class="shade__svg" viewBox="0 0 600 330" role="img" :aria-label="svgDescription">
      <title>{{ siteName }} 이동 경로 평면도</title>
      <desc>{{ svgDescription }}</desc>

      <defs>
        <marker
          id="routeArrow"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" :fill="activeColor" />
        </marker>
      </defs>

      <rect class="shade__bg" x="0" y="0" width="600" height="330" />

      <polygon
        v-for="shadow in shadows"
        :key="shadow.id"
        class="shade__shadow"
        :points="polygonAttr(shadow.points)"
      />

      <line
        class="shade__walkway"
        :x1="WALKWAY.x1"
        :y1="WALKWAY.y1"
        :x2="WALKWAY.x2"
        :y2="WALKWAY.y2"
      />

      <g v-for="zone in ZONES" :key="zone.id">
        <rect
          class="shade__zone"
          :class="{ 'shade__zone--canopy': zone.shade }"
          :x="zone.x"
          :y="zone.y"
          :width="zone.w"
          :height="zone.h"
          rx="4"
        />
        <text class="shade__zone-name" :x="zone.x + 8" :y="zone.y + 18">{{ zone.name }}</text>
      </g>

      <path v-for="route in otherRoutes" :key="route.id" class="shade__route" :d="route.path" />

      <path class="shade__route shade__route--base" :d="bestRoute.path" :stroke="activeColor" />
      <path
        class="shade__route shade__route--best"
        :d="bestRoute.path"
        :stroke="activeColor"
        marker-end="url(#routeArrow)"
      />

      <circle class="shade__start" :cx="START.x" :cy="START.y" r="6" />
      <text class="shade__start-label" :x="START.x + 12" :y="START.y + 4">출발</text>
    </svg>

    <ul class="legend">
      <li>
        <span class="legend__line legend__line--best" :style="{ background: activeColor }" /> 권장
        경로
      </li>
      <li><span class="legend__line legend__line--alt" /> 후보 경로</li>
      <li><span class="legend__box legend__box--canopy" /> 상시 차양</li>
      <li><span class="legend__box legend__box--shadow" /> 계산된 그림자</li>
    </ul>

    <div class="verdict">
      <p class="verdict__best">권장 | {{ bestRoute.name }}</p>
      <p class="verdict__why">{{ reasonFor(bestRoute) }}</p>
      <p v-for="route in otherRoutes" :key="route.id" class="verdict__other">
        {{ route.name }} — {{ reasonFor(route) }}
      </p>
    </div>

    <p class="notice">
      본 평면도는 개념 시연용 가상 도면이며, 실제 사업장 구조와 무관합니다. 그림자는 현재 시각의
      태양 위치 계산에 기반한 추정값입니다.
    </p>
  </div>
</template>

<style scoped>
.shade {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.shade__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.shade__left {
  display: flex;
  align-items: center;
  gap: 10px;
}
.shade__auto {
  font-size: 12px;
  color: #2f80ed;
  background: #eaf2fd;
  padding: 3px 9px;
  border-radius: 999px;
}
.shade__summary {
  font-size: 13px;
  color: #52606d;
}
.shade__svg {
  width: 100%;
  height: auto;
  border: 1px solid #eef2f6;
  border-radius: 10px;
}
.shade__bg {
  fill: #fbfcfd;
}
.shade__shadow {
  fill: #5a6672;
  opacity: 0.13;
}
.shade__walkway {
  stroke: #d5dce3;
  stroke-width: 2;
  stroke-dasharray: 8 6;
}
.shade__zone {
  fill: #fff;
  stroke: #b9c3cd;
  stroke-width: 1.5;
}
.shade__zone--canopy {
  fill: #eef4ea;
  stroke: #9db98c;
  stroke-dasharray: 5 4;
}
.shade__zone-name {
  font-size: 12px;
  fill: #52606d;
}
.shade__route {
  fill: none;
  stroke: #aab4bf;
  stroke-width: 2;
  stroke-dasharray: 6 5;
  opacity: 0.55;
}
.shade__route--base {
  stroke-width: 5;
  stroke-dasharray: none;
  opacity: 0.32;
}
.shade__route--best {
  stroke-width: 4;
  stroke-dasharray: 12 7;
  opacity: 1;
  animation: routeFlow 1.4s linear infinite;
}
@keyframes routeFlow {
  to {
    stroke-dashoffset: -19;
  }
}
.shade__start {
  fill: #1f2933;
}
.shade__start-label {
  font-size: 12px;
  fill: #1f2933;
  font-weight: 600;
}
.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: 12px;
  color: #7b8794;
}
.legend li {
  display: flex;
  align-items: center;
  gap: 6px;
}
.legend__line {
  width: 20px;
  height: 3px;
  border-radius: 2px;
}
.legend__line--alt {
  background: repeating-linear-gradient(90deg, #aab4bf 0 5px, transparent 5px 9px);
}
.legend__box {
  width: 14px;
  height: 12px;
  border-radius: 3px;
}
.legend__box--canopy {
  background: #eef4ea;
  border: 1px dashed #9db98c;
}
.legend__box--shadow {
  background: rgba(90, 102, 114, 0.22);
}
.verdict {
  padding: 13px 15px;
  background: #f7f9fb;
  border: 1px solid #eef2f6;
  border-radius: 10px;
}
.verdict__best {
  margin: 0 0 5px;
  font-size: 14px;
  font-weight: 600;
  color: #1f2933;
}
.verdict__why {
  margin: 0 0 10px;
  font-size: 13px;
  line-height: 1.65;
  color: #3e4c59;
}
.verdict__other {
  margin: 3px 0 0;
  font-size: 12px;
  line-height: 1.6;
  color: #7b8794;
}
.notice {
  margin: 0;
  font-size: 11px;
  line-height: 1.6;
  color: #9aa5b1;
}
</style>
