<template>
  <view class="page">
    <!-- Header -->
    <view class="header">
      <button class="icon-btn" @click="onBack">←</button>
      <view class="title-wrap">
        <text class="title">{{ sample.ingredient_name }}</text>
      </view>
    </view>

    <!-- Shared card -->
    <view class="card">
      <view class="card-row">
        <view class="card-left">
          <text class="label">安全等级</text>
          <view class="safety-row">
            <text class="safety-score">{{ sample.safety_rating }}</text>
            <view class="progress-wrap">
              <view class="progress-bg">
                <view class="progress-fill" :style="{ width: (sample.safety_rating / 5 * 100) + '%' }"></view>
              </view>
              <text class="hint">分数越高越安全</text>
            </view>
          </view>
        </view>

        <view class="card-right">
          <text class="label">常见食品</text>
          <view class="badges">
            <view v-for="(f, idx) in sample.common_foods" :key="f" class="badge food">{{ f }}</view>
          </view>
        </view>
      </view>

      <!-- Tabs -->
      <view class="tabs">
        <button :class="['tab-btn', tab === 'basic' ? 'active' : '']" @click="tab = 'basic'">配料基本信息</button>
        <button :class="['tab-btn', tab === 'personal' ? 'active' : '']" @click="tab = 'personal'">个体化分析</button>
      </view>
    </view>

    <!-- Content -->
    <view class="content">
      <view v-if="tab === 'basic'" class="section-list">
        <view class="section card">
          <text class="section-title">功能说明</text>
          <text class="section-body">{{ sample.basic_info.function_description }}</text>
        </view>

        <view class="section card">
          <view class="section-head">
            <text class="section-title">技术信息</text>
            <text class="section-sub">可用于检索/合规</text>
          </view>
          <view class="kv">
            <text class="kv-key">学名：</text><text class="kv-val">{{ sample.basic_info.chemical_identity }}</text>
          </view>
          <view class="kv">
            <text class="kv-key">常见形态：</text><text class="kv-val">{{ sample.basic_info.typical_forms.join('，') }}</text>
          </view>
          <view class="kv">
            <text class="kv-key">典型添加量：</text><text class="kv-val">{{ sample.basic_info.typical_addition_rate }}</text>
          </view>
          <view class="kv">
    <text class="kv-key">特殊技能：</text><text class="kv-val">{{ sample.basic_info.stability_and_processing }}</text>
          </view>
          <view class="health-impact">
            <view class="health-box">
              <text class="health-title">健康影响</text>
              <text class="health-text">{{ sample.basic_info.health_impact }}</text>
            </view>
          </view>
        </view>

        <view class="section card">
          <text class="section-title">使用示例</text>
          <view class="badges">
            <view v-for="u in sample.basic_info.usage_examples" :key="u" class="badge alt">{{ u }}</view>
          </view>
        </view>
      </view>

      <view v-else class="section-list">
        <view class="section card">
          <view class="section-head">
            <text class="section-title">适配结论</text>
            <view class="confidence">置信度 {{ Math.round(sample.personalized_analysis.confidence * 100) }}%</view>
          </view>
          <text class="section-body">{{ sample.personalized_analysis.suitability_summary }}</text>
        </view>

        <view class="section card">
          <view class="section-head">
            <text class="section-title">风险要点</text>
            <view v-if="hasSodiumConcern" class="badge warn head-tag">高钠顾虑</view>
          </view>

          <view class="badges">
            <view v-for="r in riskFlagsExcludingSodium" :key="r" class="badge warn">{{ r }}</view>
          </view>

          <text class="section-body">{{ sample.personalized_analysis.risk_explanation }}</text>

          <view class="progress-line">
            <view class="progress-bg">
              <view class="progress-fill" :style="{ width: (sample.personalized_analysis.estimated_risk_level_for_profile / 5 * 100) + '%' }"></view>
            </view>
          </view>

          <view class="kv stack">
            <text class="kv-key">情景说明：</text>
            <text class="kv-val">{{ sample.personalized_analysis.consumption_context_notes }}</text>
          </view>
        </view>

        <view class="section card">
          <text class="section-title">替代与标注建议</text>
          <view class="kv">
            <text class="kv-key">替代：</text>
            <text class="kv-val">{{ sample.personalized_analysis.alternatives.join('；') }}</text>
          </view>
          <view class="kv">
            <text class="kv-key">包装建议：</text>
            <text class="kv-val">{{ sample.personalized_analysis.labeling_and_warning }}</text>
          </view>
        </view>
      </view>

      <!-- JSON viewer -->
      <view v-if="showJSON" class="card raw-json">
        <view class="json-head">
          <text class="json-title">Raw JSON</text>
          <button class="link-btn" @click="showJSON = false">关闭</button>
        </view>
        <pre class="json-pre">{{ jsonString }}</pre>
      </view>

      <!-- bottom spacing so floating area doesn't overlap -->
      <view style="height: 120px"></view>
    </view>
  </view>
</template>

<script setup>
import { reactive, ref, computed } from 'vue'

const sample = reactive({
  ingredient_name: '谷氨酸钠',
  safety_rating: 3.5,
  common_foods: ['汤料', '方便面', '调味料', '速冻食品'],
  basic_info: {
    function_description:
      '通过提供谷氨酸离子增强食物的鲜味，通常以结晶或粉末形式加入。典型添加量通常小于1%，多数汤料或调味包在0.1%–0.5%范围。可提升汤类和酱料的鲜味，改善低成本配方的口感；在高温烹调下稳定性较好，常与盐和其他调味料配伍使用。',
    chemical_identity: '谷氨酸钠（Monosodium Glutamate, MSG），CAS: 142-47-2',
    typical_forms: ['粉末', '结晶盐'],
    typical_addition_rate: '约0.1%–0.5%',
    stability_and_processing: '耐高温，水溶性好；在极酸或极碱环境下反应性增加，应按配方控制pH。',
    regulatory_notes: '多数国家允许作为食品添加剂使用，包装上视地区法规而定。',
    usage_examples: ['速食汤料提鲜', '方便面调味包'],
    health_impact:
      '谷氨酸钠可增强鲜味；在推荐用量下多数人群安全。若长期大量或频繁摄入，可能增加总体钠盐负担，不利于高血压人群及心血管健康，需结合每日总钠摄入控制。'
  },
  personalized_analysis: {
    profile_id: 'profile-001',
    suitability_summary:
      '对一般成年人适量使用通常安全；对高血压患者短期少量使用并非直接禁忌，但建议注意总体钠摄入量。',
    risk_flags: ['高钠顾虑'],
    risk_explanation:
      '谷氨酸钠含钠，若用户有高血压或需要限制钠摄入，应关注成品中总钠含量。单次少量使用风险较低，但长期多次高摄入可能增加钠负荷。',
    estimated_risk_level_for_profile: 2.5,
    consumption_context_notes:
      '若产品为高钠配方（例如同时添加大量食盐），则对高血压人群总体不利；若作为微量增鲜（单次0.1%以内），对大多数人影响有限。',
    alternatives: ['低钠增鲜配方（天然高鲜度原料替代）'],
    labeling_and_warning:
      '建议在产品营养标签中明确标注钠含量，以便需要限制钠摄入的人群决策。',
    confidence: 0.8
  }
})

const tab = ref('basic')
const showJSON = ref(false)

// 风险要点：是否包含“高钠顾虑”，及剔除后的列表
const hasSodiumConcern = computed(() =>
  sample.personalized_analysis.risk_flags.includes('高钠顾虑') ||
  sample.personalized_analysis.risk_flags.includes('high_sodium_concern')
)
const riskFlagsExcludingSodium = computed(() =>
  sample.personalized_analysis.risk_flags.filter(
    (r) => r !== '高钠顾虑' && r !== 'high_sodium_concern'
  )
)

const jsonString = computed(() => JSON.stringify(sample, null, 2))


function onBack() {
  if (typeof uni !== 'undefined' && uni.navigateBack) {
    uni.navigateBack({ delta: 1 })
  } else if (typeof window !== 'undefined' && window.history) {
    window.history.back()
  }
}

function onSave() {
  // implement save logic, e.g. call API
  console.log('save', sample)
}

// 编辑用户画像功能已移除
</script>

<style scoped>
.page { padding: 16px; background: linear-gradient(180deg,#FFF2E8 0%, #FFFFFF 80%); min-height: 100vh; box-sizing: border-box; }
.header { display:flex; align-items:center; justify-content:space-between; margin-bottom: 12px; }
.icon-btn { background:#ffffff; border:none; padding:-6px 12px; border-radius:12px; box-shadow:0 1px 2px rgba(0,0,0,.06); }
.title-wrap { text-align:center; flex:1; }
.subtitle { font-size: 14px; color:#6b7280; }
.title { font-size: 22px; font-weight:800; color:#2E3A46; }
.card { background:#fff; padding: 16px; border-radius: 24px; box-shadow: 0 8px 24px rgba(0,0,0,0.06); margin-bottom: 14px; margin-left:-7px; margin-right:-7px; }
.card-row { display:flex; justify-content:space-between; gap:16px; align-items:flex-start; }
.card-left { flex:1; }
.card-right { width:auto; text-align:left; }
.label { font-size: 12px; color:#6b7280; }
.safety-row { display:flex; align-items:center; gap:12px; margin-top:6px; }
.safety-score { font-size: 28px; font-weight:800; color:#2E3A46; }
.progress-wrap { width: 140px; }
.progress-bg { height: 10px; background:#e5e7eb; border-radius: 10px; overflow:hidden; }
.progress-fill { height: 10px; background: linear-gradient(90deg,#66BB6A,#43A047); }
.hint { font-size: 12px; color:#9ca3af; margin-top:6px; }
.badges { display:flex; flex-wrap:wrap; gap:8px; justify-content:flex-start; margin-top:6px; }
.badge { background:#EFF5FB; padding:6px 12px; border-radius:6px; font-size:10px; color:#356A94; }
.badge.food { padding: 4px 8px; }
.badge.alt { background:#ECFDF5; color:#2E7D32; }
.badge.warn { background:#FFF3CD; color:#856404; }
.tabs { display:flex; margin-top:12px; background:transparent; padding:3px; border-radius:14px; }
.tab-btn { flex:1;  border-radius: 12px; background:transparent; border:none; color:#8D6E63; font-weight:700; min-height: 35px; transition: transform .15s ease, background-color .15s ease; }
.tab-btn:active { transform: scale(0.98); }
.tab-btn.active { background:#F3F4F6; color:#5D4037; box-shadow:none; }
.tab-btn.active:active { background:#E9EAEE; }
.content { }
.section { padding: 12px; }
.section-title { display:block; font-size: 16px; font-weight:700; margin-bottom:8px; }
.section-body { color:#374151; font-size:14px; line-height:1.7; }
.section-head { display:flex; justify-content:space-between; align-items:center; }
.head-tag { margin-left:8px; }
.confidence { background:#E6F0F9; color:#356A94; border-radius:999px; padding:6px 10px; font-size:12px; }
.section-sub { font-size:12px; color:#9ca3af; }
.kv { display:flex; margin-top:6px; }
.kv-key { width: 120px; color:#6b7280; }
.kv-val { flex:1; color:#374151; }
/* 健康影响模块：标题 + 灰色背景文本框 */
.health-impact { margin-top: 10px; }
.health-title { display:block; font-size: 18px; font-weight: 700; color:#111827; margin-bottom: 8px; }
.health-box { background:#fbf5d0; border-radius: 12px; padding: 12px; }
.health-text { color:#2E3A46; font-size: 14px; line-height: 1.8; }
/* 纵向堆叠：键在上、值在下 */
.kv.stack { flex-direction: column; align-items: flex-start; }
.kv.stack .kv-key { width: auto; margin-bottom: 6px; }
.kv.stack .kv-val { width: 100%; }
.raw-json { font-size:12px; }
.json-head { display:flex; justify-content:space-between; align-items:center; }
.json-pre { white-space: pre-wrap; max-height: 240px; overflow:auto; background:#f3f4f6; padding:8px; border-radius:8px; }
.floating { position: fixed; left:16px; right:16px; bottom:16px; display:flex; justify-content:center; }
.link-btn { background:transparent; border:none; color:#2563eb; }
</style>
