import express from "express";
import cors from "cors";
import axios from "axios";
import "dotenv/config";
import {
  scheduleCheckout,
  listJobs,
  cancelJob,
} from "./queue.js";

// dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// ---- Upstream APIs ------------------------------------------------------
const CYKUL_EVENTS_URL =
  "https://cykul.in/app/lifeCykul/webservice/departments/subDepartments.php";
const CYKUL_SCAN_URL =
  "https://cykul.in/app/lifeCykul/webservice/scanning/scanActivities.php";
const COLLEGE_EVENTS_URL =
  "https://vtuapts.zdotapps.in/api/student/api/collegestudenteventsAPI/";
// ---- Upstream API -------------------------------------------------------
const JOIN_EVENT_URL =
  "https://vtuapts.zdotapps.in/api/student/joinevent/";

const JOURNEY_URL = "https://vtuapts.zdotapps.in/api/student/api/journeyuserlistAPI/";


// ---- Upstream APIs -------------------------------------------------------
// ---- Upstream API -------------------------------------------------------
const CYKUL_TIMELINE_URL =
  "https://cykul.in/app/lifeCykul/webservice/Vfinal/timelineActivitiesV20.php";
const CYKUL_POST_DETAIL_URL =
  "https://cykul.in/app/lifeCykul/webservice/Vfinal/SWG_PostDetails.php";
const CYKUL_DELETE_POST_URL =
  "https://cykul.in/app/lifeCykul/webservice/deleteActivity.php";
// ---- Helpers ------------------------------------------------------------
const asArray = (v) => (Array.isArray(v) ? v : v ? [v] : []);

/**
 * POST /api/journey
 * Body: { riderID, page?, page_size? }
 */
app.post("/api/journey", async (req, res) => {
  const { riderID, page = 1, page_size = 5 } = req.body || {};

  if (!riderID) {
    return res
      .status(400)
      .json({ status: "error", message: "riderID is required" });
  }

  try {
    const { data } = await axios.post(
      JOURNEY_URL,
      {
        riderID: String(riderID),
        page: Number(page),
        page_size: Number(page_size),
      },
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json, text/plain, */*",
          "User-Agent":
            "Dalvik/2.1.0 (Linux; U; Android 16; RMX5030 Build/BP2A.250605.015)",
        },
        timeout: 15000,
        validateStatus: () => true,
      }
    );

    res.status(data?.status === "success" ? 200 : 400).json(data);
  } catch (err) {
    console.error("[journey]", err.message);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch journey",
      detail: err.message,
    });
  }
});

/**
 * Normalize a Cykul "My Events" item to our internal shape.
 * Keeps every field the UI might need.
 */
function normalizeCykulEvent(e) {
  return {
    source: "cykul",
    id: e.id,
    challengeID: e.challengeID,
    rideName: e.rideName,
    rideLogo: e.rideLogo,
    rideBanner: e.rideBanner,
    about: e.about,
    // internal
    date: e.date || e.startedDate,
    startedDate: e.startedDate,
    endDate: e.endDate,
    status: String(e.status ?? "1"),
    finished: String(e.finished ?? "0"),
    eventType: e.eventType || "Private",
    eventTypes: e.eventTypes || "private",
    category: e.category || "event",
    categorytype: e.categorytype || "leagues",
    event_category: e.event_category || "",
    tab_status: e.tab_status || "current",
    leaderboard: e.leaderboard || "Individual",
    Joined: e.Joined || "Yes",
    invitationCode: e.invitationCode || "",
    // things the scan API needs
    menuItems: e.menuItems,
    challengeInfoButtons: e.challengeInfoButtons,
    challengeInfoButtonsTwo: e.challengeInfoButtonsTwo,
  };
}

/**
 * Normalize a VTU-APTS "college-events" item to our internal shape.
 * We also expose extra fields like `invitationCode`, `startedDate`, `endDate`.
 */
function normalizeCollegeEvent(e) {
  return {
    source: "college",
    id: e.id,
    challengeID: e.challengeID,
    rideName: e.rideName,
    rideLogo: e.rideLogo,
    rideBanner: e.rideBanner,
    about: e.about,
    date: e.startedDate, // used by existing EventCard
    startedDate: e.startedDate,
    endDate: e.endDate,
    status: String(e.status ?? "1"),
    finished: String(e.finished ?? "0"),
    event_category: e.event_category || "",
    tab_status: e.tab_status || "current",
    invitationCode: e.invitationCode || "",
    // defaults so the same UI doesn't break
    eventType: "College",
    eventTypes: "college",
    category: "event",
    categorytype: "college",
    leaderboard: "Individual",
    Joined: "Yes",
  };
}

// ---- Routes -------------------------------------------------------------
/**
 * POST /api/join-event
 * Body: { eventID, riderID, invitationCode }
 * Forwards to VTU-APTS join endpoint.
 */
// ---- Upstream API -------------------------------------------------------

app.post("/api/join-event", async (req, res) => {
  const { rider_id, eventID, check_only = false } = req.body || {};

  if (!rider_id || !eventID) {
    return res.status(400).json({
      status: "error",
      message: "rider_id and eventID are required",
    });
  }

  const payload = {
    rider_id: String(rider_id),
    eventID: String(eventID),
    check_only: Boolean(check_only),
  };

  try {
    const { data } = await axios.post(JOIN_EVENT_URL, payload, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/plain, */*",
        "User-Agent":
          "Dalvik/2.1.0 (Linux; U; Android 16; RMX5030 Build/BP2A.250605.015)",
      },
      timeout: 15000,
      validateStatus: () => true,
    });

    res.status(data?.status === "success" ? 200 : 400).json(data);
  } catch (err) {
    console.error("[join-event]", err.message);
    res.status(500).json({
      status: "error",
      message: "Failed to join event",
      detail: err.message,
    });
  }
});

/** Legacy: Cykul "My Events" */
/** My Events — Cykul POST (x-www-form-urlencoded) */
app.post("/api/my-events", async (req, res) => {
  const { riderId } = req.body;

  if (!riderId) {
    return res
      .status(400)
      .json({ status: "error", error: "riderId is required" });
  }

  try {
    // Build URL-encoded body exactly like the mobile app
    const body = new URLSearchParams();
    body.append("whichapp", "campuslife");
    body.append("eventID", "APTSCLG74988287MYEVENTS");
    body.append("riderID", String(riderId));
    body.append("masterLeague", "1");

    const { data } = await axios.post(CYKUL_EVENTS_URL, body.toString(), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "User-Agent":
          "Dalvik/2.1.0 (Linux; U; Android 16; RMX5030 Build/BP2A.250605.015)",
        Accept: "application/json, text/plain, */*",
      },
      timeout: 15000,
    });

    // The response may nest events under different keys
    const raw = asArray(
      data?.resultStatus || data?.events || data?.data?.events || []
    );
    const events = raw.map(normalizeCykulEvent);

    res.json({
      status: "success",
      data: {
        events,
        total_events: events.length,
        current_page: 1,
        total_pages: 1,
        page_size: events.length,
        counts: {
          current: events.filter((e) => e.tab_status === "current").length,
          upcoming: events.filter((e) => e.tab_status === "upcoming").length,
          closed: events.filter((e) => e.tab_status === "closed").length,
        },
        all_categories: [
          ...new Set(events.map((e) => e.event_category).filter(Boolean)),
        ],
        student: { rider_id: riderId },
        college: null,
        master_event: null,
      },
    });
  } catch (err) {
    console.error("[my-events]", err.message);
    res.status(500).json({
      status: "error",
      error: "Failed to fetch My Events",
      detail: err.message,
    });
  }
});

/** New: VTU-APTS college events */
/** New: VTU-APTS college events — POST (matches current upstream contract) */
app.get("/api/college-events/:riderId", async (req, res) => {
  const { riderId } = req.params;
  const {
    tab = "current",
    page = 1,
    page_size = 5,
    search = "",
    category = "",
  } = req.query;

  try {
    const { data } = await axios.post(
      COLLEGE_EVENTS_URL,
      {
        riderID: String(riderId),
        tab,
        page: Number(page),
        page_size: Number(page_size),
        search: search || "",
        category: category || "",
      },
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json, text/plain, */*",
          "User-Agent":
            "Dalvik/2.1.0 (Linux; U; Android 16; RMX5030 Build/BP2A.250605.015)",
        },
        timeout: 20000,
        validateStatus: () => true,
      }
    );

    // Upstream may nest events differently — normalize.
    const eventsRaw = asArray(data?.data?.events);
    let events = eventsRaw.map(normalizeCollegeEvent);

    // Optional client-side category filter (server already filters, this
    // is a belt-and-braces layer if the upstream ignores it).
    if (category) {
      const c = category.toLowerCase();
      events = events.filter(
        (e) => e.event_category?.toLowerCase() === c
      );
    }

    res.json({
      status: data?.status || "success",
      data: {
        student: data?.data?.student || null,
        college: data?.data?.college || null,
        master_event: data?.data?.master_event || null,
        events,
        total_events: data?.data?.total_events ?? events.length,
        total_pages: data?.data?.total_pages ?? 1,
        current_page: data?.data?.current_page ?? Number(page),
        page_size: data?.data?.page_size ?? Number(page_size),
        counts: data?.data?.counts || {
          current: 0,
          upcoming: 0,
          closed: 0,
        },
        all_categories: data?.data?.all_categories || [],
      },
    });
  } catch (err) {
    console.error("[college events]", err.message);
    res.status(500).json({
      status: "error",
      error: "Failed to fetch college events",
      detail: err.message,
    });
  }
});

/* ---------------- My Posts ---------------- */
/* ---------------- My Posts / My Activities ---------------- */

app.post("/api/my-posts", async (req, res) => {
  const {
    riderId,
    page = 1,
    activity = "All",
    challengeID = "",
    key = "myActivities",
  } = req.body || {};

  if (!riderId) {
    return res
      .status(400)
      .json({ status: "error", message: "riderId is required" });
  }

  // ---- Build the request exactly like the Android app ----
  const body = new URLSearchParams();
  body.append("whichapp", "campuslife");
  body.append("challengeID", String(challengeID || ""));
  body.append("activity", String(activity));
  body.append("user_id", String(riderId));
  body.append("page", String(page));
  body.append("rider_id", String(riderId));
  body.append("key", String(key));

  const requestEcho = body.toString();
  console.log("[my-posts] POST", CYKUL_TIMELINE_URL);
  console.log("[my-posts] body:", requestEcho);

  try {
    const { data } = await axios.post(CYKUL_TIMELINE_URL, requestEcho, {
      headers: {
        "Content-Type":
          "application/x-www-form-urlencoded; charset=UTF-8",
        "User-Agent":
          "Dalvik/2.1.0 (Linux; U; Android 16; RMX5030 Build/BP2A.250605.015)",
        Accept: "application/json, text/plain, */*",
      },
      timeout: 20000,
      validateStatus: () => true,
    });

    // Upstream usually puts the list in resultStatus
    const rawList = Array.isArray(data?.resultStatus)
      ? data.resultStatus
      : Array.isArray(data?.data?.resultStatus)
        ? data.data.resultStatus
        : [];

    // Strip the "welcome" placeholder + anything without a real activityID
    const posts = rawList.filter(
      (p) =>
        p &&
        p.category !== "welcome" &&
        p.activityID &&
        String(p.activityID) !== "0"
    );

    // What the upstream claimed, and what we actually kept
    console.log(
      `[my-posts] upstream count=${data?.count ?? "?"} kept=${posts.length}`
    );

    res.json({
      status: "success",
      data: {
        posts,
        count: posts.length,
        isEmpty: posts.length === 0,
        respText: data?.respText || "",
        // 👇 debugging aids — useful until the query returns real posts
        debug: {
          requestBody: requestEcho,
          upstreamCount: data?.count ?? null,
          upstreamRaw: rawList,
        },
        meta: {
          weekData: data?.weekData || [],
          followcount: data?.followcount ?? 0,
          rewardTrophyCount: data?.rewardTrophyCount ?? 0,
          rewardVoucherCount: data?.rewardVoucherCount ?? 0,
          rewardAmountCount: data?.rewardAmountCount ?? 0,
          streamInterval: data?.streamInterval ?? 3000,
        },
      },
    });
  } catch (err) {
    console.error("[my-posts]", err.message);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch posts",
      detail: err.message,
    });
  }
});

/* ---------------- Single Post Detail ---------------- */
app.post("/api/post-detail", async (req, res) => {
  const { riderID, activityID, eventID } = req.body || {};
  if (!riderID || !activityID) {
    return res
      .status(400)
      .json({ status: "error", message: "riderID and activityID required" });
  }

  try {
    const body = new URLSearchParams();
    body.append("whichapp", "campuslife");
    body.append("riderID", String(riderID));
    body.append("activityID", String(activityID));
    if (eventID) body.append("eventID", String(eventID));

    const { data } = await axios.post(
      CYKUL_POST_DETAIL_URL,
      body.toString(),
      {
        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded; charset=UTF-8",
          "User-Agent":
            "Dalvik/2.1.0 (Linux; U; Android 16; RMX5030 Build/BP2A.250605.015)",
          Accept: "application/json, text/plain, */*",
        },
        timeout: 15000,
        validateStatus: () => true,
      }
    );

    // Upstream returns the post under followresultStatus (per your sample).
    const post = data?.followresultStatus || data?.resultStatus || data;
    res.json({ status: "success", data: { post } });
  } catch (err) {
    console.error("[post-detail]", err.message);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch post",
      detail: err.message,
    });
  }
});

/* ---------------- Delete Post ---------------- */
app.post("/api/delete-post", async (req, res) => {
  const { rider_id, activityID, challengeID } = req.body || {};
  if (!rider_id || !activityID || !challengeID) {
    return res.status(400).json({
      status: "error",
      message: "rider_id, activityID, and challengeID are required",
    });
  }

  try {
    const body = new URLSearchParams();
    body.append("activityMode", "mivPosts");
    body.append("whichapp", "campuslife");
    body.append("activityID", String(activityID));
    body.append("challengeID", String(challengeID));
    body.append("rider_id", String(rider_id));

    const { data } = await axios.post(
      CYKUL_DELETE_POST_URL,
      body.toString(),
      {
        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded; charset=UTF-8",
          "User-Agent":
            "Dalvik/2.1.0 (Linux; U; Android 16; RMX5030 Build/BP2A.250605.015)",
          Accept: "application/json, text/plain, */*",
        },
        timeout: 15000,
        validateStatus: () => true,
      }
    );

    res.json(data);
  } catch (err) {
    console.error("[delete-post]", err.message);
    res.status(500).json({
      resultStatus: "false",
      reportStatus: "Failed to delete: " + err.message,
    });
  }
});

/** Scan (check-in / check-out) — unchanged */
app.post("/api/scan", async (req, res) => {
  const {
    mode,
    eventID,
    riderID,
    address,
    qrCode,
    latitude,
    longitude,
    time,
  } = req.body || {};

  if (!mode || !eventID || !riderID || !qrCode) {
    return res.status(400).json({
      response: "false",
      resultStatus: "Missing required fields.",
    });
  }

  // ---- Build departmentID exactly like the app ----
  // from logs: CHEKIN5846YOE584 / CHEKOUT5846YOE584
  // The 5846 and 584 come from the event ID suffix, so we slice the
  // numeric tail of the challengeID.
  const numeric = String(eventID).replace(/[^0-9]/g, "");
  const first4 = numeric.slice(-8, -4) || "0000"; // 5846
  const last3 = numeric.slice(-3);                // 584
  const departmentID =
    mode === "in"
      ? `CHEKIN${first4}YOE${last3}`
      : `CHEKOUT${first4}YOE${last3}`;

  // ---- Normalize time to "YYYY-Mon-DD HH:MM" ----
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const pad = (n) => String(n).padStart(2, "0");
  let timeStr = time;
  if (time instanceof Date || typeof time === "string") {
    const d = time instanceof Date ? time : new Date(time);
    if (!isNaN(d.getTime())) {
      timeStr = `${d.getFullYear()}-${months[d.getMonth()]}-${pad(
        d.getDate()
      )} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }
  }
  if (!timeStr) {
    const d = new Date();
    timeStr = `${d.getFullYear()}-${months[d.getMonth()]}-${pad(
      d.getDate()
    )} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  // ---- Build x-www-form-urlencoded body ----
  const body = new URLSearchParams();
  body.append("whichapp", "campuslife");
  body.append("eventID", String(eventID));
  body.append("riderID", String(riderID));
  body.append("address", String(address || ""));
  body.append("qrCode", String(qrCode));
  body.append("departmentID", departmentID);
  body.append("latitude", String(latitude ?? ""));
  body.append("time", timeStr);
  body.append("longitude", String(longitude ?? ""));

  // Debug (optional — remove after verifying)
  console.log("[scan] POST", CYKUL_SCAN_URL);
  console.log("[scan] body:", body.toString());

  try {
    const { data } = await axios.post(CYKUL_SCAN_URL, body.toString(), {
      headers: {
        "Content-Type":
          "application/x-www-form-urlencoded; charset=UTF-8",
        "User-Agent":
          "Dalvik/2.1.0 (Linux; U; Android 16; RMX5030 Build/BP2A.250605.015)",
        Accept: "application/json, text/plain, */*",
      },
      timeout: 15000,
      validateStatus: () => true,
    });

    // Some responses come back as stringified JSON — normalize.
    let payload = data;
    if (typeof data === "string") {
      try {
        payload = JSON.parse(data);
      } catch {
        payload = { response: "false", resultStatus: data };
      }
    }

    res.json(payload);
  } catch (err) {
    console.error("[scan]", err.message);
    res.status(500).json({
      response: "false",
      resultStatus: "Server error: " + err.message,
    });
  }
});

/* ---------------------------------------------------------------------------
 * Scheduled checkouts (server-side, survives browser close)
 * ------------------------------------------------------------------------- */

app.post("/api/schedule-checkout", async (req, res) => {
  const {
    mode = "out",
    riderID,
    eventID,
    rideName,
    address,
    qrCode,
    latitude,
    longitude,
    scheduledAt,
  } = req.body || {};

  if (!riderID || !eventID || scheduledAt == null) {
    return res.status(400).json({
      status: "error",
      message: "riderID, eventID, and scheduledAt are required",
    });
  }

  try {
    const job = await scheduleCheckout({
      mode: mode === "in" ? "in" : "out",
      riderID: String(riderID),
      eventID: String(eventID),
      rideName: rideName || "",
      address: address || "",
      qrCode: qrCode || "",
      latitude: latitude ?? null,
      longitude: longitude ?? null,
      scheduledAt: Number(scheduledAt), // any timestamp — past is fine
      createdAt: Date.now(),
    });
    res.json({ status: "success", data: { job } });
  } catch (err) {
    console.error("[schedule-checkout]", err.message);
    res.status(500).json({
      status: "error",
      message: "Failed to schedule checkout",
      detail: err.message,
    });
  }
});
app.get("/api/scheduled/:riderID", async (req, res) => {
  try {
    const jobs = await listJobs(String(req.params.riderID));
    res.json({ status: "success", data: { jobs } });
  } catch (err) {
    console.error("[list-jobs]", err.message);
    res.status(500).json({
      status: "error",
      message: "Failed to list jobs",
      detail: err.message,
    });
  }
});

app.delete("/api/scheduled/:jobID", async (req, res) => {
  try {
    const ok = await cancelJob(req.params.jobID);
    res.json({ status: ok ? "success" : "not_found" });
  } catch (err) {
    console.error("[cancel-job]", err.message);
    res.status(500).json({
      status: "error",
      message: "Failed to cancel job",
      detail: err.message,
    });
  }
});

app.get("/", (_, res) => res.send("ByPass API is running 🚀"));

app.listen(PORT, () => {
  if (!process.env.REDIS_URL) {
    console.warn(
      "[startup] REDIS_URL missing — scheduled checkouts will not fire."
    );
  } else {
    console.log("[startup] Redis configured — auto-checkout worker online.");
  }
  console.log(`ByPass server running on http://localhost:${PORT}`)
}
);



