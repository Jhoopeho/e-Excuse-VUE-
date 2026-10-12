<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { addRequest, saveRequestAttachment } from '../store'

const router = useRouter()
const form = ref({ reason: '', dateStart: '', dateEnd: '', details: '', documentName: '' })
const selectedSubjects = ref([])
const selectedFile = ref(null)
const fileInput = ref(null)
const error = ref('')
const success = ref(false)
function todayInput() {
  const today = new Date()
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
}
function onFile(event) {
  const file = event.target.files?.[0]
  if (!file) return
  const allowed = ['application/pdf', 'image/jpeg', 'image/png']
  if (!allowed.includes(file.type)) {
    error.value = 'Please upload a PDF, JPG, or PNG file.'
    selectedFile.value = null
    form.value.documentName = ''
    event.target.value = ''
    return
  }
  if (file.size > 5 * 1024 * 1024) {
    error.value = 'The file must be 5 MB or smaller.'
    selectedFile.value = null
    form.value.documentName = ''
    event.target.value = ''
    return
  }
  selectedFile.value = file
  form.value.documentName = file.name
  error.value = ''
}
async function submitForm() {
  error.value = ''
  if (!form.value.reason || !selectedSubjects.value.length || !form.value.dateStart) {
    error.value = 'Please choose a reason, select at least one subject, and enter a start date.'
    return
  }
  if (form.value.dateEnd && form.value.dateStart > form.value.dateEnd) {
    error.value = 'The end date must be on or after the start date.'
    return
  }
  const today = new Date()
  const todayLabel = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  if (form.value.dateStart > todayLabel) {
    error.value = 'The start date cannot be in the future.'
    return
  }
  let attachmentId = ''
  if (selectedFile.value) {
    attachmentId = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`
    try {
      await saveRequestAttachment(attachmentId, selectedFile.value)
    } catch {
      error.value = 'The supporting document could not be saved. Please try again.'
      return
    }
  }
  selectedSubjects.value.forEach(subject => addRequest({ ...form.value, subject, attachmentId }))
  success.value = true
  setTimeout(() => router.push('/requests'), 900)
}
</script>

<template>
  <section class="page-intro"><div><h1>Submit Excuse</h1><p>Fill out the form below to submit your absence excuse.</p></div><span class="breadcrumb">Dashboard <b>›</b> Submit Excuse</span></section>
  <section class="submit-layout">
    <article class="panel form-panel">
      <form @submit.prevent="submitForm" novalidate>
        <label for="reason">Reason for Absence <span class="required">*</span></label>
        <select id="reason" v-model="form.reason" required>
          <option value="" disabled>Select reason</option><option>Medical Reason</option><option>Family Matter</option><option>Personal Reason</option><option>Sick Leave</option><option>School Activity</option><option>Transportation Issue</option><option>Other</option>
        </select>

        <fieldset class="subject-options">
          <legend>Subject / Course Code <span class="required">*</span></legend>
          <label class="subject-option" :class="{ selected: selectedSubjects.includes('WS-301') }">
            <input v-model="selectedSubjects" type="checkbox" name="subjects" value="WS-301" />
            <span>WS-301</span>
          </label>
          <label class="subject-option" :class="{ selected: selectedSubjects.includes('DC-301') }">
            <input v-model="selectedSubjects" type="checkbox" name="subjects" value="DC-301" />
            <span>DC-301</span>
          </label>
          <label class="subject-option" :class="{ selected: selectedSubjects.includes('CC-302') }">
            <input v-model="selectedSubjects" type="checkbox" name="subjects" value="CC-302" />
            <span>CC-302</span>
          </label>
          <label class="subject-option" :class="{ selected: selectedSubjects.includes('IPT-301') }">
            <input v-model="selectedSubjects" type="checkbox" name="subjects" value="IPT-301" />
            <span>IPT-301</span>
          </label>
          <p class="field-note">Select every subject this absence applies to. A separate request will be created for each one.</p>
        </fieldset>

        <div class="form-grid absence-date-range">
          <div><label for="date-start">Start Date <span class="required">*</span></label><input id="date-start" v-model="form.dateStart" type="date" :max="todayInput()" required /></div>
          <div><label for="date-end">End Date <span class="optional">(optional)</span></label><input id="date-end" v-model="form.dateEnd" type="date" :min="form.dateStart || undefined" /></div>
        </div>
        <p class="field-note absence-range-note">Leave the end date blank for a one-day absence. For a longer absence, enter the last day.</p>

        <label for="details">Additional Details</label>
        <textarea id="details" v-model="form.details" maxlength="300" rows="5" placeholder="Write a short reason (optional)"></textarea>
        <div class="character-count">{{ form.details.length }}/300</div>

        <label>Upload Supporting Document</label>
        <button type="button" class="upload-zone" @click="fileInput?.click()"><span class="upload-icon">⇧</span><strong>{{ form.documentName || 'Click to upload or drag and drop' }}</strong><small>PDF, JPG, PNG (Max 5 MB)</small></button>
        <input ref="fileInput" class="visually-hidden" type="file" accept=".pdf,.jpg,.jpeg,.png" @change="onFile" />
        <p class="field-note">Supporting documents are optional.</p>

        <p v-if="error" class="form-message error-message" role="alert">{{ error }}</p>
        <p v-if="success" class="form-message success-message" role="status">Request submitted! Redirecting to My Requests…</p>
        <div class="form-actions"><button type="button" class="secondary-button" @click="router.push('/dashboard')">Cancel</button><button type="submit" class="primary-button submit-button">➤ &nbsp; Submit Request</button></div>
      </form>
    </article>
    <aside class="panel tips-panel"><div class="tips-illustration"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7 3.5h6.5L18.5 9v11.5A1.5 1.5 0 0 1 17 22H7a1.5 1.5 0 0 1-1.5-1.5V5A1.5 1.5 0 0 1 7 3.5Z" /><path d="M13.5 3.5V9h5M8.5 13h7M8.5 16.5h7" /></svg><b>✓</b></div><h3>Need to submit an excuse?</h3><p>Provide accurate information and supporting documents to ensure a faster review.</p><div class="tips-box"><strong>Tips:</strong><ul><li>Use a valid and clear reason.</li><li>Select the subjects affected by your absence.</li><li>Select the correct date.</li><li>Attach a supporting document if available.</li><li>Check your request status in “My Requests”.</li><li>You will be notified once your request is updated.</li></ul></div></aside>
  </section>
</template>
