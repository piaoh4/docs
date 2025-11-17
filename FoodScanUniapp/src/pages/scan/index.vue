<template>
  <view class="scan-page">
    <view class="top-bar">
      <text class="title">拍照识别</text>
      <view class="actions">
        <view class="btn light" @tap="goBack">返回</view>
        <view class="btn" @tap="retake">重新拍摄</view>
      </view>
    </view>

    <view class="preview-wrap">
      <image v-if="imageUrl" class="preview-img" :src="imageUrl" mode="aspectFit" />
      <view v-else class="guide-box"><text class="guide-text">正在打开相机...</text></view>
      <view v-if="imageUrl" class="scan-line"></view>
    </view>

    <view class="content">
      <text class="section-title">分析图片</text>
      <view class="steps">
        <view class="step" :class="{active: step===0}"><view class="dot" :class="{gray: step>0}"></view><text>正在提取配料表</text></view>
        <view class="step" :class="{active: step===1}"><view class="dot" :class="{gray: step>1}"></view><text>提取营养成分表</text></view>
        <view class="step" :class="{active: step===2}"><view class="dot"></view><text>综合解读</text></view>
      </view>
      <view class="tip-card"><text class="tip-text">示例提示：含隐形糖，应谨慎选择含糖饮料与烘焙食品。</text></view>
    </view>
  </view>
</template>

<script setup>
import { ref, onUnmounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

const imageUrl = ref('')
const step = ref(0)
let t1=0, t2=0, tDone=0

const startProgress = () => {
  step.value = 0
  clearTimeout(t1); clearTimeout(t2)
  t1 = setTimeout(()=>{ step.value = 1 }, 1000)
  t2 = setTimeout(()=>{ 
    step.value = 2 
    // 模拟识别成功后进入结果页
    clearTimeout(tDone)
    tDone = setTimeout(()=>{
      try {
        uni.navigateTo({ url: `/pages/result/index?img=${encodeURIComponent(imageUrl.value)}` })
      } catch(e) {
        uni.showToast({ title: '识别完成', icon: 'none' })
      }
    }, 800)
  }, 2000)
}

const openCamera = () => {
  uni.chooseImage({
    count: 1,
    sourceType: ['camera'],
    success: (res) => {
      const path = (res.tempFilePaths && res.tempFilePaths[0]) || (res.tempFiles && res.tempFiles[0]?.path) || ''
      if (path) {
        imageUrl.value = path
        startProgress()
      }
    },
    fail: () => {
      uni.showToast({ title: '未能打开相机', icon: 'none' })
    }
  })
}

const retake = () => { openCamera() }
const goBack = () => { uni.navigateBack() }

onLoad((params)=>{
  let preset = decodeURIComponent(params?.img || '')
  if (!preset) {
    try { preset = uni.getStorageSync('scanImagePath') || '' } catch(e) {}
  }
  if (preset) {
    imageUrl.value = preset
    startProgress()
    try { uni.removeStorageSync('scanImagePath') } catch(e) {}
  } else {
    openCamera()
  }
})
onUnmounted(()=>{ clearTimeout(t1); clearTimeout(t2); clearTimeout(tDone) })
</script>

<style>
.scan-page { min-height: 100vh; background: linear-gradient(180deg,#F3F9F1 0%,#FFFFFF 70%); padding: 24rpx; }
.top-bar { height: 100rpx; display:flex; align-items:center; justify-content:space-between; }
.title { font-size: 36rpx; font-weight: 700; color:#3E566D; }
.actions { display:flex; gap: 16rpx; }
.btn { padding: 12rpx 22rpx; background:#2E7D32; color:#FFF; border-radius: 12rpx; }
.btn.light { background:#E8F5E9; color:#2E7D32; }

.preview-wrap { height: 520rpx; margin: 24rpx; border-radius: 24rpx; overflow:hidden; background:#FFF; box-shadow: 0 8rpx 24rpx rgba(9,45,66,.06); position:relative; display:flex; align-items:center; justify-content:center; }
.preview-img { max-width: 92%; max-height: 92%; border-radius: 24rpx; }
.guide-box { color:#7E99AE; }
.guide-text { font-size: 28rpx; }
.scan-line { position:absolute; left: 6%; right: 6%; top: 50%; height: 14rpx; border-radius: 7rpx; background: linear-gradient(90deg, rgba(0,0,0,0), #A5D6A7, rgba(0,0,0,0)); animation: scanline 2s ease-in-out infinite; opacity:.8; }
@keyframes scanline { 0%{ transform: translateY(-180rpx) } 50%{ transform: translateY(0) } 100%{ transform: translateY(180rpx) } }

.content { padding: 0 24rpx; }
.section-title { font-size: 32rpx; color:#2E7D32; font-weight:700; }
.steps { margin-top: 16rpx; }
.step { display:flex; align-items:center; gap: 12rpx; padding: 12rpx 0; }
.dot { width: 18rpx; height: 18rpx; border-radius: 50%; background:#2E7D32; }
.dot.gray { background:#B0BEC5; }
.step.active text { color:#2E7D32; font-weight:600; }
.tip-card { margin-top: 18rpx; background:#F5F7FA; border-radius: 18rpx; padding: 18rpx; color:#556E7A; }
</style>