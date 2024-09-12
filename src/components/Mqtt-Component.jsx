//Mqtt-Component.jsx
import React from 'react';

export default function MqttComponent({ messages }) {
  return (
    <div className="container" style={{ textAlign: 'center' }}>
      {messages.length === 0 ? (
        <p>No messages received yet</p>
      ) : (
        messages.map((msg, index) => (
          <div key={index}>
            <strong>{msg.topic}</strong>: {msg.message}
          </div>
        ))
      )}
    </div>
  );
}
