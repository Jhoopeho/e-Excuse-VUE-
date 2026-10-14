<script setup>
import { computed } from "vue";
import { RouterLink } from "vue-router";
import { state } from "../store";

const total = computed(() => studentRequests.value.length);
const studentRequests = computed(() => state.requests.filter((r) => !r.studentDeleted));
const visibleCount = computed(() => studentRequests.value.length);
const approved = computed(
  () => studentRequests.value.filter((r) => r.status === "Approved").length,
);
const pending = computed(
  () => studentRequests.value.filter((r) => r.status === "Pending").length,
);
const rejected = computed(
  () => studentRequests.value.filter((r) => r.status === "Rejected").length,
);
const recent = computed(() => [...studentRequests.value].slice(0, 4));
const percent = computed(() =>
  visibleCount.value ? Math.round((approved.value / visibleCount.value) * 100) : 0,
);
function dateRangeLabel(item) {
  const start = item.dateStart || item.date;
  const end = item.dateEnd || item.date;
  return !end || start === end
    ? dateLabel(start)
    : `${dateLabel(start)} – ${dateLabel(end)}`;
}
function dateLabel(value) {
  if (!value) return "—";
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
function reasonIconType(reason) {
  const normalizedReason = reason.toLowerCase();
  if (normalizedReason.includes("family")) return "family";
  if (normalizedReason.includes("sick") || normalizedReason.includes("health"))
    return "health";
  if (normalizedReason.includes("medical")) return "medical";
  if (normalizedReason.includes("personal")) return "personal";
  if (normalizedReason.includes("transport")) return "transportation";
  if (normalizedReason.includes("school")) return "school";
  return "default";
}
</script>

<template>
  <section class="welcome-row">
    <div>
      <h1>
        Good morning,<br class="small-break" />
        {{ state.profile.fullName.split(" ")[0] }}!
      </h1>
      <p>Stay responsible, your excuses matter.</p>
    </div>
  </section>

  <section class="hero-banner">
    <div class="hero-copy">
      <span class="eyebrow">WELCOME TO e-EXCUSE</span>
      <h2>Manage Your Absences Easily</h2>
      <p>
        Submit and track your absence excuses, provide supporting<br
          class="desktop-break"
        />
        documents, and stay updated—all in one place.
      </p>
      <RouterLink to="/submit" class="hero-button"
        ><span class="document-icon" aria-hidden="true"
          ><svg viewBox="0 0 24 24">
            <path
              d="M7 3.5h6.5L18.5 9v11.5a1.5 1.5 0 0 1-1.5 1.5H7A1.5 1.5 0 0 1 5.5 20.5V5A1.5 1.5 0 0 1 7 3.5Z"
            />
            <path d="M13.5 3.5V9h5.5" />
            <path d="M8 13.5h8M8 17h8" /></svg
        ></span>
        Submit an Excuse <b>›</b></RouterLink
      >
    </div>
    <div class="hero-art" aria-hidden="true">
      <img class="hero-art-image" src="/dashboard-hero.svg" alt="" />
    </div>
  </section>

  <section class="stats-grid">
    <article class="stat-card">
      <span class="stat-icon blue document-icon" aria-hidden="true"
        ><svg viewBox="0 0 24 24">
          <path
            d="M7 3.5h6.5L18.5 9v11.5a1.5 1.5 0 0 1-1.5 1.5H7A1.5 1.5 0 0 1 5.5 20.5V5A1.5 1.5 0 0 1 7 3.5Z"
          />
          <path d="M13.5 3.5V9h5.5" />
          <path d="M8 13.5h8M8 17h8" /></svg
      ></span>
      <div>
        <small>Total Requests</small><strong>{{ total }}</strong>
      </div>
      <span class="stat-chip blue-chip">↗</span>
    </article>
    <article class="stat-card">
      <span class="stat-icon amber" aria-hidden="true"
        ><svg viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 7v5l3.5 2.5" /></svg
      ></span>
      <div>
        <small>Pending</small><strong>{{ pending }}</strong>
      </div>
      <span class="stat-chip amber-chip"
        >{{ total ? Math.round((pending / total) * 100) : 0 }}%</span
      >
    </article>
    <article class="stat-card">
      <span class="stat-icon green" aria-hidden="true"
        ><svg viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="8.5" />
          <path d="M8.5 12.5l2.5 2.5 5-6" /></svg
      ></span>
      <div>
        <small>Approved</small><strong>{{ approved }}</strong>
      </div>
      <span class="stat-chip green-chip">{{ percent }}%</span>
    </article>
    <article class="stat-card">
      <span class="stat-icon red" aria-hidden="true"
        ><svg viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="8.5" />
          <path d="m9 9 6 6m0-6-6 6" /></svg
      ></span>
      <div>
        <small>Rejected</small><strong>{{ rejected }}</strong>
      </div>
      <span class="stat-chip red-chip"
        >{{ total ? Math.round((rejected / total) * 100) : 0 }}%</span
      >
    </article>
  </section>

  <section class="dashboard-columns">
    <article class="panel activity-panel">
      <div class="panel-heading">
        <div>
          <h3>Recent Activity</h3>
          <p>Your latest absence requests</p>
        </div>
        <RouterLink to="/requests" class="text-link"
          >View All <span>›</span></RouterLink
        >
      </div>
      <div v-if="recent.length" class="activity-list">
        <div
          v-for="(item, index) in recent"
          :key="item.id"
          class="activity-row"
        >
          <span
            class="reason-icon"
            :class="['green', 'amber', 'blue', 'red'][index % 4]"
            aria-hidden="true"
          >
            <svg
              v-if="reasonIconType(item.reason) === 'family'"
              viewBox="0 0 24 24"
            >
              <circle cx="9" cy="8" r="3" />
              <circle cx="17" cy="9" r="2.5" />
              <path d="M3.5 19a5.5 5.5 0 0 1 11 0M14 14a4.5 4.5 0 0 1 6.5 4" />
            </svg>
            <svg
              v-else-if="reasonIconType(item.reason) === 'health'"
              viewBox="0 0 24 24"
            >
              <path
                d="M20.5 8.8c0 5.1-8.5 10.2-8.5 10.2S3.5 13.9 3.5 8.8A4.3 4.3 0 0 1 12 7.2a4.3 4.3 0 0 1 8.5 1.6Z"
              />
              <path d="M5.5 12h3l1.5-2.5 2.2 5 1.5-2.5h4.8" />
            </svg>
            <svg
              v-else-if="reasonIconType(item.reason) === 'medical'"
              viewBox="0 0 24 24"
            >
              <path
                d="M5.5 3.5h13A2.5 2.5 0 0 1 21 6v12a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 18V6a2.5 2.5 0 0 1 2.5-2.5Z"
              />
              <path d="M12 7v10M7 12h10" />
            </svg>
            <svg
              v-else-if="reasonIconType(item.reason) === 'personal'"
              viewBox="0 0 24 24"
            >
              <circle cx="12" cy="8" r="3.5" />
              <path d="M5 20a7 7 0 0 1 14 0" />
            </svg>
            <svg
              v-else-if="reasonIconType(item.reason) === 'transportation'"
              viewBox="0 0 24 24"
            >
              <path d="M3 7.5h11v10H3zM14 11h4l3 3v3h-7z" />
              <circle cx="7" cy="18" r="1.5" />
              <circle cx="18" cy="18" r="1.5" />
              <path d="M5.5 10h6M16 13h1.5" />
            </svg>
            <svg
              v-else-if="reasonIconType(item.reason) === 'school'"
              viewBox="0 0 24 24"
            >
              <path d="m3 9 9-5 9 5M5 10v9m4-9v9m6-9v9m4-9v9M3 21h18M2 19h20" />
            </svg>
            <svg v-else viewBox="0 0 24 24">
              <path
                d="M7 4.5h7l5 5V18a1.5 1.5 0 0 1-1.5 1.5H7A1.5 1.5 0 0 1 5.5 18V6A1.5 1.5 0 0 1 7 4.5Z"
              />
              <path d="M14 4.5V10h5" />
              <path d="M8.5 14.5h7" />
            </svg>
          </span>
          <div class="activity-copy">
            <strong>{{ item.reason }}</strong
            ><small
              >{{ dateRangeLabel(item) }} <span>•</span>
              {{ item.status }}</small
            >
          </div>
          <span class="status-pill" :class="item.status.toLowerCase()">{{
            item.status
          }}</span>
          <RouterLink
            class="row-arrow"
            :to="{ path: '/requests', query: { selected: item.id } }"
            :aria-label="`View ${item.reason}`"
            >›</RouterLink
          >
        </div>
      </div>
      <div v-else class="empty-state">
        No requests yet. Submit your first excuse to get started.
      </div>
    </article>

    <div class="right-column">
      <article class="panel overview-panel">
        <div class="panel-heading">
          <h3>Request Status Overview</h3>
          <span class="month-chip">All time⌄</span>
        </div>
        <div
          v-for="status in ['Approved', 'Pending', 'Rejected']"
          :key="status"
          class="progress-row"
        >
          <span>{{ status }}</span>
          <div class="progress-track">
            <i
              :class="status.toLowerCase()"
              :style="{
                width:
                  (total
                    ? (studentRequests.filter((r) => r.status === status)
                        .length /
                        total) *
                      100
                    : 0) + '%',
              }"
            ></i>
          </div>
          <strong>{{
            studentRequests.filter((r) => r.status === status).length
          }}</strong>
        </div>
      </article>
    </div>
  </section>
</template>
