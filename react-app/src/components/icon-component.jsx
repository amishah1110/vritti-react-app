import React, { useState, useEffect, useRef } from 'react';
import { mqttSub, mqttUnsub } from '../Subscribe';

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

const IconComponent = ({ hoverText, latestValue, position, onPositionChange, iconKey, topic = '', thresholds = [0, 15, 50, 75, 100], handleIconSelect, handleUnsubscribe }) => {
  const [icon, setIcon] = useState(iconMapping[iconKey]?.grey);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTopic, setCurrentTopic] = useState(topic);
  const [message, setMessage] = useState('');
  const previousTopic = useRef(topic);
  const isSubscribed = useRef(false);

  useEffect(() => {
    if (iconMapping[iconKey]) {
      setIcon(iconMapping[iconKey].grey);
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
    if (!iconMapping[iconKey]) {
      console.error(`Icon mapping for iconKey "${iconKey}" not found.`);
      return;
    }

    if (!Array.isArray(thresholds) || thresholds.length < 5) {
      console.error('Invalid thresholds:', thresholds);
      return;
    }

    let newIcon;
    if (value < thresholds[0]) {
      newIcon = iconMapping[iconKey]?.grey;
    } else if (value < thresholds[1]) {
      newIcon = iconMapping[iconKey]?.blue;
    } else if (value < thresholds[2]) {
      newIcon = iconMapping[iconKey]?.green;
    } else if (value < thresholds[3]) {
      newIcon = iconMapping[iconKey]?.yellow;
    } else if (value <= thresholds[4]) {
      newIcon = iconMapping[iconKey]?.red;
    } else {
      console.error('Value out of range:', value);
      return;
    }

    setIcon(newIcon);
  };

  const handleTopicChangeInput = (e) => {
    setCurrentTopic(e.target.value);
  };

  const handleSubscribe = () => {
    if (newTopic && !subscribedTopics.includes(newTopic)) {
      mqttSub(newTopic, (receivedTopic, message) => {
        const value = parseFloat(message);
        console.log(`Received message on topic ${receivedTopic}: ${value}`); // Debug log
        setDroppedIcons((prev) =>
          prev.map((icon) =>
            icon.topic === receivedTopic ? { ...icon, latestValue: value } : icon
          )
        );
      });
  
      // Set a default icon and drop it in the dropbox upon subscribing
      const defaultIconKey = 'icon1'; // Choose an appropriate default icon, e.g., icon1
      const defaultPosition = { x: 10, y: 10 }; // Default position in the dropbox (top-left corner)
      
      // Add the icon to the droppedIcons array
      const newIcon = {
        id: Date.now(), // Ensure unique ID
        iconKey: defaultIconKey,
        position: defaultPosition,
        topic: newTopic, // Assign the new subscribed topic to the icon
        color: iconMapping[defaultIconKey]?.grey // Set color to default grey or any other
      };
  
      setDroppedIcons((prev) => [...prev, newIcon]);
  
      // Add the new topic to the subscribed topics list
      setSubscribedTopics((prevTopics) => [...prevTopics, newTopic]);
      
      // Clear the input field
      setNewTopic('');
    }
  }; 
  const handleCancel = () => {
    setCurrentTopic(previousTopic.current);
    setIsEditing(false);
  };

  const handleUnsubscribeClick = () => {
    mqttUnsub(previousTopic.current);
    handleUnsubscribe(iconKey);
    setMessage('No Data');
    previousTopic.current = '';
    setCurrentTopic('');
    isSubscribed.current = false;
    setIsEditing(false);
  };

  const handleDrag = (event) => {
    const newPosition = { x: event.clientX - 25, y: event.clientY - 25 }; 
    onPositionChange(iconKey, newPosition);
  };

  const handleDragStart = (event) => {
    event.dataTransfer.setData('application/json', JSON.stringify({ iconKey, topic }));
  };

  const handleDragEnd = (event) => {
    event.preventDefault();
  };

  return (
    <div
      style={{ 
        position: 'absolute', 
        left: position.x, 
        top: position.y, 
        cursor: 'move', 
        zIndex: 1, 
        textAlign: 'center' // Ensures text is centered under the icon
      }}
      onClick={handleIconSelect}
      id={iconKey}
      draggable
      onDragStart={handleDragStart}
      onDoubleClick={() => setIsEditing(true)}
    >
      <img
        src={icon}
        alt="Icon"
        style={{ width: '50px', height: '50px', cursor: 'pointer'}}
        title={hoverText}
      />
      <p style={{ fontSize: '12px', color: '#333', position: 'relative' }}> {message} </p>

      {isEditing && (
        <div style={{ marginTop: '10px', textAlign: 'center' }}>
          <input
            type="text"
            value={currentTopic}
            onChange={handleTopicChangeInput}
            placeholder="Enter topic name"
            style={{ padding: '5px', marginBottom: '5px', width: '150px', border: '1px solid #ccc', borderRadius: '4px' }}
            autoFocus
          />
          <button onClick={handleSubs} style={{ margin: '5px', padding: '5px 10px', border: 'none', backgroundColor: '#007bff', color: 'white', borderRadius: '4px', cursor: 'pointer' }}>
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
