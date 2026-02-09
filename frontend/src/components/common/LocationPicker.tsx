import * as React from 'react';
import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIconPng from "leaflet/dist/images/marker-icon.png";
import markerIconShadow from "leaflet/dist/images/marker-shadow.png";

// Fix Leaflet's default icon path issues in React
const defaultIcon = new Icon({
    iconUrl: markerIconPng, // Use imported image directly if supported by bundler, or public URL
    shadowUrl: markerIconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

interface LocationPickerProps {
    lat?: number;
    lng?: number;
    onLocationSelect: (lat: number, lng: number) => void;
    label?: string;
    height?: string;
    readOnly?: boolean;
}

const LocationMarker = ({ onLocationSelect, position, readOnly }: { onLocationSelect: (lat: number, lng: number) => void, position: { lat: number, lng: number } | null, readOnly?: boolean }) => {

    useMapEvents({
        click(e) {
            if (!readOnly) {
                onLocationSelect(e.latlng.lat, e.latlng.lng);
            }
        },
    });

    return position === null ? null : (
        <Marker position={position} icon={defaultIcon}></Marker>
    );
}

const LocationPicker: React.FC<LocationPickerProps> = ({ lat, lng, onLocationSelect, label = "Select Location", height = "300px", readOnly = false }) => {
    // Default to Dubai center if no location provided
    const defaultCenter: [number, number] = [25.2048, 55.2708];
    const [position, setPosition] = useState<{ lat: number, lng: number } | null>(
        lat && lng ? { lat, lng } : null
    );

    useEffect(() => {
        if (lat && lng) {
            setPosition({ lat, lng });
        }
    }, [lat, lng]);

    const handleSelect = (newLat: number, newLng: number) => {
        setPosition({ lat: newLat, lng: newLng });
        onLocationSelect(newLat, newLng);
    };

    return (
        <div className="space-y-2 w-full">
            {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
            <div className="border rounded-lg overflow-hidden" style={{ height }}>
                <MapContainer
                    center={position ? [position.lat, position.lng] : defaultCenter}
                    zoom={11}
                    style={{ height: "100%", width: "100%" }}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <LocationMarker onLocationSelect={handleSelect} position={position} readOnly={readOnly} />
                </MapContainer>
            </div>
            {position && (
                <p className="text-xs text-gray-500">
                    Selected: {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
                </p>
            )}
        </div>
    );
};

export default LocationPicker;
