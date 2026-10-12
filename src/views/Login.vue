<script setup>
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { showAuthLoading, hideAuthLoading, signIn } from "../store";

const route = useRoute();
const router = useRouter();
const identifier = ref("");
const password = ref("");
const showPassword = ref(false);
const role = ref("student");
const error = ref("");

async function submit() {
  if (!identifier.value.trim() || !password.value) {
    error.value = `Enter your ${role.value === "student" ? "Student" : "Teacher"} ID and password.`;
    return;
  }

  if (!signIn(role.value, identifier.value, password.value)) {
    error.value = `Invalid ${role.value === "student" ? "Student" : "Teacher"} ID or password.`;
    return;
  }
  const signedInRole = role.value;
  showAuthLoading("Signing in...");
  await new Promise((resolve) => setTimeout(resolve, 2500));
  const redirect = route.query.redirect;
  const target =
    typeof redirect === "string" &&
    redirect.startsWith("/") &&
    !redirect.startsWith("//")
      ? redirect
      : signedInRole === "teacher"
        ? "/teacher/review"
        : "/dashboard";
  try {
    await router.replace(target);
  } finally {
    hideAuthLoading();
  }
}
</script>

<template>
  <main class="login-page">
    <section class="login-card">
      <RouterLink class="login-brand" to="/login" aria-label="Excuse sign in">
        <span class="brand-mark"><img src="/brand-icon.png" alt="" /></span>
        <span
          ><strong>e-Excuse</strong
          ><small>Student Absence Management</small></span
        >
      </RouterLink>

      <div class="login-heading">
        <p class="login-eyebrow">
          {{ role === "teacher" ? "TEACHER PORTAL" : "STUDENT PORTAL" }}
        </p>
        <h1>Welcome back</h1>
        <p>
          {{
            role === "teacher"
              ? "Sign in to review student absence requests."
              : "Sign in to manage and track your absence requests."
          }}
        </p>
      </div>

      <form @submit.prevent="submit">
        <span class="login-role-label">Sign in as</span>
        <div
          class="login-role-switch"
          :class="{ 'teacher-selected': role === 'teacher' }"
          role="group"
          aria-label="Sign in as"
        >
          <span class="login-role-slider" aria-hidden="true"></span>
          <button
            type="button"
            class="login-role-option"
            :class="{ active: role === 'student' }"
            :aria-pressed="role === 'student'"
            @click="role = 'student'"
          >
            Student
          </button>
          <button
            type="button"
            class="login-role-option"
            :class="{ active: role === 'teacher' }"
            :aria-pressed="role === 'teacher'"
            @click="role = 'teacher'"
          >
            Teacher
          </button>
        </div>

        <label for="login-identifier">{{
          role === "student" ? "Student ID" : "Teacher ID"
        }}</label>
        <input
          id="login-identifier"
          v-model="identifier"
          type="text"
          autocomplete="username"
          :placeholder="
            role === 'student'
              ? 'Enter your Student ID'
              : 'Enter your Teacher ID'
          "
          required
        />

        <label for="login-password">Password</label>
        <div class="password-input-wrap">
          <input
            id="login-password"
            v-model="password"
            class="login-password-input"
            :type="showPassword ? 'text' : 'password'"
            autocomplete="current-password"
            placeholder="Enter your password"
            required
          />
          <button
            class="password-visibility"
            type="button"
            :aria-label="showPassword ? 'Hide password' : 'Show password'"
            :aria-pressed="showPassword"
            @click="showPassword = !showPassword"
          >
            {{ showPassword ? "Hide" : "Show" }}
          </button>
        </div>

        <p v-if="error" class="form-message error-message" role="alert">
          {{ error }}
        </p>
        <button class="primary-button login-submit" type="submit">
          Sign in <span aria-hidden="true">→</span>
        </button>
      </form>
    </section>
  </main>
</template>
