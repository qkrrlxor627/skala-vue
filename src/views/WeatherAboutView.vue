<script setup>
import { ref } from 'vue'

const riskLevels = ref([
  {
    id: 'risk_danger',
    badge: '작업 중단 권고',
    tone: 'danger',
    condition: '강수확률 70% 이상',
    action: '야외 작업 중단, 자재 결박 및 배수로 점검',
  },
  {
    id: 'risk_warn',
    badge: '주의 권고',
    tone: 'warn',
    condition: '강수확률 40% 이상 70% 미만',
    action: '고소, 크레인 작업 재검토, 철수 동선 사전 확인',
  },
  {
    id: 'risk_safe',
    badge: '작업 가능',
    tone: 'safe',
    condition: '강수확률 40% 미만',
    action: '정상 작업 진행',
  },
])

const techStack = ref([
  {
    id: 'tech_01',
    name: 'Vue 3',
    desc: 'Composition API + script setup 으로 컴포넌트를 작성했습니다.',
  },
  {
    id: 'tech_02',
    name: 'Vue Router',
    desc: '지연 로딩과 동적 라우트 파라미터로 사업장 상세 페이지를 구성했습니다.',
  },
  { id: 'tech_03', name: 'Pinia', desc: 'Setup Store 로 온도 단위와 즐겨찾기를 전역 관리합니다.' },
  {
    id: 'tech_04',
    name: 'axios',
    desc: '인스턴스와 응답 인터셉터로 공통 설정과 에러 메시지를 처리합니다.',
  },
  {
    id: 'tech_05',
    name: 'Element Plus',
    desc: '카드, 배지, 입력, 스켈레톤 등 UI 컴포넌트를 부분 적용했습니다.',
  },
  {
    id: 'tech_06',
    name: 'OpenWeatherMap API',
    desc: '5일/3시간 예보를 기반으로 현재 기상과 24시간 강수확률을 제공합니다.',
  },
])
</script>

<template>
  <div class="about">
    <h1 class="about__title">서비스 소개</h1>

    <div class="notice">
      <strong>데이터 고지</strong>
      본 대시보드의 사업장 정보는 학습용으로 임의 생성한 가상 데이터이며, 실제 사업장의 위치나
      명칭과는 무관합니다.
    </div>

    <p class="about__lead">
      가상 사업장 5곳의 기상 상황을 한눈에 보여주는 대시보드입니다. OpenWeatherMap 의 24시간 예보를
      받아 강수확률을 기준으로 야외 작업 가능 여부를 3단계로 판정합니다. 사업장명과 지역명으로
      검색하고, 섭씨와 화씨를 전환하고, 자주 보는 사업장을 즐겨찾기에 담을 수 있습니다.
    </p>

    <h2 class="about__subtitle">위험도 판정 기준</h2>
    <table class="risk">
      <thead>
        <tr>
          <th>등급</th>
          <th>판정 조건</th>
          <th>권고 조치</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="level in riskLevels" :key="level.id">
          <td>
            <span class="risk__badge" :class="'risk__badge--' + level.tone">{{ level.badge }}</span>
          </td>
          <td>{{ level.condition }}</td>
          <td>{{ level.action }}</td>
        </tr>
      </tbody>
    </table>
    <p class="about__note-sm">
      24시간(3시간 간격 8건) 예보 중 <strong>가장 높은 강수확률</strong> 하나를 기준으로 판정합니다.
      야외 작업은 강수 시작 전 철수 준비 시간이 필요하기 때문입니다.
    </p>

    <h2 class="about__subtitle">사용 기술 스택</h2>
    <ul class="stack">
      <li v-for="tech in techStack" :key="tech.id" class="stack__item">
        <strong class="stack__name">{{ tech.name }}</strong>
        <span class="stack__desc">{{ tech.desc }}</span>
      </li>
    </ul>

    <p class="about__note">
      API 키가 아직 활성화되지 않았거나 네트워크가 불안정할 때는 미리 준비된 Mock 데이터로 화면이
      표시되며, 상단에 경고 배너와 [다시 시도] 버튼이 나타납니다.
    </p>

    <RouterLink class="about__link" to="/">← 메인 대시보드로 돌아가기</RouterLink>
  </div>
</template>

<style scoped>
.about {
  background: #fff;
  border: 1px solid #e3e8ee;
  border-radius: 14px;
  padding: 26px;
}
.about__title {
  margin: 0 0 16px;
  font-size: 22px;
  font-weight: 600;
  color: #1f2933;
}
.notice {
  margin: 0 0 20px;
  padding: 13px 15px;
  font-size: 13px;
  line-height: 1.7;
  color: #8a6116;
  background: #fff7e6;
  border: 1px solid #f5d99a;
  border-radius: 9px;
}
.notice strong {
  display: block;
  margin-bottom: 3px;
  color: #7a5410;
}
.about__lead {
  margin: 0 0 26px;
  font-size: 14px;
  line-height: 1.75;
  color: #52606d;
}
.about__subtitle {
  margin: 0 0 12px;
  font-size: 15px;
  font-weight: 600;
  color: #1f2933;
}
.risk {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.risk th,
.risk td {
  padding: 10px 12px;
  text-align: left;
  border-bottom: 1px solid #eef2f6;
}
.risk th {
  font-weight: 600;
  color: #7b8794;
  background: #f7f9fb;
}
.risk td {
  color: #52606d;
}
.risk__badge {
  display: inline-block;
  padding: 3px 9px;
  border-radius: 999px;
  font-size: 12px;
  white-space: nowrap;
}
.risk__badge--danger {
  color: #b23c17;
  background: #fdecea;
}
.risk__badge--warn {
  color: #8a6116;
  background: #fff7e6;
}
.risk__badge--safe {
  color: #1e7d4f;
  background: #e7f6ed;
}
.about__note-sm {
  margin: 12px 0 26px;
  font-size: 12px;
  line-height: 1.7;
  color: #7b8794;
}
.stack {
  margin: 0 0 24px;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.stack__item {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 12px 14px;
  background: #f7f9fb;
  border: 1px solid #eef2f6;
  border-radius: 9px;
}
.stack__name {
  font-size: 14px;
  color: #2f80ed;
}
.stack__desc {
  font-size: 13px;
  color: #52606d;
  line-height: 1.6;
}
.about__note {
  margin: 0 0 24px;
  padding: 12px 14px;
  font-size: 13px;
  line-height: 1.7;
  color: #8a6116;
  background: #fff7e6;
  border: 1px solid #f5d99a;
  border-radius: 9px;
}
.about__link {
  display: inline-block;
  font-size: 14px;
  color: #2f80ed;
  text-decoration: none;
}
.about__link:hover {
  text-decoration: underline;
}
</style>
