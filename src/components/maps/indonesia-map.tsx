"use client";

import { useEffect, useState } from "react";
import { formatNumber, formatPct, formatRupiah } from "@/lib/utils/format";

interface ProvinceData {
  name: string;
  lat: number;
  lon: number;
  total_kecamatan: number;
  total_population: number;
  avg_poverty_rate: number;
  avg_priority_score: number;
  total_fakir: number;
  total_miskin: number;
  avg_coverage_gap: number;
  total_ziswaf_received: number;
}

interface Props {
  provinces: ProvinceData[];
}

function getColor(score: number): string {
  if (score >= 25) return "#dc2626"; // red-600
  if (score >= 20) return "#ea580c"; // orange-600
  if (score >= 15) return "#d97706"; // amber-600
  if (score >= 10) return "#ca8a04"; // yellow-600
  return "#16a34a"; // green-600
}

function getRadius(population: number): number {
  if (population >= 20_000_000) return 28;
  if (population >= 10_000_000) return 22;
  if (population >= 5_000_000) return 17;
  if (population >= 1_000_000) return 13;
  return 9;
}

export function IndonesiaMap({ provinces }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-[500px] rounded-lg bg-muted flex items-center justify-center">
        <p className="text-muted-foreground">Memuat peta...</p>
      </div>
    );
  }

  return <MapInner provinces={provinces} />;
}

function MapInner({ provinces }: Props) {
  const [L, setL] = useState<typeof import("leaflet") | null>(null);
  const [RL, setRL] = useState<typeof import("react-leaflet") | null>(null);

  useEffect(() => {
    Promise.all([import("leaflet"), import("react-leaflet")]).then(
      ([leaflet, reactLeaflet]) => {
        setL(leaflet);
        setRL(reactLeaflet);
      }
    );
  }, []);

  if (!L || !RL) {
    return (
      <div className="h-[500px] rounded-lg bg-muted flex items-center justify-center">
        <p className="text-muted-foreground">Memuat peta...</p>
      </div>
    );
  }

  const { MapContainer, TileLayer, CircleMarker, Tooltip } = RL;

  return (
    <>
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      />
      <MapContainer
        center={[-2.5, 118]}
        zoom={5}
        minZoom={4}
        maxZoom={8}
        scrollWheelZoom={true}
        style={{ height: "500px", width: "100%", borderRadius: "0.5rem" }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        {provinces.map((prov) => (
          <CircleMarker
            key={prov.name}
            center={[prov.lat, prov.lon]}
            radius={getRadius(prov.total_population)}
            pathOptions={{
              fillColor: getColor(prov.avg_priority_score),
              color: "#fff",
              weight: 2,
              opacity: 0.9,
              fillOpacity: 0.75,
            }}
          >
            <Tooltip direction="top" sticky>
              <div className="text-sm min-w-[200px]">
                <p className="font-bold text-base mb-1">{prov.name}</p>
                <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
                  <span className="text-muted-foreground">Kecamatan:</span>
                  <span className="font-medium text-right">{prov.total_kecamatan}</span>
                  <span className="text-muted-foreground">Penduduk:</span>
                  <span className="font-medium text-right">{formatNumber(prov.total_population, true)}</span>
                  <span className="text-muted-foreground">Kemiskinan:</span>
                  <span className="font-medium text-right">{formatPct(prov.avg_poverty_rate)}</span>
                  <span className="text-muted-foreground">Skor Prioritas:</span>
                  <span className="font-bold text-right" style={{ color: getColor(prov.avg_priority_score) }}>
                    {prov.avg_priority_score.toFixed(1)}
                  </span>
                  <span className="text-muted-foreground">Fakir:</span>
                  <span className="font-medium text-right">{formatNumber(prov.total_fakir, true)}</span>
                  <span className="text-muted-foreground">Miskin:</span>
                  <span className="font-medium text-right">{formatNumber(prov.total_miskin, true)}</span>
                  <span className="text-muted-foreground">Gap:</span>
                  <span className="font-medium text-right">{prov.avg_coverage_gap.toFixed(1)}</span>
                  <span className="text-muted-foreground">ZISWAF:</span>
                  <span className="font-medium text-right">{formatRupiah(prov.total_ziswaf_received)}</span>
                </div>
              </div>
            </Tooltip>
          </CircleMarker>
        ))}
      </MapContainer>
      {/* Legend */}
      <div className="flex items-center gap-6 mt-3 text-sm flex-wrap">
        <span className="text-muted-foreground font-medium">Skor Prioritas:</span>
        {[
          { label: "Sangat Tinggi (≥25)", color: "#dc2626" },
          { label: "Tinggi (20-24)", color: "#ea580c" },
          { label: "Sedang (15-19)", color: "#d97706" },
          { label: "Rendah (<15)", color: "#16a34a" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div
              className="size-3.5 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span>{item.label}</span>
          </div>
        ))}
        <span className="text-muted-foreground ml-4">Ukuran = populasi</span>
      </div>
    </>
  );
}
