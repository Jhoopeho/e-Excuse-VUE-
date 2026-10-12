<script setup>
import { computed } from "vue";
import { useRoute, RouterLink, RouterView } from "vue-router";
import { auth, authTransition, state } from "./store";

const route = useRoute();
const title = computed(() => route.meta.title || "Dashboard");
const nav = computed(() =>
  auth.role === "teacher"
    ? [
        { label: "Review Requests", to: "/teacher/review", icon: "todo" },
        { label: "Settings", to: "/teacher/settings", icon: "settings" },
      ]
    : [
        { label: "Dashboard", to: "/dashboard", icon: "home" },
        { label: "Submit Excuse", to: "/submit", icon: "document" },
        { label: "My Requests", to: "/requests", icon: "requests" },
        { label: "Settings", to: "/settings", icon: "settings" },
      ],
);
</script>

<template>
  <div v-if="route.name === 'login'">
    <RouterView />
  </div>
  <div
    v-else
    class="app-shell"
    :class="{ 'dark-mode': state.settings.darkMode }"
  >
    <aside class="sidebar">
      <RouterLink class="brand" :to="auth.role === 'teacher' ? '/teacher/review' : '/dashboard'" aria-label="Excuse dashboard">
        <span class="brand-mark"><img src="/brand-icon.png" alt="" /></span>
        <span
          ><strong>e-Excuse</strong
          ><small>Student Absence<br />Management System</small></span
        >
      </RouterLink>

      <nav class="main-nav" aria-label="Main navigation">
        <RouterLink
          v-for="item in nav"
          :key="item.to"
          :to="item.to"
          class="nav-link"
          :class="{ active: route.path === item.to }"
        >
          <span class="nav-icon">
            <svg v-if="item.icon === 'settings'" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M19.14 12.94a7.49 7.49 0 0 0 0-1.88l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.28 7.28 0 0 0-1.63-.94l-.36-2.54a.48.48 0 0 0-.49-.41h-3.84a.48.48 0 0 0-.49.41l-.36 2.54c-.59.23-1.13.55-1.63.94l-2.39-.96a.5.5 0 0 0-.6.22L2.67 8.84a.5.5 0 0 0 .12.64l2.03 1.58a7.49 7.49 0 0 0 0 1.88l-2.03 1.58a.5.5 0 0 0-.12.64l1.92 3.32c.12.21.37.3.6.22l2.39-.96c.5.39 1.04.71 1.63.94l.36 2.54c.04.24.25.41.49.41h3.84c.24 0 .45-.17.49-.41l.36-2.54c.59-.23 1.13-.55 1.63-.94l2.39.96c.23.09.48-.01.6-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58Z" />
              <circle cx="12" cy="12" r="3.5" />
            </svg>
            <svg v-else-if="item.icon === 'document'" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M7 3.5h6.5L18.5 9v11.5A1.5 1.5 0 0 1 17 22H7a1.5 1.5 0 0 1-1.5-1.5V5A1.5 1.5 0 0 1 7 3.5Z" />
              <path d="M13.5 3.5V9h5M8.5 13h7M8.5 16.5h7" />
            </svg>
            <svg v-else-if="item.icon === 'requests'" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="m3.5 6.5 1.5 1.5 2.5-2.5M10 7h10M3.5 12.5 5 14l2.5-2.5M10 13h10M3.5 18.5 5 20l2.5-2.5M10 19h10" />
            </svg>
            <svg v-else-if="item.icon === 'home'" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="m3 10.5 9-7 9 7M5.5 9v11h13V9M9.5 20v-6h5v6" />
            </svg>
            <svg v-else-if="item.icon === 'todo'" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M9 6.5h11M9 12h11M9 17.5h11" />
              <path d="M4 6.5l1.2 1.2 2.3-2.7M4 12l1.2 1.2 2.3-2.7M4 17.5l1.2 1.2 2.3-2.7" />
            </svg>
            <template v-else>{{ item.icon }}</template>
          </span
          ><span>{{ item.label }}</span>
        </RouterLink>
      </nav>

      <RouterLink v-if="auth.role === 'student'" class="sidebar-user" to="/profile">
        <span class="user-copy"
          ><strong>{{ auth.role === 'teacher' ? 'Teacher' : state.profile.fullName }}</strong
          ><small>{{ auth.role === 'teacher' ? 'Request reviewer' : `${state.profile.course} Student` }}</small></span
        >
        <span class="chevron">›</span>
      </RouterLink>
    </aside>

    <main class="main-area">
      <header class="topbar">
        <div class="topbar-right">
          <span
            v-if="auth.role === 'student'"
            class="icon-button notification"
            role="img"
            aria-label="Notifications"
          >
            <svg class="notification-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></svg><i v-if="state.settings.notifications"></i>
          </span>
          <RouterLink v-if="auth.role === 'student'" class="top-user" to="/profile"
            ><span class="mini-avatar">{{
              state.profile.fullName.slice(0, 1)
            }}</span></RouterLink
          >
        </div>
      </header>

      <div class="page-content">
        <div class="mobile-page-title">{{ title }}</div>
        <RouterView />
      </div>
    </main>
  </div>
  <div v-if="authTransition.active" class="auth-loading-screen" role="status" aria-live="polite" aria-busy="true">
    <div class="auth-loading-content">
      <img class="auth-loading-logo" src="/brand-icon.png" alt="e-Excuse logo" />
      <strong>e-Excuse</strong>
      <span class="auth-loading-spinner" aria-hidden="true"></span>
      <p>{{ authTransition.message }}</p>
    </div>
  </div>
</template>
