import React, { useState, useEffect, useRef } from 'react';
import IconComponent from './components/icon-component';
import TopicDialog from './components/TopicDialog';
import { mqttSub, mqttUnsub, initializeClient } from './Subscribe';
import icon1 from './icons/icon-grey.svg';
import icon2 from './icons/hangout-grey.svg';
import icon3 from './icons/planner-grey.svg';
import './styles.css';

function App() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState(null);
  const [editingIcon, setEditingIcon] = useState(null);
  const [newTopic, setNewTopic] = useState('');
  const [editedTopic, setEditedTopic] = useState('');
  const [subscribedTopics, setSubscribedTopics] = useState([]);
  const [droppedIcons, setDroppedIcons] = useState([]);
  const [pendingIcon, setPendingIcon] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    initializeClient();
  }, []);

  useEffect(() => {
    if (dialogOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [dialogOpen]);

  const handleTopicChange = (event) => {
    setNewTopic(event.target.value);
  };

  const handleSubscribe = () => {
    if (newTopic && !subscribedTopics.includes(newTopic)) {
      mqttSub(newTopic, (receivedTopic, message) => {
        const value = parseFloat(message);
        setDroppedIcons((prev) =>
          prev.map((icon) =>
            icon.topic === receivedTopic ? { ...icon, latestValue: value } : icon
          )
        );
      });
      setSubscribedTopics((prevTopics) => [...prevTopics, newTopic]);
      setNewTopic('');
    }
  };

  const handleUnsubscribe = (iconKey) => {
    const iconToUnsubscribe = droppedIcons.find(icon => icon.iconKey === iconKey);
    if (iconToUnsubscribe) {
      mqttUnsub(iconToUnsubscribe.topic);
      setDroppedIcons((prevIcons) =>
        prevIcons.filter(icon => icon.iconKey !== iconKey) 
      );
      setSubscribedTopics((prevTopics) =>
        prevTopics.filter(topic => topic !== iconToUnsubscribe.topic)
      );
    }
  };
  

  const handleDragStart = (event, icon, iconKey) => {
    event.dataTransfer.setData('application/json', JSON.stringify({ icon, iconKey }));
    event.dataTransfer.effectAllowed = 'move';
  };

 
  const handleDrop = (event) => {
    event.preventDefault();
    const data = event.dataTransfer.getData('application/json');
    
    if (data && event.target.id === 'drop-box') {
      const { icon, iconKey } = JSON.parse(data);
      
      const rect = event.currentTarget.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
  
      const existingIcon = droppedIcons.find(icon => icon.iconKey === iconKey);
  
      if (existingIcon) {
        setDroppedIcons(prevIcons => 
          prevIcons.map(icon => 
            icon.iconKey === iconKey ? { ...icon, position: { x, y } } : icon
          )
        );
      } else {
        setPendingIcon({ ...icon, iconKey: `${iconKey}_${Date.now()}`, position: { x, y }, topic: '', id: Date.now() });
        setDialogOpen(true);
      }
    }
  };
  

  const handleTopicSubmit = (topic, colorThresholds) => {
    if (pendingIcon && topic.trim()) {
      const trimmedTopic = topic.trim();
      const uniqueIconKey = `${pendingIcon.iconKey}_${trimmedTopic}`;
  
      if (!droppedIcons.some(icon => icon.topic === trimmedTopic && icon.iconKey === pendingIcon.iconKey)) {
        setDroppedIcons((prev) => [
          ...prev,
          { ...pendingIcon, topic: trimmedTopic, iconKey: uniqueIconKey, colorThresholds }
        ]);
        mqttSub(trimmedTopic, (receivedTopic, message) => {
          const value = parseFloat(message);
          setDroppedIcons((prev) =>
            prev.map((droppedIcon) =>
              droppedIcon.topic === receivedTopic ? { ...droppedIcon, latestValue: value } : droppedIcon
            )
          );
        });
  
        setPendingIcon(null);
        setDialogOpen(false);
      } else {
        alert("An icon with this topic already exists. Please enter a unique topic.");
      }
    }
  };

  const handleEditSubmit = () => {
    if (editedTopic.trim() && editingIcon) {
      const oldTopic = editingIcon.topic;
      const newTopic = editedTopic.trim();

      if (oldTopic !== newTopic) {
        mqttUnsub(oldTopic);
        setDroppedIcons((prev) =>
          prev.map((icon) =>
            icon.id === editingIcon.id ? { ...icon, topic: newTopic } : icon
          )
        );

        setSubscribedTopics((prevTopics) => {
          const updatedTopics = prevTopics.filter((topic) => topic !== oldTopic);
          return [...updatedTopics, newTopic];
        });

        mqttSub(newTopic, (receivedTopic, message) => {
          const value = parseFloat(message);
          setDroppedIcons((prev) =>
            prev.map((icon) =>
              icon.topic === receivedTopic ? { ...icon, latestValue: value } : icon
            )
          );
        });

        setEditDialogOpen(false);
        setEditingIcon(null);
      }
    }
  };

  const handleEditCancel = () => {
    setEditDialogOpen(false);
    setEditingIcon(null);
  };
  
  const handlePositionChange = (iconKey, newPosition) => {
    setDroppedIcons((prevIcons) =>
      prevIcons.map((icon) =>
        icon.iconKey === iconKey ? { ...icon, position: newPosition } : icon
      )
    );
  };
  

  return (
    <div className="App">
      <div className="subscription-container">
        <h1>MQTT Subscription</h1>
        <input
          type="text"
          placeholder="Enter topic to subscribe"
          value={newTopic}
          onChange={handleTopicChange}
        />
        <button className="subscribeButton" onClick={handleSubscribe}>Subscribe</button>
      </div>

      <div className="drag-container">
        <img
          src={icon1}
          alt="icon-1"
          draggable
          onDragStart={(event) => handleDragStart(event, icon1, 'icon1')}
        />
        <img
          src={icon2}
          alt="icon-2"
          draggable
          onDragStart={(event) => handleDragStart(event, icon2, 'icon2')}
        />
        <img
          src={icon3}
          alt="icon-3"
          draggable
          onDragStart={(event) => handleDragStart(event, icon3, 'icon3')}
        />
      </div>

      <div
        id='drop-box'
        style={{ width: 400, height: 300 }}
        className="dropbox"
        onDrop={handleDrop}
        onDragOver={(event) => event.preventDefault()}
      >
        {droppedIcons.map((icon) => (
         <IconComponent  
            key={icon.iconKey}  
            topic={icon.topic}  
            hoverText={`Topic: ${icon.topic}`}  
            latestValue={icon.latestValue}  
            position={icon.position}  
            iconKey={icon.iconKey}  
            onDragStart={(event) => handleDragStart(event, icon, icon.iconKey)}  
            handleUnsubscribe={handleUnsubscribe} 
            onPositionChange={handlePositionChange}  
            />
       
        ))}
      </div>

      <TopicDialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)} 
        onSubmit={(topic, colorThresholds) => handleTopicSubmit(topic, colorThresholds)} 
        initialTopic={newTopic} 
        inputRef={inputRef} 
      />
        
      <TopicDialog 
        open={editDialogOpen} 
        onClose={handleEditCancel} 
        onSubmit={handleEditSubmit} 
        initialTopic={editedTopic} 
      />
    </div>
  );
}

export default App;
