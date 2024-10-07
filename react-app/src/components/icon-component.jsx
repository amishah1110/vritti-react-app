import React, { useState, useEffect, useRef } from 'react';
import { mqttSub, mqttUnsub } from '../Subscribe';

// Import your icon files
import Icon1Grey from '../icons/bulb-grey.svg';
import Icon1Red from '../icons/bulb-red.svg';
import Icon1Blue from '../icons/bulb-blue.svg';
import Icon1Yellow from '../icons/bulb-yellow.svg';
import Icon1Green from '../icons/bulb-green.svg';

import Icon2Grey from '../icons/fan-grey.svg';
import Icon2Red from '../icons/fan-red.svg';
import Icon2Blue from '../icons/fan-blue.svg';
import Icon2Green from '../icons/fan-green.svg';
import Icon2Yellow from '../icons/fan-yellow.svg';

import Icon3Grey from '../icons/gas-meter-grey.svg';
import Icon3Red from '../icons/gas-meter-red.svg';
import Icon3Blue from '../icons/gas-meter-blue.svg';
import Icon3Green from '../icons/gas-meter-green.svg';
import Icon3Yellow from '../icons/gas-meter-yellow.svg';

import Icon4Grey from '../icons/heat-grey.svg';
import Icon4Red from '../icons/heat-red.svg';
import Icon4Blue from '../icons/heat-blue.svg';
import Icon4Green from '../icons/heat-green.svg';
import Icon4Yellow from '../icons/heat-yellow.svg';

import Icon5Grey from '../icons/memory-grey.svg';
import Icon5Red from '../icons/memory-red.svg';
import Icon5Blue from '../icons/memory-blue.svg';
import Icon5Green from '../icons/memory-green.svg';
import Icon5Yellow from '../icons/memory-yellow.svg';

import Icon6Grey from '../icons/oil-barrel-grey.svg';
import Icon6Red from '../icons/oil-barrel-red.svg';
import Icon6Blue from '../icons/oil-barrel-blue.svg';
import Icon6Green from '../icons/oil-barrel-green.svg';
import Icon6Yellow from '../icons/oil-barrel-yellow.svg';

import Icon7Grey from '../icons/power-settings-grey.svg';
import Icon7Red from '../icons/power-settings-red.svg';
import Icon7Blue from '../icons/power-settings-blue.svg';
import Icon7Green from '../icons/power-settings-green.svg';
import Icon7Yellow from '../icons/power-settings-yellow.svg';

import Icon8Grey from '../icons/propane-tank-grey.svg';
import Icon8Red from '../icons/propane-tank-red.svg';
import Icon8Blue from '../icons/propane-tank-blue.svg';
import Icon8Green from '../icons/propane-tank-green.svg';
import Icon8Yellow from '../icons/propane-tank-yellow.svg';

import Icon9Grey from '../icons/thermostat-grey.svg';
import Icon9Red from '../icons/thermostat-red.svg';
import Icon9Blue from '../icons/thermostat-blue.svg';
import Icon9Green from '../icons/thermostat-green.svg';
import Icon9Yellow from '../icons/thermostat-yellow.svg';

import Icon10Grey from '../icons/timer-grey.svg';
import Icon10Red from '../icons/timer-red.svg';
import Icon10Blue from '../icons/timer-blue.svg';
import Icon10Green from '../icons/timer-green.svg';
import Icon10Yellow from '../icons/timer-yellow.svg';

import Icon11Grey from '../icons/valve-grey.svg';
import Icon11Red from '../icons/valve-red.svg';
import Icon11Blue from '../icons/valve-blue.svg';
import Icon11Green from '../icons/valve-green.svg';
import Icon11Yellow from '../icons/valve-yellow.svg';

import Icon12Grey from '../icons/water-drop-grey.svg';
import Icon12Red from '../icons/water-drop-red.svg';
import Icon12Blue from '../icons/water-drop-blue.svg';
import Icon12Green from '../icons/water-drop-green.svg';
import Icon12Yellow from '../icons/water-drop-yellow.svg';

import Icon13Grey from '../icons/wifi-grey.svg';
import Icon13Red from '../icons/wifi-red.svg';
import Icon13Blue from '../icons/wifi-blue.svg';
import Icon13Green from '../icons/wifi-green.svg';
import Icon13Yellow from '../icons/wifi-yellow.svg';

export const iconMapping = {
  'icon1': { grey: Icon1Grey, red: Icon1Red, blue: Icon1Blue, green: Icon1Green, yellow: Icon1Yellow },
  'icon2': { grey: Icon2Grey, red: Icon2Red, blue: Icon2Blue, green: Icon2Green, yellow: Icon2Yellow },
  'icon3': { grey: Icon3Grey, red: Icon3Red, blue: Icon3Blue, green: Icon3Green, yellow: Icon3Yellow },
  'icon4': { grey: Icon4Grey, red: Icon4Red, blue: Icon4Blue, green: Icon4Green, yellow: Icon4Yellow },
  'icon5': { grey: Icon5Grey, red: Icon5Red, blue: Icon5Blue, green: Icon5Green, yellow: Icon5Yellow },
  'icon6': { grey: Icon6Grey, red: Icon6Red, blue: Icon6Blue, green: Icon6Green, yellow: Icon6Yellow },
  'icon7': { grey: Icon7Grey, red: Icon7Red, blue: Icon7Blue, green: Icon7Green, yellow: Icon7Yellow },
  'icon8': { grey: Icon8Grey, red: Icon8Red, blue: Icon8Blue, green: Icon8Green, yellow: Icon8Yellow },
  'icon9': { grey: Icon9Grey, red: Icon9Red, blue: Icon9Blue, green: Icon9Green, yellow: Icon9Yellow },
  'icon10': { grey: Icon10Grey, red: Icon10Red, blue: Icon10Blue, green: Icon10Green, yellow: Icon10Yellow },
  'icon11': { grey: Icon11Grey, red: Icon11Red, blue: Icon11Blue, green: Icon11Green, yellow: Icon11Yellow },
  'icon12': { grey: Icon12Grey, red: Icon12Red, blue: Icon12Blue, green: Icon12Green, yellow: Icon12Yellow },
  'icon13': { grey: Icon13Grey, red: Icon13Red, blue: Icon13Blue, green: Icon13Green, yellow: Icon13Yellow },
};


const IconComponent = ({ id, latestValue, position, onPositionChange, iconKey, topic = '', thresholds = [0, 15, 50, 75, 100], handleIconSelect, handleUnsubscribe,}) => {
  const [icon, setIcon] = useState(iconMapping[iconKey.split('-')[0]]?.grey); // Adjusted to extract base iconKey
  const [isEditing, setIsEditing] = useState(false);
  const [currentTopic, setCurrentTopic] = useState(topic);
  const [message, setMessage] = useState('No Data');
  const previousTopic = useRef(topic);
  const [isBlinking, setIsBlinking] = useState(false);
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
      newIcon = iconMapping[iconKey.split('-')[0]]?.grey;
      triggerBlinking();
      return;
    }
    setIsBlinking(false);
    setIcon(newIcon);
    checkThresholds(value);
  };

  const checkThresholds = (value) => {
    console.log("going inside checkThresholds method")
    const [t1, t5] = thresholds;
    if (value < t1 || value > t5) {
      setIsBlinking(true); 
      setTimeout(() => {
        setIsBlinking(false); 
      }, 3000); 
    }
  };

  const triggerBlinking = () => {
    setIsBlinking(true);
    setIcon(iconMapping[iconKey.split('-')[0]]?.grey);
    setTimeout(() => {
        setIsBlinking(false);
    }, 10000); // Duration of blinking effect
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

      // previousTopic.current = currentTopic;
       previousTopic.current = newTopic; //changed this line
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

  const SCADAApp = () => {
    const [thresholds, setThresholds] = useState([0, 25, 50, 75, 100]);
    const [latestValue, setLatestValue] = useState(null);
    const [showToast, setShowToast] = useState(false);
  
    const checkThresholds = (value) => {
      const [t1, t2, t3, t4, t5] = thresholds;
      
      if (value < t1 || value > t5) {
        // Value is outside the defined range
        triggerToast(`Value ${value} is out of range!`);
      }
    };
  
    return (
      <div className="scada-container">
        {showToast && <ToastNotification message={`Alert! Latest value ${latestValue} is out of range!`} onClose={() => setShowToast(false)} />}
        <div className="scada-display">
          {/* Display and monitor the latest values here */}
        </div>
      </div>
    );
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
      <img 
  src={icon} 
  alt="Icon" 
  style={{ 
    width: '50px', 
    height: '50px', 
    cursor: 'pointer' 
  }} 
  className={isBlinking ? 'blink-animation' : ''} 
  title={`Topic: ${previousTopic.current}`} 
/>

      {/* <img src={icon} alt="Icon" style={{ width: '50px', height: '50px',cursor: 'pointer' }} title={`Topic: ${previousTopic.current}`}
      /> */}
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
          <button onClick={handleSubmit} style={{ margin: '5px', padding: '5px 10px', border: 'none', backgroundColor: '#007bff', color: 'white', borderRadius: '4px', cursor: 'pointer' }}>Submit</button>
          <button onClick={handleCancel} style={{ margin: '5px', padding: '5px 10px', border: 'none', backgroundColor: '#6c757d', color: 'white', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleUnsubscribeClick} style={{ margin: '5px', padding: '5px 10px', border: 'none', backgroundColor: '#dc3545', color: 'white', borderRadius: '4px', cursor: 'pointer' }}> Unsubscribe</button>
        </div>
      )}
    </div>
  );
};

export default IconComponent;
