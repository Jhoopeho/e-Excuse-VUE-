<script setup>
import { reactive, ref } from "vue";
import { state } from "../store";

const form = reactive({ ...state.profile });
const message = ref("");
function saveProfile() {
  if (
    !form.fullName.trim() ||
    !form.email.trim() ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)
  ) {
    message.value = "Enter a full name and a valid email address.";
    return;
  }
  Object.assign(state.profile, form);
  message.value = "Profile changes saved successfully.";
}
</script>

<template>
  <section class="page-intro">
    <div>
      <h1>Profile</h1>
      <p>Update your student information. Passwords cannot be changed here.</p>
    </div>
    <span class="breadcrumb">Dashboard <b>›</b> Profile</span>
  </section>
  <section class="profile-layout">
    <article class="panel profile-card">
      <div class="profile-cover"></div>
      <div class="profile-avatar">
        {{
          state.profile.fullName
            .split(" ")
            .map((p) => p[0])
            .slice(0, 2)
            .join("")
        }}<span>✓</span>
      </div>
      <h2>{{ state.profile.fullName }}</h2>
      <p class="muted">{{ state.profile.course }} Student</p>
      <div class="profile-facts">
        <div>
          <span>▣</span><small>Student ID</small
          ><strong>{{ state.profile.studentId }}</strong>
        </div>
        <div>
          <span>▱</span><small>Course</small
          ><strong>{{ state.profile.course }}</strong>
        </div>
        <div>
          <span>▦</span><small>Year Level</small
          ><strong>{{ state.profile.yearLevel }}</strong>
        </div>
        <div>
          <span>✉</span><small>Email</small
          ><strong>{{ state.profile.email }}</strong>
        </div>
      </div>
    </article>
    <article class="panel edit-profile-panel">
      <div class="panel-heading">
        <div>
          <h3>Edit Profile</h3>
          <p>Keep your student information up to date.</p>
        </div>
      </div>
      <form @submit.prevent="saveProfile">
        <div class="form-grid">
          <div>
            <label for="fullName">Full Name</label
            ><input id="fullName" v-model="form.fullName" required />
          </div>
          <div>
            <label for="studentId">Student ID</label
            ><input id="studentId" v-model="form.studentId" disabled />
          </div>
          <div>
            <label for="course">Course</label
            ><select id="course" v-model="form.course">
              <option>BSIT</option>
              <option>BSCS</option>
              <option>BSIS</option>
              <option>Other</option>
            </select>
          </div>
          <div>
            <label for="yearLevel">Year Level</label
            ><select id="yearLevel" v-model="form.yearLevel">
              <option>1st Year</option>
              <option>2nd Year</option>
              <option>3rd Year</option>
              <option>4th Year</option>
            </select>
          </div>
          <div class="full-span">
            <label for="email">Email Address</label
            ><input id="email" v-model="form.email" type="email" required />
          </div>
        </div>
        <p
          v-if="message"
          class="form-message"
          :class="
            message.includes('successfully')
              ? 'success-message'
              : 'error-message'
          "
        >
          {{ message }}
        </p>
        <button class="primary-button save-profile">
          ▣ &nbsp; Save Changes
        </button>
      </form>
    </article>
  </section>
</template>
