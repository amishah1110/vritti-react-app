import React, { useState, useEffect, useRef } from 'react';
import { mqttSub, mqttUnsub } from '../Subscribe';

// Import your icon files
import Icon1Grey from '../icons/icon-grey.svg';
import Icon1Red from '../icons/icon-red.svg';
import Icon1Blue from '../icons/icon-blue.svg';
import Icon1Yellow from '../icons/icon-yellow.svg';
import Icon1Green from '../icons/icon-green.svg';

import Icon2Grey from '../icons/hangout-grey.svg';
import Icon2Red from '../icons/hangout-red.svg';
import Icon2Blue from '../icons/hangout-blue.svg';
import Icon2Green from '../icons/hangout-green.svg';
import Icon2Yellow from '../icons/hangout-yellow.svg';

import Icon3Grey from '../icons/planner-grey.svg';
import Icon3Red from '../icons/planner-red.svg';
import Icon3Blue from '../icons/planner-blue.svg';
import Icon3Green from '../icons/planner-green.svg';
import Icon3Yellow from '../icons/planner-yellow.svg';

export const iconMapping = {
  'icon1': { grey: Icon1Grey, red: Icon1Red, blue: Icon1Blue, green: Icon1Green, yellow: Icon1Yellow },
  'icon2': { grey: Icon2Grey, red: Icon2Red, blue: Icon2Blue, green: Icon2Green, yellow: Icon2Yellow },
  'icon3': { grey: Icon3Grey, red: Icon3Red, blue: Icon3Blue, green: Icon3Green, yellow: Icon3Yellow },
};

const IconComponent = ({ id, latestValue, position, onPositionChange, iconKey, topic = '', thresholds = [0, 15, 50, 75, 100], handleIconSelect, handleUnsubscribe,}) => {
  const [icon, setIcon] = useState(iconMapping[iconKey.split('-')[0]]?.grey); // Adjusted to extract base iconKey
  const [isEditing, setIsEditing] = useState(false);
  const [currentTopic, setCurrentTopic] = useState(topic);
  const [message, setMessage] = useState('No Data');
  const previousTopic = useRef(topic);
  const isSubscribed = useRef(true);

  useEffect(() => {
    if (iconMapping[iconKey.split('-')[0]]) {
      setIcon(iconMapping[iconKey.split('-')[0]].grey);
    } else {
      console.error(`No icon mapping found for: ${iconKey}`);
      setIcon(iconMapping['icon1'].grey);
    }
  }, [iconKey]);

  useEffect(() => {
    if (latestValue !== undefined) {
      const numericValue = typeof latestValue === 'number' ? latestValue : parseFloat(latestValue);
      if (!isNaN(numericValue)) {
        updateIconColor(numericValue);
      }
    }
  }, [latestValue]);

  useEffect(() => {
    if (topic !== previousTopic.current) {
      setCurrentTopic(topic || '');
      previousTopic.current = topic;
    }
  }, [topic]);

  const updateIconColor = (value) => {
    if (!iconMapping[iconKey.split('-')[0]]) {
      console.error(`Icon mapping for iconKey "${iconKey}" not found.`);
      return;
    }

    if (!Array.isArray(thresholds) || thresholds.length < 5) {
      console.error('Invalid thresholds:', thresholds);
      return;
    }

    let newIcon;
    if (value < thresholds[0]) {
      newIcon = iconMapping[iconKey.split('-')[0]]?.grey;
    } else if (value < thresholds[1]) {
      newIcon = iconMapping[iconKey.split('-')[0]]?.blue;
    } else if (value < thresholds[2]) {
      newIcon = iconMapping[iconKey.split('-')[0]]?.green;
    } else if (value < thresholds[3]) {
      newIcon = iconMapping[iconKey.split('-')[0]]?.yellow;
    } else if (value <= thresholds[4]) {
      newIcon = iconMapping[iconKey.split('-')[0]]?.red;
    } else {
      console.error('Value out of range:', value);
      return;
    }

    setIcon(newIcon);
  };

  const handleTopicChangeInput = (e) => {
    setCurrentTopic(e.target.value);
  };

  const handleSubmit = (e) => {
    const newTopic = document.getElementById("topic-input").value.trim();
    
    if (newTopic != "") {
      if (isSubscribed.current) {
        mqttUnsub(previousTopic.current); 
      }

      previousTopic.current = currentTopic;
      const uniqueSubscriptionId = iconKey; // Unique ID remains the same as iconKey is now unique

      mqttSub(newTopic, (receivedTopic, message) => {
        console.log("Received message:", message, "on topic:", receivedTopic);
        if (receivedTopic === uniqueSubscriptionId) {
          const value = parseFloat(message);
          setMessage(message + "");
        }
      });

      isSubscribed.current = true;
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setCurrentTopic(previousTopic.current);
    setIsEditing(false);
  };

  const handleUnsubscribeClick = () => {
    mqttUnsub(previousTopic.current);
    handleUnsubscribe(id);
    setMessage('No Data');
    previousTopic.current = '';
    setCurrentTopic('');
    isSubscribed.current = false;
    setIsEditing(false);
  };

  const handleDrag = (event) => {
    const newPosition = { x: event.clientX - 25, y: event.clientY - 25 };
    onPositionChange(event.target.id, newPosition);
  };

  const handleDragStart = (event) => {
    event.dataTransfer.setData('application/json', JSON.stringify({ iconKey, topic, id: event.target.id }));
  };

  const handleDragEnd = (event) => {
    event.preventDefault();
  };

  return (
    <div style={{ position: 'absolute', left: position.x, top: position.y, cursor: 'move', zIndex: 1, textAlign: 'center',}}
      onClick={handleIconSelect}
      id={id} 
      draggable
      onDragStart={handleDragStart}
      onDoubleClick={() => setIsEditing(true)}
      onDrag={handleDrag} 
      onDragEnd={handleDragEnd} 
    >
      <img src={icon} alt="Icon" style={{ width: '50px', height: '50px',cursor: 'pointer' }} title={`Topic: ${previousTopic.current}`}
      />
      <p
        style={{ margin: '5px 0 0 0', fontSize: '18px', color: '#333', position: 'relative' }}>{latestValue}</p>

      {isEditing && (
        <div style={{ marginTop: '10px', textAlign: 'center' }}>
          <input
            id='topic-input'
            type="text"
            value={currentTopic}
            onChange={handleTopicChangeInput}
            placeholder="Enter topic name"
            style={{ padding: '5px', marginBottom: '5px', width: '150px', border: '1px solid #ccc', borderRadius: '4px' }}
            autoFocus
          />
          <button onClick={handleSubmit} style={{ margin: '5px', padding: '5px 10px', border: 'none', backgroundColor: '#007bff', color: 'white', borderRadius: '4px', cursor: 'pointer' }}>
            Submit
          </button>
          <button onClick={handleCancel} style={{ margin: '5px', padding: '5px 10px', border: 'none', backgroundColor: '#6c757d', color: 'white', borderRadius: '4px', cursor: 'pointer' }}>
            Cancel
          </button>
          <button onClick={handleUnsubscribeClick} style={{ margin: '5px', padding: '5px 10px', border: 'none', backgroundColor: '#dc3545', color: 'white', borderRadius: '4px', cursor: 'pointer' }}>
            Unsubscribe
          </button>
        </div>
      )}
    </div>
  );
};

export default IconComponent;
