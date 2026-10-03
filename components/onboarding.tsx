"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, Crosshair, Link as LinkIcon, MapPin } from "lucide-react";

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState(localStorageSafe("reviewflow_business"));
  const [url, setUrl] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);
  const urlRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function requestLocation() {
    if (!navigator.geolocation) return setError("This browser does not support location. Enter coordinates manually.");
    setLocating(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => { setLatitude(String(coords.latitude)); setLongitude(String(coords.longitude)); setLocating(false); },
      () => { setLocating(false); setError("We couldn’t get your location. Allow location access or enter the coordinates manually."); },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    );
  }

  async function next() {
    const businessName = nameRef.current?.value || name;
    const reviewUrl = urlRef.current?.value || url;
    if (step === 1) {
      if (!businessName.trim()) return setError("Enter your business name.");
      setName(businessName); setError(""); setStep(2); return;
    }
    if (step === 2) {
      if (!/^https?:\/\/.+/.test(reviewUrl)) return setError("Paste a valid Google review URL.");
      try {
        const token = localStorage.getItem("reviewflow_token");
        const response = await fetch("/api/business", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ name: businessName, googleReviewUrl: reviewUrl }) });
        if (!response.ok) throw new Error();
        setUrl(reviewUrl); setError(""); setStep(3);
      } catch { setError("Couldn’t save your business. Please try again."); }
      return;
    }
    if (step === 3) {
      const parsedLatitude = Number(latitude); const parsedLongitude = Number(longitude);
      if (!Number.isFinite(parsedLatitude) || !Number.isFinite(parsedLongitude) || parsedLatitude < -90 || parsedLatitude > 90 || parsedLongitude < -180 || parsedLongitude > 180) return setError("Share your location or enter valid latitude and longitude.");
      try {
        const token = localStorage.getItem("reviewflow_token");
        const response = await fetch("/api/business", { method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ name: businessName, googleReviewUrl: reviewUrl, latitude: parsedLatitude, longitude: parsedLongitude }) });
        if (!response.ok) throw new Error();
        await fetch("/api/business/qr", { method: "POST", headers: { Authorization: `Bearer ${token}` } });
        setError(""); setStep(4);
      } catch { setError("Couldn’t save your business location. Please try again."); }
      return;
    }
    router.push("/dashboard");
  }

  return <main className="onboard"><div className="onboard-top"><span className="brand"><span>✦</span> reviewflow</span><span>Step {step} of 4</span></div><div className="progress"><i style={{ width: `${step / 4 * 100}%` }} /></div><section>
    {step === 1 ? <><p className="eyebrow">LET’S GET STARTED</p><h1>What&apos;s your business called?</h1><p className="muted">This is the name your customers will see on your QR poster.</p><label>Business name<input ref={nameRef} value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Melbourne Coffee House" autoFocus /></label></> : null}
    {step === 2 ? <><p className="eyebrow">CONNECT GOOGLE</p><h1>Paste your Google review link</h1><p className="muted">Customers will be sent directly here — no forms or sign-in screens.</p><label>Google review URL<div className="input-icon"><LinkIcon /><input ref={urlRef} value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://g.page/r/…/review" autoFocus /></div></label><small>Find this in your Google Business Profile → Ask for reviews.</small></> : null}
    {step === 3 ? <><p className="eyebrow">YOUR BUSINESS LOCATION</p><h1>Where is your business located?</h1><p className="muted">We use this only to compare you with similar businesses within 1 km, 3 km, or 5 km.</p><button type="button" className="outline" onClick={requestLocation} disabled={locating}><Crosshair />{locating ? "Finding your location…" : "Use my current location"}</button><div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginTop:14 }}><label style={{ marginTop:0 }}>Latitude<input type="number" inputMode="decimal" value={latitude} onChange={(event) => setLatitude(event.target.value)} placeholder="e.g. 25.5941" /></label><label style={{ marginTop:0 }}>Longitude<input type="number" inputMode="decimal" value={longitude} onChange={(event) => setLongitude(event.target.value)} placeholder="e.g. 85.1376" /></label></div><small><MapPin />You can update this later in Settings.</small></> : null}
    {step === 4 ? <div className="success"><CheckCircle2 /><p className="eyebrow">YOU’RE READY</p><h1>Your review QR code is live.</h1><p className="muted">Your nearby benchmark is ready too — compare local businesses whenever you need.</p></div> : null}
    {error ? <p className="form-error">{error}</p> : null}
    <div className="onboard-actions">{step > 1 && step < 4 ? <button className="back" onClick={() => setStep(step - 1)}><ArrowLeft />Back</button> : <span />}<button className="button" onClick={next}>{step === 4 ? "Go to dashboard" : step === 3 ? "Save location and generate QR" : step === 2 ? "Continue" : "Continue"}<ArrowRight /></button></div>
  </section></main>;
}

function localStorageSafe(key: string) { if (typeof window === "undefined") return ""; return localStorage.getItem(key) || ""; }
