"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
declare const google: any;
import { useEffect, useRef } from "react";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";

const MAP_STYLES = [
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

setOptions({
  key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
});

let mapInstance: any = null;

export default function Map() {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const init = async () => {
      await importLibrary("maps");
      if (!mapRef.current) return;

      if (mapInstance) {
        const mapDiv = mapInstance.getDiv();
        mapRef.current.appendChild(mapDiv);
        google.maps.event.trigger(mapInstance, "resize");
        return;
      }

      mapInstance = new google.maps.Map(mapRef.current, {
        center: { lat: 41.37348988192273, lng: -8.59339888770085 },
        zoom: 15,
        styles: MAP_STYLES,
        disableDefaultUI: true,
        draggable: false,
        scrollwheel: false,
        disableDoubleClickZoom: true,
        gestureHandling: "none",
      });

      new google.maps.Marker({
        position: { lat: 41.37348988192273, lng: -8.59339888770085 },
        map: mapInstance,
        title: "Fumarentas do Asfalto",
      });
    };

    init();
  }, []);

  return <div ref={mapRef} className="w-full h-87.5 brightness-[0.9] relative z-10 overflow-hidden" />;
}