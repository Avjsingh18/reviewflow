"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Crosshair, Lock, MapPin, Save } from "lucide-react";

const api = "";

export default function Settings() {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [locating, setLocating] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const headers = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("reviewflow_token")}` });

  useEffect(() => {
    fetch(`${api}/api/business`, { headers: headers() }).then((response) => response.json()).then((business) => {
      setName(business.name ?? ""); setUrl(business.googleReviewUrl ?? "");
      setLatitude(business.latitude == null ? "" : String(business.latitude)); setLongitude(business.longitude == null ? "" : String(business.longitude));
    }).catch(() => setError("Please sign in again."));
  }, []);

  function requestLocation() {
    if (!navigator.geolocation) return setError("This browser does not support location. Enter coordinates manually.");
    setLocating(true); setError("");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => { setLatitude(String(coords.latitude)); setLongitude(String(coords.longitude)); setLocating(false); },
      () => { setLocating(false); setError("We couldn’t get your location. Allow location access or enter the coordinates manually."); },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    );
  }

  async function business(event: React.FormEvent) {
    event.preventDefault(); setMessage(""); setError("");
    const parsedLatitude = Number(latitude); const parsedLongitude = Number(longitude);
    if (!Number.isFinite(parsedLatitude) || !Number.isFinite(parsedLongitude) || parsedLatitude < -90 || parsedLatitude > 90 || parsedLongitude < -180 || parsedLongitude > 180) return setError("Enter a valid business location.");
    const response = await fetch(`${api}/api/business`, { method:"PUT", headers:headers(), body:JSON.stringify({ name, googleReviewUrl:url, latitude:parsedLatitude, longitude:parsedLongitude }) });
    if (!response.ok) return setError("Enter a valid Google review URL and business location.");
    setMessage("Business details and location saved.");
  }

  async function password(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage(""); setError(""); const form = new FormData(event.currentTarget);
    if (form.get("new") !== form.get("confirm")) return setError("New passwords do not match.");
    const response = await fetch(`${api}/api/auth/change-password`, { method:"POST", headers:headers(), body:JSON.stringify({ currentPassword:form.get("current"), newPassword:form.get("new") }) });
    if (!response.ok) return setError("Current password is incorrect or the new password is too short.");
    event.currentTarget.reset(); setMessage("Password updated.");
  }

  return <main className="settings"><Link href="/dashboard" className="back-link"><ArrowLeft />Back to dashboard</Link><div><p className="eyebrow">SETTINGS</p><h1>Account settings</h1><p className="muted">Keep your review link, business location, and account secure.</p></div>{error ? <p className="form-error">{error}</p> : null}{message ? <p className="settings-success"><Check />{message}</p> : null}
    <section className="card settings-card"><h2>Business details</h2><form onSubmit={business}><label>Business name<input value={name} onChange={(event) => setName(event.target.value)} required /></label><label>Google review URL<input value={url} onChange={(event) => setUrl(event.target.value)} required type="url" /></label><div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:12, marginTop:18 }}><div><b style={{ fontSize:13 }}>Business location</b><p className="muted" style={{ marginTop:4 }}>Used for your local competitor radius.</p></div><button type="button" className="outline" onClick={requestLocation} disabled={locating}><Crosshair />{locating ? "Finding…" : "Use my location"}</button></div><div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}><label>Latitude<input type="number" inputMode="decimal" value={latitude} onChange={(event) => setLatitude(event.target.value)} required /></label><label>Longitude<input type="number" inputMode="decimal" value={longitude} onChange={(event) => setLongitude(event.target.value)} required /></label></div><p className="muted" style={{ fontSize:12, marginTop:10 }}><MapPin style={{ width:14, verticalAlign:"-2px" }} /> Location is never shown to other businesses.</p><button className="button"><Save />Save business details</button></form></section>
    <section className="card settings-card"><h2>Change password</h2><form onSubmit={password}><label>Current password<input name="current" required type="password" /></label><label>New password<input name="new" required minLength={8} type="password" /></label><label>Confirm new password<input name="confirm" required minLength={8} type="password" /></label><button className="outline"><Lock />Update password</button></form></section>
  </main>;
}
