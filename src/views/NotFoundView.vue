<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()
</script>

<template>
  <div class="notfound">
    <p class="notfound__code">404</p>
    <h1 class="notfound__title">페이지를 찾을 수 없습니다</h1>
    <p class="notfound__desc">요청하신 주소가 존재하지 않거나 이동되었습니다.</p>

    <p class="notfound__path">
      요청한 주소 : <code>{{ route.fullPath }}</code>
    </p>

    <RouterLink class="notfound__link" to="/">메인으로 돌아가기</RouterLink>
  </div>
</template>

<style scoped>
.notfound {
  background: #fff;
  border: 1px solid #e3e8ee;
  border-radius: 14px;
  padding: 56px 26px;
  text-align: center;
}
.notfound__code {
  margin: 0;
  font-size: 60px;
  font-weight: 700;
  line-height: 1;
  color: #cbd4dd;
}
.notfound__title {
  margin: 16px 0 8px;
  font-size: 20px;
  font-weight: 600;
  color: #1f2933;
}
.notfound__desc {
  margin: 0 0 20px;
  font-size: 14px;
  color: #7b8794;
}
.notfound__path {
  display: inline-block;
  margin: 0 0 26px;
  padding: 9px 14px;
  font-size: 13px;
  color: #52606d;
  background: #f7f9fb;
  border: 1px solid #eef2f6;
  border-radius: 8px;
  word-break: break-all;
}
.notfound__path code {
  color: #b23c17;
}
.notfound__link {
  display: inline-block;
  padding: 10px 20px;
  font-size: 14px;
  color: #fff;
  background: #2f80ed;
  border-radius: 8px;
  text-decoration: none;
}
.notfound__link:hover {
  background: #1c68cc;
}
</style>
