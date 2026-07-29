"use client";
import { useEffect, useRef } from "react";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";

const MAP_STYLES: google.maps.MapTypeStyle[] = [
  { featureType: "all", elementType: "labels", stylers: [{ visibility: "on" }] },
  { featureType: "all", elementType: "labels.text.fill", stylers: [{ saturation: 36 }, { color: "#000000" }, { lightness: 40 }] },
  { featureType: "all", elementType: "labels.text.stroke", stylers: [{ visibility: "on" }, { color: "#000000" }, { lightness: 16 }] },
  { featureType: "all", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { featureType: "administrative", elementType: "geometry.fill", stylers: [{ color: "#000000" }, { lightness: 20 }] },
  { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#000000" }, { lightness: 17 }, { weight: 1.2 }] },
  { featureType: "administrative.country", elementType: "labels.text.fill", stylers: [{ color: "#ff6b00" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#c4c4c4" }] },
  { featureType: "administrative.neighborhood", elementType: "labels.text.fill", stylers: [{ color: "#ff6b00" }] },
  { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#000000" }, { lightness: 15 }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#000000" }, { lightness: 21 }, { visibility: "on" }] },
  { featureType: "poi.business", elementType: "geometry", stylers: [{ visibility: "on" }] },
  { featureType: "road.highway", elementType: "geometry.fill", stylers: [{ color: "#ff6b00" }, { lightness: 0 }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ visibility: "off" }] },
  { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#ffffff" }] },
  { featureType: "road.highway", elementType: "labels.text.stroke", stylers: [{ color: "#ff6b00" }] },
  { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#000000" }, { lightness: 18 }] },
  { featureType: "road.arterial", elementType: "geometry.fill", stylers: [{ color: "#ff6b00" }] },
  { featureType: "road.arterial", elementType: "labels.text.fill", stylers: [{ color: "#ffffff" }] },
  { featureType: "road.arterial", elementType: "labels.text.stroke", stylers: [{ color: "#2c2c2c" }] },
  { featureType: "road.local", elementType: "geometry", stylers: [{ color: "#000000" }, { lightness: 25 }] },
  { featureType: "road.local", elementType: "labels.text.fill", stylers: [{ color: "#999999" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#000000" }, { lightness: 19 }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#000000" }, { lightness: 17 }] },
];

let initialized = false;
let mapInstance: google.maps.Map | null = null;

const IDLE_TIMEOUT_MS = 2000;
const IDLE_FALLBACK_DELAY_MS = 1500;

// Schedules `cb` for whenever the main thread is next idle (falling back to a
// plain timeout on browsers without requestIdleCallback, e.g. older Safari),
// so the eager/root Map instance doesn't compete with the page's initial
// render for bandwidth/CPU. Returns a canceller safe to call even if `cb`
// already ran.
function scheduleIdle(cb: () => void): () => void {
  if (typeof window.requestIdleCallback === "function") {
    const id = window.requestIdleCallback(cb, { timeout: IDLE_TIMEOUT_MS });
    return () => window.cancelIdleCallback(id);
  }
  const id = window.setTimeout(cb, IDLE_FALLBACK_DELAY_MS);
  return () => window.clearTimeout(id);
}

const MAP_CENTER = { lat: 41.37348988192273, lng: -8.59339888770085 };

interface MapProps {
  // When true, this mount doesn't grab the map on mount — it waits until its
  // own container is about to enter the viewport. The map instance otherwise
  // sits (and stays actively composited/"warm") in the always-on-screen
  // anchor instance for as long as possible; claiming it only at the last
  // moment keeps its off-screen dormancy (which is what causes the tile
  // layer to go "cold" and flash on reveal) as short as possible.
  deferUntilNear?: boolean;
}

export default function Map({ deferUntilNear = false }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let observer: IntersectionObserver | null = null;
    let cancelIdle: (() => void) | null = null;
    let cancelled = false;

    const createOrClaim = async () => {
      if (!initialized) {
        setOptions({
          key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
        });
        initialized = true;
      }
      await importLibrary("maps");
      if (cancelled || !mapRef.current) return;

      if (mapInstance) {
        const mapDiv = mapInstance.getDiv();
        mapRef.current.appendChild(mapDiv);
        google.maps.event.trigger(mapInstance, "resize");
        mapInstance.setCenter(MAP_CENTER);
        return;
      }

      if (deferUntilNear) return; // anchor instance hasn't created it yet — nothing to claim

      mapInstance = new google.maps.Map(mapRef.current, {
        center: MAP_CENTER,
        zoom: 15,
        styles: MAP_STYLES,
        disableDefaultUI: true,
        draggable: false,
        scrollwheel: false,
        disableDoubleClickZoom: true,
        gestureHandling: "none",
      });

      new google.maps.Marker({
        position: MAP_CENTER,
        map: mapInstance,
        title: "Fumarentas do Asfalto",
      });
    };

    if (deferUntilNear) {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) createOrClaim();
        },
        { rootMargin: "200px 0px 200px 0px" }
      );
      if (mapRef.current) observer.observe(mapRef.current);
    } else {
      // Root/anchor instance: don't compete with the page's initial render —
      // wait for the main thread to be idle before loading the Maps JS API.
      cancelIdle = scheduleIdle(createOrClaim);
    }

    return () => {
      cancelled = true;
      observer?.disconnect();
      cancelIdle?.();
    };
  }, [deferUntilNear]);

  return <div ref={mapRef} className="w-full h-87.5 bg-[#0a0a0a] brightness-[0.9] relative z-10 overflow-hidden will-change-transform" />;
}