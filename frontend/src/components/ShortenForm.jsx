import { useState } from "react";

/**
 * URL input form with a "Shorten" button.
 * @param {{ onShorten: (url: string) => Promise<void>, isLoading: boolean }} props
 */
const ShortenForm = ({ onShorten, isLoading }) => {
  const [url, setUrl] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url.trim()) return;
    await onShorten(url.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-full max-w-3xl">
      <input
        id="url-input"
        type="text"
        className="input input-success w-full"
        placeholder="Enter long URL"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        disabled={isLoading}
      />
      <button
        id="shorten-btn"
        type="submit"
        className={`btn btn-primary w-full ${isLoading ? "loading" : ""}`}
        disabled={isLoading}
      >
        {isLoading ? "Shortening..." : "Shorten"}
      </button>
    </form>
  );
};

export default ShortenForm;
