<template>
  <view class="detail-page">
    <view class="topbar">
      <text class="back" @tap="goBack">←</text>
      <text class="top-title">配料表成分</text>
    </view>

    <view class="sub-info">共有 {{ items.length }} 种成分</view>

    <view class="card list">
      <view class="ing-item" v-for="(it,idx) in items" :key="it.label || idx" @tap="openIngredient(it)" hover-class="pressed-item" hover-stay-time="100">
        <text class="ing-label">{{ it.label }}</text>
        <text class="ing-text">{{ it.text }}</text>
        <text class="ing-arrow">›</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

const items = ref([])
const productName = ref('')

onLoad((params)=>{
  productName.value = decodeURIComponent(params?.name || '')
  let list = []
  try { list = uni.getStorageSync('ingredientsAll') || [] } catch(_) {}
  if (Array.isArray(list)) items.value = list
})

const goBack = () => { uni.navigateBack() }
const openIngredient = (it) => {
  const name = encodeURIComponent(productName.value || '产品')
  const label = encodeURIComponent(it.label)
  const text = encodeURIComponent(it.text)
  uni.navigateTo({ url: `/pages/ingredient/index?name=${name}&label=${label}&text=${text}` })
}
const openFeedback = () => { uni.showToast({ title: '反馈入口', icon: 'none' }) }
</script>

<style>
.detail-page { min-height: 100vh; background: #F7FAF7; padding-bottom: 40rpx; }
.topbar { height: 88rpx; display:flex; align-items:center; justify-content:space-between; padding: 0 24rpx; }
.back { font-size: 40rpx; color:#37474F; }
.top-title { margin-left: 8rpx; font-size: 32rpx; font-weight: 700; color:#2E3A46; flex:1; }
.top-link { color:#8D9AA7; font-size: 24rpx; }
.sub-info { font-size: 24rpx; color:#8D9AA7; padding: 0 24rpx; margin-top: 6rpx; }
.card { margin: 16rpx 24rpx; background:#FFFFFF; border-radius: 24rpx; box-shadow: 0 8rpx 24rpx rgba(0,0,0,.06); padding: 20rpx; }
.list { display:flex; flex-direction:column; }
.ing-item { display:flex; gap: 12rpx; align-items:center; padding: 20rpx 8rpx; border-bottom: 1rpx solid #ECEFF1; }
.ing-item:last-child { border-bottom: none; }
.ing-label { flex: 0 0 160rpx; color:#111827; font-weight:600; }
.ing-text { flex:1; color:#607D8B; font-size: 24rpx; }
.ing-arrow { color:#A0A7AE; font-size: 32rpx; }
.pressed-item { transform: scale(.98); background-color:#FFF7F4; }
</style>