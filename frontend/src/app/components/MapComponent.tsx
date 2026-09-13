'use client';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function MapComponent({ terminals, incidents }: { terminals: any[], incidents: any[] }) {
  // Center roughly around Pune
  const center: [number, number] = [18.5204, 73.8567];

  return (
    <MapContainer center={center} zoom={11} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      {terminals.map(t => (
        <CircleMarker
          key={t.id}
          center={[t.latitude, t.longitude]}
          radius={4}
          pathOptions={{ color: '#0ea5e9', fillColor: '#0ea5e9', fillOpacity: 0.7 }}
        >
          <Popup>
            <div className="text-slate-900">
              <b>Terminal: {t.id}</b><br/>
              Usage: {t.historical_usage}
            </div>
          </Popup>
        </CircleMarker>
      ))}
      
      {/* If there was a prediction, we would highlight the predicted terminals in red.
          For V1, since predictions are linked to incidents, we would fetch them.
          Here we just show ATMs. */}
    </MapContainer>
  );
}
