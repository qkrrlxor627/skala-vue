<script setup>
import { RouterLink, RouterView } from 'vue-router'
import UnitToggler from '@/components/UnitToggler.vue'
</script>

<template>
  <header class="nav">
    <div class="nav__inner">
      <span class="nav__brand">사업장 기상 현황</span>

      <nav class="nav__menu">
        <RouterLink to="/">대시보드</RouterLink>
        <RouterLink to="/favorites">즐겨찾기</RouterLink>
        <RouterLink to="/about">소개</RouterLink>
      </nav>

      <div class="nav__right">
        <UnitToggler />
      </div>
    </div>
  </header>

  <main class="main">
    <RouterView />
  </main>
</template>

<style scoped>
.nav {
  border-bottom: 1px solid #e3e8ee;
  background: #fff;
}
.nav__inner {
  max-width: 960px;
  margin: 0 auto;
  padding: 14px 20px;
  display: flex;
  align-items: center;
  gap: 20px;
}
.nav__brand {
  font-size: 16px;
  font-weight: 600;
  color: #1f2933;
}
.nav__menu {
  display: flex;
  gap: 6px;
}
.nav__menu a {
  padding: 6px 12px;
  font-size: 14px;
  color: #52606d;
  border-radius: 7px;
  text-decoration: none;
  transition:
    color 0.15s,
    background 0.15s;
}
.nav__menu a:hover {
  background: #f2f7fe;
  color: #2f80ed;
}
.nav__menu a.router-link-active {
  color: #2f80ed;
  background: #e8f1fd;
  font-weight: 600;
}
.nav__right {
  margin-left: auto;
}
.main {
  max-width: 960px;
  margin: 0 auto;
  padding: 22px 20px 50px;
}
</style>

<style>
:root {
  --el-color-primary: #2f80ed;
  --el-color-primary-light-3: #6da6f2;
  --el-color-primary-light-5: #97c0f6;
  --el-color-primary-light-7: #c1d9fa;
  --el-color-primary-light-8: #d5e6fb;
  --el-color-primary-light-9: #eaf2fd;
  --el-color-primary-dark-2: #2666be;
}

*,
*::before,
*::after {
  box-sizing: border-box;
}
body {
  margin: 0;
  font-family:
    'Pretendard',
    -apple-system,
    'Segoe UI',
    'Malgun Gothic',
    sans-serif;
  background: #f5f7fa;
  color: #1f2933;
  -webkit-font-smoothing: antialiased;
}
button,
input {
  font: inherit;
}
</style>
