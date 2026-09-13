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

export default function MapComponent({ terminals, incidents, predictions }) {
  const center = [18.5204, 73.8567];

  return (
    <MapContainer center={center} zoom={12} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        attribution='&copy; OSM'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {/* Baseline Risk: Normal Terminals */}
      {terminals && terminals.map(t => (
        <Marker key={t.id} position={[t.latitude, t.longitude]}>
          <Popup><div className="text-black font-mono text-xs">SYNTHETIC TERMINAL<br/>ID: {t.id}</div></Popup>
        </Marker>
      ))}

      {/* Reachability Zone (Derived mathematically from max travel time) */}
      {predictions && predictions.length > 0 && (
        <Circle 
          center={center} 
          pathOptions={{ color: 'purple', fillColor: 'purple', fillOpacity: 0.15, dashArray: "5, 10" }} 
          radius={parseFloat(predictions[0].predicted_region_h3) * 1000 || 5000} // km to meters
        >
          <Popup><span className="text-black font-bold">Reachability Zone (30m)</span></Popup>
        </Circle>
      )}

      {/* Top-K Terminals (Only if model does not abstain) */}
      {predictions && predictions.map(p => {
         if(!p.top_k_terminals || p.top_k_terminals.length === 0) return null;
         return p.top_k_terminals.map(tk => (
           <Marker key={tk.terminal_id} position={[tk.lat, tk.lng]} icon={redIcon}>
             <Popup>
               <div className="text-black font-mono text-xs">
                 <strong>High Risk Candidate</strong><br/>
                 P(Terminal|Cashout): {(tk.prob * 100).toFixed(1)}%<br/>
                 Travel: {tk.travel_time.toFixed(1)} min<br/>
                 <em>{tk.reason}</em>
               </div>
             </Popup>
           </Marker>
         ));
      })}
    </MapContainer>
  );
}
