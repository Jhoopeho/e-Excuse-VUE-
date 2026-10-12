import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import Dashboard from './views/Dashboard.vue'
import SubmitExcuse from './views/SubmitExcuse.vue'
import MyRequests from './views/MyRequests.vue'
import Profile from './views/Profile.vue'
import Settings from './views/Settings.vue'
import Login from './views/Login.vue'
import TeacherReview from './views/TeacherReview.vue'
import { auth } from './store'
import './style.css'

const routes = [
  { path: '/', redirect: '/dashboard' },
  { path: '/login', name: 'login', component: Login, meta: { title: 'Sign in' } },
  { path: '/dashboard', component: Dashboard, meta: { title: 'Dashboard', requiresAuth: true, requiresStudent: true } },
  { path: '/submit', component: SubmitExcuse, meta: { title: 'Submit Excuse', requiresAuth: true, requiresStudent: true } },
  { path: '/requests', component: MyRequests, meta: { title: 'My Requests', requiresAuth: true, requiresStudent: true } },
  { path: '/profile', component: Profile, meta: { title: 'Profile', requiresAuth: true, requiresStudent: true } },
  { path: '/settings', component: Settings, meta: { title: 'Settings', requiresAuth: true, requiresStudent: true } },
  { path: '/teacher/review', component: TeacherReview, meta: { title: 'Review Requests', requiresAuth: true, requiresTeacher: true } },
  { path: '/teacher/settings', component: Settings, meta: { title: 'Settings', requiresAuth: true, requiresTeacher: true } },
  { path: '/:pathMatch(.*)*', redirect: '/dashboard' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() { return { top: 0 } },
})

router.beforeEach(to => {
  if (to.meta.requiresAuth && !auth.authenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (auth.authenticated && auth.role === 'teacher' && to.meta.requiresStudent) {
    return '/teacher/review'
  }
  if (auth.authenticated && auth.role === 'student' && to.meta.requiresTeacher) {
    return '/dashboard'
  }
  if (to.name === 'login' && auth.authenticated) {
    return auth.role === 'teacher' ? '/teacher/review' : '/dashboard'
  }
})

createApp(App).use(router).mount('#app')
