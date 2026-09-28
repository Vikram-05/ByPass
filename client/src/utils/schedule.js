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

export function addJob(job) {
  const jobs = loadJobs();
  jobs.push(job);
  saveJobs(jobs);
  return job;
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