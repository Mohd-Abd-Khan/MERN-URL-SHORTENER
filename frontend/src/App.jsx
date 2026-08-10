import React, { useState } from 'react'
import axios from "axios";
import QRCode from "react-qr-code";
import QRCodeGenerator from "qrcode";

const API_BASE_URL=import.meta.env.VITE_BACKEND_URL;

const App = () => {
  const [url,seturl] = useState("");
  const [shortUrl, setshortUrl] = useState("");
  const [copied, setcopied] = useState(false);
  const [qrImage, setqrImage] = useState("");
  const [loading, setloading] = useState(false);

  const handleShorten = async ()=>{
    if(!url || loading)return;
    setloading(true);

    try{
      const res = await axios.post(`${API_BASE_URL}/shortener`,{
        originalUrl: url
      });
      const newShortUrl = res.data.shortUrl;
      setshortUrl(newShortUrl);
      setcopied(false);

      const qr = await QRCodeGenerator.toDataURL(newShortUrl);

      setqrImage(qr);

    } catch(err){
      console.log(err);
      alert(err.response?.data?.error || "Something went wrong");
    }finally{
      setloading(false);
    }
  }

  const handleCopy = ()=>{
    navigator.clipboard.writeText(shortUrl);
    setcopied(true);
    setTimeout(()=>setcopied(false),2000);
  }

  return (
  <div className="min-h-screen flex flex-col items-center justify-center p-6 gap-6">
    <h1 className="text-4xl font-bold mb-4 text-center">URL SHORTENER</h1>
    <div className="flex flex-col gap-3 w-full max-w-3xl">
      <input
        type="text"
        className="input input-success w-full"
        placeholder="Enter long URL"
        value={url}
        onChange={(e) => seturl(e.target.value)}
      />
      <button
        onClick={handleShorten}
        className="btn btn-primary w-full sm:auto"
        disabled={loading}
      >
        Shorten
      </button>
    </div>
    {shortUrl && (
  <div className="flex flex-col items-center max-w-3xl w-full">
    <p className="font-medium mb-2">Your short link:</p>

    <a
      className="link link-primary break-all"
      target='_blank'
      href={shortUrl}
    >
      {shortUrl}
    </a>

    <button
      onClick={handleCopy}
      className={`btn mt-2 w-full ${
        copied ? "btn-success" : "btn-secondary"
      }`}
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
        className="btn btn-accent mt-3 w-full"
        download="qr-code.png" 
        href={qrImage}>
          Download QR Code
        </a>
    )}
  </div>
)}
  </div>
);
}

export default App