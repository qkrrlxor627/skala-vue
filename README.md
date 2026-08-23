# 사업장 기상 현황

가상 사업장 5곳의 24시간 강수확률을 받아 **야외 작업 가능 여부를 3단계로 판정**하는 Vue 3 학습 프로젝트입니다.

**배포 URL** : https://skala-vue-kiteak.vercel.app/

— 사업장 정보는 임의 데이터로, 실제 사업장과 무관합니다.

---

## 기술 스택

| 구분       | 사용 기술      |
| ---------- | -------------- |
| 프레임워크 | Vue 3.5        |
| 라우팅     | Vue Router     |
| 상태 관리  | Pinia          |
| HTTP       | axios          |
| API        | OpenWeatherMap |

---

## 실행

```sh
npm install
```

프로젝트 루트에 `.env.local`을 만들고 키를 넣습니다.

```sh
VITE_OPENWEATHER_KEY=발급받은키
```

```sh
npm run dev       # http://localhost:5173
npm run build
npm run preview
npm run lint
```

---

## 파일 구조

```
src/
├── main.js
├── App.vue
├── router/index.js
├── stores/configStore.js
├── components/
│   ├── BaseDashboardCard.vue
│   ├── SearchBar.vue
│   ├── WeatherCard.vue
│   ├── UnitToggler.vue
│   ├── StatusBar.vue
│   └── EmptyState.vue
└── views/
    ├── WeatherHomeView.vue
    ├── FavoritesView.vue
    ├── WeatherDetailView.vue
    ├── WeatherAboutView.vue
    └── NotFoundView.vue
```

## 각 파일별 주요사항

### main.js

1. CSS는 먼저 import될수록 우선순위가 낮다.
2. mount 이후 app.use 플로그인 등록은 무시된다.

### App.vue

1. 고정영역과 교체영역을 나누어서 처리했다.
2. RouteLink를 클릭하면 현재 라우트 상태가 갱신되어 RouterView가 새 컴포넌트를 렌더링한다.
3. UnitToggler의 unit은 컴포넌트가 아니라 store에 있고, 전역에서 유지된다. 다만, 새로고침하면 초기화된다. 유지하려면 localStorage가 필요하다.
4. to="/"는 접두사 매칭 때문에 exact-active를 사용하여야 한다.

### router/index.js

1. URL과 컴포넌트를 매핑한다. (RouterView 결정)
2. Home만 정적 import, 나머지는 동적 import로 지연 로딩한다.(필수 진입점은 정적으로 즉시 렌더링)
3. props: true로 URL 파라미터(:cityId)를 props로 넘겨 컴포넌트가 라우터에 의존하지 않게 한다.
4. beforeEach 가드에서 meta.title을 읽어 document.title을 동기화한다.(이동시 HTML이 바뀌는 것이 아니기에 이를 대비하여 이 코드를 작성해서 탭제목을 바꿔줌)

### stores/config.js

1. 단위(unit)와 즐겨찾기(favorites)를 앱 전역 상태로 보관한다. 여러 컴포넌트가 같은 인스턴스를 공유하므로 한 곳에서 바꾸면 전부 동기화된다.
2. return에 넣은 것만 외부에 노출된다.
3. unitSymbol 및 favoriteCount는 computed로 캐싱(계산 사항 임시저장)하고, isFavorite은 인자를 받아야 하므로 일반 함수로 뒀다.
4. 새로고침하면 초기화된다. 유지하려면 localStorage 연동이 필요하다.

### src/components/ 중 SearchBar.vue

1. 검색어를 소유하지 않고 props로 받아 표시만 한다. 값 변경은 emit으로 부모에 요청한다.(부모 WeatherHomeView가 소유해야 다른 컴포넌트도 검색어 값을 공유할 수 있음)
2. v-model 대신 :model-value + @input으로 푼 이유는 자식 컴포넌트에서 props를 직접 수정할 수 없기 때문이다.
3. el-input의 @input은 "값"을 바로 넘기고, @keyup은 네이티브 이벤트라 event.target.value로 꺼낸다.(Element Plus가 keyup을 정의하지 않아 네이티브 input에 그대로 전달되기 때문)

### src/components/ 중 WeatherCard.vue

1. 날씨 데이터(cityItem)는 부모 props로 받고, 단위 및 즐겨찾기는 store에서 직접 읽는다.
2. 원본(섭씨)은 그대로 두고 computed로 표시값만 파생시킨다. (단위 토글 시 자동 재계산되고, 되돌려도 원본이 손실되지 않는다.)
3. 카드 전체 클릭과 내부 버튼 클릭이 겹치므로 @click.stop으로 버블링을 막는다.
4. 위험 레벨(risk.level)에 따라 v-if / v-else-if / v-else로 태그 색을 분기한다.
5. 클릭 이벤트는 처리하지 않고 emit으로 부모에 올린다. (라우팅 결정은 부모 몫)

### src/views/ 중 WeatherHomeView.vue

1. 자식(SearchBar, WeatherCard)은 props로 받아 표시만 하고 emit으로 올린다.
2. 원본 리스트는 그대로 두고 filteredWeatherList를 computed로 파생시킨다.(검색어 및 폭염 필터가 바뀌어도 원본이 손실되지 않는다.)
3. watch는 이전값이 필요할 때(선택 사업장 변경), watchEffect는 현재값만 필요할 때(검색어 로그) 쓴다.
4. Promise.allSettled로 5개 요청을 한꺼번에 보내고, 성공과 실패를 각각 나눠 받는다.(Promise.all은 첫 실패에서 전체가 reject되어 성공분까지 버려진다.)

### src/views/ 중 WeatherDetailView.vue

1. URL 파라미터 cityId를 props로 받아 사업장을 찾고, 없으면 "찾을 수 없습니다" 화면을 띄운다.
2. Promise.allSettled로 현재 날씨·예보·대기질 3개 API를 병렬 호출한다.
3. 단위 변환은 toDisplayTemp 함수로 통일한다. 단건(현재·체감)은 computed로 캐싱하고, 예보 리스트는 항목마다 값이 달라 템플릿에서 함수로 호출한다.

---

## 위험도 판정

24시간(3시간 간격 8건) 예보 중 **가장 높은 강수확률 하나**로 판정합니다. 야외 작업은 강수 전 철수 준비 시간이 필요하므로, 한 번이라도 임계값을 넘으면 해당 등급으로 봅니다.

| 배지           | 조건                  | 권고                                    |
| -------------- | --------------------- | --------------------------------------- |
| 작업 중단 권고 | 강수확률 **70% 이상** | 작업 중단, 자재 결박·배수로 점검        |
| 주의 권고      | **40% 이상 70% 미만** | 고소·크레인 작업 재검토, 철수 동선 확인 |
| 작업 가능      | **40% 미만**          | 정상 진행                               |

### 그 밖의 기능

- **검색** — 사업장명 및 지역명 매칭, 한글 조합으로 필터링 가능
- **필터** — 폭염 주의(25도 이상)를 검색어와 동시 적용
- **즐겨찾기** — 별 토글, 전용 페이지, 해제 시 재조회 없이 즉시 반영

---

## 핵심내용

### 사업장 및 지역명 검색, 즐겨찾기 기능

각 사업장을 5곳으로 나눠 카드에 지역명을 적었고, 사업장명과 지역명 둘 중 하나를 통해 검색할 수 있게 했습니다.
관심있는 사업장별 즐겨찾기가 가능합니다.

### 검색어 필터 및 최근 검색어 기억

사업장에서 폭염 필터(25도 이상)를 통해 검색어 필터가 가능하고, 같은 지역을 반복 검색하는 일이 많을 듯해 최근 검색어를 5건까지 기억하게 했습니다.

### 즐겨찾기 모아보기

즐겨찾기한 사업장만 모아 보는 페이지를 추가했습니다. 대시보드에서 별을 누른 곳들이 여기 모입니다.

## 추가 기능

1. 상세페이지에서 임의의 사업장 평면도를 추가하여, 각 날씨별 사업장 추천 경로를 안내합니다. 당장은 목업 기능이지만, 차후 사업장별로 관리자가 기상 이상 징후 발생 시 설정할 수 있게 확장할 기능입니다.
2. 기상 조건 기반으로 판정됩니다.
3. AI를 활용하여, 우선적으로 그림자 및 태양위치에 대한 간단한 로직 계산을 구현했습니다. (차후 수정 필요)
