import React, { useState, useEffect } from 'react';
import { mqttSub, mqttUnsub } from '../Subscribe';

const TopicDialog = ({ open, onClose, onSubmit, initialTopic = '', inputRef }) => {
  const [topic, setTopic] = useState(initialTopic);
  const [thresholds, setThresholds] = useState([0, 25, 50, 75, 100]);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false); // Track if submission is in progress

  useEffect(() => {
    if (open) {
      setTopic(initialTopic);
      setThresholds([0, 25, 50, 75, 100]);
      setError('');
      setIsSubmitting(false); 
    }
  }, [open, initialTopic]);

  const handleThresholdChange = (index, value) => {
    const newThresholds = [...thresholds];
    newThresholds[index] = Number(value);
    setThresholds(newThresholds);
  };

  const validateInput = () => {
    const trimmedTopic = topic.trim();
    if (trimmedTopic === '') {
      setError('Please enter a valid topic name.');
      return false;
    }

    const uniqueThresholds = new Set(thresholds);
    if (uniqueThresholds.size !== thresholds.length || thresholds.some(t => t < 0 || isNaN(t))) {
      setError('Please enter valid and unique thresholds with non-negative values.');
      return false;
    }

    setError('');
    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateInput() || isSubmitting) return; 

    setIsSubmitting(true); 

    onSubmit(topic.trim(), thresholds);
    mqttSub(topic.trim(), (receivedTopic, message) => {
      console.log(`Received message on topic ${receivedTopic}: ${message}`);
    });

    setIsSubmitting(false);
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
          <input id="topic" type="text" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Enter topic name" autoFocus ref={inputRef} className="input-field"/>
          {thresholds.map((threshold, index) => (
            <div key={index} className="threshold-input">
              <label>{`Threshold ${index + 1}:`}</label>
              <input id={`threshold_${index}`} type="number" value={threshold} onChange={(e) => handleThresholdChange(index, e.target.value)} min="0" step="0.01" className="threshold-field" />
            </div>
          ))}
          {error && <div className="error-message">{error}</div>}
          <div className="dialog-buttons">
            <button type="submit" className="submitDialogButton" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Subscribe'}
            </button>
            <button type="button" className="cancelDialogButton" onClick={handleClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TopicDialog;
