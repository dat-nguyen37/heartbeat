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
    username: 'ruoidz1st',
    password: 'a6k46pbc',
    reconnectPeriod: 1000,
};

// const MQTT_URL = "wss://7ec4f05f00f044a0bab76fb5f0be2ffd.s2.eu.hivemq.cloud:8884/mqtt";
const MQTT_URL = process.env.REACT_APP_MQTT_URL;



export default function Home() {
    const lastHeartbeatTimeRef = useRef(Date.now());
    const fallbackIntervalRef = useRef(null);
    const [position, setPosition] = useState(null);
    const [error, setError] = useState('');
    const [open, setOpen] = useState(false)
    const [heartbeat, setHeartbeat] = useState(null);
    const [dataPoints, setDataPoints] = useState([]);

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const x = dataPoints.map(p => p.x);
    const y = dataPoints.map(p => p.y);

    const hasData = y.length > 0;

    const minX = hasData ? Math.max(0, x[x.length - 1] - 200) : undefined;
    const maxX = hasData ? x[x.length - 1] : undefined;

    useEffect(() => {
        const client = mqtt.connect(MQTT_URL, MQTT_OPTIONS);

        client.on('connect', () => {
            console.log('🔗 MQTT connected');
            client.subscribe("health/pulse", (err) => {
                if (!err) console.log('✅ Subscribed to health/pulse');
            });
        });

        client.on('message', (receivedTopic, message) => {
            if (receivedTopic === "health/pulse") {
                setHeartbeat(message.toString());
                const value = parseFloat(message.toString());
                if (isNaN(value)) return;

                lastHeartbeatTimeRef.current = Date.now();

                if (fallbackIntervalRef.current) {
                    clearInterval(fallbackIntervalRef.current);
                    fallbackIntervalRef.current = null;
                }
                const now = new Date();
                const formattedTime = now.toLocaleTimeString('vi-VN');

                setDataPoints(prev => {
                    const updated = [
                        ...prev,
                        {
                            x: now,
                            y: value,
                            hovertext: `🕒 ${formattedTime}<br>❤️ Nhịp tim: ${value}`, // Tooltip đẹp
                        }
                    ];
                    return updated.slice(-1000);
                });
            }
        });

        const checker = setInterval(() => {
            const now = Date.now();
            const timeSinceLast = now - lastHeartbeatTimeRef.current;

            if (timeSinceLast > 4000 && !fallbackIntervalRef.current) {
                setHeartbeat(null)
                // ✅ Bắt đầu fallback interval cập nhật 0 mỗi giây
                fallbackIntervalRef.current = setInterval(() => {
                    const now = new Date();
                    const formattedTime = now.toLocaleTimeString('vi-VN');

                    setDataPoints(prev => {
                        const updated = [
                            ...prev,
                            {
                                x: now,
                                y: 0,
                                hovertext: `🕒 ${formattedTime}<br>❤️ Nhịp tim: 0`,
                            }
                        ];
                        return updated.slice(-1000);
                    });
                }, 1000);
            }
        }, 1000);

        return () => {
            clearInterval(checker);
            if (fallbackIntervalRef.current) {
                clearInterval(fallbackIntervalRef.current);
            }
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
            <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    Biểu đồ nhịp tim
                    <Typography><h3>{heartbeat || 0}</h3></Typography>
                </DialogTitle>
                <DialogContent sx={{ padding: '0px !important' }}>
                    <Plot
                        data={[
                            {
                                x: dataPoints.length > 0 ? dataPoints.map(p => p.x) : [new Date()],
                                y: dataPoints.length > 0 ? dataPoints.map(p => p.y) : [0],
                                type: 'scatter',
                                mode: 'lines+markers',
                                line: { color: 'red' },
                                hovertext: dataPoints.length > 0 ? dataPoints.map(p => p.hovertext) : [''], // 👈 Tooltip hiển thị đẹp
                                hoverinfo: 'text',
                            },
                        ]}
                        layout={{
                            margin: { t: 0, l: 30, r: 0, b: 0 },
                            title: 'Nhịp tim thời gian thực',
                            xaxis: {
                                title: {
                                    text: 'Thời gian',
                                    standoff: 40,          // Khoảng cách giữa trục và tiêu đề
                                },
                                type: 'date',
                                tickformat: '%H:%M',              // Chỉ hiện giờ:phút
                                dtick: 60 * 1000,             // 1 phút (đơn vị là mili-giây)
                                tickangle: -45,
                                automargin: true,                  // (tuỳ chọn) nghiêng nhãn trục để dễ đọc
                            },
                            yaxis: {
                                title: 'Biên độ',
                                range: [0, 130],
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
