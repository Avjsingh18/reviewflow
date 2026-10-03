import { NextRequest, NextResponse } from "next/server";
import { error, requireUser } from "@/lib/api";

type Place = { id: string; name: string; address: string; rating: number | null; reviewCount: number | null; mapsUrl: string | null; distanceMeters: number | null };

const categoryTypes: Record<string, string[]> = {
  cafe: ["cafe"], restaurant: ["restaurant"], hotel: ["hotel"], salon: ["beauty_salon", "hair_salon"],
  clinic: ["doctor"], "coaching centre": ["school"], "plant nursery": ["garden_center"], gym: ["gym"],
};

const demoPlaces: Record<string, Place[]> = {
  cafe: [{ id:"demo-cafe-1", name:"The Daily Grind", address:"Nearby", rating:4.7, reviewCount:182, mapsUrl:null, distanceMeters:420 }, { id:"demo-cafe-2", name:"Bean Street Café", address:"Nearby", rating:4.6, reviewCount:96, mapsUrl:null, distanceMeters:780 }],
  restaurant: [{ id:"demo-restaurant-1", name:"Spice Garden", address:"Nearby", rating:4.6, reviewCount:438, mapsUrl:null, distanceMeters:610 }, { id:"demo-restaurant-2", name:"The Terrace Kitchen", address:"Nearby", rating:4.5, reviewCount:271, mapsUrl:null, distanceMeters:1200 }],
  hotel: [{ id:"demo-hotel-1", name:"Hotel Grand Stay", address:"Nearby", rating:4.4, reviewCount:687, mapsUrl:null, distanceMeters:1100 }, { id:"demo-hotel-2", name:"City View Residency", address:"Nearby", rating:4.3, reviewCount:402, mapsUrl:null, distanceMeters:1900 }],
  salon: [{ id:"demo-salon-1", name:"Glow Studio", address:"Nearby", rating:4.8, reviewCount:211, mapsUrl:null, distanceMeters:340 }, { id:"demo-salon-2", name:"Style Lounge", address:"Nearby", rating:4.7, reviewCount:148, mapsUrl:null, distanceMeters:940 }],
};

function distanceMeters(latitude: number, longitude: number, placeLatitude?: number, placeLongitude?: number) {
  if (placeLatitude == null || placeLongitude == null) return null;
  const radians = (value: number) => value * Math.PI / 180;
  const deltaLatitude = radians(placeLatitude - latitude); const deltaLongitude = radians(placeLongitude - longitude);
  const a = Math.sin(deltaLatitude / 2) ** 2 + Math.cos(radians(latitude)) * Math.cos(radians(placeLatitude)) * Math.sin(deltaLongitude / 2) ** 2;
  return Math.round(6_371_000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export async function GET(request: NextRequest) {
  const auth = await requireUser(request); if ("response" in auth) return auth.response;
  const category = request.nextUrl.searchParams.get("category") || "cafe";
  const radiusKm = Number(request.nextUrl.searchParams.get("radiusKm") || 3);
  if (!categoryTypes[category]) return error("Choose a valid business category.");
  if (![1, 3, 5].includes(radiusKm)) return error("Choose a 1 km, 3 km, or 5 km radius.");

  const { data: business, error: businessError } = await auth.supabase.from("businesses").select("latitude,longitude").eq("user_id", auth.user.id).maybeSingle();
  if (businessError) return error("The local-location database migration has not been applied yet.", 409);
  if (!business) return error("Complete onboarding to create your business.", 404);
  if (business.latitude == null || business.longitude == null) return error("Add your business location in Settings before searching local competitors.", 409);

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return NextResponse.json({ source:"demo", places:demoPlaces[category] || [{ id:"demo-1", name:`Example ${category}`, address:"Nearby", rating:4.6, reviewCount:100, mapsUrl:null, distanceMeters:550 }], radiusKm });

  try {
    const response = await fetch("https://places.googleapis.com/v1/places:searchNearby", {
      method:"POST",
      headers:{ "Content-Type":"application/json", "X-Goog-Api-Key":apiKey, "X-Goog-FieldMask":"places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.googleMapsUri,places.location" },
      body:JSON.stringify({ includedTypes:categoryTypes[category], maxResultCount:20, rankPreference:"DISTANCE", locationRestriction:{ circle:{ center:{ latitude:business.latitude, longitude:business.longitude }, radius:radiusKm * 1000 } } }),
      cache:"no-store",
    });
    if (!response.ok) throw new Error(`Places search returned ${response.status}`);
    const payload = await response.json() as { places?: Array<{ id?: string; displayName?: { text?: string }; formattedAddress?: string; rating?: number; userRatingCount?: number; googleMapsUri?: string; location?: { latitude?: number; longitude?: number } }> };
    const places: Place[] = (payload.places || []).map((place) => ({
      id:place.id || crypto.randomUUID(), name:place.displayName?.text || "Unnamed business", address:place.formattedAddress || "Nearby",
      rating:place.rating ?? null, reviewCount:place.userRatingCount ?? null, mapsUrl:place.googleMapsUri || null,
      distanceMeters:distanceMeters(business.latitude, business.longitude, place.location?.latitude, place.location?.longitude),
    }));
    return NextResponse.json({ source:"google_places", places, radiusKm });
  } catch { return error("We couldn’t load local benchmark data. Check the Google Places API key and try again.", 502); }
}
