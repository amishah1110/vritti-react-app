import React, { useState, useEffect, useRef } from 'react';
import { mqttSub, mqttUnsub } from '../Subscribe';

// Define your SVG icons as React components
const icons = [
  ({ color }) => (
    <svg xmlns="http://www.w3.org/2000/svg" height="50px" viewBox="0 -960 960 960" width="50px" fill={color}>
      <path d="M480-80q-33 0-56.5-23.5T400-160h160q0 33-23.5 56.5T480-80ZM320-200v-80h320v80H320Zm10-120q-69-41-109.5-110T180-580q0-125 87.5-212.5T480-880q125 0 212.5 87.5T780-580q0 81-40.5 150T630-320H330Zm24-80h252q45-32 69.5-79T700-580q0-92-64-156t-156-64q-92 0-156 64t-64 156q0 54 24.5 101t69.5 79Zm126 0Z"/>
    </svg>
  ),

  
  // Add other icons here...
];

const IconComponent = ({ id, latestValue, position, onPositionChange, iconKey, topic = '', thresholds = [0, 15, 50, 75, 100], handleIconSelect, handleUnsubscribe, colors }) => {
  const [iconColor, setIconColor] = useState('#5f6368'); 
  const [isEditing, setIsEditing] = useState(false);
  const [currentTopic, setCurrentTopic] = useState(topic);
  const [message, setMessage] = useState('No Data');
  const previousTopic = useRef(topic);
  const [isBlinking, setIsBlinking] = useState(false);
  const isSubscribed = useRef(true);
  const [currentIconIndex, setCurrentIconIndex] = useState(0); // Track the index of the current icon

  // Update icon color when latestValue changes
  useEffect(() => {
    if (latestValue !== undefined) {
      const numericValue = typeof latestValue === 'number' ? latestValue : parseFloat(latestValue);
      if (!isNaN(numericValue)) {
        updateIconColor(numericValue);
      }
    }
  }, [latestValue]);

  const updateIconColor = (value) => {
    let newColor;
    if (value < thresholds[0]) {
      newColor = colors[0] || '#5f6368'; 
    } else if (value < thresholds[1]) {
      newColor = colors[1] || '#007bff'; // Use user-defined color or default
    } else if (value < thresholds[2]) {
      newColor = colors[2] || '#28a745'; // Use user-defined color or default
    } else if (value < thresholds[3]) {
      newColor = colors[3] || '#ffc107'; // Use user-defined color or default
    } else if (value <= thresholds[4]) {
      newColor = colors[4] || '#dc3545'; // Use user-defined color or default
    } else {
      console.error('Value out of range:', value);
      newColor = '#5f6368'; // grey
      return;
    }
    setIconColor(newColor);
  };

  // Function to handle color selection
  const handleColorChange = (event) => {
    setIconColor(event.target.value); // Update icon color based on user selection
  };

  const handleDragStart = (event) => {
    event.dataTransfer.setData('text/plain', id); // Store the ID of the dragged item
  };

  const handleDragOver = (event) => {
    event.preventDefault(); // Allow drop
  };

  const handleDrop = (event) => {
    const draggedId = event.dataTransfer.getData('text/plain'); // Get the ID of the dragged item
    if (draggedId !== id) {
      onPositionChange(draggedId, position); // Handle the drop logic here
    }
  };

  return (
    <div 
      style={{ position: 'absolute', left: position.x, top: position.y, cursor: 'move', zIndex: 1, textAlign: 'center' }} 
      id={id} 
      draggable
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleIconSelect}
      onDoubleClick={() => setIsEditing(true)}
    >
      {/* Render the current icon based on currentIconIndex */}
      {icons[currentIconIndex]({ color: iconColor })}
      <p style={{ margin: '5px 0 0 0', fontSize: '18px', color: '#333', position: 'relative' }}>{latestValue}</p>

      {/* Dropdown for color selection */}
      {/* <div style={{ marginTop: '10px' }}>
        <label htmlFor="colorSelect">Select Icon Color: </label>
        <select id="colorSelect" onChange={handleColorChange} value={iconColor}>
          <option value="#5f6368">Grey</option>
          <option value="#007bff">Blue</option>
          <option value="#28a745">Green</option>
          <option value="#ffc107">Yellow</option>
          <option value="#dc3545">Red</option>
        </select>
      </div> */}

      {isEditing && (
        <div style={{ marginTop: '10px', textAlign: 'center' }}>
          <input
            type="text"
            value={currentTopic}
            onChange={(e) => setCurrentTopic(e.target.value)}
            placeholder="Enter topic name"
            style={{ padding: '5px', marginBottom: '5px', width: '150px', border: '1px solid #ccc', borderRadius: '4px' }}
            autoFocus
          />
          <button onClick={() => { handleSubmit(currentTopic); setIsEditing(false); }}>Submit</button>
          <button onClick={() => setIsEditing(false)}>Cancel</button>
          <button onClick={handleUnsubscribe}>Unsubscribe</button>
        </div>
      )}
    </div>
  );
};

export default IconComponent;


export const updateIconColor = (value) => {
  let newIcon;
  if (value < thresholds[0]) {
    newIcon = '#5f6368'; // grey
  } else if (value < thresholds[1]) {
    newIcon = '#007bff'; // blue
  } else if (value < thresholds[2]) {
    newIcon = '#28a745'; // green
  } else if (value < thresholds[3]) {
    newIcon = '#ffc107'; // yellow
  } else if (value <= thresholds[4]) {
    newIcon = '#dc3545'; // red
  } else {
    console.error('Value out of range:', value);
    newIcon = '#5f6368'; // grey
    triggerBlinking();
    return;
  }
  setIsBlinking(false);
  setIcon(newIcon);
  checkThresholds(value);
};
