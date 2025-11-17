<template>
  <view class="home">
    <!-- 未登录时不阻断页面，仅在数据区显示登录提示 -->
    <!-- 顶部卡片：问候与登录状态 -->
    <view class="greet-card">
      <view class="greet-left">
        <text class="hand">👋</text>
        <view class="greet-texts">
          <text v-if="isLoggedIn" class="greet-title logged">Hi，{{ userName }}</text>
          <text v-else class="greet-title guest" @tap="goLogin">未登录</text>
          <view class="greet-sub-row" v-if="isLoggedIn">
            <text class="greet-sub logged">已为你识别重点关注成分 {{ focusCount }} 项</text>
            <text class="sub-arrow">›</text>
          </view>
        </view>
      </view>
      <view class="greet-actions">
        <view class="pill-btn" @tap="goSettings">
          <image class="pill-icon" src="/static/setting.png" mode="aspectFit" />
        </view>
        
      </view>
    </view>

    <!-- 指标概览 -->
    <view class="card stats-card">
      <view class="stat">
        <text class="stat-num">{{ isLoggedIn ? analyzedCount : 0 }}</text>
        <text class="stat-label">已分析食品</text>
      </view>
      <view class="stat">
        <text class="stat-num">{{ isLoggedIn ? avgHealthScore : 0 }}</text>
        <text class="stat-label">平均健康分</text>
      </view>
      <view class="stat">
        <text class="stat-num">{{ isLoggedIn ? riskCount : 0 }}</text>
        <text class="stat-label">风险提醒</text>
      </view>
    </view>

    <!-- 今日健康提醒 -->
    <view class="card alert-card">
      <view class="alert-dot"></view>
      <view class="alert-body">
        <text class="alert-title">今日健康提醒</text>
        <text class="alert-desc">请仔细检查配料表，避免接触过敏源成分</text>
      </view>
    </view>

    <!-- 分析历史列表：图片 + 评分 + 描述 -->
    <view class="section-title">
      <text class="title-left">分析历史</text>
      <text class="title-right">{{ isLoggedIn ? histories.length : 0 }}个食品已分析</text>
    </view>
       <!-- 过滤标签（简化） -->
    <view class="chips">
      <view class="chip" :class="{active: activeChip==='all'}" @tap="activeChip='all'">全部</view>
      <view class="chip" :class="{active: activeChip==='fav'}" @tap="activeChip='fav'">收藏</view>
    </view>
    <view v-if="isLoggedIn" class="list-scroll">
      <scroll-view class="sv" scroll-y="true" :scroll-into-view="scrollInto" scroll-with-animation="true" show-scrollbar="false">
        <view class="list">
          <view class="list-item" v-for="(h,idx) in filteredHistories" :key="h.id" :id="'item-'+idx" @tap="openHistory(h)">
            <image class="thumb" :src="h.img" mode="aspectFill"></image>
            <view class="item-body">
              <view class="item-top-row">
                <text class="item-title">{{ h.title }}</text>
                <text class="score-value" :class="h.scoreClass">{{ h.score }}分</text>
              </view>
              <text class="item-desc">{{ h.desc }}</text>
              <text class="item-sub">{{ h.time }}</text>
            </view>
          </view>
        </view>
      </scroll-view>
      <view class="scroll-ctrl up" @tap="scrollUp">
        <text class="ctrl-emoji">▲</text>
      </view>
      <view class="scroll-ctrl down" @tap="scrollDown">
        <text class="ctrl-emoji">▼</text>
      </view>
    </view>
    <view v-else class="login-card">
      <image class="login-icon" src="/static/user.png" mode="aspectFit"></image>
      <text class="login-card-title">登录后查看分析历史</text>
      <text class="login-card-sub">登录账号即可查看您的所有食品分析记录</text>
      <view class="primary-btn" @tap="goLogin">立即登录</view>
    </view>

    <!-- 底部导航（仅首页与个人中心），拍照按钮独立浮层 -->
    <view class="bottom-tabbar">
      <view class="tab-item active" @tap="goHome">
        <text class="tab-text">首页</text>
      </view>
      <view class="tab-item" @tap="goProfile">
        <text class="tab-text">我</text>
      </view>
    </view>
    <view class="camera-fab" @tap="onScan" aria-label="拍照" @touchstart="onPress(true)" @touchend="onPress(false)" @mousedown="onPress(true)" @mouseup="onPress(false)" :class="{active: pressing}">
      <view class="ripple" v-if="pressing"></view>
      <image class="camera-img" src="/static/camera.png" mode="aspectFit"></image>
    </view>
    
    <!-- 识别叠层：拍摄成功后展示，含动态进度 -->
    <view class="scan-overlay" v-if="scanning" @tap="closeScan">
      <view class="scan-panel" @tap.stop>
        <view class="scan-preview-wrap">
          <image class="scan-preview" :src="scanImageUrl" mode="aspectFit" />
          <view class="scan-line"></view>
        </view>
        <view class="scan-body">
          <text class="scan-title">分析图片</text>
          <view class="scan-status">
            <view class="st-item" :class="{active: scanningStep===0}"><view class="st-dot" :class="{gray: scanningStep>0}"></view><text>正在提取配料表</text></view>
            <view class="st-item" :class="{active: scanningStep===1}"><view class="st-dot" :class="{gray: scanningStep>1}"></view><text>提取营养成分表</text></view>
            <view class="st-item" :class="{active: scanningStep===2}"><view class="st-dot"></view><text>综合解读</text></view>
          </view>
          <view class="tip-card"><text class="tip-text">示例提示：含隐形糖，应谨慎选择含糖饮料与烘焙食品。</text></view>
          <view class="panel-actions">
            <view class="close-btn" @tap="closeScan">关闭</view>
          </view>
        </view>
      </view>
    </view>
  </view>
  
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'

const isLoggedIn = ref(false)
const userName = ref('DUCK')
const focusCount = ref(22)

const activeChip = ref('all')

const histories = ref([
  { id: 1, title: '抽取式面巾纸', score: 80, scoreClass: 'score-good', desc: '该配料表仅含原生木浆（竹材），不含添加剂', time: '11月6日 16:04', img: 'https://picsum.photos/seed/food1/240/240' },
  { id: 2, title: '方便速食', score: 56, scoreClass: 'score-warn', desc: '配方复杂含多类添加糖，含香精与色素', time: '9月13日 15:57', img: 'https://picsum.photos/seed/food2/240/240' },
])

const filteredHistories = computed(() => {
  return histories.value
})

// 指标概览数据（未登录显示0）
const analyzedCount = computed(() => histories.value.length)
const avgHealthScore = ref(6.2)
const riskCount = ref(9)

const loadHomeData = () => {
  if (!isLoggedIn.value) return
  // 登录后再进行数据请求，例如：uni.request({ url: '/api/home', header: { Authorization: token } })
}

onMounted(() => { loadHomeData() })
watch(isLoggedIn, v => { if (v) loadHomeData() })

const ITEM_VISIBLE_COUNT = 5
const scrollIndex = ref(0)
const maxScrollIndex = computed(() => Math.max(0, filteredHistories.value.length - ITEM_VISIBLE_COUNT))
const scrollInto = computed(() => 'item-' + scrollIndex.value)
const scrollUp = () => { scrollIndex.value = Math.max(0, scrollIndex.value - 1) }
const scrollDown = () => { scrollIndex.value = Math.min(maxScrollIndex.value, scrollIndex.value + 1) }

const pressing = ref(false)
const scanning = ref(false)
const scanImageUrl = ref('')
const scanningStep = ref(0)
let t1 = 0, t2 = 0
const onPress = (v) => { pressing.value = v }
const onScan = () => {
  pressing.value = true
  setTimeout(() => { pressing.value = false }, 150)
  // 桌面优先选择图片/拍摄后再进入识别页
  uni.chooseImage({
    count: 1,
    sourceType: ['album','camera'],
    success: (res) => {
      let path = (res.tempFilePaths && res.tempFilePaths[0]) || (res.tempFiles && res.tempFiles[0]?.path) || ''
      // #ifdef H5
      if (!path && res.tempFiles && res.tempFiles[0]) {
        try { path = URL.createObjectURL(res.tempFiles[0]) } catch(e) {}
      }
      // #endif
      if (path) {
        try { uni.setStorageSync('scanImagePath', path) } catch(e) {}
      }
      const url = path ? `/pages/scan/index?img=${encodeURIComponent(path)}` : '/pages/scan/index'
      uni.navigateTo({ url }).catch(() => {
        // 跳转失败（单页模式）则在首页降级为叠层识别
        if (path) {
          scanImageUrl.value = path
          scanning.value = true
          scanningStep.value = 0
          clearTimeout(t1); clearTimeout(t2)
          t1 = setTimeout(() => { scanningStep.value = 1 }, 1000)
          t2 = setTimeout(() => { scanningStep.value = 2 }, 2000)
        }
      })
    },
    fail: () => {
      // 用户取消或不可用时，仍尝试进入识别页
      uni.navigateTo({ url: '/pages/scan/index' }).catch(() => {
        uni.showToast({ title: '请选择图片或相机不可用', icon: 'none' })
      })
    }
  })
}
// 历史记录跳转到静态配料表分析页面
const openHistory = (h) => {
  const img = encodeURIComponent(h.img || '')
  const title = encodeURIComponent(h.title || '')
  const score = h.score ?? ''
  const url = `/pages/result/index?img=${img}&title=${title}&score=${score}`
  uni.navigateTo({ url }).catch(() => {
    uni.showToast({ title: '跳转失败，请使用运行到浏览器/小程序方式', icon: 'none' })
  })
}
const closeScan = () => { scanning.value = false; scanImageUrl.value = ''; scanningStep.value = 0; clearTimeout(t1); clearTimeout(t2) }
const goSettings = () => uni.showToast({ title: '进入设置', icon: 'none' })
const goHome = () => {}
const goProfile = () => uni.showToast({ title: '进入个人中心', icon: 'none' })
// 登录状态由后端接口与全局状态管理控制，移除本地切换按钮
const goLogin = () => {
  isLoggedIn.value = true
  uni.showToast({ title: '已登录', icon: 'none' })
}
const openVip = () => uni.showToast({ title: '会员中心', icon: 'none' })
</script>

<style>
.home { min-height: 100vh; padding: 32rpx 28rpx 220rpx; background: linear-gradient(180deg,#F3F9F1 0%,#FFFFFF 70%); padding-top: calc(32rpx + env(safe-area-inset-top)); padding-top: calc(32rpx + constant(safe-area-inset-top)); }

/* 按钮与链接（复用） */
.primary-btn { padding: 20rpx 44rpx; border-radius: 12rpx; background:#f5f9f2; color:#000000; font-size: 28rpx; font-weight:700; box-shadow:0 8rpx 20rpx rgba(53,106,148,.25); transition: transform .15s ease, box-shadow .15s ease; text-align:center; min-width: 360rpx; }
.primary-btn:active { transform: scale(.98); box-shadow:0 6rpx 16rpx rgba(53,106,148,.28); }

/* 通用卡片 */
.card {
  background: #FFFFFF; border-radius: 28rpx; box-shadow: 0 8rpx 24rpx rgba(9, 45, 66, 0.06);
}

/* 顶部问候卡片 */
.greet-card { padding: 28rpx; display:flex; align-items:center; justify-content:space-between; margin-bottom: 28rpx; }
.greet-left { display:flex; align-items:center; gap: 16rpx; }
.hand { font-size: 44rpx; }
.greet-texts { display:flex; flex-direction:column; }
.greet-title { font-size: 36rpx; color:#394B59; font-weight: 700; }
.greet-sub { font-size: 26rpx; margin-top:8rpx; }
.greet-sub-row { display:flex; align-items:center; gap: 6rpx; }
.greet-title.logged { color:#1D1D1D; font-weight:800; }
.greet-title.guest { color:#B0BEC5; font-weight:600; }
.greet-sub.logged { color:#3A3A3A; }
.greet-sub.guest { color:#BFC8CF; }
.sub-arrow { color:#3A3A3A; }
.greet-actions { display:flex; gap: 16rpx; align-items:center; }
.pill-btn { width: 64rpx; height: 64rpx; border-radius: 999rpx; background: transparent; display:flex; align-items:center; justify-content:center; }
.pill-icon { width: 42rpx; height:42rpx; color:#5B7FAB; }
.pill-emoji { font-size: 36rpx; }


/* 筛选 chips */
.chips { display:flex; gap: 20rpx; margin: 20rpx 4rpx 8rpx; }
.chip { padding: 16rpx 24rpx; border-radius: 16rpx; background:#F2F6F9; color:#607D8B; font-size:26rpx; }
.chip.active { background:#E1EEF6; color:#356A94; box-shadow:0 4rpx 12rpx rgba(9,45,66,.06); }

/* 提醒卡 */
.alert-card { display:flex; align-items:flex-start; padding: 24rpx; margin-bottom: 24rpx; position:relative; }
.alert-dot { width:12rpx; height:100%; position:absolute; left:0; top:0; border-top-left-radius:24rpx; border-bottom-left-radius:24rpx; background:#F8DFA6; }
.alert-body { margin-left: 16rpx; }
.alert-title { font-size: 28rpx; color:#6E5B2A; font-weight:700; }
.alert-desc { display:block; margin-top:8rpx; font-size: 26rpx; color:#7A6C50; }

/* 指标卡 */
.stats-card { display:flex; justify-content:space-between; padding: 28rpx; margin-bottom: 32rpx; }
.stat { text-align:center; flex:1; }
.stat-num { font-size: 40rpx; color:#446A86; font-weight:700; }
.stat-label { display:block; margin-top:8rpx; font-size:24rpx; color:#8CA5B5; }

/* 历史列表 */
.section-title { display:flex; justify-content:space-between; align-items:center; margin-bottom: 16rpx; padding: 0 4rpx; }
.title-left { font-size: 30rpx; color:#3E566D; font-weight:700; }
.title-right { font-size: 26rpx; color:#9DB2C2; }
.list { display:flex; flex-direction:column; gap: 16rpx; }
.list-item { display:flex; gap:20rpx; background:#FFFFFF; border-radius:24rpx; padding: 24rpx; box-shadow: 0 6rpx 20rpx rgba(9,45,66,0.04); min-height: 180rpx; align-items:center; transition: transform .18s ease, box-shadow .18s ease; position: relative; }
.list-item:active { transform: scale(.98); box-shadow: 0 4rpx 14rpx rgba(9,45,66,0.06); }
.thumb { width: 140rpx; height: 140rpx; border-radius: 16rpx; background:#EEE; object-fit: cover; flex-shrink: 0; }
.item-top-row { display:block; }
.item-title { flex: 1; }
.score-value { font-size: 34rpx; font-weight: 700; color:#2E7D32; width: 120rpx; text-align: right; white-space: nowrap; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; font-variant-numeric: tabular-nums; position: absolute; right: 24rpx; top: 24rpx; line-height: 40rpx; height: 40rpx; }
.score-good { color:#2E7D32; }
.score-warn { color:#C62828; }
.item-desc { display:block; margin-top:8rpx; font-size: 26rpx; color:#5C6C7A; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.item-top { display:flex; align-items:center; gap: 12rpx; }
.score-tag { padding: 8rpx 12rpx; border-radius: 999rpx; font-size: 24rpx; }
.tag-good { background:#E2F3E6; color:#2E7D32; }
.tag-warn { background:#FDE8E8; color:#C62828; }
.item-desc { display:block; margin-top:8rpx; font-size: 26rpx; color:#5C6C7A; }
.item-body { display:flex; flex-direction:column; justify-content:center; flex: 1; padding-right: 160rpx; }
.item-title { font-size: 28rpx; color:#3C4C59; font-weight:600; }
.item-sub { font-size: 24rpx; color:#8EA1B1; margin-top:8rpx; }

/* 底部导航 */
.bottom-tabbar { position: fixed; left:0; right:0; bottom:0; height: 96rpx; background:#FFFFFF; display:flex; align-items:center; justify-content:space-around; box-shadow:0 -8rpx 24rpx rgba(9,45,66,0.06); }
.tab-item { display:flex; flex-direction:column; align-items:center; justify-content:center; color:#000000; }
.tab-item.active { color:#000000; }
.tab-emoji { font-size: 44rpx; }
.tab-text { font-size: 34rpx; margin-top: 0; }
.tab-item.active .tab-text { font-size: 38rpx; font-weight: 700; }
.camera-fab { position: fixed; left:50%; transform: translateX(-50%); bottom: calc(120rpx); width: 140rpx; height: 140rpx; border-radius: 50%; background:#373331; box-shadow:0 16rpx 36rpx rgba(0,0,0,.25); display:flex; align-items:center; justify-content:center; }
.camera-fab { transition: transform .15s ease; cursor: pointer; }
.camera-fab.active { transform: translateX(-50%) scale(.96); }
.camera-fab:hover { transform: translateX(-50%) scale(.98); }
.camera-emoji { font-size: 64rpx; color:#FFF; }
.camera-img { width: 64rpx; height: 64rpx; }
.ripple { position:absolute; left:50%; top:50%; transform: translate(-50%,-50%); width: 140rpx; height: 140rpx; border-radius: 50%; background: rgba(255,255,255,.12); animation: ripple .5s ease-out; }
@keyframes ripple { 0%{ opacity:.25; transform: translate(-50%,-50%) scale(1) } 100%{ opacity:0; transform: translate(-50%,-50%) scale(1.35) } }

/* 识别叠层样式 */
.scan-overlay { position: fixed; left:0; right:0; top:0; bottom:0; background: rgba(0,0,0,.35); display:flex; align-items:flex-start; justify-content:center; padding-top: 60rpx; z-index: 999; }
.scan-panel { width: 92%; background:#FFF; border-radius: 24rpx; box-shadow: 0 12rpx 32rpx rgba(0,0,0,.16); overflow:hidden; }
.scan-preview-wrap { height: 520rpx; background:#F7F9FA; position: relative; display:flex; align-items:center; justify-content:center; }
.scan-preview { max-width: 92%; max-height: 92%; border-radius: 24rpx; }
.scan-line { position:absolute; left: 6%; right: 6%; top: 50%; height: 14rpx; border-radius: 7rpx; background: linear-gradient(90deg, rgba(0,0,0,0), #A5D6A7, rgba(0,0,0,0)); animation: scanline 2s ease-in-out infinite; opacity:.8; }
@keyframes scanline { 0%{ transform: translateY(-180rpx) } 50%{ transform: translateY(0) } 100%{ transform: translateY(180rpx) } }
.scan-body { padding: 24rpx; }
.scan-title { font-size: 32rpx; color:#2E7D32; font-weight:700; }
.scan-status { margin-top: 16rpx; }
.st-item { display:flex; align-items:center; gap: 12rpx; padding: 12rpx 0; }
.st-dot { width: 18rpx; height: 18rpx; border-radius: 50%; background:#2E7D32; }
.st-dot.gray { background:#B0BEC5; }
.st-item.active text { color:#2E7D32; font-weight:600; }
.tip-card { margin-top: 18rpx; background:#F5F7FA; border-radius: 18rpx; padding: 18rpx; color:#556E7A; }
.panel-actions { margin-top: 16rpx; display:flex; justify-content:flex-end; }
.close-btn { padding: 16rpx 22rpx; background:#E8F5E9; color:#2E7D32; border-radius: 12rpx; }
/* 移除叠层相关样式（改为独立页面） */
.camera-svg { width: 64rpx; height: 64rpx; }

/* 未登录时的历史登录提示卡 */
.login-card { background:#FFFFFF; border-radius: 24rpx; box-shadow: 0 6rpx 20rpx rgba(9,45,66,0.04); padding: 40rpx 24rpx; display:flex; flex-direction:column; align-items:center; gap: 18rpx; margin-top: 12rpx; margin-bottom: 220rpx; }
.login-icon { width: 64rpx; height: 64rpx; }
.login-card-title { font-size: 32rpx; color:#1D1D1D; font-weight:800; }
.login-card-sub { font-size: 26rpx; color:#5C6C7A; text-align:center; }

/* 响应式调整（回退前版本保持通用 rpx，自适应无需媒体查询） */

/* 列表滚动区域与指示控件 */
.list-scroll { position: relative; height: 880rpx; }
.sv { height: 880rpx; }
.scroll-ctrl { position: absolute; right: 12rpx; width: 56rpx; height: 56rpx; border-radius: 999rpx; display:flex; align-items:center; justify-content:center; background: #EFF5FB; box-shadow: 0 6rpx 16rpx rgba(9,45,66,.08); }
.scroll-ctrl.up { top: -28rpx; }
.scroll-ctrl.down { bottom: -28rpx; }
.ctrl-emoji { font-size: 32rpx; color: #356A94; }
</style>
