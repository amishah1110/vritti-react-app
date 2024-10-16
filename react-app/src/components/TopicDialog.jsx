import React, { useState, useEffect } from 'react';
import { mqttSub } from '../Subscribe';
import '../styles.css';

const TopicDialog = ({ open, onClose, onSubmit, initialTopic = '', inputRef }) => {
  const [topic, setTopic] = useState(initialTopic);
  const [thresholds, setThresholds] = useState([0, 25, 50, 75, 100]);
  const [colors, setColors] = useState(Array(thresholds.length - 1).fill(''));
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const colorOptions = ['Red', 'Green', 'Blue', 'Yellow', 'Purple'];

  useEffect(() => {
    if (open) {
      setTopic(initialTopic);
      setThresholds([0, 25, 50, 75, 100]);
      setColors(Array(thresholds.length - 1).fill(''));
      setError('');
      setIsSubmitting(false);
      if (inputRef.current) {
        inputRef.current.focus(); 
      }
    }
  }, [open, initialTopic, inputRef]);

  const handleThresholdChange = (index, value) => {
    const newThresholds = [...thresholds];
    newThresholds[index] = Number(value);
    setThresholds(newThresholds);
  };

  const handleColorChange = (index, value) => {
    const newColors = [...colors];
    newColors[index] = value;
    setColors(newColors);
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

    onSubmit(topic.trim(), { thresholds, colors });
    mqttSub(topic.trim(), (receivedTopic, message) => {
      console.log(`Received message on topic ${receivedTopic}: ${message}`);
    });

    setIsSubmitting(false);
    onClose();
  };

  const handleClose = () => {
    setTopic(initialTopic);
    setThresholds([0, 25, 50, 75, 100]);
    setColors(Array(thresholds.length - 1).fill(''));
    setError('');
    onClose();
  };

  if (!open) return null;

  return (
    <div className="dialog-overlay">
      <div className="dialog-content">
        <h2>Configure Topic</h2>
        <form onSubmit={handleSubmit} className="dialog-form">
          <input
            id="topic"
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Enter topic name"
            autoFocus
            ref={inputRef}
            className="input-field"
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
                step="0.01"
                className="threshold-field"
              />
              {index < thresholds.length - 1 && (
                <>
                  {/* <label>{`Color ${index}:`}</label> */}
                  <select
                    value={colors[index]}
                    onChange={(e) => handleColorChange(index, e.target.value)}
                    className="color-select"
                  >
                    <option value="">Select color</option>
                    {colorOptions.map((color) => (
                      <option key={color} value={color}>{color}</option>
                    ))}
                  </select>
                </>
              )}
            </div>
          ))}
          {error && <div className="error-message">{error}</div>}
          <div className="dialog-buttons">
            <button type="submit" className="submitDialogButton" onClick={isSubmitting}>
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
