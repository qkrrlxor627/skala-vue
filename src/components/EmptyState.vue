<script setup>
defineProps({
  message: { type: String, required: true },
  icon: { type: String, default: '' },
})
</script>

<template>
  <el-empty :description="message">
    <template v-if="icon" #image>
      <div class="empty__icon">{{ icon }}</div>
    </template>
  </el-empty>
</template>

<style scoped>
.empty__icon {
  font-size: 52px;
  line-height: 1;
}
</style>
