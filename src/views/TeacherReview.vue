<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { deleteTeacherRequest, getRequestAttachment, state, updateRequest } from '../store'

const activeFilter = ref('Pending')
const selectedRequest = ref(null)
const attachmentUrls = ref({})
const attachmentTypes = ref({})
const attachmentObjectUrls = new Map()
const attachmentTypesById = new Map()
const teacherRequests = computed(() => state.requests.filter(request => !request.teacherDeleted))
const filters = ['All', 'Pending', 'Approved', 'Rejected']
const visibleRequests = computed(() => teacherRequests.value.filter(request =>
  activeFilter.value === 'All' || request.status === activeFilter.value
))
const pendingCount = computed(() => teacherRequests.value.filter(request => request.status === 'Pending').length)

onMounted(async () => {
  const attachmentIds = [...new Set(state.requests.map(request => request.attachmentId).filter(Boolean))]
  await Promise.all(attachmentIds.map(async id => {
    try {
      const file = await getRequestAttachment(id)
      if (file) {
        attachmentObjectUrls.set(id, URL.createObjectURL(file))
        attachmentTypesById.set(id, file.type)
      }
    } catch {
      // Older demo requests may only have a saved filename.
    }
  }))
  state.requests.forEach(request => {
    const url = attachmentObjectUrls.get(request.attachmentId)
    if (!url) return
    attachmentUrls.value[request.id] = url
    attachmentTypes.value[request.id] = attachmentTypesById.get(request.attachmentId) || ''
  })
})

onBeforeUnmount(() => {
  attachmentObjectUrls.forEach(url => URL.revokeObjectURL(url))
})

function dateLabel(value) {
  return value ? new Date(`${value}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'
}

function submittedAtLabel(request) {
  if (!request.submittedAt) return 'Time unavailable'
  const submittedAt = new Date(request.submittedAt)
  return Number.isNaN(submittedAt.getTime())
    ? 'Time unavailable'
    : submittedAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function dateRangeLabel(request) {
  const start = request.dateStart || request.date
  const end = request.dateEnd || request.date
  return !end || start === end ? dateLabel(start) : `${dateLabel(start)} – ${dateLabel(end)}`
}

function isImageAttachment(request) {
  return attachmentTypes.value[request.id]?.startsWith('image/') || false
}

function reviewRequest(request, status) {
  updateRequest(request.id, { status })
}

function reviewSelectedRequest(status) {
  if (!selectedRequest.value) return
  reviewRequest(selectedRequest.value, status)
}

function deleteReviewedRequest(request) {
  if (!request || request.status === 'Pending') return
  deleteTeacherRequest(request.id)
  if (selectedRequest.value?.id === request.id) selectedRequest.value = null
}

</script>

<template>
  <section class="page-intro teacher-page-intro">
    <div>
      <h1>Review Requests</h1>
      <p>Review student absence excuses and record your decision.</p>
    </div>
    <span class="teacher-pending-count">{{ pendingCount }} pending</span>
  </section>

  <section class="panel requests-panel teacher-review-panel">
    <div class="request-toolbar">
      <div class="filter-tabs" aria-label="Filter requests">
        <button v-for="filter in filters" :key="filter" :class="{ selected: activeFilter === filter }" @click="activeFilter = filter">
          {{ filter }} <span>{{ filter === 'All' ? teacherRequests.length : teacherRequests.filter(request => request.status === filter).length }}</span>
        </button>
      </div>
    </div>

    <div v-if="visibleRequests.length" class="teacher-request-list">
      <article v-for="request in visibleRequests" :key="request.id" class="teacher-request-card">
        <div class="teacher-card-heading">
          <div class="student-cell">
            <strong>{{ request.studentName || state.profile.fullName }}</strong>
            <small>Course: {{ request.course || state.profile.course }} · Year: {{ request.yearLevel || state.profile.yearLevel }}</small>
          </div>
          <span class="status-pill" :class="request.status.toLowerCase()">{{ request.status }}</span>
        </div>
        <div class="teacher-card-facts">
          <div><span>Subject</span><strong>{{ request.subject || 'Subject not specified' }}</strong></div>
        </div>
        <div class="teacher-card-actions">
          <button class="teacher-details-button" type="button" @click="selectedRequest = request">View full details</button>
          <div v-if="request.status === 'Pending'" class="teacher-review-actions">
            <button class="approve-button" :aria-label="`Approve ${request.reason} request`" @click="reviewRequest(request, 'Approved')">Approve</button>
            <button class="reject-button" :aria-label="`Reject ${request.reason} request`" @click="reviewRequest(request, 'Rejected')">Reject</button>
          </div>
          <button v-else class="teacher-delete-action" type="button" :title="`Delete ${request.status.toLowerCase()} request from review`" :aria-label="`Delete ${request.status.toLowerCase()} request from review`" @click="deleteReviewedRequest(request)"><svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M3 5h10M6 5V3.5h4V5m2-1.5-.6 9.2a1 1 0 0 1-1 .9H5.6a1 1 0 0 1-1-.9L4 3.5m2.5 4v4m3-4v4" /></svg></button>
        </div>
      </article>
    </div>
    <div v-else class="table-empty">No {{ activeFilter.toLowerCase() }} requests to show.</div>

  </section>

  <div v-if="selectedRequest" class="modal-backdrop" @click.self="selectedRequest = null">
    <section class="modal-card teacher-request-dialog" role="dialog" aria-modal="true" aria-labelledby="teacher-request-title">
      <button class="modal-close" type="button" aria-label="Close request details" @click="selectedRequest = null">×</button>
      <h2 id="teacher-request-title">Request Details</h2>
      <div class="detail-line"><span>Student</span><strong>{{ selectedRequest.studentName || state.profile.fullName }} ({{ selectedRequest.studentId || state.profile.studentId }})</strong></div>
      <div class="detail-line"><span>Reason</span><strong>{{ selectedRequest.reason }}</strong></div>
      <div class="detail-line"><span>Subject / course</span><strong>{{ selectedRequest.subject || 'Not specified' }}</strong></div>
      <div class="detail-line"><span>Absence dates</span><strong>{{ dateRangeLabel(selectedRequest) }}</strong></div>
      <div class="detail-line"><span>Submitted on</span><strong>{{ dateLabel(selectedRequest.submitted) }} at {{ submittedAtLabel(selectedRequest) }}</strong></div>
      <div class="teacher-request-description"><span>About this request</span><p>{{ selectedRequest.details || 'No additional details provided.' }}</p></div>
      <div v-if="selectedRequest.documentName" class="teacher-request-document">
        <strong>Supporting document</strong>
        <a v-if="attachmentUrls[selectedRequest.id]" :href="attachmentUrls[selectedRequest.id]" target="_blank" rel="noopener noreferrer">
          <img v-if="isImageAttachment(selectedRequest)" class="teacher-request-image" :src="attachmentUrls[selectedRequest.id]" :alt="`Supporting document for ${selectedRequest.subject || selectedRequest.reason}`" />
          <span>View {{ selectedRequest.documentName }}</span>
        </a>
        <p v-else>{{ selectedRequest.documentName }} (file unavailable)</p>
      </div>
      <div class="teacher-dialog-actions">
        <template v-if="selectedRequest.status === 'Pending'">
          <button class="reject-button" type="button" @click="reviewSelectedRequest('Rejected')">Reject request</button>
          <button class="approve-button" type="button" @click="reviewSelectedRequest('Approved')">Approve request</button>
        </template>
        <button v-else class="teacher-delete-action" type="button" :title="`Delete ${selectedRequest.status.toLowerCase()} request from review`" :aria-label="`Delete ${selectedRequest.status.toLowerCase()} request from review`" @click="deleteReviewedRequest(selectedRequest)"><svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M3 5h10M6 5V3.5h4V5m2-1.5-.6 9.2a1 1 0 0 1-1 .9H5.6a1 1 0 0 1-1-.9L4 3.5m2.5 4v4m3-4v4" /></svg></button>
      </div>
    </section>
  </div>

</template>
