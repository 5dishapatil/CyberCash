'use client';
import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
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

export default function MapComponent({ activeIncident, predictions, showInfrastructure }) {
  const center = [18.5204, 73.8567];

  return (
    <MapContainer center={center} zoom={11} style={{ height: '100%', width: '100%' }} zoomControl={false}>
      <TileLayer attribution='&copy; OSM' url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
      
      {/* 1. Global View: Show all predicted regions if no specific incident is selected */}
      {!activeIncident && predictions && predictions.map(p => (
        <Circle 
          key={p.id}
          center={center} 
          pathOptions={{ color: '#ec4899', fillColor: '#ec4899', fillOpacity: 0.1, dashArray: "4, 4" }} 
          radius={parseFloat(p.predicted_region_h3) * 1000 || 5000}
        >
          <Popup><span className="text-black font-bold">Threat Zone (INC-{p.incident_id})</span></Popup>
        </Circle>
      ))}

      {/* 2. Incident Command View: Show specific region and candidate ATMs */}
      {activeIncident && predictions && predictions.filter(p => p.incident_id === activeIncident.id).map(p => (
        <div key={`inc-view-${p.id}`}>
          <Circle 
            center={center} 
            pathOptions={{ color: '#e11d48', fillColor: '#e11d48', fillOpacity: 0.2, dashArray: "5, 10" }} 
            radius={parseFloat(p.predicted_region_h3) * 1000 || 5000}
          />
          {p.top_k_terminals && p.top_k_terminals.map(tk => (
             <Marker key={tk.terminal_id} position={[tk.lat, tk.lng]} icon={redIcon}>
               <Popup>
                 <div className="text-black font-mono text-xs">
                   <strong>High Risk Candidate</strong><br/>
                   Rel. Likelihood: {(tk.prob * 100).toFixed(1)}<br/>
                   Travel: {tk.travel_time.toFixed(1)} min<br/>
                   <em>{tk.reason}</em>
                 </div>
               </Popup>
             </Marker>
          ))}
        </div>
      ))}
    </MapContainer>
  );
}
