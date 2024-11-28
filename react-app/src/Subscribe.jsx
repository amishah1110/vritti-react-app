import mqtt from 'mqtt';
import { MQTT_BROKER_URL } from './mqtt-config.js';

let client = null;
let isConnected = false;
const subscriptions = new Set();
const callbacks = new Map();

// Initialize MQTT client
export const initializeClient = () => {
    if (!client) {
        client = mqtt.connect(MQTT_BROKER_URL);

        client.on('connect', () => {
            console.log('Connected to MQTT Broker');
            isConnected = true;
            // Subscribe to topics in subscriptions set
            subscriptions.forEach(topic => {
                client.subscribe(topic, (err) => {
                    if (err) {
                        console.error(`Subscription error for ${topic}: ${err}`);
                    } else {
                        console.log(`Subscribed to topic: ${topic}`);
                    }
                });
            });
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
            isConnected = false;
            // Clear subscriptions and callbacks on connection close
            subscriptions.clear();
            callbacks.clear();
        });

        client.on('reconnect', () => {
            console.log('MQTT client reconnecting');
        });
    }

    return client;
};

// Subscribe to a topic
export const mqttSub = (topic, callback) => {
    const client = initializeClient();
    if (client) {
        if (!subscriptions.has(topic)) {
            subscriptions.add(topic);
            callbacks.set(topic, callback);

            if (isConnected) {
                client.subscribe(topic, (err) => {
                    if (err) {
                        console.error(`Subscription error for ${topic}: ${err}`);
                    } else {
                        console.log(`Subscribed to topic: ${topic}`);
                    }
                });
            } else {
                console.log(`Client not connected, subscription will be handled on reconnect for topic: ${topic}`);
            }
        }
    } else {
        console.error('MQTT client not initialized');
    }

};

// Unsubscribe from a topic
export const mqttUnsub = (topic) => {
    const client = initializeClient();

    if (client) {
        if (subscriptions.has(topic)) {
            subscriptions.delete(topic);
            callbacks.delete(topic);

            if (isConnected) {
                client.unsubscribe(topic, (error) => {
                    if (error) {
                        console.error(`Error unsubscribing from ${topic}:`, error);
                    } else {
                        console.log(`Unsubscribed from topic: ${topic}`);
                    }
                });
            } else {
                console.log(`Client not connected, unsubscription on reconnect for topic: ${topic}`);
            }
        } 
    } else {
        console.error('MQTT client not initialized');
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
