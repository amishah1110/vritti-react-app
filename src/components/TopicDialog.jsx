import React, { useState, useEffect } from 'react';
import { mqttSub } from '../Subscribe';

const TopicDialog = ({ open, onClose, onSubmit, initialTopic = '', inputRef }) => {
  const [topic, setTopic] = useState(initialTopic);
  const [thresholds, setThresholds] = useState([0, 25, 50, 75, 100]);

  useEffect(() => {
    if (open) {
      setTopic(initialTopic);
      setThresholds([0, 25, 50, 75, 100]);
    }
  }, [open, initialTopic]);

  const handleThresholdChange = (index, value) => {
    const newThresholds = [...thresholds];
    newThresholds[index] = Number(value);
    setThresholds(newThresholds);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const trimmedTopic = topic.trim();
    console.log(`Topic received in handleSubmit: ${trimmedTopic}`);
  
    if (trimmedTopic === '') {
      alert('Please enter a valid topic name.');
      return;
    }
  
    if (new Set(thresholds).size !== thresholds.length || thresholds.some(t => t < 0 || isNaN(t))) {
      alert('Please enter valid and unique thresholds with non-negative values.');
      return;
    }
  
    onSubmit(trimmedTopic, thresholds);
    mqttSub(trimmedTopic, (receivedTopic, message) => {
      console.log(`Received message on topic ${receivedTopic}: ${message}`);

    });
  
    onClose();
  };
  

  const handleClose = () => {
    onClose();
  };

  if (!open) return null;

  return (
    <div className="dialog-overlay" style={{ zIndex: 2 }}>
      <div className="dialog-content">
        <h2>Configure Topic</h2>
        <form onSubmit={handleSubmit}>
          <input
            id="topic"
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Enter topic name"
            autoFocus
            ref={inputRef}
          />
          {thresholds.map((threshold, index) => (
            <div key={index} className="threshold-input">
              <label>{`Threshold ${index + 1}:`}</label>
              <input
                id={`threshold_${index}`}
                type="number"
                value={threshold}
                onChange={(e) => handleThresholdChange(index, e.target.value)}
                min="0"
                step="0.1"
              />
            </div>
          ))}
          <div className="dialog-buttons">
            <button type="submit" className="submitDialogButton" onClick={handleSubmit}>Subscribe</button>
            <button type="button" className="cancelDialogButton" onClick={handleClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TopicDialog;
