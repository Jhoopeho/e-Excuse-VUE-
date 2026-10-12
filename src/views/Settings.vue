<script setup>
import { nextTick, ref } from "vue";
import { useRouter } from "vue-router";
import { auth, hideAuthLoading, showAuthLoading, signOut, state } from "../store";

const router = useRouter();
const active = ref("");
const saved = ref("");
const detailSection = ref(null);
const showLogoutConfirmation = ref(false);
const disabledOptions = ["notifications", "support"];
const options = [
  {
    id: "security",
    title: "Account",
    description: "Update your student information.",
  },
  {
    id: "notifications",
    title: "Notifications",
    description: "Notification settings are unavailable.",
  },
  {
    id: "appearance",
    title: "Appearance",
    description: "Light / Dark mode.",
  },
  {
    id: "support",
    title: "Help & Support",
    description: "Help and support are unavailable.",
  },
];
function toggle(key) {
  state.settings[key] = !state.settings[key];
  saved.value = "Preference updated.";
  setTimeout(() => (saved.value = ""), 1800);
}
async function selectOption(id) {
  if (disabledOptions.includes(id)) return;
  if (id === "security") {
    await router.push("/profile");
    return;
  }
  active.value = active.value === id ? "" : id;
  if (active.value) {
    await nextTick();
    detailSection.value?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }
}
async function confirmLogout() {
  signOut();
  showLogoutConfirmation.value = false;
  showAuthLoading("Signing out...");
  await new Promise((resolve) => setTimeout(resolve, 2500));
  try {
    await router.replace("/login");
  } finally {
    hideAuthLoading();
  }
}
</script>

<template>
  <template v-if="auth.role === 'teacher'">
    <section class="page-intro">
      <div>
        <h1>Settings</h1>
        <p>Manage your teacher session.</p>
      </div>
    </section>
    <button
      class="panel logout-row"
      type="button"
      @click="showLogoutConfirmation = true"
    >
      <span class="logout-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M13 4H6.5A1.5 1.5 0 0 0 5 5.5v13A1.5 1.5 0 0 0 6.5 20H13" /><path d="M10 12h9m-4-4 4 4-4 4" /></svg></span
      ><span
        ><strong>Log Out</strong
        ><small>Sign out of your current session.</small></span
      ><span class="setting-chevron">›</span>
    </button>
  </template>
  <template v-else>
  <section class="page-intro">
    <div>
      <h1>Settings</h1>
      <p>Manage your account preferences.</p>
    </div>
    <span class="breadcrumb">Dashboard <b>›</b> Settings</span>
  </section>
  <section class="settings-grid">
    <div v-for="item in options" :key="item.id" class="setting-entry">
      <button
        class="panel setting-card"
        :disabled="disabledOptions.includes(item.id)"
        :aria-disabled="disabledOptions.includes(item.id)"
        :aria-expanded="item.id === 'appearance' ? active === item.id : undefined"
        :aria-controls="item.id === 'appearance' ? 'settings-detail' : undefined"
        @click="selectOption(item.id)"
      >
        <span class="setting-icon" :class="item.id" aria-hidden="true">
          <svg v-if="item.id === 'security'" viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.5" /><path d="M5 20a7 7 0 0 1 14 0" /></svg>
          <svg v-else-if="item.id === 'notifications'" viewBox="0 0 24 24"><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></svg>
          <svg v-else-if="item.id === 'appearance'" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5" /><path d="M12 3.5a8.5 8.5 0 0 0 0 17Z" /></svg>
          <svg v-else viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M9.7 9a2.4 2.4 0 1 1 4.2 1.6c-1.1 1.1-1.9 1.5-1.9 3M12 17.5h.01" /></svg>
        </span
        ><span class="setting-copy"
          ><strong>{{ item.title }}</strong
          ><small>{{ item.description }}</small></span
        ><span class="setting-chevron">{{ active === item.id ? "⌄" : "›" }}</span>
      </button>
      <section
        v-if="item.id === 'appearance' && active === 'appearance'"
        id="settings-detail"
        ref="detailSection"
        class="panel settings-detail"
        role="region"
        aria-label="Appearance settings"
        tabindex="-1"
      >
        <h2>Appearance</h2>
        <p class="muted">Choose the visual theme for your dashboard.</p>
        <div class="setting-detail-row">
          <div>
            <strong>Dark mode</strong
            ><small>Switch between light and dark interface themes.</small>
          </div>
          <button
            class="toggle-switch"
            :class="{ on: state.settings.darkMode }"
            role="switch"
            :aria-checked="state.settings.darkMode"
            @click="toggle('darkMode')"
          >
            <span></span>
          </button>
        </div>
      </section>
    </div>
  </section>
  <p v-if="saved" class="form-message success-message">{{ saved }}</p>
  <button
    class="panel logout-row"
    type="button"
    @click="showLogoutConfirmation = true"
  >
    <span class="logout-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M13 4H6.5A1.5 1.5 0 0 0 5 5.5v13A1.5 1.5 0 0 0 6.5 20H13" /><path d="M10 12h9m-4-4 4 4-4 4" /></svg></span
    ><span
      ><strong>Log Out</strong
      ><small>Sign out of your current session.</small></span
    ><span class="setting-chevron">›</span>
  </button>
  <p class="settings-footnote">
    Excuse Student Absence Management System · Classroom demonstration project
  </p>
  </template>

  <div
    v-if="showLogoutConfirmation"
    class="modal-backdrop"
    @click.self="showLogoutConfirmation = false"
  >
    <section
      class="modal-card logout-confirm-dialog"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="logout-confirm-title"
      aria-describedby="logout-confirm-message"
    >
      <h2 id="logout-confirm-title">Log out?</h2>
      <p id="logout-confirm-message" class="modal-help">
        Are you sure you want to log out of your account?
      </p>
      <div class="form-actions">
        <button
          class="secondary-button"
          type="button"
          @click="showLogoutConfirmation = false"
        >
          Cancel
        </button>
        <button class="primary-button" type="button" @click="confirmLogout">
          Log Out
        </button>
      </div>
    </section>
  </div>
</template>
