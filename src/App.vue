<template>
  <div class="header">
    <h1>
      <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/>
      </svg>
      Don't overshare
    </h1>
    <div class="controls">
      <select v-model="language" class="select">
        <option value="auto">Auto Detect</option>
        <option value="python">Python</option>
        <option value="php">PHP</option>
        <option value="javascript">JavaScript</option>
        <option value="sql">SQL</option>
      </select>
      <button @click="anonymize" class="btn">
        <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/>
        </svg>
        Anonymize
      </button>
      <button @click="downloadMapping" class="btn btn-secondary" :disabled="!mapping.size">
        <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
        </svg>
        Export Mapping
      </button>
      <button @click="clear" class="btn btn-danger">
        <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
        </svg>
        Clear
      </button>
    </div>
  </div>

  <div class="main-content">
    <div class="panel">
      <div class="panel-header">Original Code</div>
      <textarea 
        v-model="inputCode" 
        placeholder="Paste your code here..."
        spellcheck="false"
      ></textarea>
    </div>

    <div class="divider"></div>

    <div class="panel">
      <div class="panel-header">Anonymized Code</div>
      <textarea 
        v-if="outputCode"
        v-model="outputCode" 
        readonly
        spellcheck="false"
      ></textarea>
      <div v-else class="empty-state">
        Anonymized code will appear here
      </div>
    </div>

    <div class="divider"></div>

    <div class="panel">
      <div class="panel-header">
        <span>Mapping ({{ mapping.size }} items)</span>
        <button 
          v-if="mapping.size > 0" 
          @click="copyMapping" 
          class="btn btn-secondary"
          style="padding: 0.25rem 0.5rem; font-size: 0.8rem;"
        >
          <svg v-if="!copied" class="icon" style="width: 14px; height: 14px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
          </svg>
          <svg v-else class="icon" style="width: 14px; height: 14px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
          </svg>
          {{ copied ? 'Copied!' : 'Copy' }}
        </button>
      </div>
      <div v-if="mapping.size > 0" class="mapping-panel">
        <div v-for="[key, value] in mapping" :key="key" class="mapping-item">
          <span class="mapping-original">{{ key.split(':')[1] }}</span>
          <span class="mapping-arrow">→</span>
          <span class="mapping-anonymized">{{ value }}</span>
        </div>
      </div>
      <div v-else class="empty-state">
        Mapping will appear here
      </div>
    </div>
  </div>

  <div class="footer">
    All processing happens in your browser. No data is sent to any server.
  </div>
</template>

<script setup>
import { ref, onUnmounted } from 'vue'
import { Anonymizer } from './anonymizer/core'

const inputCode = ref('')
const outputCode = ref('')
const language = ref('auto')
const mapping = ref(new Map())
const copied = ref(false)

const anonymizer = new Anonymizer()

const anonymize = () => {
  if (!inputCode.value.trim()) return
  
  const result = anonymizer.process(inputCode.value, language.value)
  outputCode.value = result.code
  mapping.value = result.mapping
}

const clear = () => {
  inputCode.value = ''
  outputCode.value = ''
  mapping.value = new Map()
  anonymizer.clear()
}

const downloadMapping = () => {
  if (mapping.value.size === 0) return
  
  const mappingObj = {}
  mapping.value.forEach((value, key) => {
    mappingObj[key] = value
  })
  
  const blob = new Blob([JSON.stringify(mappingObj, null, 2)], { 
    type: 'application/json' 
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'anonymization-mapping.json'
  a.click()
  URL.revokeObjectURL(url)
}

const copyMapping = () => {
  const mappingObj = {}
  mapping.value.forEach((value, key) => {
    mappingObj[key] = value
  })
  navigator.clipboard.writeText(JSON.stringify(mappingObj, null, 2))
  copied.value = true
  setTimeout(() => copied.value = false, 2000)
}

onUnmounted(() => {
  anonymizer.clear()
})
</script>