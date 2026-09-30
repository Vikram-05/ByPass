import "dotenv/config";
import { Queue, Worker } from "bullmq";
import IORedis from "ioredis";
import axios from "axios";

/* ---------------------------------------------------------------------------
 * Redis connection (BullMQ needs maxRetriesPerRequest: null)
 * ------------------------------------------------------------------------- */
const REDIS_URL = process.env.REDIS_URL;

export const redis = REDIS_URL
  ? new IORedis(REDIS_URL, { maxRetriesPerRequest: null })
  : null;

if (!redis) {
  console.warn(
    "[queue] REDIS_URL not set — scheduled checkouts are DISABLED until Redis is configured."
  );
}

/* ---------------------------------------------------------------------------
 * Cykul upstream
 * ------------------------------------------------------------------------- */
const CYKUL_SCAN_URL =
  "https://cykul.in/app/lifeCykul/webservice/scanning/scanActivities.php";

function buildDepartmentID(mode, eventID) {
  const numeric = String(eventID).replace(/[^0-9]/g, "");
  const first4 = numeric.slice(-8, -4) || "0000";
  const last3 = numeric.slice(-3) || "000";
  return mode === "in"
    ? `CHEKIN${first4}YOE${last3}`
    : `CHEKOUT${first4}YOE${last3}`;
}

function formatApiTime(ts) {
  const d = new Date(ts);
  const months = [
    "Jan","Feb","Mar","Apr","May","Jun",
    "Jul","Aug","Sep","Oct","Nov","Dec",
  ];
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${months[d.getMonth()]}-${pad(
    d.getDate()
  )} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export async function fireCheckout(payload) {
  const {
    mode = "out",
    riderID,
    eventID,
    address,
    qrCode,
    latitude,
    longitude,
    scheduledAt,
  } = payload;

  const departmentID = buildDepartmentID(mode, eventID);
  const timeStr = formatApiTime(scheduledAt || Date.now());

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

  const { data } = await axios.post(CYKUL_SCAN_URL, body.toString(), {
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

  let parsed = data;
  if (typeof data === "string") {
    try {
      parsed = JSON.parse(data);
    } catch {
      parsed = { response: "false", resultStatus: data };
    }
  }
  return parsed;
}

/* ---------------------------------------------------------------------------
 * Queue + Worker
 * ------------------------------------------------------------------------- */
export const checkoutQueue = redis
  ? new Queue("checkout", { connection: redis })
  : null;

/**
 * Deterministic job id — one pending job per (rider, event, mode).
 * BullMQ reserves ":" as its internal separator, so we use "-".
 */
function jobIdFor(riderID, eventID, mode) {
  return `checkout-${mode}-${riderID}-${eventID}`;
}

/**
 * Schedule (or replace) an auto check-in OR auto check-out.
 * Any scheduledAt value is accepted:
 *   - future  → fires at that time
 *   - now     → fires immediately
 *   - past    → fires immediately (delay clamps to 0)
 */
export async function scheduleCheckout(job) {
  if (!checkoutQueue) throw new Error("Redis not configured");

  const mode = job.mode === "in" ? "in" : "out";
  const delay = Math.max(0, Number(job.scheduledAt) - Date.now());

  console.log(
    `[schedule] mode=${mode} rider=${job.riderID} event=${job.eventID} ` +
      `scheduledAt=${job.scheduledAt} delay=${delay}ms`
  );

  await checkoutQueue.add(
    mode === "in" ? "auto-checkin" : "auto-checkout",
    { ...job, mode },
    {
      jobId: `checkout-${mode}-${job.riderID}-${job.eventID}`, // no ":"
      delay,                                                   // past = 0
      attempts: 3,
      backoff: { type: "exponential", delay: 30_000 },
      removeOnComplete: { age: 60 * 60 * 24 },
      removeOnFail: { age: 60 * 60 * 24 },
    }
  );

  return {
    id: `checkout-${mode}-${job.riderID}-${job.eventID}`,
    ...job,
    mode,
    status: "pending",
  };
}
export async function listJobs(riderID) {
  if (!checkoutQueue) return [];

  const all = await checkoutQueue.getJobs(
    ["delayed", "waiting", "active", "completed", "failed"],
    0,
    500
  );

  const filtered = all.filter(
    (j) => j?.data?.riderID === String(riderID)
  );

  return Promise.all(
    filtered.map(async (j) => {
      const state = await j.getState();
      return {
        id: j.id,
        mode: j.data.mode || "out",
        riderID: j.data.riderID,
        eventID: j.data.eventID,
        rideName: j.data.rideName,
        address: j.data.address,
        qrCode: j.data.qrCode,
        latitude: j.data.latitude,
        longitude: j.data.longitude,
        scheduledAt: j.data.scheduledAt,
        status: state,
        result: j.returnvalue || null,
        failedReason: j.failedReason || null,
      };
    })
  );
}

export async function cancelJob(jobID) {
  if (!checkoutQueue) return false;
  const job = await checkoutQueue.getJob(jobID);
  if (!job) return false;
  await job.remove();
  return true;
}

/* ---------------------------------------------------------------------------
 * Worker — runs in the same Node process
 * ------------------------------------------------------------------------- */
export let checkoutWorker = null;

if (redis) {
  checkoutWorker = new Worker(
    "checkout",
    async (job) => {
      console.log(
        `[worker] firing auto-${
          job.data.mode === "in" ? "check-in" : "check-out"
        } for ${job.data.riderID} · ${job.data.eventID}`
      );
      const res = await fireCheckout(job.data);
      console.log("[worker] upstream result:", res);
      return res;
    },
    {
      connection: redis,
      concurrency: 5,
    }
  );

  checkoutWorker.on("completed", (job) =>
    console.log(`[worker] completed ${job.id}`)
  );
  checkoutWorker.on("failed", (job, err) =>
    console.error(`[worker] failed ${job?.id}`, err?.message)
  );
  checkoutWorker.on("error", (err) =>
    console.error("[worker] error:", err?.message)
  );
}