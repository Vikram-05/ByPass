const KEY_PREFIX = "bypass_checkin_state";

function keyFor(riderId) {
  return `${KEY_PREFIX}:${riderId || "anon"}`;
}

function readAll(riderId) {
  try {
    return JSON.parse(localStorage.getItem(keyFor(riderId)) || "{}");
  } catch {
    return {};
  }
}

function writeAll(riderId, state) {
  localStorage.setItem(keyFor(riderId), JSON.stringify(state));
  window.dispatchEvent(new Event("bypass:checkin-changed"));
}

export function getCheckin(riderId, eventID) {
  const all = readAll(riderId);
  return all?.[eventID] || null;
}

export function isCheckedIn(riderId, eventID) {
  return !!getCheckin(riderId, eventID);
}

export function setCheckin(riderId, eventID, info) {
  const all = readAll(riderId);
  all[eventID] = { ...info, eventID };
  writeAll(riderId, all);
  return all[eventID];
}

export function clearCheckin(riderId, eventID) {
  const all = readAll(riderId);
  delete all[eventID];
  writeAll(riderId, all);
}

export function listCheckins(riderId) {
  return Object.values(readAll(riderId) || {});
}