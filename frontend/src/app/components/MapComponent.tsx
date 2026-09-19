'use client';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import React from 'react';
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

interface MapProps {
  incidents?: any[];
  predictions?: any[];
  onIncidentClick?: (inc: any) => void;
}

export default function MapComponent({ incidents = [], predictions = [], onIncidentClick }: MapProps) {
  const center: [number, number] = [18.5204, 73.8567]; // Pune center

  return (
    <MapContainer center={center} zoom={11} style={{ height: '100%', width: '100%' }} zoomControl={false}>
      <TileLayer attribution='&copy; OSM' url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
      
      {incidents.map((inc) => {
        // Find predictions for this incident
        const incPreds = predictions.filter(p => p.incident_id === inc.id);
        
        return (
          <React.Fragment key={inc.id}>
            {incPreds.map(p => {
              // Show localized circles around high risk candidates
              if (p.top_k_terminals && p.top_k_terminals.length > 0) {
                return p.top_k_terminals.map((tk: any) => (
                  <React.Fragment key={`${p.id}-${tk.terminal_id}`}>
                    <Circle 
                      center={[tk.lat, tk.lng]} 
                      pathOptions={{ color: inc.severity === 'critical' ? '#e11d48' : '#ec4899', fillColor: inc.severity === 'critical' ? '#e11d48' : '#ec4899', fillOpacity: 0.2 }} 
                      radius={300}
                    />
                    <Marker position={[tk.lat, tk.lng]} icon={redIcon} eventHandlers={{ click: () => onIncidentClick && onIncidentClick(inc) }}>
                      <Popup>
                        <div className="text-black font-mono text-xs">
                          <strong>Incident {inc.id.substring(0,8)}</strong><br/>
                          Risk: {inc.severity}<br/>
                          Location Risk: {(tk.prob * 100).toFixed(1)}%<br/>
                        </div>
                      </Popup>
                    </Marker>
                  </React.Fragment>
                ));
              }
              return null;
            })}
          </React.Fragment>
        );
      })}
    </MapContainer>
  );
}
