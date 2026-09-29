const KEY = "bypass_checkin_state";

/* Shape stored:
   {
     "1713009": {
       "CLCYOE6235260529062357251": {
         "activityID": "4468198",
         "checkinAt": 1738000000000,
         "eventID": "CLCYOE6235260529062357251",
         "rideName": "..."
       },
       ...
     }
   }
*/

function readAll() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
}

function writeAll(state) {
  localStorage.setItem(KEY, JSON.stringify(state));
  window.dispatchEvent(new Event("bypass:checkin-changed"));
}

export function getCheckin(riderId, eventID) {
  const all = readAll();
  return all?.[riderId]?.[eventID] || null;
}

export function isCheckedIn(riderId, eventID) {
  return !!getCheckin(riderId, eventID);
}

export function setCheckin(riderId, eventID, info) {
  const all = readAll();
  const forRider = { ...(all[riderId] || {}) };
  forRider[eventID] = { ...info, eventID };
  all[riderId] = forRider;
  writeAll(all);
  return forRider[eventID];
}

export function clearCheckin(riderId, eventID) {
  const all = readAll();
  const forRider = { ...(all[riderId] || {}) };
  delete forRider[eventID];
  all[riderId] = forRider;
  writeAll(all);
}

export function listCheckins(riderId) {
  const all = readAll();
  return Object.values(all?.[riderId] || {});
}

export function loadCheckinState() {
  return readAll();
}