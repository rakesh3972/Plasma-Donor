import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

function LocationMarker({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      if (onLocationSelect) {
        onLocationSelect({ lat: e.latlng.lat, lng: e.latlng.lng });
      }
    },
  });
  return null;
}

function Map({ donors = [], center, onLocationSelect }) {
  return (
    <MapContainer center={center} zoom={12} style={{ width: '100%', height: '350px' }} scrollWheelZoom={true}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {donors.map(donor => (
        <Marker key={donor._id} position={{ lat: donor.location.lat, lng: donor.location.lng }}>
          <Popup>
            <div>
              <strong>{donor.name}</strong><br />
              Blood Group: {donor.bloodGroup}
            </div>
          </Popup>
        </Marker>
      ))}
      <LocationMarker onLocationSelect={onLocationSelect} />
    </MapContainer>
  );
}

export default Map; 