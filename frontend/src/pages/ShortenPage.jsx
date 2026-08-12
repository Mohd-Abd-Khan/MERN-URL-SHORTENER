import { useState, useEffect, useCallback } from "react";
import QRCodeGenerator from "qrcode";
import QRCode from "react-qr-code";
import ShortenForm from "../components/ShortenForm";
import ShortenResult from "../components/ShortenResult";
import { shortenUrl } from "../api/urlApi";
import { fetchMyUrls } from "../api/dashboardApi";
import { useAuth } from "../context/useAuth";

/**
 * Page 2 — Protected URL Shortener Page.
 * Combines the URL shorten form, instant QR generator, and user link history / click analytics.
 * Accessible only to authenticated users (wrapped in ProtectedRoute).
 */
const ShortenPage = () => {
  const { user } = useAuth();

  // Shorten form states
  const [shortUrl, setShortUrl] = useState("");
  const [qrImage, setQrImage] = useState("");
  const [isShortening, setIsShortening] = useState(false);
  const [shortenError, setShortenError] = useState("");

  // History & dashboard states
  const [urls, setUrls] = useState([]);
  const [isLoadingUrls, setIsLoadingUrls] = useState(true);
  const [historyError, setHistoryError] = useState("");
  const [copiedId, setCopiedId] = useState(null);
  const [activeQrUrl, setActiveQrUrl] = useState(null);

  // Helper to refresh URL list
  const refreshUrls = useCallback(async () => {
    setIsLoadingUrls(true);
    try {
      const data = await fetchMyUrls();
      setUrls(data);
      setHistoryError("");
    } catch (err) {
      setHistoryError(
        err.response?.data?.error || "Failed to load your links. Please try again."
      );
    } finally {
      setIsLoadingUrls(false);
    }
  }, []);

  // Initial load on mount using safe async effect pattern
  useEffect(() => {
    let isMounted = true;

    fetchMyUrls()
      .then((data) => {
        if (isMounted) {
          setUrls(data);
          setHistoryError("");
        }
      })
      .catch((err) => {
        if (isMounted) {
          setHistoryError(
            err.response?.data?.error || "Failed to load your links. Please try again."
          );
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingUrls(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Handle URL shorten submission
  const handleShorten = async (url) => {
    setIsShortening(true);
    setShortenError("");
    try {
      const newShortUrl = await shortenUrl(url);
      setShortUrl(newShortUrl);

      const qr = await QRCodeGenerator.toDataURL(newShortUrl);
      setQrImage(qr);

      // Automatically refresh history list after shortening
      await refreshUrls();
    } catch (err) {
      console.error(err);
      setShortenError(
        err.response?.data?.error || "Failed to shorten URL. Please check the link and try again."
      );
    } finally {
      setIsShortening(false);
    }
  };

  const handleCopy = (urlToCopy, id) => {
    navigator.clipboard.writeText(urlToCopy);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const totalClicks = urls.reduce((acc, curr) => acc + (curr.clicks || 0), 0);

  return (
    <div className="min-h-screen p-4 sm:p-6 max-w-6xl mx-auto flex flex-col gap-10">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-base-300 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">URL Shortener & Dashboard</h1>
          <p className="text-base-content/70 mt-1">
            Welcome back, <span className="font-semibold text-primary">{user?.name || user?.email}</span>! Shorten links and track engagement.
          </p>
        </div>
      </div>

      {/* Shorten Tool Section */}
      <div className="card bg-base-200/80 backdrop-blur-md border border-base-300 shadow-xl p-6 sm:p-8 flex flex-col items-center gap-6">
        <div className="text-center max-w-xl">
          <h2 className="text-2xl font-bold mb-2">Shorten a New Link</h2>
          <p className="text-sm text-base-content/70">
            Paste your long URL below to create a shortened link and instant QR code.
          </p>
        </div>

        <ShortenForm onShorten={handleShorten} isLoading={isShortening} />

        {shortenError && (
          <div className="alert alert-error max-w-3xl w-full">
            <span>{shortenError}</span>
          </div>
        )}

        <ShortenResult shortUrl={shortUrl} qrImage={qrImage} />
      </div>

      {/* Analytics Overview */}
      <div className="stats shadow bg-base-200/80 backdrop-blur-md w-full border border-base-300">
        <div className="stat">
          <div className="stat-title">Total Short Links</div>
          <div className="stat-value text-primary">{urls.length}</div>
          <div className="stat-desc">Created in your account</div>
        </div>
        <div className="stat">
          <div className="stat-title">Total Clicks</div>
          <div className="stat-value text-secondary">{totalClicks}</div>
          <div className="stat-desc">Clicks across all active links</div>
        </div>
      </div>

      {/* My Links History Section */}
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Your Shortened Links</h2>
          <button onClick={refreshUrls} className="btn btn-ghost btn-sm gap-2">
            🔄 Refresh History
          </button>
        </div>

        {/* Error State */}
        {historyError && (
          <div className="alert alert-error">
            <span>{historyError}</span>
            <button onClick={refreshUrls} className="btn btn-xs btn-outline">
              Retry
            </button>
          </div>
        )}

        {/* Loading State */}
        {isLoadingUrls ? (
          <div className="flex justify-center p-12 bg-base-200/40 rounded-box border border-base-300">
            <span className="loading loading-spinner loading-lg text-primary"></span>
          </div>
        ) : urls.length === 0 ? (
          /* Empty State */
          <div className="card bg-base-200/50 p-12 text-center items-center border border-dashed border-base-300">
            <svg className="w-16 h-16 opacity-30 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
            </svg>
            <h3 className="text-xl font-bold mb-2">No links created yet</h3>
            <p className="text-base-content/60 max-w-md">
              Shorten your first URL above to start tracking clicks and generating QR codes.
            </p>
          </div>
        ) : (
          /* Table of URLs */
          <div className="overflow-x-auto bg-base-200/80 backdrop-blur-md rounded-box border border-base-300 shadow-xl">
            <table className="table w-full">
              <thead>
                <tr className="border-b border-base-300 text-sm">
                  <th>Short URL</th>
                  <th>Original Destination</th>
                  <th className="text-center">Clicks</th>
                  <th>Created Date</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {urls.map((item) => {
                  const fullShortUrl = `${import.meta.env.VITE_BACKEND_URL}/${item.shortId}`;
                  return (
                    <tr key={item._id} className="hover:bg-base-300/40">
                      <td>
                        <a
                          href={fullShortUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="link link-primary font-mono font-semibold"
                        >
                          /{item.shortId}
                        </a>
                      </td>
                      <td className="max-w-xs truncate" title={item.originalUrl}>
                        <span className="text-base-content/80">{item.originalUrl}</span>
                      </td>
                      <td className="text-center">
                        <span className="badge badge-secondary badge-outline font-bold">
                          {item.clicks}
                        </span>
                      </td>
                      <td className="text-sm text-base-content/60">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </td>
                      <td className="text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleCopy(fullShortUrl, item._id)}
                            className={`btn btn-xs ${copiedId === item._id ? "btn-success" : "btn-outline"}`}
                          >
                            {copiedId === item._id ? "Copied!" : "Copy"}
                          </button>
                          <button
                            onClick={() => setActiveQrUrl(fullShortUrl)}
                            className="btn btn-xs btn-outline btn-accent"
                          >
                            QR Code
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* QR Code Modal */}
      {activeQrUrl && (
        <dialog className="modal modal-open">
          <div className="modal-box text-center flex flex-col items-center">
            <h3 className="font-bold text-lg mb-4">Link QR Code</h3>
            <div className="bg-white p-4 rounded-lg shadow mb-4">
              <QRCode value={activeQrUrl} size={200} />
            </div>
            <p className="text-xs font-mono break-all text-base-content/70 mb-4">
              {activeQrUrl}
            </p>
            <div className="modal-action">
              <button
                onClick={() => setActiveQrUrl(null)}
                className="btn btn-sm"
              >
                Close
              </button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button onClick={() => setActiveQrUrl(null)}>close</button>
          </form>
        </dialog>
      )}
    </div>
  );
};

export default ShortenPage;
