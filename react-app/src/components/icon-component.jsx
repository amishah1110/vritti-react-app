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

const iconMapping = {
  'icon1': { grey: Icon1Grey, red: Icon1Red, blue: Icon1Blue, green: Icon1Green, yellow: Icon1Yellow },
  'icon2': { grey: Icon2Grey, red: Icon2Red, blue: Icon2Blue, green: Icon2Green, yellow: Icon2Yellow },
  'icon3': { grey: Icon3Grey, red: Icon3Red, blue: Icon3Blue, green: Icon3Green, yellow: Icon3Yellow },
};

const IconComponent = ({ hoverText, latestValue, position, onPositionChange, iconKey, topic = '', thresholds = [0, 15, 50, 75, 100], handleIconSelect }) => {
  const [icon, setIcon] = useState(iconMapping[iconKey]?.grey);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTopic, setCurrentTopic] = useState(topic);
  const [message, setMessage] = useState('No Data');
  const previousTopic = useRef(topic);
  const isSubscribed = useRef(false);

  useEffect(() => {
    if (iconMapping[iconKey]) {
      setIcon(iconMapping[iconKey].grey);
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

  const handleSubmit = () => {
    if (currentTopic.trim()) {
      mqttUnsub(previousTopic.current); 
      
      previousTopic.current = currentTopic;
      mqttSub(currentTopic, (receivedTopic, message) => {
        console.log("Received message:", message, "on topic:", receivedTopic);
        if (receivedTopic === currentTopic) {
          const value = parseFloat(message);
          setMessage(message);
          updateIconColor(value);
          if (!isNaN(value)) {
            updateIconColor(value);
          } else {
            console.error(`Invalid message value: ${message}`);
          }
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

  const handleUnsubscribe = () => {
    mqttUnsub(previousTopic.current); 
    setMessage('No Data');
    previousTopic.current = '';
    setCurrentTopic('');
    isSubscribed.current = false;
    setIsEditing(false);
  };

  const handleUnsubscribeClick = () => {
    handleUnsubscribe();
    setMessage('No Data');
    previousTopic.current = '';
    setCurrentTopic('');
    isSubscribed.current = false;
    setIsEditing(false);
  };

  const handleDragStart = (event) => {
    event.dataTransfer.setData('application/json', JSON.stringify({ iconKey, position }));
  };

  return (
    <div
      style={{ position: 'absolute', left: position.x, top: position.y, cursor: 'move', zIndex: 1 }}
      onClick={handleIconSelect}
      id={iconKey}
      draggable
      onDragStart={handleDragStart}
      onDoubleClick={() => setIsEditing(true)}
    >
      <img
        src={icon}
        alt="Icon"
        style={{ width: '50px', height: '50px', cursor: 'pointer' }}
        title={hoverText}
      />
      <p style={{ margin: '5px 0' }}>{message}</p>

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
