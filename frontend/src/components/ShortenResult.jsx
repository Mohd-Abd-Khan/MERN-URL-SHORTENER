import { useState } from "react";
import QRCode from "react-qr-code";

/**
 * Displays the shortened URL result with copy button, QR code, and QR download.
 * @param {{ shortUrl: string, qrImage: string }} props
 */
const ShortenResult = ({ shortUrl, qrImage }) => {
  const [copied, setCopied] = useState(false);

  if (!shortUrl) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col items-center max-w-3xl w-full">
      <p className="font-medium mb-2">Your short link:</p>

      <a
        id="short-url-link"
        className="link link-primary break-all"
        href={shortUrl}
        target="_blank"
        rel="noopener noreferrer"
      >
        {shortUrl}
      </a>

      <button
        id="copy-btn"
        onClick={handleCopy}
        className={`btn mt-2 w-full ${copied ? "btn-success" : "btn-secondary"}`}
      >
        {copied ? "Copied!" : "Copy"}
      </button>

      <div className="bg-white p-4 rounded-lg shadow mt-6">
        <p className="mb-2 text-center font-semibold text-gray-800">
          Scan QR Code:
        </p>
        <QRCode value={shortUrl} size={180} />
      </div>

      {qrImage && (
        <a
          id="download-qr-btn"
          className="btn btn-accent mt-3 w-full"
          download="qr-code.png"
          href={qrImage}
        >
          Download QR Code
        </a>
      )}
    </div>
  );
};

export default ShortenResult;
