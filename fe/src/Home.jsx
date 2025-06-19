import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Cấu hình icon mặc định (nếu không sẽ không thấy marker do lỗi icon path)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl:
        'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export default function Home() {
    const [position, setPosition] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        const watchId = navigator.geolocation.watchPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                setPosition([latitude, longitude]);
            },
            (err) => {
                setError(err.message);
            },
            {
                enableHighAccuracy: true,
            }
        );

        return () => navigator.geolocation.clearWatch(watchId);
    }, []);

    return (
        <div style={{ height: '100vh' }}>
            {position ? (
                <MapContainer center={position} zoom={13} style={{ height: '100%' }}>
                    <TileLayer
                        attribution='© OpenStreetMap'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker position={position}>
                        <Popup>Bạn đang ở đây</Popup>
                    </Marker>
                </MapContainer>
            ) : error ? (
                <p>Lỗi: {error}</p>
            ) : (
                <p>Đang lấy vị trí...</p>
            )}
        </div>
    );
}
