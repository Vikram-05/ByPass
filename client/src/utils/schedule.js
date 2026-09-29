const KEY = "bypass_scheduled_checkouts";

export function loadJobs() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveJobs(jobs) {
  localStorage.setItem(KEY, JSON.stringify(jobs));
  window.dispatchEvent(new Event("bypass:jobs-changed"));
}

/**
 * Add or replace the pending job for the given (riderID, eventID).
 * Returns the final job record. Any previous pending/running job for the
 * same event is removed so there's only ever one.
 */
export function upsertJob(job) {
  const existing = loadJobs();
  const filtered = existing.filter(
    (j) =>
      !(
        j.riderID === job.riderID &&
        j.eventID === job.eventID &&
        (j.status === "pending" || j.status === "running")
      )
  );
  filtered.push(job);
  saveJobs(filtered);
  return job;
}

export function findJobForEvent(riderId, eventId) {
  return (
    loadJobs().find(
      (j) =>
        j.riderID === riderId &&
        j.eventID === eventId &&
        (j.status === "pending" || j.status === "running")
    ) || null
  );
}

export function removeJob(id) {
  const jobs = loadJobs().filter((j) => j.id !== id);
  saveJobs(jobs);
}

export function updateJob(id, patch) {
  const jobs = loadJobs().map((j) => (j.id === id ? { ...j, ...patch } : j));
  saveJobs(jobs);
}

export function newJobId() {
  return `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}