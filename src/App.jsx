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
  const inputRef = useRef(null);

  useEffect(() => {
    initializeClient();
  }, []);

  useEffect(() => {
    if (dialogOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [dialogOpen]);

  const handleIconSelection = (index) => {
    if (index < droppedIcons.length) {
      setSelectedIcon(droppedIcons[index]);
    }
  };

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

  const handleUnsubscribe = (topicToUnsubscribe) => {
    if (topicToUnsubscribe) {
      mqttUnsub(topicToUnsubscribe);
      setSubscribedTopics((prevTopics) =>
        prevTopics.filter((t) => t !== topicToUnsubscribe)
      );
      setDroppedIcons((prev) =>
        prev.filter((icon) => icon.topic !== topicToUnsubscribe)
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
      if (!droppedIcons.some(droppedIcon => droppedIcon.iconKey === iconKey && droppedIcon.topic === selectedIcon?.topic)) {
        const dropBox = event.currentTarget;
        const rect = dropBox.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        setDroppedIcons((prev) => [
          ...prev,
          { ...selectedIcon, iconKey, position: { x, y }, id: Date.now(), topic: selectedIcon?.topic }
        ]);
        setDialogOpen(true);
      }
    }
  };

  const handleIconPositionChange = (id, newPosition) => {
    const dropBox = document.querySelector('.dropbox');
    const rect = dropBox.getBoundingClientRect();
    const iconWidth = 50;
    const iconHeight = 50;

    const maxX = rect.width - iconWidth;
    const maxY = rect.height - iconHeight;

    const x = Math.max(0, Math.min(newPosition.x, maxX));
    const y = Math.max(0, Math.min(newPosition.y, maxY));

    setDroppedIcons((prev) =>
      prev.map((icon) =>
        icon.id === id ? { ...icon, position: { x, y } } : icon
      )
    );
  };

  const handleTopicSubmit = (topic, colorThresholds) => {
    if (selectedIcon && topic.trim()) {
      setDroppedIcons((prev) => [
        ...prev, { ...selectedIcon, topic: topic.trim(), id: Date.now(), colorThresholds },
      ]);

      if (!subscribedTopics.includes(topic.trim())) {
        mqttSub(topic.trim(), (receivedTopic, message) => {
          const value = parseFloat(message);
          setDroppedIcons((prev) =>
            prev.map((droppedIcon) =>
              droppedIcon.topic === receivedTopic ? { ...droppedIcon, latestValue: value } : droppedIcon
            )
          );
        });
        setSubscribedTopics((prevTopics) => [...prevTopics, topic.trim()]);
      }
    }

    setDialogOpen(false);
    setNewTopic('');
  };

  const handleIconDoubleClick = (icon) => {
    setEditingIcon(icon);
    setEditedTopic(icon.topic || '');
    setEditDialogOpen(true);
  };

  const handleEditSubmit = () => {
    if (editedTopic.trim() && editingIcon) {
      const oldTopic = editingIcon.topic;
      const newTopic = editedTopic.trim();

      if (oldTopic !== newTopic) {
        mqttUnsub(oldTopic);
        mqttSub(newTopic, (receivedTopic, message) => {
          const value = parseFloat(message);
          setDroppedIcons((prev) =>
            prev.map((icon) =>
              icon.topic === receivedTopic ? { ...icon, latestValue: value } : icon
            )
          );
        });
      }

      setDroppedIcons((prev) =>
        prev.map((icon) =>
          icon.id === editingIcon.id ? { ...icon, topic: newTopic } : icon
        )
      );

      setSubscribedTopics((prevTopics) => {
        const updatedTopics = prevTopics.filter((topic) => topic !== oldTopic);
        return newTopic !== oldTopic ? [...updatedTopics, newTopic] : updatedTopics;
      });

      setEditDialogOpen(false);
      setEditingIcon(null);
    }
  };

  const handleEditCancel = () => {
    setEditDialogOpen(false);
    setEditingIcon(null);
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
        {droppedIcons.map((icon, index) => (
          <IconComponent
            key={icon.id}
            handleIconSelect={() => handleIconSelection(index)}
            topic={icon.topic}
            hoverText={`Topic: ${icon.topic}`}
            latestValue={icon.latestValue}
            position={icon.position}
            iconKey={icon.iconKey}
            onPositionChange={(event) => 
              handleIconPositionChange(icon.id, { x: event.clientX - event.currentTarget.getBoundingClientRect().left, y: event.clientY - event.currentTarget.getBoundingClientRect().top })
            }
            onDoubleClick={() => handleIconDoubleClick(icon)}
            colorThresholds={icon.colorThresholds}
          />
        ))}
      </div>

      {subscribedTopics.length > 0 && (
        <div>
          <h3>Subscribed Topics</h3>
          {subscribedTopics.map((topic, index) => (
            <div key={index} className="topic-item">
              <span>{topic}</span>
              <button className="unsubscribeButton" onClick={() => handleUnsubscribe(topic)}>
                Unsubscribe
              </button>
            </div>
          ))}
        </div>
      )}

      <TopicDialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)} 
        onSubmit={(topic, colorThresholds) => handleTopicSubmit(topic, colorThresholds)} 
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
