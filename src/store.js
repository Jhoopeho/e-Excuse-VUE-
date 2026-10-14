import { reactive, watch } from 'vue'

const starterRequests = [
  { id: 1, reason: 'Medical Reason', date: '2025-09-25', submitted: '2025-09-24', details: 'Medical appointment.', status: 'Approved', documentName: '' },
  { id: 2, reason: 'Family Matter', date: '2025-09-22', submitted: '2025-09-21', details: 'Important family matter.', status: 'Pending', documentName: '' },
  { id: 3, reason: 'Personal Reason', date: '2025-09-15', submitted: '2025-09-14', details: 'Personal appointment.', status: 'Approved', documentName: '' },
  { id: 4, reason: 'Sick Leave', date: '2025-09-10', submitted: '2025-09-09', details: 'Was not feeling well.', status: 'Rejected', documentName: '' },
]

function read(key, fallback) {
  try {
    const saved = localStorage.getItem(key)
    return saved ? JSON.parse(saved) : fallback
  } catch {
    return fallback
  }
}

export const state = reactive({
  requests: read('excuse-requests', starterRequests),
  profile: read('excuse-profile', {
    fullName: 'Hope John Bagaipo',
    studentId: '15749-1T4',
    course: 'BSIT',
    yearLevel: '1st Year',
    email: 'hopejohn@example.com',
  }),
  settings: read('excuse-settings', {
    notifications: true,
    emailUpdates: true,
    darkMode: false,
  }),
})

const loginAccounts = {
  student: { id: '676767', password: '676767' },
  teacher: { id: '12345', password: '12345' },
}
const savedRole = sessionStorage.getItem('excuse-role')
const savedId = sessionStorage.getItem('excuse-user-id')
const savedSessionIsValid = sessionStorage.getItem('excuse-authenticated') === 'true' &&
  loginAccounts[savedRole]?.id === savedId
if (!savedSessionIsValid) {
  sessionStorage.removeItem('excuse-authenticated')
  sessionStorage.removeItem('excuse-role')
  sessionStorage.removeItem('excuse-user-id')
}

export const auth = reactive({
  authenticated: savedSessionIsValid,
  role: savedSessionIsValid ? savedRole : 'student',
})

export const authTransition = reactive({ active: false, message: '' })

export function showAuthLoading(message) {
  authTransition.message = message
  authTransition.active = true
}

export function hideAuthLoading() {
  authTransition.active = false
  authTransition.message = ''
}

const attachmentDatabase = 'excuse-attachments'
const attachmentStore = 'files'

function openAttachmentDatabase() {
  return new Promise((resolve, reject) => {
    if (!globalThis.indexedDB) {
      reject(new Error('Browser file storage is unavailable.'))
      return
    }
    const request = indexedDB.open(attachmentDatabase, 1)
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(attachmentStore)) {
        request.result.createObjectStore(attachmentStore)
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error || new Error('Unable to open file storage.'))
  })
}

export async function saveRequestAttachment(id, file) {
  const db = await openAttachmentDatabase()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(attachmentStore, 'readwrite')
    transaction.objectStore(attachmentStore).put(file, String(id))
    transaction.oncomplete = () => { db.close(); resolve() }
    transaction.onerror = () => { db.close(); reject(transaction.error || new Error('Unable to save attachment.')) }
    transaction.onabort = () => { db.close(); reject(transaction.error || new Error('Unable to save attachment.')) }
  })
}

export async function deleteRequestAttachment(id) {
  const db = await openAttachmentDatabase()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(attachmentStore, 'readwrite')
    transaction.objectStore(attachmentStore).delete(String(id))
    transaction.oncomplete = () => { db.close(); resolve() }
    transaction.onerror = () => { db.close(); reject(transaction.error || new Error('Unable to remove attachment.')) }
    transaction.onabort = () => { db.close(); reject(transaction.error || new Error('Unable to remove attachment.')) }
  })
}

export async function getRequestAttachment(id) {
  const db = await openAttachmentDatabase()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(attachmentStore, 'readonly')
    const request = transaction.objectStore(attachmentStore).get(String(id))
    request.onsuccess = () => { db.close(); resolve(request.result || null) }
    request.onerror = () => { db.close(); reject(request.error || new Error('Unable to read attachment.')) }
  })
}

watch(() => state.requests, value => localStorage.setItem('excuse-requests', JSON.stringify(value)), { deep: true })
watch(() => state.profile, value => localStorage.setItem('excuse-profile', JSON.stringify(value)), { deep: true })
watch(() => state.settings, value => localStorage.setItem('excuse-settings', JSON.stringify(value)), { deep: true })

export function signIn(role, identifier, password) {
  const account = loginAccounts[role]
  if (!account || account.id !== String(identifier).trim() || account.password !== password) return false
  sessionStorage.setItem('excuse-authenticated', 'true')
  sessionStorage.setItem('excuse-role', role)
  sessionStorage.setItem('excuse-user-id', account.id)
  auth.authenticated = true
  auth.role = role
  if (role === 'student') state.profile.studentId = account.id
  return true
}

export function signOut() {
  sessionStorage.removeItem('excuse-authenticated')
  sessionStorage.removeItem('excuse-role')
  sessionStorage.removeItem('excuse-user-id')
  auth.authenticated = false
  auth.role = 'student'
}

function nextRequestId() {
  const largestId = state.requests.reduce((largest, item) => Math.max(largest, Number(item.id) || 0), 0)
  return Math.max(Date.now(), largestId + 1)
}

export function addRequest(payload) {
  const dateStart = payload.dateStart || payload.date
  const dateEnd = payload.dateEnd || payload.date || dateStart
  const subject = payload.subject?.trim() || ''
  if (hasRequestConflict(subject, dateStart, dateEnd)) return null
  const today = new Date()
  const submitted = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  state.requests.unshift({
    id: nextRequestId(),
    studentName: state.profile.fullName,
    studentId: state.profile.studentId,
    course: state.profile.course,
    yearLevel: state.profile.yearLevel,
    reason: payload.reason,
    subject,
    date: dateStart,
    dateStart,
    dateEnd,
    submitted,
    submittedAt: new Date().toISOString(),
    details: payload.details.trim(),
    status: 'Pending',
    documentName: payload.documentName || '',
    attachmentId: payload.attachmentId || '',
  })
  return state.requests[0].id
}

function requestDatesOverlap(request, dateStart, dateEnd) {
  const existingStart = request.dateStart || request.date
  const existingEnd = request.dateEnd || request.date
  return existingStart <= dateEnd && dateStart <= existingEnd
}

export function hasRequestConflict(subject, dateStart, dateEnd = dateStart, excludeId = null) {
  const normalizedSubject = subject.trim().toLowerCase()
  if (!normalizedSubject || !dateStart || !dateEnd) return false
  return state.requests.some(request =>
    request.id !== excludeId &&
    (request.subject || '').trim().toLowerCase() === normalizedSubject &&
    requestDatesOverlap(request, dateStart, dateEnd)
  )
}

export function updateRequest(id, changes) {
  const request = state.requests.find(item => item.id === id)
  if (request) Object.assign(request, changes)
}

export function deleteStudentRequest(id) {
  const request = state.requests.find(item => item.id === id)
  if (request) request.studentDeleted = true
}

export function deleteTeacherRequest(id) {
  const request = state.requests.find(item => item.id === id)
  if (request && request.status !== 'Pending') request.teacherDeleted = true
}
