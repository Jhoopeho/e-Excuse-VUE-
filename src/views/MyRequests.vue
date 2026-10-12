<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { state, deleteRequest, updateRequest, saveRequestAttachment, deleteRequestAttachment, getRequestAttachment } from '../store'

const route = useRoute()
const activeFilter = ref('All')
const search = ref('')
const selected = ref(null)
const attachmentUrl = ref('')
const attachmentError = ref('')
const editing = ref(null)
const deleting = ref(null)
const editForm = ref({ reason: '', subject: '', dateStart: '', dateEnd: '', details: '' })
const editFile = ref(null)
const editFileInput = ref(null)
const editDocumentName = ref('')
const editError = ref('')
const filters = ['All', 'Pending', 'Approved', 'Rejected']
const filtered = computed(() => state.requests.filter(item =>
  (activeFilter.value === 'All' || item.status === activeFilter.value) &&
  `${item.reason} ${item.subject || ''} ${item.status} ${item.details}`.toLowerCase().includes(search.value.toLowerCase())
))
watch(() => route.query.selected, id => { if (id) selected.value = state.requests.find(r => String(r.id) === String(id)) || null }, { immediate: true })
watch(selected, async (item, _previousItem, onCleanup) => {
  let current = true
  onCleanup(() => {
    current = false
    if (attachmentUrl.value) URL.revokeObjectURL(attachmentUrl.value)
    attachmentUrl.value = ''
  })
  attachmentError.value = ''
  if (!item?.documentName) return
  if (!item.attachmentId) {
    attachmentError.value = 'The attachment is not available in this browser.'
    return
  }
  try {
    const file = await getRequestAttachment(item.attachmentId)
    if (!current) return
    if (!file) {
      attachmentError.value = 'The attachment is not available in this browser.'
      return
    }
    attachmentUrl.value = URL.createObjectURL(file)
  } catch {
    if (current) attachmentError.value = 'The attachment could not be loaded.'
  }
}, { immediate: true })
onBeforeUnmount(() => {
  if (attachmentUrl.value) URL.revokeObjectURL(attachmentUrl.value)
})
function dateLabel(value) {
  return value ? new Date(`${value}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'
}
function dateRangeLabel(item) {
  const start = item.dateStart || item.date
  const end = item.dateEnd || item.date
  return !end || start === end ? dateLabel(start) : `${dateLabel(start)} – ${dateLabel(end)}`
}
function reasonIconType(reason) {
  const normalizedReason = reason.toLowerCase()
  if (normalizedReason.includes('family')) return 'family'
  if (normalizedReason.includes('sick') || normalizedReason.includes('health')) return 'health'
  if (normalizedReason.includes('medical')) return 'medical'
  if (normalizedReason.includes('personal')) return 'personal'
  if (normalizedReason.includes('transport')) return 'transportation'
  if (normalizedReason.includes('school')) return 'school'
  return 'default'
}
function beginEdit(item) {
  if (item.status !== 'Pending') return
  editing.value = item.id
  editForm.value = { reason: item.reason, subject: item.subject || '', dateStart: item.dateStart || item.date, dateEnd: item.dateEnd || item.date, details: item.details }
  editFile.value = null
  editDocumentName.value = item.documentName || ''
  editError.value = ''
}
function onEditFile(event) {
  const file = event.target.files?.[0]
  if (!file) return
  if (!['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)) {
    editError.value = 'Please upload a PDF, JPG, or PNG file.'
    event.target.value = ''
    return
  }
  if (file.size > 5 * 1024 * 1024) {
    editError.value = 'The file must be 5 MB or smaller.'
    event.target.value = ''
    return
  }
  editFile.value = file
  editDocumentName.value = file.name
  editError.value = ''
}
function clearEditDocument() {
  editFile.value = null
  editDocumentName.value = ''
  editError.value = ''
  if (editFileInput.value) editFileInput.value.value = ''
}
async function saveEdit(item) {
  editError.value = ''
  if (!item || item.status !== 'Pending' || !editForm.value.reason || !editForm.value.subject.trim() || !editForm.value.dateStart || (editForm.value.dateEnd && editForm.value.dateStart > editForm.value.dateEnd)) return
  let attachmentId = item.attachmentId || ''
  if (editFile.value) {
    const sharedAttachment = state.requests.some(request => request.id !== item.id && request.attachmentId === attachmentId)
    if (!attachmentId || sharedAttachment) attachmentId = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`
    try {
      await saveRequestAttachment(attachmentId, editFile.value)
    } catch {
      editError.value = 'The supporting document could not be saved. Please try again.'
      return
    }
  } else if (!editDocumentName.value && attachmentId) {
    const sharedAttachment = state.requests.some(request => request.id !== item.id && request.attachmentId === attachmentId)
    if (!sharedAttachment) {
      try {
        await deleteRequestAttachment(attachmentId)
      } catch {
        editError.value = 'The attached document could not be removed. Please try again.'
        return
      }
    }
    attachmentId = ''
  }
  updateRequest(item.id, {
    ...editForm.value,
    date: editForm.value.dateStart,
    dateEnd: editForm.value.dateEnd || editForm.value.dateStart,
    subject: editForm.value.subject.trim(),
    documentName: editDocumentName.value,
    attachmentId,
  })
  editing.value = null
}
function remove(item) {
  deleting.value = item
}
async function confirmDelete() {
  if (!deleting.value) return
  const item = deleting.value
  const attachmentId = item.attachmentId
  const sharedAttachment = attachmentId && state.requests.some(request => request.id !== item.id && request.attachmentId === attachmentId)
  if (attachmentId && !sharedAttachment) {
    try {
      await deleteRequestAttachment(attachmentId)
    } catch {
      // Keep request deletion available if browser file storage is unavailable.
    }
  }
  deleteRequest(item.id)
  if (selected.value?.id === item.id) selected.value = null
  deleting.value = null
}
</script>

<template>
  <section class="page-intro"><div><h1>My Requests</h1><p>View and track all your absence requests.</p></div><RouterLink to="/submit" class="primary-button compact-button">＋ New Request</RouterLink></section>
  <section class="panel requests-panel">
    <div class="request-toolbar"><div class="filter-tabs"><button v-for="filter in filters" :key="filter" :class="{ selected: activeFilter === filter }" @click="activeFilter = filter">{{ filter }} <span>{{ filter === 'All' ? state.requests.length : state.requests.filter(r => r.status === filter).length }}</span></button></div><label class="table-search"><span>⌕</span><input v-model="search" placeholder="Search requests..." aria-label="Search requests" /></label></div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>#</th><th>Reason</th><th>Subject / Course</th><th>Absence Dates</th><th>Submitted On</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>
          <tr v-for="(item, index) in filtered" :key="item.id">
            <td data-label="#">{{ index + 1 }}</td>
            <td data-label="Reason"><div class="table-reason"><span class="reason-dot" :class="item.status.toLowerCase()" aria-hidden="true">
              <svg v-if="reasonIconType(item.reason) === 'family'" viewBox="0 0 24 24"><circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0M14 14a4.5 4.5 0 0 1 6.5 4"/></svg>
              <svg v-else-if="reasonIconType(item.reason) === 'health'" viewBox="0 0 24 24"><path d="M20.5 8.8c0 5.1-8.5 10.2-8.5 10.2S3.5 13.9 3.5 8.8A4.3 4.3 0 0 1 12 7.2a4.3 4.3 0 0 1 8.5 1.6Z"/><path d="M5.5 12h3l1.5-2.5 2.2 5 1.5-2.5h4.8"/></svg>
              <svg v-else-if="reasonIconType(item.reason) === 'medical'" viewBox="0 0 24 24"><path d="M5.5 3.5h13A2.5 2.5 0 0 1 21 6v12a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 18V6a2.5 2.5 0 0 1 2.5-2.5Z"/><path d="M12 7v10M7 12h10"/></svg>
              <svg v-else-if="reasonIconType(item.reason) === 'personal'" viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0"/></svg>
              <svg v-else-if="reasonIconType(item.reason) === 'transportation'" viewBox="0 0 24 24"><path d="M3 7.5h11v10H3zM14 11h4l3 3v3h-7z"/><circle cx="7" cy="18" r="1.5"/><circle cx="18" cy="18" r="1.5"/><path d="M5.5 10h6M16 13h1.5"/></svg>
              <svg v-else-if="reasonIconType(item.reason) === 'school'" viewBox="0 0 24 24"><path d="m3 9 9-5 9 5M5 10v9m4-9v9m6-9v9m4-9v9M3 21h18M2 19h20"/></svg>
              <svg v-else viewBox="0 0 24 24"><path d="M7 4.5h7l5 5V18a1.5 1.5 0 0 1-1.5 1.5H7A1.5 1.5 0 0 1 5.5 18V6A1.5 1.5 0 0 1 7 4.5Z"/><path d="M14 4.5V10h5"/><path d="M8.5 14.5h7"/></svg>
            </span><strong>{{ item.reason }}</strong></div></td>
            <td data-label="Subject"><span class="subject-code">{{ item.subject || '—' }}</span></td>
            <td data-label="Absence dates">{{ dateRangeLabel(item) }}</td><td data-label="Submitted">{{ dateLabel(item.submitted) }}</td>
            <td data-label="Status"><span class="status-pill" :class="item.status.toLowerCase()">{{ item.status }}</span></td>
            <td data-label="Actions"><div class="action-buttons"><button title="View details" aria-label="View details" @click="selected = item">◉</button><button v-if="item.status === 'Pending'" title="Edit request" aria-label="Edit request" @click="beginEdit(item)">✎</button><button title="Delete request" aria-label="Delete request" class="delete-action" @click="remove(item)"><svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M3 5h10M6 5V3.5h4V5m2-1.5-.6 9.2a1 1 0 0 1-1 .9H5.6a1 1 0 0 1-1-.9L4 3.5m2.5 4v4m3-4v4" /></svg></button></div></td>
          </tr>
          <tr v-if="!filtered.length" class="empty-row"><td colspan="7" class="table-empty">No requests found. Try another filter or submit a new request.</td></tr>
        </tbody>
      </table>
    </div>
    <div class="table-footer">Showing {{ filtered.length }} of {{ state.requests.length }} requests <span>Stored locally in this browser</span></div>
  </section>

  <div v-if="selected" class="modal-backdrop" @click.self="selected = null">
    <section class="modal-card" role="dialog" aria-modal="true" aria-labelledby="detail-title">
      <button class="modal-close" aria-label="Close" @click="selected = null">×</button><h2 id="detail-title">Request Details</h2>
      <div class="detail-line"><span>Reason</span><strong>{{ selected.reason }}</strong></div><div class="detail-line"><span>Subject / course</span><strong>{{ selected.subject || 'Not specified' }}</strong></div><div class="detail-line"><span>Absence dates</span><strong>{{ dateRangeLabel(selected) }}</strong></div><div class="detail-line"><span>Submitted on</span><strong>{{ dateLabel(selected.submitted) }}</strong></div><div class="detail-line"><span>Status</span><span class="status-pill" :class="selected.status.toLowerCase()">{{ selected.status }}</span></div><div class="detail-line"><span>Details</span><strong>{{ selected.details || 'No additional details provided.' }}</strong></div>
      <div class="detail-line attachment-detail"><span>Attachment</span><div class="attachment-preview">
        <template v-if="selected.documentName">
          <img v-if="attachmentUrl && selected.documentName.match(/\.(jpe?g|png)$/i)" :src="attachmentUrl" :alt="selected.documentName" />
          <span v-else-if="attachmentError" class="attachment-message" role="status">{{ attachmentError }}</span>
          <a v-else-if="attachmentUrl" :href="attachmentUrl" :download="selected.documentName" target="_blank" rel="noopener">{{ selected.documentName }}</a>
          <span v-else class="attachment-message" role="status">Loading attachment…</span>
        </template>
        <span v-else class="attachment-message">No document attached</span>
      </div></div>
      <button class="primary-button modal-done" @click="selected = null">Done</button>
    </section>
  </div>

  <div v-if="editing !== null" class="modal-backdrop" @click.self="editing = null">
    <form class="modal-card" @submit.prevent="saveEdit(state.requests.find(r => r.id === editing))">
      <button type="button" class="modal-close" aria-label="Close" @click="editing = null">×</button>
      <h2>Edit Request</h2>
      <p class="modal-help">Update the details for this request. Status is preserved.</p>
      <label>Reason for Absence</label>
      <select v-model="editForm.reason" required><option>Medical Reason</option><option>Family Matter</option><option>Personal Reason</option><option>Sick Leave</option><option>School Activity</option><option>Transportation Issue</option><option>Other</option></select>
      <label>Subject / Course Code</label>
      <input v-model="editForm.subject" type="text" maxlength="40" placeholder="e.g. WS-301" required />
      <div class="form-grid absence-date-range">
        <div><label>Start Date</label><input v-model="editForm.dateStart" type="date" required /></div>
        <div><label>End Date <span class="optional">(optional)</span></label><input v-model="editForm.dateEnd" type="date" :min="editForm.dateStart || undefined" /></div>
      </div>
      <label>Additional Details</label>
      <textarea v-model="editForm.details" rows="3" maxlength="300"></textarea>
      <label for="edit-document">Supporting Document</label>
      <input id="edit-document" ref="editFileInput" type="file" accept=".pdf,.jpg,.jpeg,.png" @change="onEditFile" />
      <div class="edit-attachment-row"><span>{{ editDocumentName || 'No document attached' }}</span><button v-if="editDocumentName" type="button" class="secondary-button" @click="clearEditDocument">Remove</button></div>
      <p class="field-note">PDF, JPG, or PNG (max 5 MB). Select a file to replace the current document.</p>
      <p v-if="editError" class="form-message error-message" role="alert">{{ editError }}</p>
      <div class="form-actions"><button type="button" class="secondary-button" @click="editing = null">Cancel</button><button class="primary-button">Save Changes</button></div>
    </form>
  </div>
  <div v-if="deleting" class="modal-backdrop" @click.self="deleting = null">
    <section class="modal-card request-delete-dialog" role="alertdialog" aria-modal="true" aria-labelledby="delete-request-title" aria-describedby="delete-request-message">
      <h2 id="delete-request-title">Delete request?</h2>
      <p id="delete-request-message" class="modal-help">Are you sure you want to delete this request? This action cannot be undone.</p>
      <div class="form-actions">
        <button class="secondary-button" type="button" @click="deleting = null">Cancel</button>
        <button class="primary-button" type="button" @click="confirmDelete">Delete</button>
      </div>
    </section>
  </div>
</template>
