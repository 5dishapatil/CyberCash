'use client';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import React, { useEffect } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

const orangeIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

const yellowIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

const greyIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-grey.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [16, 26], iconAnchor: [8, 26], popupAnchor: [1, -20], shadowSize: [26, 26]
});

interface MapProps {
  incidents?: any[];
  predictions?: any[];
  terminals?: any[];
  onIncidentClick?: (inc: any) => void;
}

export default function MapComponent({ incidents = [], predictions = [], terminals = [], onIncidentClick }: MapProps) {
  let center: [number, number] = [18.5204, 73.8567]; // Pune center
  if (predictions.length > 0 && predictions[0].top_k_terminals && predictions[0].top_k_terminals.length > 0) {
    const firstTk = predictions[0].top_k_terminals[0];
    const term = terminals.find(t => t.id === firstTk.terminal_id);
    if (term) {
       center = [term.latitude, term.longitude];
    } else if (firstTk.lat && firstTk.lng) {
       center = [firstTk.lat, firstTk.lng];
    }
  } else if (terminals.length > 0) {
    center = [terminals[0].latitude, terminals[0].longitude];
  }

  const getRiskAssets = (riskLevel: string) => {
    if (riskLevel === 'HIGH') return { color: '#ef4444', icon: redIcon }; // High Risk -> Red
    return { color: '#eab308', icon: yellowIcon }; // Medium and Low Risk -> Yellow
  };

  return (
    <MapContainer 
      center={center} 
      zoom={12} 
      style={{ height: '100%', width: '100%', background: '#0b1120' }}
      zoomControl={false}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        className="map-tiles"
      />
      
      {/* Background Terminals Layer */}
      {terminals.map((t: any) => (
        <Marker key={t.id} position={[t.latitude, t.longitude]} icon={greyIcon}>
          <Popup>
            <div className="text-xs bg-slate-900 text-white p-2 rounded border border-slate-700">
              <strong className="text-cyan-400">Terminal: {t.id}</strong><br/>
              Type: {t.terminal_type}<br/>
            </div>
          </Popup>
        </Marker>
      ))}
      
      {incidents.map((inc) => {
        // Find predictions for this incident
        const incPreds = predictions.filter(p => p.incident_id === inc.id);
        
        return (
          <React.Fragment key={inc.id}>
            {incPreds.map(p => {
              // Show localized circles around high risk candidates
              if (p.top_k_terminals && p.top_k_terminals.length > 0) {
                return p.top_k_terminals.map((tk: any) => {
                  const term = terminals.find(t => t.id === tk.terminal_id);
                  let lat = tk.lat || (term ? term.latitude : null);
                  let lng = tk.lng || (term ? term.longitude : null);
                  
                  // if no lat/lng is available (e.g. mock terminal), generate deterministic ones
                  if (!lat || !lng) {
                     const hash = tk.terminal_id.split('').reduce((a: number, b: string) => a + b.charCodeAt(0), 0);
                     lat = 18.5204 + (hash % 100) * 0.001;
                     lng = 73.8567 + (hash % 100) * 0.001;
                  }

                  const assets = getRiskAssets(inc.risk_level);
                  return (
                    <React.Fragment key={`${p.id}-${tk.terminal_id}`}>
                      <Circle 
                        center={[lat, lng]} 
                        pathOptions={{ color: assets.color, fillColor: assets.color, fillOpacity: 0.2 }} 
                        radius={tk.prob > 0.6 ? 800 : 400}
                      />
                      <Marker position={[lat, lng]} icon={assets.icon} eventHandlers={{ click: () => onIncidentClick && onIncidentClick(inc) }}>
                        <Popup>
                          <div className="text-xs bg-slate-900 text-white p-2 rounded border border-slate-700">
                            <strong className="text-cyan-400">Incident: {inc.id.substring(0,8)}</strong><br/>
                            Risk Level: {inc.risk_level}<br/>
                            Probability: {(tk.prob * 100).toFixed(1)}%<br/>
                            Terminal ID: {tk.terminal_id}<br/>
                          </div>
                        </Popup>
                      </Marker>
                    </React.Fragment>
                  );
                });
              }
              return null;
            })}
          </React.Fragment>
        );
      })}
    </MapContainer>
  );
}
