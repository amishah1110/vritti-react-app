import mqtt from 'mqtt';
import { MQTT_BROKER_URL } from './mqtt-config.js';

let client = null;
const callbacks = new Map();

// Initialize MQTT client
export const initializeClient = () => {
    if (!client) {
        client = mqtt.connect(MQTT_BROKER_URL);

        client.on('connect', () => {
            console.log('Connected to MQTT Broker');
        });

        client.on('error', (error) => {
            console.error('MQTT error:', error);
        });

        client.on('message', (receivedTopic, message) => {
            if (callbacks.has(receivedTopic)) {
                const callback = callbacks.get(receivedTopic);
                callback(receivedTopic, parseFloat(message));
            }
        });

        client.on('close', () => {
            console.log('MQTT connection closed');
            callbacks.clear();
        });
    }

    return client;
};

// Subscribe to a topic
export const mqttSub = (topic, callback) => {
    if (client) {
        client.subscribe(topic, (error) => {
            if (error) {
                console.error(`Error subscribing to ${topic}:`, error);
                return;
            }
            callbacks.set(topic, callback);
            console.log(`Successfully subscribed to topic: ${topic}`);
        });
    } else {
        console.error('MQTT client not initialized');
    }
};

// Unsubscribe from a topic
export const mqttUnsub = (topic) => {
    if (client) {
        client.unsubscribe(topic, (error) => {
            if (error) {
                console.error(`Error unsubscribing from ${topic}:`, error);
            } else {
                console.log(`Unsubscribed from topic: ${topic}`);
                callbacks.delete(topic);
            }
        });
    } else {
        console.error('MQTT client not initialized');
    }
};

// Publish a message to a topic
export const mqttPublish = (topic, message) => {
    if (client) {
        client.publish(topic, message, (error) => {
            if (error) {
                console.error(`Error publishing to ${topic}:`, error);
            } else {
                console.log(`Message published to topic ${topic}: ${message}`);
            }
        });
    } else {
        console.error('MQTT client not initialized');
    }
};
