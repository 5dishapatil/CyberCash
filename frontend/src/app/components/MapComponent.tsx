'use client';
import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default Leaflet icons in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export default function MapComponent({ terminals, incidents, predictions }) {
  // Center roughly on Pune
  const center = [18.5204, 73.8567];

  return (
    <MapContainer center={center} zoom={12} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        className="map-tiles"
      />
      
      {/* Plot all ATMs */}
      {terminals && terminals.map(t => (
        <Marker key={t.id} position={[t.latitude, t.longitude]}>
          <Popup>
            <div className="text-black">
              <strong>{t.id}</strong><br/>
              Bank: {t.bank_id}<br/>
              Type: {t.terminal_type}
            </div>
          </Popup>
        </Marker>
      ))}

      {/* Plot predicted Top-K ATMs in Red */}
      {predictions && predictions.map(p => {
         if(!p.top_k_terminals) return null;
         return p.top_k_terminals.map(tk => (
           <Marker key={tk.terminal_id} position={[tk.lat, tk.lng]} icon={redIcon}>
             <Popup>
               <div className="text-black font-bold">
                 High Risk Terminal<br/>
                 Prob: {(tk.prob * 100).toFixed(1)}%
               </div>
             </Popup>
           </Marker>
         ));
      })}
      
      {/* Prediction Region Circle (Pseudo H3 for now) */}
      {predictions && predictions.length > 0 && (
        <Circle 
          center={[18.5204, 73.8567]} 
          pathOptions={{ color: 'purple', fillColor: 'purple', fillOpacity: 0.2 }} 
          radius={5000} 
        />
      )}
    </MapContainer>
  );
}
