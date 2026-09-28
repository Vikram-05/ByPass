import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  timeout: 20000,
});

export const fetchMyEvents = async (riderId) => {
  const { data } = await api.post(`/my-events`, { riderId });
  return data;
};

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

export const scanActivity = async (payload) => {
  const { data } = await api.post("/scan", payload, {
    validateStatus: (s) => s < 500,
  });
  return data;
};

export const joinEvent = async ({ rider_id, eventID, check_only = false }) => {
  const { data } = await api.post(
    "/join-event",
    { rider_id, eventID, check_only },
    { validateStatus: (s) => s < 500 }
  );
  return data;
};
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