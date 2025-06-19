import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Box, CircularProgress, Typography, Paper, IconButton, Badge } from '@mui/material';
import { Favorite, HeartBroken, HeartBrokenSharp } from '@mui/icons-material';
import { keyframes } from '@emotion/react';
import { styled } from '@mui/system';
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

const pulse = keyframes`
  0% { transform: scale(1); }
  25% { transform: scale(1.2); }
  50% { transform: scale(1); }
  75% { transform: scale(1.2); }
  100% { transform: scale(1); }
`;

const BeatingHeart = styled(Favorite)(({ theme }) => ({
    fontSize: 50,
    color: "#f44336",
    animation: `${pulse} 1s infinite ease-in-out`,
}));


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
                <Box sx={{ width: "100%", height: '100vh', position: 'relative' }}>
                    <MapContainer center={position} zoom={17} style={{ height: '100%', width: '100%' }}>
                        <TileLayer
                            attribution='© OpenStreetMap contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <Marker position={position}>
                            <Popup>Bạn đang ở đây</Popup>
                        </Marker>
                    </MapContainer>
                    <IconButton sx={{ position: 'absolute', top: 50, right: 20, zIndex: 1000, backgroundColor: 'white', boxShadow: 10 }}>
                        <BeatingHeart sx={{ fontSize: '40px' }} color='error' />
                        <Box
                            sx={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                color: 'white',
                                fontWeight: 'bold',
                                fontSize: 12,
                                pointerEvents: 'none',
                            }}
                        >
                            12
                        </Box>
                    </IconButton>
                </Box>
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
