import { useEffect, useRef } from 'react';
import mqtt from 'mqtt';

const MQTT_OPTIONS = {
    clientId: 'Client_id_' + Math.random().toString(16).substr(2, 8),
    connectTimeout: 4000,
    username: 'datnguyen',
    password: 'Datnguyen12@',
    reconnectPeriod: 1000,
};

const MQTT_URL = 'ws://broker.emqx.io:8083/mqtt';

export default function useMqtt(onMessage) {
    const clientRef = useRef(null);

    useEffect(() => {
        // ⚠️ Nếu đã có kết nối rồi thì không cần tạo lại
        if (clientRef.current) {
            return;
        }

        const client = mqtt.connect(MQTT_URL, MQTT_OPTIONS);
        clientRef.current = client;

        client.on('connect', () => {
            console.log('🔗 MQTT connected');
            client.subscribe("esp32/add", (err) => {
                if (!err) console.log('✅ Subscribed to esp32/add');
            });
        });

        client.on('message', (receivedTopic, message) => {
            if (receivedTopic === "esp32/add") {
                onMessage(message.toString());
            }
        });

        return () => {
            client.end(true, () => {
                console.log('❌ MQTT disconnected');
                clientRef.current = null;
            });
        };
    }, [clientRef]);

    return clientRef;
}
