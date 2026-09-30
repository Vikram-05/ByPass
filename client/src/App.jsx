import { useCallback, useEffect, useState } from "react";
import Navbar from "./components/Navbar";
import MemberEntry from "./components/MemberEntry";
import EventList from "./components/EventList";
import EventDetail from "./components/EventDetail";
import ActionModal from "./components/ActionModal";
import JourneyView from "./components/JourneyView";
import SourceTabs from "./components/SourceTabs";
import ScheduledPanel from "./components/ScheduledPanel";
import Settings from "./components/Settings";
import Toast from "./components/Toast";
import CountdownToast from "./components/CountdownToast";
import Loader from "./components/Loader";

import {
  fetchMyEvents,
  fetchCollegeEvents,
  fetchJourney,
  scanActivity,
  joinEvent,
  warmup,
  scheduleCheckout,
  fetchScheduled,
  cancelScheduled,
} from "./api";

import { toApiTimeRaw } from "./utils/format";
import { isCheckedIn, setCheckin, clearCheckin } from "./utils/checkinState";

export default function App() {
  const [riderId, setRiderId] = useState(
    () => localStorage.getItem("bypass_rider") || ""
  );
  const [source, setSource] = useState("college"); // "college" | "my" | "journey"

  /* -------------------- My Events -------------------- */
  const [myEvents, setMyEvents] = useState([]);

  /* -------------------- College Events -------------------- */
  const [collegeMeta, setCollegeMeta] = useState(null);
  const [collegeEvents, setCollegeEvents] = useState([]);
  const [collegeStatus, setCollegeStatus] = useState("current");
  const [collegePage, setCollegePage] = useState(1);
  const [collegePageSize, setCollegePageSize] = useState(5);
  const [collegeCategory, setCollegeCategory] = useState("");

  /* -------------------- Journey -------------------- */
  const [journeySummary, setJourneySummary] = useState(null);
  const [journeyRecords, setJourneyRecords] = useState([]);
  const [journeyPage, setJourneyPage] = useState(1);
  const [journeyPageSize, setJourneyPageSize] = useState(5);
  const [journeyTotalPages, setJourneyTotalPages] = useState(1);
  const [journeyTotal, setJourneyTotal] = useState(0);

  /* -------------------- Scheduled jobs (server-side) -------------------- */
  const [scheduledJobs, setScheduledJobs] = useState([]);

  /* -------------------- View / UI -------------------- */
  const [view, setView] = useState("list"); // "list" | "detail"
  const [selected, setSelected] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [joining, setJoining] = useState(false);
  const [toast, setToast] = useState(null);

  // modal has: open, mode ("in"|"out"), scheduled (boolean)
  const [modal, setModal] = useState({
    open: false,
    mode: "in",
    scheduled: false,
  });

  /* ------------------------------------------------------------------ */
  /* Warm up backend                                                     */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    warmup();
  }, []);

  /* ------------------------------------------------------------------ */
  /* Persist rider id                                                    */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    if (riderId) localStorage.setItem("bypass_rider", riderId);
  }, [riderId]);

  /* ------------------------------------------------------------------ */
  /* Initial load                                                        */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    if (!riderId) return;
    if (source === "college") loadCollege();
    else if (source === "my") loadMy();
    else if (source === "journey") loadJourney();
    // eslint-disable-next-line
  }, [riderId]);

  /* ------------------------------------------------------------------ */
  /* Reload college list on filter change                                */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    if (riderId && source === "college") loadCollege();
    // eslint-disable-next-line
  }, [collegeStatus, collegePage, collegePageSize, collegeCategory]);

  /* ------------------------------------------------------------------ */
  /* Reload journey on pagination change                                 */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    if (riderId && source === "journey") loadJourney();
    // eslint-disable-next-line
  }, [journeyPage, journeyPageSize]);

  /* ------------------------------------------------------------------ */
  /* Scheduled jobs — fetch + poll                                       */
  /* ------------------------------------------------------------------ */
  const refreshScheduled = useCallback(async () => {
    if (!riderId) {
      setScheduledJobs([]);
      return;
    }
    try {
      const res = await fetchScheduled(riderId);
      setScheduledJobs(res?.data?.jobs || []);
    } catch {
      /* silent */
    }
  }, [riderId]);

  useEffect(() => {
    refreshScheduled();
  }, [refreshScheduled]);

  useEffect(() => {
    if (!riderId) return;
    const id = setInterval(() => {
      if (document.visibilityState === "visible") refreshScheduled();
    }, 30_000);
    const onVis = () => {
      if (document.visibilityState === "visible") refreshScheduled();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [riderId, refreshScheduled]);

  /* ------------------------------------------------------------------ */
  /* Data loaders                                                        */
  /* ------------------------------------------------------------------ */
  const loadMy = async () => {
    setLoading(true);
    try {
      const res = await fetchMyEvents(riderId);
      setMyEvents(res?.data?.events || []);
      if (!res?.data?.events?.length) {
        setToast({
          type: "info",
          title: "No events found",
          message: "This member ID has no active events in My Events.",
        });
      }
    } catch (err) {
      setToast({
        type: "error",
        title: "Couldn't load My Events",
        message: err?.response?.data?.detail || err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCollege = async () => {
    setLoading(true);
    try {
      const res = await fetchCollegeEvents(riderId, {
        tab: collegeStatus,
        page: collegePage,
        pageSize: collegePageSize,
        category: collegeCategory,
      });
      const d = res?.data || {};
      setCollegeEvents(d.events || []);
      setCollegeMeta({
        student: d.student,
        college: d.college,
        master_event: d.master_event,
        counts: d.counts,
        all_categories: d.all_categories || [],
        total: d.total_events,
        total_pages: d.total_pages,
        current_page: d.current_page,
        page_size: d.page_size,
      });
    } catch (err) {
      setToast({
        type: "error",
        title: "Couldn't load All Events",
        message: err?.response?.data?.detail || err.message,
      });
      setCollegeEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const loadJourney = async () => {
    setLoading(true);
    try {
      const res = await fetchJourney(riderId, {
        page: journeyPage,
        pageSize: journeyPageSize,
      });
      setJourneySummary(res?.summary || null);
      setJourneyRecords(res?.records || []);
      setJourneyTotalPages(res?.pagination?.total_pages || 1);
      setJourneyTotal(res?.pagination?.total || 0);
    } catch (err) {
      setToast({
        type: "error",
        title: "Couldn't load journey",
        message: err?.response?.data?.message || err.message,
      });
      setJourneyRecords([]);
    } finally {
      setLoading(false);
    }
  };

  /* ------------------------------------------------------------------ */
  /* Member entry                                                        */
  /* ------------------------------------------------------------------ */
  const handleMemberSubmit = async (id) => {
    setRiderId(id);
    setCollegePage(1);
    setCollegeStatus("current");
    setCollegeCategory("");
    setJourneyPage(1);
    setJourneySummary(null);
    setJourneyRecords([]);
    setView("list");
    setSelected(null);

    if (source === "college") await loadCollege();
    else if (source === "my") await loadMy();
    else await loadJourney();
  };

  /* ------------------------------------------------------------------ */
  /* Source switch                                                       */
  /* ------------------------------------------------------------------ */
  const handleSourceChange = async (next) => {
    if (next === source) return;
    setSource(next);
    setView("list");
    setSelected(null);
    if (next === "college") await loadCollege();
    else if (next === "my") await loadMy();
    else if (next === "journey") await loadJourney();
  };

  /* ------------------------------------------------------------------ */
  /* Logout                                                              */
  /* ------------------------------------------------------------------ */
  const handleLogout = () => {
    setRiderId("");
    setMyEvents([]);
    setCollegeEvents([]);
    setCollegeMeta(null);
    setJourneySummary(null);
    setJourneyRecords([]);
    setJourneyPage(1);
    setScheduledJobs([]);
    setView("list");
    setSelected(null);
    localStorage.removeItem("bypass_rider");
  };

  /* ------------------------------------------------------------------ */
  /* Event selection                                                     */
  /* ------------------------------------------------------------------ */
  const handleSelectEvent = (ev) => {
    setSelected(ev);
    setView("detail");
  };

  const handleBack = () => {
    setView("list");
    setSelected(null);
  };

  /* ------------------------------------------------------------------ */
  /* Open modal — opts.scheduled decides immediate vs scheduled          */
  /* ------------------------------------------------------------------ */
  const handleAction = (mode, opts = {}) => {
    setModal({
      open: true,
      mode,
      scheduled: !!opts.scheduled,
    });
  };

  const closeModal = () =>
    setModal({ open: false, mode: "in", scheduled: false });

  /* ------------------------------------------------------------------ */
  /* Immediate check-in OR check-out                                     */
  /* ------------------------------------------------------------------ */
  const handleSubmitAction = async ({
    mode,
    eventID,
    riderID,
    address,
    qrCode,
    latitude,
    longitude,
    time,
  }) => {
    /* ---- Guard 1: already checked in ---- */
    if (mode === "in" && isCheckedIn(riderID, eventID)) {
      setToast({
        type: "info",
        title: "Already checked in",
        message: "You have already checked in to this event.",
      });
      closeModal();
      return;
    }

    /* ---- Guard 2: trying to check out without check-in ---- */
    if (mode === "out" && !isCheckedIn(riderID, eventID)) {
      setToast({
        type: "info",
        title: "Not checked in",
        message: "Please check in before checking out.",
      });
      closeModal();
      return;
    }

    setSubmitting(true);
    try {
      const res = await scanActivity({
        mode,
        eventID,
        riderID,
        address,
        qrCode,
        latitude,
        longitude,
        time: toApiTimeRaw(time),
      });
      const ok = String(res?.response) === "true";

      if (ok && mode === "in") {
        setCheckin(riderID, eventID, {
          checkinAt: Date.now(),
          rideName: selected?.rideName,
        });
      }
      if (ok && mode === "out") {
        clearCheckin(riderID, eventID);
      }

      setToast({
        type: ok ? "success" : "error",
        title: ok
          ? mode === "in"
            ? "Checked in"
            : "Checked out"
          : "Action failed",
        message:
          res?.resultStatus ||
          (ok ? "Saved successfully." : "Please try again."),
      });
      if (ok) closeModal();
    } catch (err) {
      setToast({
        type: "error",
        title: "Network error",
        message: err?.response?.data?.resultStatus || err.message,
      });
    } finally {
      setSubmitting(false);
    }
  };

  /* ------------------------------------------------------------------ */
  /* Scheduled check-in OR check-out (server owns the timer)             */
  /* ------------------------------------------------------------------ */
  const handleSchedule = async (payload) => {
    setSubmitting(true);
    try {
      const isIn = payload.mode === "in";

      const existing = scheduledJobs.find(
        (j) =>
          String(j.eventID) === String(payload.eventID) &&
          (j.mode || "out") === payload.mode &&
          (j.status === "delayed" ||
            j.status === "waiting" ||
            j.status === "active")
      );

      const res = await scheduleCheckout(payload);
      if (res?.status !== "success") {
        throw new Error(res?.message || "Failed to schedule");
      }

      await refreshScheduled();

      setToast({
        type: "countdown",
        title: existing
          ? `Auto check-${isIn ? "in" : "out"} rescheduled`
          : `Auto check-${isIn ? "in" : "out"} scheduled`,
        message: existing
          ? `Replaced the previous schedule for ${
              payload.rideName || "this event"
            }.`
          : `We'll auto ${
              isIn ? "check you in to" : "check you out from"
            } ${payload.rideName || "this event"}.`,
        scheduledAt: payload.scheduledAt,
        autoCloseAfter: 8000,
      });

      closeModal();
    } catch (err) {
      setToast({
        type: "error",
        title: "Couldn't schedule",
        message: err?.message || "Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  /* ------------------------------------------------------------------ */
  /* Cancel a scheduled job                                              */
  /* ------------------------------------------------------------------ */
  const handleCancelScheduled = async (jobID) => {
    try {
      await cancelScheduled(jobID);
      await refreshScheduled();
    } catch (err) {
      setToast({
        type: "error",
        title: "Couldn't cancel",
        message: err?.message || "Please try again.",
      });
    }
  };

  /* ------------------------------------------------------------------ */
  /* Join event                                                          */
  /* ------------------------------------------------------------------ */
  const handleJoin = async () => {
    if (!selected) return;
    setJoining(true);
    try {
      const check = await joinEvent({
        rider_id: riderId,
        eventID: selected.challengeID,
        check_only: true,
      });

      if (check?.already_joined === true) {
        setToast({
          type: "info",
          title: "Already joined",
          message: "You're already a member of this event.",
        });
        return;
      }

      const res = await joinEvent({
        rider_id: riderId,
        eventID: selected.challengeID,
        check_only: false,
      });

      const ok = res?.status === "success";
      const already = res?.already_joined === true;

      setToast({
        type: ok ? "success" : "error",
        title: ok
          ? already
            ? "Already joined"
            : "Joined successfully"
          : "Couldn't join",
        message:
          res?.message ||
          (already
            ? "You're already a member of this event."
            : ok
            ? "You've been added to the event."
            : "Please try again."),
      });

      if (ok && source === "college") {
        const fresh = await fetchCollegeEvents(riderId, {
          tab: collegeStatus,
          page: collegePage,
          pageSize: collegePageSize,
          category: collegeCategory,
        });
        setCollegeEvents(fresh?.data?.events || []);
      }
    } catch (err) {
      setToast({
        type: "error",
        title: "Network error",
        message: err?.message || "Could not reach server.",
      });
    } finally {
      setJoining(false);
    }
  };

  /* ------------------------------------------------------------------ */
  /* Derived                                                             */
  /* ------------------------------------------------------------------ */
  const eventsToShow = source === "college" ? collegeEvents : myEvents;

  const selectedCheckedIn = selected
    ? isCheckedIn(riderId, selected.challengeID)
    : false;

  const selectedHasCheckinSchedule = selected
    ? scheduledJobs.some(
        (j) =>
          String(j.eventID) === String(selected.challengeID) &&
          (j.mode || "out") === "in" &&
          (j.status === "delayed" ||
            j.status === "waiting" ||
            j.status === "active")
      )
    : false;

  const selectedHasCheckoutSchedule = selected
    ? scheduledJobs.some(
        (j) =>
          String(j.eventID) === String(selected.challengeID) &&
          (j.mode || "out") === "out" &&
          (j.status === "delayed" ||
            j.status === "waiting" ||
            j.status === "active")
      )
    : false;

  /* ------------------------------------------------------------------ */
  /* Render                                                              */
  /* ------------------------------------------------------------------ */
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar
        riderId={riderId}
        onLogout={handleLogout}
        onSettings={() => setSettingsOpen(true)}
      />

      {riderId && (
        <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 pt-6">
          <SourceTabs value={source} onChange={handleSourceChange} />
        </div>
      )}

      {riderId && (
        <ScheduledPanel
          jobs={scheduledJobs}
          onCancel={handleCancelScheduled}
        />
      )}

      <main className="flex-1">
        {!riderId ? (
          <MemberEntry onSubmit={handleMemberSubmit} loading={loading} />
        ) : loading && eventsToShow.length === 0 && source !== "journey" ? (
          <Loader label="Fetching events…" />
        ) : view === "detail" && selected ? (
          <EventDetail
            event={selected}
            onBack={handleBack}
            onAction={handleAction}
            onJoin={handleJoin}
            joining={joining}
            checkedIn={selectedCheckedIn}
            hasScheduledCheckin={selectedHasCheckinSchedule}
            hasScheduledCheckout={selectedHasCheckoutSchedule}
            collegeMeta={source === "college" ? collegeMeta : null}
          />
        ) : source === "journey" ? (
          <JourneyView
            summary={journeySummary}
            records={journeyRecords}
            loading={loading}
            page={journeyPage}
            totalPages={journeyTotalPages}
            pageSize={journeyPageSize}
            total={journeyTotal}
            onPage={(p) => setJourneyPage(Math.max(1, p))}
            onPageSize={(n) => {
              setJourneyPage(1);
              setJourneyPageSize(n);
            }}
          />
        ) : (
          <EventList
            source={source}
            onSourceChange={handleSourceChange}
            events={eventsToShow}
            onSelect={handleSelectEvent}
            collegeMeta={source === "college" ? collegeMeta : null}
            status={collegeStatus}
            onStatusChange={(s) => {
              setCollegePage(1);
              setCollegeStatus(s);
            }}
            page={collegePage}
            totalPages={collegeMeta?.total_pages || 1}
            pageSize={collegePageSize}
            total={collegeMeta?.total || eventsToShow.length}
            onPage={(p) => setCollegePage(Math.max(1, p))}
            onPageSize={(n) => {
              setCollegePage(1);
              setCollegePageSize(n);
            }}
            categories={collegeMeta?.all_categories || []}
            onCategoryChange={(c) => {
              setCollegePage(1);
              setCollegeCategory(c);
            }}
            loading={loading}
          />
        )}
      </main>

      <footer className="border-t border-ink-100 py-4">
        <p className="text-center text-[11px] text-ink-400">
          ByPass · Campus Check-in Utility
        </p>
      </footer>

      <ActionModal
        open={modal.open}
        mode={modal.mode}
        scheduled={modal.scheduled}
        event={selected || {}}
        riderId={riderId}
        onClose={closeModal}
        onSubmit={handleSubmitAction}
        onSchedule={handleSchedule}
        submitting={submitting}
      />

      <Settings
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        riderId={riderId}
        onToast={setToast}
      />

      {toast?.type === "countdown" ? (
        <CountdownToast toast={toast} onClose={() => setToast(null)} />
      ) : (
        <Toast toast={toast} onClose={() => setToast(null)} />
      )}
    </div>
  );
}