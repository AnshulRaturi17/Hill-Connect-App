import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon in Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface LiveMapProps {
  center?: [number, number];
  zoom?: number;
  markers?: Array<{
    id: string;
    position: [number, number];
    title: string;
    description?: string;
    type?: 'hazard' | 'ride' | 'user' | 'danger' | 'selection';
    hazardType?: string;
  }>;
  routes?: Array<{
    id: string;
    coordinates: Array<[number, number]>;
    color: string;
    weight?: number;
    opacity?: number;
  }>;
  onClick?: (lat: number, lng: number) => void;
  height?: string;
  className?: string;
}

// Component to handle map clicks
function MapEvents({ onClick }: { onClick?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      if (onClick) {
        onClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

// Component to handle map center updates
function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

export default function LiveMap({ 
  center = [30.45, 78.08], 
  zoom = 13, 
  markers = [],
  routes = [],
  height = '400px',
  className = '',
  onClick
}: LiveMapProps) {
  return (
    <div style={{ height }} className={`w-full relative z-0 ${className}`}>
      <MapContainer 
        center={center} 
        zoom={zoom} 
        scrollWheelZoom={true}
        className="h-full w-full rounded-[2rem] overflow-hidden"
      >
        <ChangeView center={center} zoom={zoom} />
        <MapEvents onClick={onClick} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {routes.map(route => (
          <Polyline 
            key={route.id} 
            positions={route.coordinates} 
            color={route.color} 
            weight={route.weight || 4} 
            opacity={route.opacity || 0.6}
          />
        ))}

        {markers.map((marker) => (
          <Marker 
            key={marker.id} 
            position={marker.position}
            icon={marker.type === 'hazard' || marker.type === 'danger' || marker.type === 'selection' ? L.divIcon({
              className: 'custom-div-icon',
              html: `
                <div class="flex flex-col items-center" style="transform: translateY(-20px)">
                  ${marker.hazardType ? `
                    <div class="mb-1.5 px-2.5 py-1 bg-red-600 text-white text-[9px] font-black uppercase tracking-widest rounded-lg shadow-[0_4px_12px_rgba(220,38,38,0.3)] whitespace-nowrap border-2 border-white animate-bounce-slow">
                      ${marker.hazardType}
                    </div>
                  ` : ''}
                  <div class="w-8 h-8 ${
                    marker.type === 'danger' ? 'bg-red-600' : 
                    marker.type === 'selection' ? 'bg-emerald-600 ring-4 ring-white' : 
                    'bg-amber-500'
                  } rounded-full border-2 border-white flex items-center justify-center text-white shadow-lg ${
                    marker.type === 'selection' ? '' : 'animate-pulse'
                  }">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      ${marker.type === 'selection' ? 
                        '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/>' : 
                        '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>'
                      }
                    </svg>
                  </div>
                </div>
              `,
              iconSize: [100, 100],
              iconAnchor: [50, 60] // Adjusted anchor to center on the circle
            }) : DefaultIcon}
          >
            <Popup>
              <div className="font-sans min-w-[120px]">
                <h4 className="font-bold text-emerald-950">{marker.title}</h4>
                {marker.description && <p className="text-xs text-on-surface-variant mt-1">{marker.description}</p>}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
