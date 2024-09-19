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
                callback(receivedTopic, message.toString());
            }
        });

        client.on('close', () => {
            console.log('MQTT connection closed');
            // Clear callbacks on connection close
            callbacks.clear();
            // Reinitialize client when closed
            client = null;
        });
    }

    return client;
};

// Subscribe to a topic
export const mqttSub = (topic, callback) => {
    const client = initializeClient();

    if (client) {
        // Store the callback for this topic
        callbacks.set(topic, callback);

        // Subscribe to the topic
        client.subscribe(topic, (err) => {
            if (err) {
                console.error(`Subscription error: ${err}`);
            } else {
                console.log(`Subscribed to topic: ${topic}`);
            }
        });
    } else {
        console.error('MQTT client not initialized');
    }
};

// Unsubscribe from a topic
export const mqttUnsub = (topic) => {
    if (!client) {
        console.error('MQTT client not initialized');
        return;
    }

    // Ensure the client is connected before attempting to unsubscribe
    if (client.connected) {
        client.unsubscribe(topic, (error) => {
            if (error) {
                console.error(`Error unsubscribing from ${topic}:`, error);
            } else {
                console.log(`Unsubscribed from topic: ${topic}`);
                callbacks.delete(topic); // Remove callback associated with the topic
            }
        });
    } else {
        console.error('MQTT client is not connected');
    }
};


// Publish a message to a topic
export const mqttPublish = (topic, message) => {
    const client = initializeClient();

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
