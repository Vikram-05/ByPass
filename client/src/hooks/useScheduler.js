import { useEffect, useRef } from "react";
import { loadJobs, updateJob } from "../utils/schedule";
import { scanActivity } from "../api";
import { toApiTimeRaw } from "../utils/format";

const TICK_MS = 5000;

/**
 * Background scheduler: fires pending check-out jobs when their time is due.
 * Calls `onFired(job, result)` and `onError(job, err)` for UI feedback.
 */
export default function useScheduler({ onFired, onError } = {}) {
  const runningRef = useRef(false);

  useEffect(() => {
    let timer;

    const tick = async () => {
      if (runningRef.current) return;
      runningRef.current = true;
      try {
        const now = Date.now();
        const jobs = loadJobs();
        const due = jobs.filter(
          (j) => j.status === "pending" && j.scheduledAt <= now
        );

        for (const job of due) {
          updateJob(job.id, { status: "running" });
          try {
            const res = await scanActivity({
              mode: "out",
              eventID: job.eventID,
              riderID: job.riderID,
              address: job.address,
              qrCode: job.qrCode,
              latitude: job.latitude,
              longitude: job.longitude,
              time: toApiTimeRaw(new Date(job.scheduledAt)),
            });
            const ok = String(res?.response) === "true";
            updateJob(job.id, {
              status: ok ? "completed" : "failed",
              result: res,
              finishedAt: Date.now(),
            });
            onFired?.(job, res);
          } catch (err) {
            updateJob(job.id, {
              status: "failed",
              error: err?.message || "Network error",
              finishedAt: Date.now(),
            });
            onError?.(job, err);
          }
        }
      } finally {
        runningRef.current = false;
      }
    };

    // run immediately + on interval
    tick();
    timer = setInterval(tick, TICK_MS);

    // also fire when the tab becomes visible again
    const onVis = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVis);
    };
    // eslint-disable-next-line
  }, []);
}