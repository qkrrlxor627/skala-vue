<script setup>
import { computed } from 'vue'
import * as SunCalc from 'suncalc'
import { feature } from 'topojson-client'
import { geoOrthographic, geoPath, geoCircle, geoGraticule, geoDistance } from 'd3-geo'
import land110m from 'world-atlas/land-110m.json'

const props = defineProps({
  sites: { type: Array, required: true },
  mode: { type: String, default: 'globe' },
  highlightId: { type: String, default: '' },
})

const LAND = feature(land110m, land110m.objects.land)

const VIEW = {
  globe: { center: [127.5, 36], scale: 150, size: 340 },
  inset: { center: [127.9, 36.1], scale: 3900, size: 340 },
}

const view = computed(() => VIEW[props.mode] ?? VIEW.globe)

// d3 의 rotate 는 지구를 돌리는 각도라 보고 싶은 중심 좌표의 부호를 뒤집어 넣는다.
// clipAngle(90) 이 지평선에 걸친 대륙을 잘라 원호로 다시 닫아 준다 (직접 필터링하면 조각난다).
const projection = computed(() => {
  const { center, scale } = view.value
  return geoOrthographic()
    .scale(scale)
    .translate([0, 0])
    .rotate([-center[0], -center[1]])
    .clipAngle(90)
})

const pathGen = computed(() => geoPath(projection.value))

const spherePath = computed(() => pathGen.value({ type: 'Sphere' }) ?? '')
const landPath = computed(() => pathGen.value(LAND) ?? '')

const graticulePath = computed(() => {
  const g =
    props.mode === 'globe'
      ? geoGraticule().step([30, 30])
      : geoGraticule()
          .step([1, 1])
          .extent([
            [123, 31],
            [133, 42],
          ])
  return pathGen.value(g()) ?? ''
})

const subsolar = computed(() => {
  const date = new Date()
  let bestLon = 0
  let bestAlt = -Infinity
  for (let lon = -180; lon < 180; lon += 2) {
    const alt = SunCalc.getPosition(date, 0, lon).altitude
    if (alt > bestAlt) {
      bestAlt = alt
      bestLon = lon
    }
  }
  let bestLat = 0
  bestAlt = -Infinity
  for (let lat = -25; lat <= 25; lat += 1) {
    const alt = SunCalc.getPosition(date, lat, bestLon).altitude
    if (alt > bestAlt) {
      bestAlt = alt
      bestLat = lat
    }
  }
  return { lon: bestLon, lat: bestLat }
})

// 밤 영역은 태양 직하점의 대척점을 중심으로 하는 반경 90도 원이다.
const nightPath = computed(() => {
  if (props.mode !== 'globe') return ''
  const { lon, lat } = subsolar.value
  const antipode = [lon > 0 ? lon - 180 : lon + 180, -lat]
  return pathGen.value(geoCircle().center(antipode).radius(90)()) ?? ''
})

const isKoreaNight = computed(
  () => geoDistance([127.5, 36], [subsolar.value.lon, subsolar.value.lat]) > Math.PI / 2,
)

const markers = computed(() => {
  const center = view.value.center
  const proj = projection.value
  return props.sites
    .filter((site) => geoDistance([site.lon, site.lat], center) < Math.PI / 2)
    .map((site) => {
      const xy = proj([site.lon, site.lat])
      return xy ? { ...site, x: xy[0], y: xy[1] } : null
    })
    .filter(Boolean)
})

const summary = computed(() => {
  const s = subsolar.value
  return (
    '태양 직하점 ' +
    Math.abs(s.lat) +
    '°' +
    (s.lat >= 0 ? 'N' : 'S') +
    ' ' +
    Math.abs(s.lon) +
    '°' +
    (s.lon >= 0 ? 'E' : 'W') +
    ' | 한국은 지금 ' +
    (isKoreaNight.value ? '밤' : '낮')
  )
})

const half = computed(() => view.value.size / 2)
const viewBox = computed(
  () => -half.value + ' ' + -half.value + ' ' + view.value.size + ' ' + view.value.size,
)
const markerRadius = computed(() => (props.mode === 'globe' ? 3.5 : 6))
const clipId = computed(() => 'globeClip-' + props.mode)
</script>

<template>
  <svg
    class="globe"
    :viewBox="viewBox"
    role="img"
    :aria-label="mode === 'globe' ? '지구본에서 본 사업장 위치' : '한반도 확대 지도'"
  >
    <title>{{ mode === 'globe' ? '지구본' : '확대 인셋' }}</title>
    <desc>{{ summary }}</desc>

    <defs>
      <clipPath :id="clipId">
        <path :d="spherePath" />
      </clipPath>
    </defs>

    <path class="globe__sea" :d="spherePath" />
    <path v-if="landPath" class="globe__land" :d="landPath" />
    <path class="globe__graticule" :d="graticulePath" />
    <path
      v-if="nightPath"
      class="globe__night"
      :d="nightPath"
      :clip-path="'url(#' + clipId + ')'"
    />
    <path class="globe__rim" :d="spherePath" />

    <g v-for="m in markers" :key="m.id">
      <circle
        class="globe__marker"
        :class="{ 'globe__marker--on': m.id === highlightId }"
        :cx="m.x"
        :cy="m.y"
        :r="markerRadius"
      />
      <text v-if="mode === 'inset'" class="globe__label" :x="m.x + 10" :y="m.y + 4">
        {{ m.name }}
      </text>
    </g>
  </svg>
</template>

<style scoped>
.globe {
  width: 100%;
  height: auto;
  display: block;
}
.globe__sea {
  fill: #cfe2f3;
}
.globe__land {
  fill: #cbdfc3;
  stroke: #8aa981;
  stroke-width: 0.5;
}
.globe__graticule {
  fill: none;
  stroke: #8aa4bd;
  stroke-width: 0.5;
  opacity: 0.5;
}
.globe__night {
  fill: #16202b;
  opacity: 0.42;
}
.globe__rim {
  fill: none;
  stroke: #7b8794;
  stroke-width: 1.2;
}
.globe__marker {
  fill: #e8833a;
  stroke: #fff;
  stroke-width: 1.5;
  transition: fill 0.15s;
}
.globe__marker--on {
  fill: #b23c17;
  stroke-width: 2.5;
}
.globe__label {
  font-size: 11px;
  fill: #1f2933;
  paint-order: stroke;
  stroke: #fff;
  stroke-width: 2.5;
}
</style>
