import express from "express";
import cors from "cors";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

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
  "https://vtuapts.zdotapps.in/api/student/api/college-events/";
  // ---- Upstream API -------------------------------------------------------
const JOIN_EVENT_URL =
  "https://vtuapts.zdotapps.in/api/student/joinevent/";

const JOURNEY_URL = "https://vtuapts.zdotapps.in/api/student/journey/";

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
app.get("/api/college-events/:riderId", async (req, res) => {
  const { riderId } = req.params;
  const { tab = "current", page = 1, page_size = 5, category } = req.query;

  try {
    const { data } = await axios.get(COLLEGE_EVENTS_URL, {
      params: {
        riderID: riderId,
        tab,
        page,
        page_size,
      },
      timeout: 15000,
    });

    const eventsRaw = asArray(data?.data?.events);
    let events = eventsRaw.map(normalizeCollegeEvent);

    // Optional client-side category filter
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
  } = req.body;

  if (!mode || !eventID || !riderID || !qrCode) {
    return res
      .status(400)
      .json({ response: "false", resultStatus: "Missing required fields." });
  }

  const eventNumeric = eventID.replace(/[^0-9]/g, "");
  const departmentID =
    mode === "in"
      ? `CHEKIN${eventNumeric.slice(0, 4)}YOE${eventNumeric.slice(4, 8)}`
      : `CHEKOUT${eventNumeric.slice(0, 4)}YOE${eventNumeric.slice(4, 8)}`;

  try {
    const { data } = await axios.get(CYKUL_SCAN_URL, {
      params: {
        whichapp: "campuslife",
        eventID,
        riderID,
        address,
        qrCode,
        departmentID,
        latitude,
        time,
        longitude,
      },
      timeout: 15000,
    });
    res.json(data);
  } catch (err) {
    console.error("[scan]", err.message);
    res
      .status(500)
      .json({ response: "false", resultStatus: "Server error: " + err.message });
  }
});

app.get("/", (_, res) => res.send("ByPass API is running 🚀"));

app.listen(PORT, () =>
  console.log(`ByPass server running on http://localhost:${PORT}`)
);