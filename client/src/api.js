import axios from "axios";

/* ---------------------------------------------------------------------------
 * Resolve the API base URL.
 *
 * Priority:
 *   1. VITE_API_BASE_URL        — set in .env.production or the host dashboard
 *   2. PROD_FALLBACK            — hardcoded backend URL (safety net in prod)
 *   3. "/api"                   — local dev; Vite proxy forwards to localhost:5000
 *
 * The final URL always ends in "/api" so the endpoint paths stay clean
 * (e.g. `/college-events/1713009` → `…/api/college-events/1713009`).
 * ------------------------------------------------------------------------- */
const PROD_FALLBACK = "https://bypass-backend-2715.onrender.com";

const ENV_BASE = (import.meta.env.VITE_API_BASE_URL || "").trim();

// In production, never silently fall back to "/api" — that would resolve
// against the frontend's own origin and 404. In dev, "/api" is what we want.
const rawBase = ENV_BASE || (import.meta.env.PROD ? PROD_FALLBACK : "");

const trimmed = rawBase.replace(/\/+$/, "");
const baseURL = trimmed
  ? trimmed.endsWith("/api")
    ? trimmed
    : `${trimmed}/api`
  : "/api";

/* ---------------------------------------------------------------------------
 * Axios instance
 * ------------------------------------------------------------------------- */
const api = axios.create({
  baseURL,
  timeout: 60000, // generous — Render free tier may cold-start
  headers: {
    Accept: "application/json, text/plain, */*",
  },
});

/* ---------------------------------------------------------------------------
 * Debug log (always useful — tells you exactly where requests go)
 * ------------------------------------------------------------------------- */
// eslint-disable-next-line no-console
console.log("[ByPass] API base URL:", baseURL);

/* ---------------------------------------------------------------------------
 * Optional: wake the backend on app boot (Render free tier sleeps).
 * Safe to call multiple times — it's a cheap GET.
 * ------------------------------------------------------------------------- */
export const warmup = () =>
  api.get("/health").catch(() => {
    /* silent — best effort */
  });

/* ---------------------------------------------------------------------------
 * Endpoints
 * ------------------------------------------------------------------------- */

/** My Events (Cykul) */
export const fetchMyEvents = async (riderId) => {
  const { data } = await api.post(`/my-events`, { riderId });
  return data;
};

/** All Events (VTU-APTS college events) */
export const fetchCollegeEvents = async (
  riderId,
  { tab = "current", page = 1, pageSize = 5, category = "" } = {}
) => {
  const { data } = await api.get(`/college-events/${riderId}`, {
    params: {
      tab,
      page,
      page_size: pageSize,
      ...(category ? { category } : {}),
    },
  });
  return data;
};

/** Journey (check-in history + summary) */
export const fetchJourney = async (
  riderID,
  { page = 1, pageSize = 5 } = {}
) => {
  const { data } = await api.post(
    "/journey",
    { riderID: String(riderID), page, page_size: pageSize },
    { validateStatus: (s) => s < 500 }
  );
  return data;
};

/** Check-in / Check-out */
export const scanActivity = async (payload) => {
  const { data } = await api.post("/scan", payload, {
    validateStatus: (s) => s < 500,
  });
  return data;
};

/** Join event */
export const joinEvent = async ({ rider_id, eventID, check_only = false }) => {
  const { data } = await api.post(
    "/join-event",
    { rider_id, eventID, check_only },
    { validateStatus: (s) => s < 500 }
  );
  return data;
};


/** My Posts / My Activities */
export const fetchMyPosts = async (
  riderId,
  { page = 1, pageSize = 20, activity = "All", challengeID = "", key = "myActivities" } = {}
) => {
  const { data } = await api.post(
    "/my-posts",
    {
      riderId: String(riderId),
      page,
      pageSize,
      activity,
      challengeID,
      key,
    },
    { validateStatus: (s) => s < 500 }
  );
  return data;
};

/** Single Post Detail */
export const fetchPostDetail = async ({ riderID, activityID, eventID }) => {
  const { data } = await api.post(
    "/post-detail",
    { riderID: String(riderID), activityID, eventID },
    { validateStatus: (s) => s < 500 }
  );
  return data;
};

/** Delete Post */
export const deletePost = async ({ rider_id, activityID, challengeID }) => {
  const { data } = await api.post(
    "/delete-post",
    { rider_id: String(rider_id), activityID, challengeID },
    { validateStatus: (s) => s < 500 }
  );
  return data;
};


export default api;