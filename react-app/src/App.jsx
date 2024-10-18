import React, { useState, useEffect, useRef } from 'react';
import IconComponent from './components/icon-component';
import { useNavigate } from 'react-router-dom';
import DrawingCanvas from './DrawingCanvas';
import TopicDialog from './components/TopicDialog';
import { mqttSub, mqttUnsub, initializeClient } from './Subscribe';

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

  const navigate = useNavigate();

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
          color: '#5f6368',
          colors : ['Red', 'Blue', 'Yellow', 'Green', 'Purple']
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

  const handleDrawButtonClick = () => {
    navigate('/draw');
  };

  const handleValueChange = (newValue) => {
    updateIconColor(newValue);}

  return (
    <div className="App">
      <div className="subscription-container">
        <h2>MQTT Subscription</h2>
        <button className="drawButton" onClick={()=> navigate('/draw')}> Draw </button>
      </div>

      <div className="icon-container">
        <div
          draggable
          onDragStart={(event) => handleDragStart(event, 'icon1')}
          style={{ display: 'inline-block', cursor: 'move' }}
        >
    
          <svg className="icon" id="icon1" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5f6368"><path d="M480-80q-33 0-56.5-23.5T400-160h160q0 33-23.5 56.5T480-80ZM320-200v-80h320v80H320Zm10-120q-69-41-109.5-110T180-580q0-125 87.5-212.5T480-880q125 0 212.5 87.5T780-580q0 81-40.5 150T630-320H330Zm24-80h252q45-32 69.5-79T700-580q0-92-64-156t-156-64q-92 0-156 64t-64 156q0 54 24.5 101t69.5 79Zm126 0Z"/></svg>
        
          <svg className="icon" id="icon2"  xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5f6368"><path d="M424-80q-51 0-77.5-30.5T320-180q0-26 11.5-50.5T367-271q22-14 35.5-36t18.5-47l-12-6q-6-3-11-7l-92 33q-17 6-33 10t-33 4q-63 0-111.5-55T80-536q0-51 30.5-77.5T179-640q26 0 51 11.5t41 35.5q14 22 36 35.5t47 18.5l6-12q3-6 7-11l-33-92q-6-17-10-33t-4-32q0-64 55-112.5T536-880q51 0 77.5 30.5T640-781q0 26-11.5 51T593-689q-22 14-35.5 36T539-606l12 6q6 3 11 7l92-34q17-6 32.5-9.5T719-640q81 0 121 67t40 149q0 51-32 77.5T777-320q-25 0-48.5-11.5T689-367q-14-22-36-35.5T606-421l-6 12q-3 6-7 11l33 92q6 16 10 30.5t4 30.5q1 65-54 115T424-80Zm56-340q25 0 42.5-17.5T540-480q0-25-17.5-42.5T480-540q-25 0-42.5 17.5T420-480q0 25 17.5 42.5T480-420Zm-46-192q6-2 12.5-3.5T459-618q8-42 30.5-78t59.5-60q5-4 8-10t3-15q0-8-6-13.5t-18-5.5q-38 0-86 16.5T400-719q0 9 2.5 17t4.5 15l27 75ZM240-400q14 0 33-7l75-27q-2-6-3.5-12.5T342-459q-42-8-78-30.5T204-549q-4-5-10.5-8t-14.5-3q-9 0-14 6t-5 18q0 54 20.5 95t59.5 41Zm184 240q47 0 92.5-19t43.5-66q0-8-2.5-15t-4.5-13l-27-75q-6 2-12.5 3.5T501-342q-8 42-30.5 78T411-204q-5 4-8.5 10.5T400-180q1 8 6 14t18 6Zm353-240q9 0 16-5t7-19q0-38-16-86.5T719-560q-9 0-17 2t-15 4l-75 28q2 6 3.5 12.5T618-501q42 8 78 30.5t60 59.5q3 5 9 8t12 3ZM618-501ZM459-618ZM342-459Zm159 117Z"/></svg>

          <svg className="icon" id="icon3" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5f6368"><path d="M320-80q-66 0-113-47t-47-113v-400q0-66 47-113t113-47h40v-80h80v80h80v-80h80v80h40q66 0 113 47t47 113v400q0 66-47 113T640-80H320Zm0-80h320q33 0 56.5-23.5T720-240v-400q0-33-23.5-56.5T640-720H320q-33 0-56.5 23.5T240-640v400q0 33 23.5 56.5T320-160Zm0-400h320v-80H320v80Zm160 320q42 0 71-28.5t29-69.5q0-33-19-56.5T480-490q-63 72-81.5 96T380-338q0 41 29 69.5t71 28.5ZM240-720v560-560Z"/></svg>

          <svg className="icon" id="icon4" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5f6368"><path d="M532-131q-6 5-12.5 8t-14.5 3q-8 0-16-3.5t-14-9.5q-41-44-60.5-90T395-320q0-37 11-78t38-106q23-57 32-87.5t9-56.5q0-34-15-63.5T423-771q-6-6-9.5-14t-3.5-16q0-8 3-14.5t8-12.5q6-6 13.5-9t15.5-3q8 0 15 3t13 8q44 41 65.5 86t21.5 95q0 35-10.5 73.5T518-474q-25 60-34 92t-9 61q0 35 14.5 67.5T534-188q5 6 8 13t3 15q0 8-3 15.5T532-131Zm195 0q-6 5-12.5 8t-14.5 3q-8 0-16-3.5t-14-9.5q-41-44-60.5-89.5T590-319q0-37 11-79t38-106q23-57 32-87t9-56q0-34-15-64.5T618-771q-6-6-9-13.5t-3-15.5q0-8 2.5-14.5T616-827q6-6 14-9.5t16-3.5q8 0 14.5 3t12.5 8q44 41 65.5 86t21.5 95q0 35-10.5 73.5T713-473q-25 60-34 92t-9 60q0 35 15 68.5t45 65.5q5 6 7.5 13t2.5 14q0 8-3 16t-10 13Zm-390 0q-6 5-12.5 8t-14.5 3q-8 0-16-3.5t-14-9.5q-41-44-60.5-89.5T200-319q0-37 11-79t38-106q23-57 32-87t9-56q0-34-15-64.5T228-771q-7-6-10-13.5t-3-15.5q0-8 3-15t8-13q6-6 13.5-9t15.5-3q8 0 15 3t13 8q44 41 65.5 85.5T370-648q0 35-10 73.5T324-474q-25 60-34 92t-9 61q0 35 14.5 68.5T340-187q5 6 7.5 13t2.5 14q0 8-3 16t-10 13Z"/></svg>
      
          <svg className="icon" id="icon5" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5f6368"><path d="M360-360v-240h240v240H360Zm80-80h80v-80h-80v80Zm-80 320v-80h-80q-33 0-56.5-23.5T200-280v-80h-80v-80h80v-80h-80v-80h80v-80q0-33 23.5-56.5T280-760h80v-80h80v80h80v-80h80v80h80q33 0 56.5 23.5T760-680v80h80v80h-80v80h80v80h-80v80q0 33-23.5 56.5T680-200h-80v80h-80v-80h-80v80h-80Zm320-160v-400H280v400h400ZM480-480Z"/></svg>

          <svg className="icon" id="icon6" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5f6368"><path d="M160-120q-17 0-28.5-11.5T120-160q0-17 11.5-28.5T160-200h40v-240h-40q-17 0-28.5-11.5T120-480q0-17 11.5-28.5T160-520h40v-240h-40q-17 0-28.5-11.5T120-800q0-17 11.5-28.5T160-840h640q17 0 28.5 11.5T840-800q0 17-11.5 28.5T800-760h-40v240h40q17 0 28.5 11.5T840-480q0 17-11.5 28.5T800-440h-40v240h40q17 0 28.5 11.5T840-160q0 17-11.5 28.5T800-120H160Zm120-80h400v-240q-17 0-28.5-11.5T640-480q0-17 11.5-28.5T680-520v-240H280v240q17 0 28.5 11.5T320-480q0 17-11.5 28.5T280-440v240Zm200-120q50 0 85-34.5t35-83.5q0-39-22.5-67T480-620q-75 86-97.5 114.5T360-438q0 49 35 83.5t85 34.5ZM280-200v-560 560Z"/></svg>

          <svg className="icon" id="icon7" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5f6368"><path d="M480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-84 31.5-156.5T197-763l56 56q-44 44-68.5 102T160-480q0 134 93 227t227 93q134 0 227-93t93-227q0-67-24.5-125T707-707l56-56q54 54 85.5 126.5T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm-40-360v-440h80v440h-80Z"/></svg>

          <svg className="icon" id="icon8" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5f6368"><path d="M320-80q-66 0-113-47t-47-113v-320q0-57 34-99t86-56v-85q0-33 23.5-56.5T360-880h240q33 0 56.5 23.5T680-800v85q52 14 86 56t34 99v320q0 66-47 113T640-80H320Zm-80-360h480v-120q0-33-23.5-56.5T640-640H320q-33 0-56.5 23.5T240-560v120Zm80 280h320q33 0 56.5-23.5T720-240v-120H240v120q0 33 23.5 56.5T320-160Zm160-280Zm0 80Zm0-40Zm40-320h80v-80H360v80h80q0-17 11.5-28.5T480-760q17 0 28.5 11.5T520-720Z"/></svg>

          <svg className="icon" id="icon9" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5f6368"><path d="M480-80q-83 0-141.5-58.5T280-280q0-48 21-89.5t59-70.5v-320q0-50 35-85t85-35q50 0 85 35t35 85v320q38 29 59 70.5t21 89.5q0 83-58.5 141.5T480-80Zm-40-440h80v-40h-40v-40h40v-80h-40v-40h40v-40q0-17-11.5-28.5T480-800q-17 0-28.5 11.5T440-760v240Z"/></svg>

          <svg className="icon" id="icon10" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5f6368"><path d="M360-840v-80h240v80H360Zm80 440h80v-240h-80v240Zm40 320q-74 0-139.5-28.5T226-186q-49-49-77.5-114.5T120-440q0-74 28.5-139.5T226-694q49-49 114.5-77.5T480-800q62 0 119 20t107 58l56-56 56 56-56 56q38 50 58 107t20 119q0 74-28.5 139.5T734-186q-49 49-114.5 77.5T480-80Zm0-80q116 0 198-82t82-198q0-116-82-198t-198-82q-116 0-198 82t-82 198q0 116 82 198t198 82Zm0-280Z"/></svg>

          <svg className="icon" id="icon11" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5f6368"><path d="M440-640v-120H280v-80h400v80H520v120h-80ZM160-120v-320h80v40h120v-120h-40v-80h320v80h-40v120h120v-40h80v320h-80v-40H240v40h-80Zm80-120h480v-80H520v-200h-80v200H240v80Zm240 0Z"/></svg>

          <svg className="icon" id="icon12" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5f6368" draggable="true" onDragStart={(e)=>handleDragStart(icon12)}><path d="M491-200q12-1 20.5-9.5T520-230q0-14-9-22.5t-23-7.5q-41 3-87-22.5T343-375q-2-11-10.5-18t-19.5-7q-14 0-23 10.5t-6 24.5q17 91 80 130t127 35ZM480-80q-137 0-228.5-94T160-408q0-100 79.5-217.5T480-880q161 137 240.5 254.5T800-408q0 140-91.5 234T480-80Zm0-80q104 0 172-70.5T720-408q0-73-60.5-165T480-774Q361-665 300.5-573T240-408q0 107 68 177.5T480-160Zm0-320Z"/></svg>

          <svg className="icon" id="icon13" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5f6368" draggable="true" onDragStart={(e)=>handleDragStart(icon13)}><path d="M480-120q-42 0-71-29t-29-71q0-42 29-71t71-29q42 0 71 29t29 71q0 42-29 71t-71 29ZM254-346l-84-86q59-59 138.5-93.5T480-560q92 0 171.5 35T790-430l-84 84q-44-44-102-69t-124-25q-66 0-124 25t-102 69ZM84-516 0-600q92-94 215-147t265-53q142 0 265 53t215 147l-84 84q-77-77-178.5-120.5T480-680q-116 0-217.5 43.5T84-516Z"/></svg>
    </div>
    </div>

      <div
        id='drop-box' //for dropbox fxning
        style={{ width: 600, height: 250 }}
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
          thresholds={icon.thresholds || [0, 15, 50, 75, 100]} // Default thresholds if not provided
    colors={icon.colors || ['Red', 'Green', 'Blue', 'Yellow', 'Purple']} // Default colors if not provided
    handleUnsubscribe={handleUnsubscribe}
          onPositionChange={handlePositionChange} 
          setDroppedIcons={setDroppedIcons} 
          handleEdit={openEditDialog} 
          />
        ))}
      </div>

      <TopicDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onSubmit={handleTopicSubmit} initialTopic={newTopic} inputRef={inputRef}/>
        
      <TopicDialog open={editDialogOpen} onClose={handleEditCancel} onSubmit={handleEditSubmit} initialTopic={editedTopic} inputRef={inputRef}/>
    </div>
    
  );
}

export default App;