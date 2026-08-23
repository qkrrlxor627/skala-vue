<script setup>
import { useConfigStore } from '@/stores/configStore'

const configStore = useConfigStore()

function onChangeUnit(value) {
  if (value !== configStore.unit) configStore.toggleUnit()
}
</script>

<template>
  <el-radio-group :model-value="configStore.unit" size="small" @change="onChangeUnit">
    <el-radio-button value="celsius">℃</el-radio-button>
    <el-radio-button value="fahrenheit">℉</el-radio-button>
  </el-radio-group>
</template>
