import React, { useState, useEffect } from 'react';
import { mqttSub } from '../Subscribe';
import '../styles.css';

export let updatedThresholds = []; // Array to store user-defined thresholds
export let updatedColors = []; // Array to store user-defined colors

const TopicDialog = ({ open, onClose, onSubmit, initialTopic = '', inputRef }) => {
  const defaultColors = ['red', 'green','blue','yellow','orange','purple'];

  const defaultThresholds = [10, 20, 30, 40, 50];

  const [topic, setTopic] = useState(initialTopic);
  const [colorSelections, setColorSelections] = useState(Array(defaultThresholds.length - 1).fill(''));
  const [thresholds, setThresholds] = useState([...defaultThresholds]);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setTopic(initialTopic);
      setColorSelections(Array(defaultThresholds.length - 1).fill(''));
      setThresholds([...defaultThresholds]);
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
    const newColors = [...colorSelections];
    newColors[index] = value;
    setColorSelections(newColors);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateInput() || isSubmitting) return;
    setIsSubmitting(true);

    // Copy user-defined thresholds and colors to the updated arrays
    updatedThresholds.length = 0; // Clear previous values
    updatedColors.length = 0; // Clear previous values
    updatedThresholds.push(...thresholds);
    updatedColors.push(...colorSelections);

    onSubmit(topic.trim(), { thresholds, colors: colorSelections });
    mqttSub(topic.trim(), (receivedTopic, message) => {
      console.log(`Received message on topic ${receivedTopic}: ${message}`);
    });

    setIsSubmitting(false);
    onClose();
  };

  const handleClose = () => {
    setTopic(initialTopic);
    setColorSelections(Array(defaultThresholds.length - 1).fill(''));
    setThresholds([...defaultThresholds]);
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
                <select
                  value={colorSelections[index]}
                  onChange={(e) => handleColorChange(index, e.target.value)}
                  className="color-select">
                  <option value="">Select color</option>
                  {defaultColors.map((color) => (<option key={color} value={color}>{color}</option>))}
                </select>
              )}
            </div>
          ))}
          {error && <div className="error-message">{error}</div>}
          <div className="dialog-buttons">
            <button type="submit" className="submitDialogButton">
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
