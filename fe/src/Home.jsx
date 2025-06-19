import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Box, CircularProgress, Typography, Paper, IconButton, Badge, useMediaQuery, useTheme, Dialog, DialogTitle, DialogContent, Button, DialogActions } from '@mui/material';
import { Favorite, HeartBroken, HeartBrokenSharp } from '@mui/icons-material';
import { keyframes } from '@emotion/react';
import { styled } from '@mui/system';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import mqtt from 'mqtt'
import Plot from 'react-plotly.js';


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


const MQTT_OPTIONS = {
    clientId: 'Client_id_' + Math.random().toString(16).substr(2, 8),
    connectTimeout: 4000,
    username: 'datnguyen',
    password: 'Datnguyen12@',
    reconnectPeriod: 1000,
};

const MQTT_URL = process.env.REACT_APP_MQTT_URL;


export default function Home() {
    const [position, setPosition] = useState(null);
    const [error, setError] = useState('');
    const [open, setOpen] = useState(false)
    const [heartbeat, setHeartbeat] = useState(null);
    const [dataPoints, setDataPoints] = useState([]);

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const x = dataPoints.map(p => p.x);
    const y = dataPoints.map(p => p.y);

    const minY = Math.min(...y, 0) - 10;
    const maxY = Math.max(...y, 0) + 10;

    const maxX = x[x.length - 1] || 0;
    const minX = Math.max(0, maxX - 200);

    useEffect(() => {
        const client = mqtt.connect(MQTT_URL, MQTT_OPTIONS);

        client.on('connect', () => {
            console.log('🔗 MQTT connected');
            client.subscribe("esp32/add", (err) => {
                if (!err) console.log('✅ Subscribed to esp32/add');
            });
        });

        client.on('message', (receivedTopic, message) => {
            if (receivedTopic === "esp32/add") {
                setHeartbeat(message.toString());
                const value = parseFloat(message.toString());
                if (isNaN(value)) return;

                setDataPoints(prev => {
                    const nextIndex = prev.length;
                    const updated = [...prev, { x: nextIndex, y: value }];
                    return updated.slice(-1000);
                });
            }
        });

        return () => {
            client.end(true, () => {
                console.log('❌ MQTT disconnected');
            });
        };
    }, []);

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
                    <IconButton onClick={() => setOpen(true)} sx={{ position: 'absolute', top: 50, right: 20, zIndex: 1000, boxShadow: 10 }}>
                        <BeatingHeart sx={{ fontSize: '50px' }} color='error' />
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
                            {heartbeat || 0}
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
            <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth fullScreen={isMobile}>
                <DialogTitle>Biểu đồ nhịp tim</DialogTitle>
                <DialogContent sx={{ padding: '0px !important' }}>
                    <Plot
                        data={[
                            {
                                x,
                                y,
                                type: 'scatter',
                                mode: 'lines',
                                line: { color: 'red' },
                            },
                        ]}
                        layout={{
                            margin: { t: 0, l: 0, r: 0, b: 0 },
                            title: 'Nhịp tim thời gian thực',
                            xaxis: {
                                title: 'Time',
                                range: [minX, maxX],
                            },
                            yaxis: {
                                title: 'Biên độ',
                                range: [minY, maxY],
                            },
                        }}
                        config={{
                            responsive: true,
                            displayModeBar: false,
                        }}
                        style={{ width: '100%', height: '400px', }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)}>Đóng</Button>
                </DialogActions>
            </Dialog>
        </Box >
    );
}
