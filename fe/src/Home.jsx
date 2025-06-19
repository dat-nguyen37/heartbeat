import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Box, CircularProgress, Typography, Paper } from '@mui/material';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Cấu hình icon mặc định
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
        <Box
            sx={{
                height: '100vh',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                background: '#f0f2f5',
            }}
        >
            {position ? (
                <MapContainer center={position} zoom={15} style={{ height: '100%', width: '100%' }}>
                    <TileLayer
                        attribution='© OpenStreetMap contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker position={position}>
                        <Popup>Bạn đang ở đây</Popup>
                    </Marker>
                </MapContainer>
            ) : error ? (
                <Typography color="error" variant="h6">
                    Lỗi: {error}
                </Typography>
            ) : (
                <Box textAlign="center">
                    <CircularProgress />
                    <Typography mt={2}>Đang lấy vị trí...</Typography>
                </Box>
            )}
        </Box>
    );
}
