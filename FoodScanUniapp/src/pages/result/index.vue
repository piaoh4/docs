<template>
  <view class="detail-page">
    <!-- 顶部返回栏 -->
    <view class="topbar">
      <text class="back" @tap="goBack">←</text>
      <text class="top-title">{{ product.title }}</text>
      <view class="top-actions">
        <view class="icon-wrap" :class="{pressing: iconPressing}" @touchstart="iconPressing=true" @touchend="iconPressing=false" @mousedown="iconPressing=true" @mouseup="iconPressing=false" @tap="toggleFav">
          <image class="icon-img" src="/static/hollow.png" :class="isFav ? 'fade-out' : 'fade-in'" />
          <image class="icon-img" src="/static/heart.png" :class="isFav ? 'fade-in' : 'fade-out'" />
        </view>
        <view class="icon-wrap" :class="{pressing: fbPressing}" @touchstart="fbPressing=true" @touchend="fbPressing=false" @mousedown="fbPressing=true" @mouseup="fbPressing=false" @tap="openFeedback">
          <image class="icon-img fade-in" src="/static/feedback.png" />
        </view>
      </view>
    </view>

    <!-- 评分面板 + 综合分析（合并展示） -->
    <view class="score-panel">
      <view class="score-top">
        <view class="score-left">
        <text class="score-big">{{ score }}分</text>
        <text class="score-tag">{{ scoreLabel }}</text>
        <view class="score-bar"><view class="score-bar-fill" :style="{width: ratingPercent + '%'}"></view></view>
        <text class="score-desc">{{ scoreDesc }}</text>
        </view>
        <view class="score-right" v-if="img">
        <image class="score-thumb" :src="img" mode="aspectFill" @tap="previewImg" />
        </view>
      </view>

      <!-- 综合分析内容（标题不加框） -->
      <view class="score-ov">
        <text class="sec-title plain">综合分析</text>
        <view class="ov-box">
          <text class="ov-text">{{ overview }}</text>
        </view>
      </view>
    </view>

    <!-- 要点速览 + 个体化建议（按图片格式呈现，固定数据结构） -->
    <view class="card seg-content">
      <view class="insight-head">
        <text class="insight-title">要点速览</text>
      </view>
      <view class="bullet-list">
        <text class="bullet" v-for="(b,i) in bullets" :key="i">• {{ b }}</text>
      </view>
      <view class="insight-divider"></view>
      <view class="personal-list">
        <text class="personal-item" v-for="(p,i) in personal" :key="i">· {{ p }}</text>
      </view>
    </view>

    <!-- 重点成分与风险提示（优化为图片格式） -->
    <view class="card risk">
      <text class="sec-title">重点成分</text>
      <transition-group name="riskfade" tag="view" class="risk-list">
        <view class="risk-box" v-for="r in (showAllRisks ? risks : risks.slice(0,1))" :key="r.name" :class="r.levelClass">
          <view class="risk-head">
            <text class="risk-title">{{ r.name }}</text>
            <text class="risk-tag" :class="r.levelClass">{{ r.levelText }}</text>
          </view>
          <view class="risk-body">
            <view class="risk-row"><text class="risk-label">问题点：</text><text class="risk-content">{{ r.issue }}</text></view>
            <view class="risk-row"><text class="risk-label">风险说明：</text><text class="risk-content">{{ r.risk }}</text></view>
            <view class="risk-row"><text class="risk-label">建议：</text><text class="risk-content">{{ r.advice }}</text></view>
          </view>
        </view>
      </transition-group>
      <view class="risk-footer" v-if="risks && risks.length > 1">
        <view class="risk-btn" @tap="showAllRisks = !showAllRisks" hover-class="pressed-btn" hover-start-time="0" hover-stay-time="100">
          {{ showAllRisks ? '收起 ▴' : '展开讲讲 ▾' }}
        </view>
      </view>
    </view>

    <!-- 配料表信息卡片 -->
    <view class="card ingredients">
      <text class="sec-title">配料表</text>
      <view class="ing-summary">{{ ingredientSummary }}</view>
      <view class="ing-list">
        <view class="ing-item" v-for="(it,idx) in ingredientItems" :key="it.label" @tap="openIngredient(it)" hover-class="pressed-item" hover-stay-time="100">
          <text class="ing-label">{{ it.label }}</text>
          <text class="ing-text">{{ it.text }}</text>
          <view class="rect-badge" :class="it.badge"
                @longpress.stop="showTip(idx)" @touchend.stop="hideTip()"
                @mouseenter.stop="showTip(idx)" @mouseleave.stop="hideTip()">
            <text class="rect-badge-text">{{ it.badgeText }}</text>
          </view>
          <view v-if="showTipIndex===idx" class="tooltip tooltip-right">
            <text>{{ it.tip }}</text>
          </view>
        </view>
      </view>
      <view class="ing-footer">
        <view class="ing-btn" @tap="openAllIngredients" hover-class="pressed-btn" hover-stay-time="100">详细了解所有成分</view>
      </view>
    </view>

    <!-- 营养成分分析 -->
    <view class="card nutrition">
      <text class="sec-title">营养成分分析</text>
      <view class="nut-summary">{{ nutritionSummary }}</view>
      <view class="nut-list">
        <view class="nut-item" v-for="n in nutrition" :key="n.name">
          <view class="nut-left">
            <view class="nut-top-row">
              <!-- 线性小图标 -->
              <svg v-if="n.icon==='energy'" class="nut-icon" viewBox="0 0 24 24">
                <path d="M12 3 C14.5 6.5 9.5 8 12 11 C14.5 14 14 17 12 21 C9 19 7.5 16 8.2 13 C9 10 10.5 8 12 3 Z"/>
              </svg>
              <svg v-else-if="n.icon==='protein'" class="nut-icon" viewBox="0 0 24 24">
                <path d="M6 12 C6 8 10 6 14 7 C17 8 18 11 16 13 C14 15 10 16 7 15 C6.5 14.5 6 13.5 6 12 Z"/>
                <circle cx="13" cy="10" r="1.4"/>
              </svg>
              <svg v-else-if="n.icon==='fat'" class="nut-icon" viewBox="0 0 24 24">
                <path d="M12 6 C14 9 16 11 16 13 C16 16 14 18 12 18 C10 18 8 16 8 13 C8 11 10 9 12 6 Z"/>
              </svg>
              <svg v-else-if="n.icon==='carb'" class="nut-icon" viewBox="0 0 24 24">
                <path d="M6 14 H18"/>
                <path d="M7 14 C7 18 17 18 17 14"/>
                <path d="M8 18 H16"/>
              </svg>
              <svg v-else-if="n.icon==='sodium'" class="nut-icon" viewBox="0 0 24 24">
                <path d="M9 4 H15 L16 8 H8 Z"/>
                <path d="M8 8 L9 20 H15 L16 8 Z"/>
              </svg>
              <text class="nut-name">{{ n.name }}</text>
              <view class="mini-bar">
                <view class="mini-fill" :style="barStyle(n.score)"></view>
              </view>
            </view>
            <text class="nut-val" :class="n.cls">{{ n.desc }}</text>
          </view>
          
          <view class="nut-right">
            <text class="nut-score lvl-box" :class="n.cls">{{ n.level }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 选购建议 -->
    <view class="card advise">
      <text class="sec-title">综合解读</text>
      <view class="adv-row">
        <view class="adv-col green">
          <text class="adv-title">建议食用人群</text>
          <view class="adv-list">
            <text v-for="i in advise.ok" :key="i" class="adv-item">{{ i }}</text>
          </view>
        </view>
        <view class="adv-col red">
          <text class="adv-title">谨慎/不推荐</text>
          <view class="adv-list">
            <text v-for="i in advise.bad" :key="i" class="adv-item">{{ i }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 推荐替代方案 -->
    <view class="card recommend">
      <view class="rec-head">
        <text class="sec-title">推荐替代方案</text>
        <text class="rec-sub">更健康的选择</text>
      </view>
      <view class="rec-list">
        <view class="rec-item" v-for="(a,idx) in alts.slice(0,3)" :key="a.id || idx"
              hover-class="pressed-item" hover-stay-time="100" @tap="openAlt(a)">
          <image class="rec-thumb" :src="a.img" mode="aspectFill" />
          <view class="rec-main">
            <text class="rec-name">{{ a.title }}</text>
            <text class="rec-desc">{{ a.desc }}</text>
          </view>
          <text class="rec-score">{{ a.score }}分</text>
          <text class="rec-arrow">›</text>
        </view>
      </view>
    </view>

    
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

const img = ref('')
const score = ref(56)
const scoreLabel = ref('倾情选择')
const scoreDesc = ref('略低于同类产品平均分')
const ratingPercent = ref(60)
const product = ref({ title: '方便速食', sub: '示例品牌 · 规格随识别返回' })
const overview = ref('配方复杂含多类添加糖，含香精与色素；建议减少频率，优先选择原料更简单的产品。')
const bullets = ref([
  '含添加糖（果葡糖浆、白砂糖）',
  '含动物脂肪（牛油）与较高钠盐',
  '含香精、色素等食品添加剂种类',
])
const personal = ref([
  '控糖、减脂人群：建议减少食用频次，可作为偶尔放松。',
  '高血压人群：注意与当天其他高盐食物的叠加。',
  '儿童：不建议作为每日零食，可偶尔少量。',
])
const ingredientSummary = ref('该配料表成分较复杂，含添加糖（果葡糖浆、白砂糖）、饱和脂肪酸（牛油）、人工与天然添加剂、食用香精与色素（姜黄、栀子黄等）。根据识别结果按含量排序如下：')
const ingredientItems = ref([
  { label: '水', text: '常见溶剂，无健康风险。', badge: 'healthy', badgeText: '健康', tip: '健康类别：对大多数人群无明显健康风险。' },
  { label: '进口全脂乳粉(≥6%)', text: '乳制品，含乳糖，可能导致消化不良；对乳糖不耐受者不宜。', badge: 'risk', badgeText: '风险', tip: '风险类别：对特定人群可能带来不良影响，需要谨慎。' },
  { label: '稀奶油', text: '高脂肪成分，低脂饮食需控制摄入。', badge: 'caution', badgeText: '警惕', tip: '警惕类别：建议控制摄入量或不常食用。' },
  { label: '咖啡成分(≥0.8%)', text: '提升注意力，但过量可能影响睡眠。', badge: 'notice', badgeText: '注意', tip: '注意类别：存在潜在影响，留意每日总摄入。' },
  { label: '碳酸钠', text: '食品添加剂，用于调节酸度，目前暂无明确健康风险信息。', badge: 'notice', badgeText: '注意', tip: '注意类别：添加剂需关注使用场景与摄入量。' },
])
const showTipIndex = ref(-1)
const showTip = (idx) => { showTipIndex.value = idx }
const hideTip = () => { showTipIndex.value = -1 }

// 进度条填充样式：宽度与渐变色根据比例区间设置
const barStyle = (score) => {
  const pct = Math.max(0, Math.min(100, Number(score) || 0))
  let bg = 'linear-gradient(to right, #4CAF50, #2E7D32)'
  if (pct > 70) bg = 'linear-gradient(to right, #F44336, #D32F2F)'
  else if (pct > 33) bg = 'linear-gradient(to right, #FFC107, #FF9800)'
  return { width: pct + '%', background: bg }
}
const risks = ref([
  {
    name: '添加糖', levelText: '偏高', levelClass: 'warn',
    issue: '配料表含果葡糖浆、白砂糖等多种糖源，排列靠前。',
    risk: '易导致总糖摄入偏高，增加血糖波动，对控糖与减脂人群不友好。',
    advice: '建议控制食用频率，搭配当天其他低糖食物，糖尿病人群尽量避免。'
  },
  {
    name: '钠盐', levelText: '较高', levelClass: 'mid',
    issue: '部分调味料中含钠较多，食用时容易忽视。',
    risk: '高盐摄入与血压升高相关，不利于高血压及心血管风险人群。',
    advice: '建议当天减少其他咸味食品摄入，高血压人群不宜经常食用。'
  },
  {
    name: '香精 / 色素', levelText: '存在', levelClass: 'info',
    issue: '用于增强风味和颜色，属于典型加工零食特征。',
    risk: '合理用量一般安全，但对部分敏感人群可能造成不适。',
    advice: '建议不必过度紧张，如有过往不适史，可减少摄入或选择无添加产品。'
  }
])
const nutritionSummary = ref('该产品高能量、高脂肪、高碳水化合物、高钠，蛋白质含量中等。营养密度较低，需注意控制用量。')
const nutrition = ref([
  { name: '能量', value: '455kcal/100g', score: 90, cls: 'high', level: '很高', desc: '每100克这款食品能量是455大卡，热量算比较高的，吃多了容易长肉哦～', icon: 'energy' },
  { name: '蛋白质', value: '7.5g/100g', score: 50, cls: 'mid', level: '中等', desc: '每100克含7.5克蛋白质，属于中等水平，有助于饱腹但不算高蛋白。', icon: 'protein' },
  { name: '脂肪', value: '21.9g/100g', score: 88, cls: 'high', level: '很高', desc: '每100克含21.9克脂肪，偏高，建议控制摄入。', icon: 'fat' },
  { name: '碳水化合物', value: '56.7g/100g', score: 92, cls: 'high', level: '很高', desc: '每100克含56.7克碳水化合物，较高，注意总碳水摄入。', icon: 'carb' },
  { name: '钠', value: '2369mg/100g', score: 95, cls: 'high', level: '很高', desc: '每100克含2369毫克钠，很高，需注意盐摄入。', icon: 'sodium' },
])
const advise = ref({
  ok: ['能量需求较高人群','非控糖人群','偶尔作为加餐'],
  bad: ['控糖人群','高血压人群','儿童尽量少量']
})

// 推荐替代方案列表（最多显示三项；后端返回数组即可）
const alts = ref([
  { id: 1, img: '/static/logo.png', title: '西麦·全家人的健康选择', desc: '配方更简单、脂肪含量较低，钠含量更低。', score: 9.2 },
  { id: 2, img: '/static/logo.png', title: '低糖燕麦片', desc: '减少添加糖与香精，更适合作为早餐主食。', score: 8.8 },
  { id: 3, img: '/static/logo.png', title: '原味酸奶', desc: '蛋白质较高，钠含量更低，配料更简单。', score: 8.6 }
])

// 重点成分展开/折叠
const showAllRisks = ref(false)

const scoreClass = ref('score-yellow')
onLoad((params)=>{
  const p = decodeURIComponent(params?.img || '')
  if (p) img.value = p
  const t = decodeURIComponent(params?.title || '')
  if (t) product.value.title = t
  const s = Number(params?.score)
  if (!isNaN(s)) score.value = s
  scoreClass.value = score.value >= 80 ? 'score-green' : (score.value >= 60 ? 'score-yellow' : 'score-red')
  // 评分面板补充
  scoreLabel.value = score.value >= 80 ? '优选推荐' : (score.value >= 60 ? '倾情选择' : '谨慎选择')
  ratingPercent.value = Math.min(100, Math.max(0, score.value))
  scoreDesc.value = score.value >= 60 ? '略低于同类产品平均分' : '低于同类产品平均分'
})

const retake = () => { uni.redirectTo({ url: '/pages/scan/index' }) }
const goHome = () => { uni.reLaunch({ url: '/pages/index/index' }) }

const activeTab = ref('brief')
const goBack = () => { uni.navigateBack() }
const previewImg = () => {
  if (!img.value) return
  try {
    uni.previewImage({ urls: [img.value] })
  } catch (e) {
    // H5 兼容处理
    try { window.open(img.value, '_blank') } catch(_) {}
  }
}

const isFav = ref(false)
const iconPressing = ref(false)
const toggleFav = () => {
  isFav.value = !isFav.value
  uni.showToast({ title: isFav.value ? '已收藏' : '已取消', icon: 'none' })
}
const fbPressing = ref(false)
const openFeedback = () => {
  uni.showToast({ title: '反馈入口', icon: 'none' })
}

// 配料详情跳转
const openIngredient = (it) => {
  const name = encodeURIComponent(product.value.title)
  const label = encodeURIComponent(it.label)
  const text = encodeURIComponent(it.text)
  uni.navigateTo({ url: `/pages/ingredient/index?name=${name}&label=${label}&text=${text}` })
}
const openAllIngredients = () => {
  try { uni.setStorageSync('ingredientsAll', ingredientItems.value) } catch(e) {}
  const name = encodeURIComponent(product.value.title)
  uni.navigateTo({ url: `/pages/ingredients/index?name=${name}` })
}

// 推荐方案点击交互（可替换为实际跳转逻辑）
const openAlt = (a) => {
  const title = a?.title || '推荐方案'
  uni.showToast({ title: `查看：${title}`, icon: 'none' })
}
</script>

<style>
.detail-page { min-height: 100vh; background: #FFF7F4; padding-bottom: 140rpx; }
.topbar { height: 88rpx; display:flex; align-items:center; padding: 0 24rpx; }
.back { font-size: 40rpx; color:#37474F; }
.top-title { margin-left: 17rpx; font-size: 32rpx; font-weight: 700; color:#2E3A46; }
.top-actions { margin-left:auto; display:flex; gap: 20rpx; }
.icon-wrap { width: 44rpx; height: 44rpx; position: relative; }
.icon-wrap.pressing { transform: scale(.95); }
.icon-img { position:absolute; left:0; top:0; width: 44rpx; height: 44rpx; transition: opacity .3s ease; }
.fade-in { opacity: 1; visibility: visible; pointer-events: auto; }
.fade-out { opacity: 0; visibility: hidden; pointer-events: none; }

.score-panel { margin: 0 24rpx 16rpx; background: linear-gradient(180deg,#FFF2E8 0%, #FFFFFF 80%); border-radius: 24rpx; padding: 18rpx; display:flex; flex-direction: column; gap: 12rpx; }
.score-top { display:flex; align-items:flex-start; justify-content:space-between; }
.score-ov { width: 100%; }
.score-left { display:flex; flex-direction:column; gap: 8rpx; }
.score-big { font-size: 44rpx; font-weight: 800; color:#333; }
.score-tag { font-size: 28rpx; color:#FF7043; font-weight: 700; }
.score-bar { width: 260rpx; height: 10rpx; background:#FFE0B2; border-radius: 6rpx; overflow:hidden; }
.score-bar-fill { height:100%; background:#FF7043; }
.score-desc { font-size: 24rpx; color:#8D9AA7; }
.score-right { width: 160rpx; height: 160rpx; border-radius: 18rpx; overflow:hidden; }
.score-thumb { width: 100%; height: 100%; }
.name-main { font-size: 34rpx; font-weight: 700; color:#2E3A46; }

.card { margin: 16rpx calc(24rpx - 2.5px); background:#FFFFFF; border-radius: 24rpx; box-shadow: 0 8rpx 24rpx rgba(0,0,0,.06); padding: 20rpx; }
.card.overview { margin-top: 0; }
.seg-content { margin-top: 12rpx; }
.insight-head { display:flex; align-items:center; justify-content:flex-start; padding: 6rpx 2rpx; margin-bottom: 10rpx; }
.insight-title { display:inline-block; font-size: 30rpx; font-weight: 700; color:#444; padding: 8rpx 14rpx; border: 1rpx solid #E4D9C9; background:#FAF4EC; border-radius: 8rpx; }
.bullet-list { display:flex; flex-direction:column; gap: 16rpx; color:#333; }
.bullet { font-size: 28rpx; }
.insight-divider { border-top: 1rpx dashed #E0E0E0; margin: 18rpx 0; }
.personal-list { display:flex; flex-direction:column; gap: 14rpx; }
.personal-item { display:block; font-size: 26rpx; color:#6B7280; line-height: 1.7; word-break: break-word; white-space: normal; text-align: justify; text-justify: inter-ideograph; text-align-last: left; }
.badge { display:inline-block; padding: 8rpx 14rpx; border-radius: 999rpx; font-size: 22rpx; margin-bottom: 12rpx; }
.good { background:#E8F5E9; color:#2E7D32; }
.ov-box { background:#F7F9FA; border-radius: 18rpx; padding: 18rpx; }
.ov-text { color:#445963; font-size: 28rpx; line-height: 1.6; }

.ingredients .ing-summary { background:#F7F9FA; border-radius: 18rpx; padding: 18rpx; color:#556E7A; margin-bottom: 12rpx; line-height: 42rpx; word-break: break-word; }
.ingredients .ing-list { display:flex; flex-direction:column; gap: 10rpx; }
.ingredients .ing-item { display:flex; gap: 12rpx; padding: 14rpx 12rpx; border-bottom: 1rpx solid #ECEFF1; border-radius: 12rpx; transition: transform .15s ease, background-color .15s ease; position: relative; }
.ingredients .ing-label { width: 160rpx; color:#37474F; font-weight:600; }
.ingredients .ing-text { flex:1; color:#607D8B; font-size: 24rpx; }
.ingredients .ing-footer { margin-top: 16rpx; display:flex; justify-content:center; }
.ingredients .ing-btn { padding: 18rpx 108rpx; background:#FFFFFF; color:#5D4037; border-radius: 20rpx; border: 1rpx solid #E0E0E0; box-shadow: 0 6rpx 16rpx rgba(0,0,0,.06); transition: transform .15s ease, box-shadow .15s ease; }
.pressed-item { transform: scale(.98); background-color:#FFF7F4; }
.pressed-btn { transform: scale(.98); box-shadow: 0 4rpx 12rpx rgba(0,0,0,.06); }

/* 右侧长方形徽章与提示（浅色系，响应式尺寸与间距） */
.detail-page { --badge-height: 24px; --badge-pad-x: 8px; --badge-gap: 8px; }
@media (min-width: 768px) { .detail-page { --badge-height: 32px; --badge-pad-x: 12px; --badge-gap: 12px; } }
.rect-badge { height: var(--badge-height); padding: 0 var(--badge-pad-x); border-radius: 6px; display:flex; align-items:center; justify-content:center; margin-left: var(--badge-gap); flex-shrink:0; }
.rect-badge-text { color:#FFFFFF; font-size: 12px; font-weight: 700; line-height: 1; }
.rect-badge.healthy { background:#4CAF50; }
.rect-badge.notice { background:#FFC107; }
.rect-badge.caution { background:#FF9800; }
.rect-badge.risk { background:#F44336; }
.tooltip { position:absolute; right: 12px; top: -36px; background: rgba(0,0,0,.78); color:#FFF; font-size: 24rpx; padding: 10rpx 14rpx; border-radius: 10rpx; max-width: 520rpx; z-index: 10; }

.sec-title { display:inline-block; font-size: 30rpx; font-weight: 700; color:#3E3E3E; margin-bottom: 12rpx; padding: 8rpx 14rpx; border: 1rpx solid #E4D9C9; background:#FAF4EC; border-radius: 8rpx; }
.sec-title.plain { padding: 0; border: none; background: transparent; }
.risk-list { display:flex; flex-direction:column; gap: 20rpx; }
.risk-box { border-radius: 18rpx; padding: 20rpx; border: 1rpx solid #EEE; background:#FAFAFA; }
.risk-box.warn { background:#FFF3E6; border-color:#FADFC4; }
.risk-box.mid { background:#FFF7DB; border-color:#F3E7A4; }
.risk-box.info { background:#EAF5FF; border-color:#CFE6FF; }
.risk-head { display:flex; align-items:center; justify-content:space-between; margin-bottom: 12rpx; }
.risk-title { font-size: 30rpx; font-weight: 700; color:#333; }
.risk-tag { font-size: 24rpx; padding: 8rpx 14rpx; border-radius: 999rpx; }
.risk-tag.warn { background:#FDE8E8; color:#C62828; }
.risk-tag.mid { background:#FFF2CC; color:#8A6D1A; }
.risk-tag.info { background:#E3F2FD; color:#1565C0; }
.risk-body { display:flex; flex-direction:column; gap: 12rpx; }
.risk-row { display:flex; }
.risk-label { flex: 0 0 160rpx; color:#6B7280; font-size: 26rpx; }
.risk-content { flex:1; min-width:0; color:#37474F; font-size: 26rpx; line-height: 1.6; word-break: break-word; white-space: normal; text-align: justify; text-justify: inter-ideograph; text-align-last: left; }
.risk-footer { display:flex; justify-content:center; margin-top: 16rpx; }
.risk-btn { display:inline-flex; align-items:center; justify-content:center; padding: 18rpx 108rpx; background:#FFFFFF; color:#5D4037; border-radius: 20rpx; border: 1rpx solid #E0E0E0; box-shadow: 0 6rpx 16rpx rgba(0,0,0,.06); transition: transform .15s ease, box-shadow .15s ease; font-size: 26rpx; }
.pressed-btn { opacity: 0.94; transform: scale(0.98); box-shadow: 0 3rpx 10rpx rgba(0,0,0,.08); }
.riskfade-enter-active, .riskfade-leave-active { transition: all .18s ease; }
.riskfade-enter-from, .riskfade-leave-to { opacity: 0; transform: translateY(-6rpx); }

/* 营养项线性图标样式 */
.nut-icon { width: 24px; height: 24px; stroke: #5a6d79; fill: none; stroke-width: 2; margin-right: 8px; }

.nut-summary { background:#F7F9FA; border-radius: 18rpx; padding: 18rpx; color:#556E7A; margin-bottom: 10rpx; }
.nut-list { display:flex; flex-direction:column; gap: 12rpx; }
.nut-item { display:flex; align-items:flex-start; justify-content:space-between; border-bottom: 1px dashed #5a6d79; padding-bottom: 8px; margin-bottom: 8px; }
.nut-left { flex: 0 0 calc(80%); }
.nut-top-row { display:flex; align-items:center; width: 100%; position: relative; min-height: var(--nut-font-size, 28rpx); }
.mini-bar { width: 140px; height: 10px; border-radius: 6px; background:#ECEFF1; overflow:hidden; position: absolute; left: 65%; top: 50%; transform: translate(-50%, -50%); }
.mini-fill { height: 100%; transition: width .25s ease; }
.nut-mid { display:none; }
.nut-name { font-size: var(--nut-font-size, 28rpx); line-height: var(--nut-font-size, 28rpx); color:#37474F; }
.nut-val { display:block; color:#5a6d79; font-size: 24rpx; line-height: 1.5; }
 
.nut-right { width: 40%; display:flex; align-items:center; justify-content:flex-end; }
.bar { display:none; }
.bar-fill { display:none; }
.nut-score { text-align: right; font-size: 24rpx; margin-right: 8px; }
/* 文本框装饰与等级背景色 */
.lvl-box { border: 1px solid #E0E0E0; padding: 4px 8px; border-radius: 4px; color: #333; background: #FFFFFF; }
.lvl-box.high { background: #fae4e3; color:#C62828; border-color:#f2b8b3; }
.lvl-box.mid { background: #f7efc9; color:#856404; border-color:#f0e28f; }
.lvl-box.low { background: #cfffd6; color:#2E7D32; border-color:#a5d6a7; }
/* 对齐变量 */
.detail-page { --nut-font-size: 28rpx; --bar-height: 12rpx; }
@media (min-width: 768px) { .detail-page { --nut-font-size: 30rpx; } }
@media (max-width: 768px) {
  .nut-item { padding-bottom: 6px; margin-bottom: 6px; }
  .mini-bar { width: 120px; }
}
@media (max-width: 480px) {
  .lvl-box { padding: 3px 6px; }
}

.advise .adv-row { display:flex; gap: 16rpx; }
.adv-col { flex:1; border-radius: 18rpx; padding: 16rpx; }
.adv-col.green { background:#E8F5E9; }
.adv-col.red { background:#FDE8E8; }
.adv-title { font-size: 26rpx; font-weight: 700; color:#37474F; }
.adv-list { margin-top: 8rpx; display:flex; flex-wrap:wrap; gap: 10rpx; }
.adv-item { padding: 8rpx 12rpx; background:#FFF; border-radius: 999rpx; font-size: 22rpx; color:#607D8B; }

/* 推荐替代方案样式 */
.recommend .rec-head { display:flex; align-items:center; justify-content:space-between; }
.recommend .rec-head .sec-title { margin-bottom: 0; }
.rec-sub { color:#8D9AA7; font-size: 24rpx; }
.rec-list { display:flex; flex-direction:column; }
.rec-item { display:flex; align-items:center; gap: 12rpx; padding: 12rpx 8rpx; border-bottom: 1rpx dashed #E0E0E0; }
.rec-item:last-child { border-bottom: none; }
.rec-thumb { width: 80rpx; height: 80rpx; border-radius: 12rpx; overflow:hidden; }
.rec-main { flex:1; display:flex; flex-direction:column; }
.rec-name { font-size: 26rpx; font-weight: 700; color:#2E3A46; }
.rec-desc { font-size: 24rpx; color:#607D8B; margin-top: 6rpx; }
.rec-score { font-size: 26rpx; color:#2E7D32; font-weight: 700; }
.rec-arrow { color:#A0A7AE; font-size: 32rpx; margin-left: 8rpx; }


</style>