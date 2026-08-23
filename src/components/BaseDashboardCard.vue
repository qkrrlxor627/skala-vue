<script setup>
defineProps({
  title: { type: String, default: '' },
})
</script>

<template>
  <section class="box">
    <header class="box__head">
      <slot name="header">
        <h2 class="box__title">{{ title }}</h2>
      </slot>
    </header>

    <div class="box__body">
      <slot />
    </div>

    <footer v-if="$slots.footer" class="box__foot">
      <slot name="footer" />
    </footer>
  </section>
</template>

<style scoped>
.box {
  background: #fff;
  border: 1px solid #e3e8ee;
  border-radius: 14px;
  overflow: hidden;
}
.box__head {
  padding: 14px 18px;
  border-bottom: 1px solid #eef2f6;
  background: #fafbfc;
}
.box__title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #1f2933;
}
.box__body {
  padding: 18px;
}
.box__foot {
  padding: 12px 18px;
  border-top: 1px solid #eef2f6;
  background: #fafbfc;
  font-size: 13px;
  color: #52606d;
}
</style>
