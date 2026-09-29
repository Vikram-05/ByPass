import { useEffect, useState } from "react";
import {
  X,
  Settings as SettingsIcon,
  Loader2,
  RefreshCw,
  Image as ImageIcon,
  Trash2,
  Calendar,
  Hash,
} from "lucide-react";
import { fetchMyPosts, deletePost } from "../api";

export default function Settings({ open, onClose, riderId, onToast }) {
  const [tab, setTab] = useState("posts"); // "posts" for now
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    if (open && riderId) load();
    // eslint-disable-next-line
  }, [open, riderId]);

  useEffect(() => {
    const onEsc = (e) => e.key === "Escape" && onClose();
    if (open) window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [open, onClose]);

const load = async () => {
  setLoading(true);
  try {
    const res = await fetchMyPosts(riderId, {
      page: 1,
      activity: "All",
      key: "myActivities",
      // leave challengeID empty for "all my posts"
    });
    console.log("ress ",res)
    const list = res?.data?.posts || [];
    setPosts(list);

    if (list.length === 0) {
      onToast?.({
        type: "info",
        title: "No posts found",
        message:
          res?.data?.respText ||
          "You haven't posted any activities yet.",
      });
    }
  } catch (err) {
    onToast?.({
      type: "error",
      title: "Couldn't load posts",
      message: err?.response?.data?.detail || err.message,
    });
  } finally {
    setLoading(false);
  }
};
  const handleDelete = async (post) => {
    if (!confirm("Delete this post? This can't be undone.")) return;
    setDeleting(post.activityID);
    try {
      const res = await deletePost({
        rider_id: post.rider_id,
        activityID: post.activityID,
        challengeID: post.challengeID,
      });
      const ok = String(res?.resultStatus) === "true";
      onToast?.({
        type: ok ? "success" : "error",
        title: ok ? "Post deleted" : "Delete failed",
        message:
          res?.reportStatus ||
          (ok ? "Your post has been removed." : "Please try again."),
      });
      if (ok) setPosts((p) => p.filter((x) => x.activityID !== post.activityID));
    } catch (err) {
      onToast?.({
        type: "error",
        title: "Network error",
        message: err?.message || "Could not reach server.",
      });
    } finally {
      setDeleting(null);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="absolute inset-0 bg-ink-950/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full sm:max-w-3xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-ink-100 px-5 sm:px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-ink-900 flex items-center justify-center">
              <SettingsIcon className="w-5 h-5 text-accent-400" />
            </div>
            <div>
              <h3 className="font-semibold text-ink-900 leading-tight">
                Settings
              </h3>
              <p className="text-xs text-ink-500">Manage your account</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-ink-50 transition"
          >
            <X className="w-4 h-4 text-ink-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-5 sm:px-6 pt-4">
          <div className="inline-flex items-center gap-1 p-1 bg-ink-50 rounded-xl">
            <button
              onClick={() => setTab("posts")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                tab === "posts"
                  ? "bg-white text-ink-900 shadow-sm"
                  : "text-ink-600 hover:text-ink-900"
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              My Posts
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          {tab === "posts" && (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs text-ink-500">
                  {posts.length} post{posts.length !== 1 && "s"}
                </p>
                <button
                  onClick={load}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-ink-50 text-ink-700 hover:bg-ink-100 disabled:opacity-50 transition"
                >
                  <RefreshCw
                    className={`w-3 h-3 ${loading ? "animate-spin" : ""}`}
                  />
                  Refresh
                </button>
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <Loader2 className="w-5 h-5 text-ink-400 animate-spin" />
                  <p className="text-sm text-ink-500">Loading posts…</p>
                </div>
              ) : posts.length === 0 ? (
                <div className="text-center py-16 bg-ink-50 rounded-2xl ring-1 ring-ink-100">
                  <ImageIcon className="w-8 h-8 text-ink-300 mx-auto mb-3" />
                  <p className="text-sm text-ink-500">
                    No posts yet. Start sharing your journey!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {posts.map((p) => (
                    <PostCard
                      key={p.activityID}
                      post={p}
                      deleting={deleting === p.activityID}
                      onDelete={() => handleDelete(p)}
                      onOpen={() => setDetail(p)}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {detail && (
        <PostDetailDrawer
          post={detail}
          onClose={() => setDetail(null)}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------------- */
/* Sub-components                                                            */
/* ------------------------------------------------------------------------- */
function PostCard({ post, deleting, onDelete, onOpen }) {
  const img = post.imagesVideos?.[0];
  const isImage = img?.category === "image";

  return (
    <div className="bg-white rounded-2xl ring-1 ring-ink-100 overflow-hidden group">
      <button
        onClick={onOpen}
        className="block w-full aspect-video bg-ink-100 overflow-hidden relative"
      >
        {isImage ? (
          <img
            src={img.filepath}
            alt=""
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-ink-300">
            <ImageIcon className="w-8 h-8" />
          </div>
        )}
        {post.category && (
          <span className="absolute top-2 left-2 text-[10px] font-semibold uppercase tracking-wide bg-white/90 backdrop-blur px-2 py-1 rounded-md text-ink-700">
            {post.category}
          </span>
        )}
      </button>

      <div className="p-3.5">
        <p className="text-xs text-ink-800 line-clamp-2">{post.description}</p>

        <div className="flex items-center gap-3 mt-2.5 text-[11px] text-ink-500">
          <span className="inline-flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {post.activityDate}
          </span>
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-ink-50">
          <span className="inline-flex items-center gap-1 text-[10px] font-mono text-ink-400 truncate max-w-[60%]">
            <Hash className="w-3 h-3" />
            {post.activityID}
          </span>
          <button
            onClick={onDelete}
            disabled={deleting}
            className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-lg text-rose-600 hover:bg-rose-50 disabled:opacity-50 transition"
          >
            {deleting ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Trash2 className="w-3 h-3" />
            )}
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

function PostDetailDrawer({ post, onClose }) {
  const img = post.imagesVideos?.[0];
  const isImage = img?.category === "image";

  return (
    <div className="absolute inset-0 z-20 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="absolute inset-0 bg-ink-950/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto animate-fade-up">
        <div className="relative">
          {isImage ? (
            <img
              src={img.filepath}
              alt=""
              className="w-full max-h-72 object-cover rounded-t-3xl"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
          ) : (
            <div className="w-full h-56 bg-ink-100 flex items-center justify-center text-ink-300 rounded-t-3xl">
              <ImageIcon className="w-8 h-8" />
            </div>
          )}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 rounded-lg bg-white/90 backdrop-blur hover:bg-white transition"
          >
            <X className="w-4 h-4 text-ink-700" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-3">
          <h3 className="text-sm font-semibold text-ink-900">
            {post.challengeName || post.title || "Post"}
          </h3>
          <p className="text-xs text-ink-600 leading-relaxed whitespace-pre-line">
            {post.description}
          </p>
          <div className="text-[11px] text-ink-400 pt-3 border-t border-ink-50 space-y-1">
            <p>
              <span className="text-ink-500">Posted:</span> {post.activityDate}
            </p>
            <p>
              <span className="text-ink-500">Activity ID:</span>{" "}
              <span className="font-mono">{post.activityID}</span>
            </p>
            <p>
              <span className="text-ink-500">Event:</span>{" "}
              <span className="font-mono">{post.challengeID}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}