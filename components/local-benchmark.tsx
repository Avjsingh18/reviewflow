"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink, MapPin, Search, Star, Trophy } from "lucide-react";
import styles from "./local-benchmark.module.css";

const categories = [{ value:"cafe", label:"Cafés" }, { value:"restaurant", label:"Restaurants" }, { value:"hotel", label:"Hotels" }, { value:"salon", label:"Salons" }, { value:"clinic", label:"Clinics" }, { value:"coaching centre", label:"Coaching centres" }, { value:"plant nursery", label:"Nurseries" }, { value:"gym", label:"Gyms" }];
type Place = { id:string; name:string; address:string; rating:number|null; reviewCount:number|null; mapsUrl:string|null; distanceMeters:number|null };
type SortBy = "reviews" | "rating";

function displayDistance(meters: number | null) { if (meters == null) return "—"; return meters < 1000 ? `${meters} m` : `${(meters / 1000).toFixed(1)} km`; }

export default function LocalBenchmark() {
  const [category, setCategory] = useState("cafe"); const [radiusKm, setRadiusKm] = useState(3); const [sortBy, setSortBy] = useState<SortBy>("reviews");
  const [places, setPlaces] = useState<Place[]>([]); const [source, setSource] = useState<"google_places" | "demo" | null>(null); const [loading, setLoading] = useState(false); const [message, setMessage] = useState(""); const [hasLocation, setHasLocation] = useState(false);
  const categoryLabel = categories.find((item) => item.value === category)?.label ?? category;
  const sortedPlaces = useMemo(() => [...places].sort((first, second) => sortBy === "rating" ? (second.rating ?? 0) - (first.rating ?? 0) || (second.reviewCount ?? 0) - (first.reviewCount ?? 0) : (second.reviewCount ?? 0) - (first.reviewCount ?? 0) || (second.rating ?? 0) - (first.rating ?? 0)), [places, sortBy]);

  useEffect(() => {
    const token = localStorage.getItem("reviewflow_token");
    fetch("/api/business", { headers:{ Authorization:`Bearer ${token}` } }).then((response) => response.ok ? response.json() : null).then((business) => setHasLocation(Boolean(business && business.latitude != null && business.longitude != null))).catch(() => setHasLocation(false));
  }, []);

  async function search(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setMessage("");
    try {
      const token = localStorage.getItem("reviewflow_token");
      const response = await fetch(`/api/benchmark?category=${encodeURIComponent(category)}&radiusKm=${radiusKm}`, { headers:{ Authorization:`Bearer ${token}` } });
      const data = await response.json(); if (!response.ok) throw new Error(data.error);
      setPlaces(data.places); setSource(data.source);
    } catch (cause) { setPlaces([]); setSource(null); setMessage(cause instanceof Error ? cause.message : "Couldn’t load nearby businesses."); }
    finally { setLoading(false); }
  }

  return <main className={styles.page}><header className={styles.header}><Link href="/dashboard" className={styles.backLink}><ArrowLeft aria-hidden="true" />Back to dashboard</Link><h1>See how similar businesses compare nearby</h1><p>Compare Google ratings and review counts within a chosen radius of your business.</p></header>
    {hasLocation === false ? <section className={styles.locationNeeded}><MapPin aria-hidden="true" /><div><strong>Add your business location first</strong><p>ReviewFlow needs your latitude and longitude to search businesses within 1 km, 3 km, or 5 km of you.</p></div><Link href="/settings">Add location</Link></section> : null}
    <section className={styles.searchCard} aria-label="Search local businesses"><form className={styles.form} onSubmit={search}><label className={styles.field}><span>Business category</span><select value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label><label className={styles.field}><span>Search radius</span><select value={radiusKm} onChange={(event) => setRadiusKm(Number(event.target.value))}><option value={1}>Within 1 km</option><option value={3}>Within 3 km</option><option value={5}>Within 5 km</option></select></label><button className={styles.searchButton} disabled={loading || hasLocation !== true} type="submit"><Search aria-hidden="true" />{loading ? "Searching…" : "Find businesses"}</button></form></section>
    {message ? <p className={styles.error}>{message}</p> : null}
    {source === "demo" ? <section className={styles.notice}><Trophy aria-hidden="true" /><div><strong>Demo preview</strong><p>Connect Google Places before launch to show live nearby businesses. These results are not live Google data.</p></div></section> : null}
    {places.length > 0 ? <section className={styles.results}><div className={styles.resultsHeader}><div><h2>{sortBy === "reviews" ? "Most reviewed" : "Highest rated"} {categoryLabel.toLowerCase()} within {radiusKm} km</h2><p>{source === "google_places" ? "Live Google Places search" : "Preview results"} · {places.length} businesses found</p></div><label className={styles.sortControl}><span>Rank by</span><select value={sortBy} onChange={(event) => setSortBy(event.target.value as SortBy)}><option value="reviews">Most reviews</option><option value="rating">Highest rating</option></select></label></div><div className={styles.table}><div className={`${styles.row} ${styles.rowHead}`}><span>Rank</span><span>Business</span><span>Distance</span><span>Rating</span><span>Reviews</span></div>{sortedPlaces.map((place, index) => <div className={styles.row} key={place.id}><b className={styles.rank}>#{index + 1}</b><div className={styles.business}><strong>{place.name}</strong><small>{place.address}</small></div><span className={styles.distance}>{displayDistance(place.distanceMeters)}</span><span className={styles.rating}><Star aria-hidden="true" />{place.rating?.toFixed(1) ?? "—"}</span><span className={styles.reviewCount}>{place.reviewCount?.toLocaleString() ?? "—"}{place.mapsUrl ? <a href={place.mapsUrl} target="_blank" rel="noreferrer" aria-label={`Open ${place.name} on Google Maps`}><ExternalLink aria-hidden="true" /></a> : null}</span></div>)}</div></section> : null}
  </main>;
}
