import React, { useState, useEffect, useRef } from 'react';
import IconComponent from './components/icon-component';
import { iconMapping } from './components/icon-component';
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
        console.log(`Received message on topic ${receivedTopic}: ${value}`);
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

  const handleUnsubscribe = (id) => {
    const iconToUnsubscribe = droppedIcons.find((icon) => icon.id == id);
    if (iconToUnsubscribe) {
      mqttUnsub(iconToUnsubscribe.topic);
      setDroppedIcons((prevIcons) =>
        prevIcons.filter((icon) => icon.id != id)
      );
      setSubscribedTopics((prevTopics) =>
        prevTopics.filter((topic) => topic != iconToUnsubscribe.topic)
      );
    }
  };

  const handleDragStart = (event, iconKey) => {
    event.dataTransfer.setData('application/json', JSON.stringify({ iconKey }));
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const data = event.dataTransfer.getData('application/json');

    if (data && event.target.id === 'drop-box') {
      const { iconKey, topic, id } = JSON.parse(data);
      const rect = event.currentTarget.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      const existingIcon = droppedIcons.find(icon => icon.id == id);

      if (existingIcon) {
        setDroppedIcons((prevIcons) =>
          prevIcons.map((icon) =>icon.id == id ? { ...icon, position: { x, y } } : icon));
      } else {
        const newIcon = {
          id: Date.now(), 
          iconKey,
          position: { x, y }, 
          thresholds: [0, 15, 50, 75, 100],
          topic: '', 
          color: iconMapping[iconKey]?.grey
        };

        setDroppedIcons((prev) => [...prev, newIcon]);
        setPendingIcon(newIcon);
        setDialogOpen(true);
      }
    }
  };

  const handleTopicSubmit = (topic, colorThresholds) => {
    if (pendingIcon && topic.trim()) {
      const trimmedTopic = topic.trim();

      if (!droppedIcons.some(icon => icon.topic == trimmedTopic)) {
        const updatedIcon = {...pendingIcon, topic: trimmedTopic, thresholds:colorThresholds};

        setDroppedIcons((prev) => prev.map(icon => (icon.id == updatedIcon.id ? updatedIcon : icon)));

        mqttSub(trimmedTopic, (receivedTopic, message) => {
          const value = parseFloat(message);
          setDroppedIcons((prev) =>
            prev.map((icon) =>
              icon.topic === receivedTopic ? { ...icon, latestValue: value } : icon
            )
          );

          console.log(droppedIcons);
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

        console.log(`Editing topic from "${oldTopic}" to "${newTopic}"`);
        if (oldTopic !== newTopic) {
            mqttUnsub(oldTopic);
            console.log(`Unsubscribed from old topic: ${oldTopic}`);

            if (!subscribedTopics.includes(newTopic) && !droppedIcons.some(icon => icon.topic == newTopic)) {
                setDroppedIcons((prev) =>
                    prev.map((icon) => icon.id == editingIcon.id ? { ...icon, topic: newTopic } : icon)
                );
                setSubscribedTopics((prevTopics) => {
                    const updatedTopics = prevTopics.filter((topic) => topic != oldTopic);
                    console.log(`Updated subscribed topics: ${[...updatedTopics, newTopic]}`);
                    return [...updatedTopics, newTopic];
                });

                mqttSub(newTopic, (receivedTopic, message) => {
                    const value = parseFloat(message);
                    console.log(`Received message on topic ${receivedTopic}: ${value}`);
                    setDroppedIcons((prev) =>
                        prev.map((icon) => icon.topic == receivedTopic ? { ...icon, latestValue: value } : icon));
                });

                setEditDialogOpen(false);
                setEditingIcon(null);
                setEditedTopic(''); 
            } else {
                alert("This topic is already subscribed. Please enter a unique topic.");
            }
        } else {
            console.log("No changes made to the topic.");
            setEditDialogOpen(false);
            setEditingIcon(null);
            setEditedTopic('');
        }
    } else {
        console.log("Invalid topic or editingIcon is null");
    }
};


  const handleEditCancel = () => {
    setEditDialogOpen(false);
    setEditingIcon(null);
    setEditedTopic(''); // Reset the edited topic
  };

  const handlePositionChange = (id, newPosition) => {
    setDroppedIcons((prevIcons) =>
      prevIcons.map((icon) =>
        icon.id === id ? { ...icon, position: newPosition } : icon
      )
    );
  };

  const openEditDialog = (icon) => {
    setEditingIcon(icon);
    setEditedTopic(icon.topic); // Set the current topic in the edit dialog
    setEditDialogOpen(true);
  };

  const updateThresholds = (updatedValues, iconIndex) => {
    const icon = icons[iconIndex];
    
  }

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
          onDragStart={(event) => handleDragStart(event, 'icon1')}
        />
        <img
          src={icon2}
          alt="icon-2"
          draggable
          onDragStart={(event) => handleDragStart(event, 'icon2')}
        />
        <img
          src={icon3}
          alt="icon-3"
          draggable
          onDragStart={(event) => handleDragStart(event, 'icon3')}
        />
      </div>

      <div
        id='drop-box' //for dropbox fxning
        style={{ width: 600, height: 350 }}
        className="dropbox"
        onDrop={handleDrop}
        onDragOver={(event) => event.preventDefault()}
      >
        {droppedIcons.map((icon, index) => (
          <IconComponent  
            key={icon.id}
            id={icon.id}
            topic={icon.topic}  
            hoverText={`Topic: ${icon.topic}`}  
            latestValue={icon.latestValue}  
            position={icon.position}  
            iconKey={icon.iconKey}  
            thresholds={icon.thresholds}
            handleUnsubscribe={handleUnsubscribe} 
            onPositionChange={handlePositionChange} 
            setDroppedIcons={setDroppedIcons}
            handleEdit={openEditDialog}  // Pass the edit handler
          />
        ))}
      </div>

      <TopicDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onSubmit={handleTopicSubmit} initialTopic={newTopic} inputRef={inputRef}/>
        
      <TopicDialog open={editDialogOpen} onClose={handleEditCancel} onSubmit={handleEditSubmit} initialTopic={editedTopic} inputRef={inputRef}/>
    </div>
  );
}

export default App;
