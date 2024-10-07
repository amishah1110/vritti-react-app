import React, { useState } from 'react';
import IconComponent from './IconComponent';
import TopicDialog from './TopicDialog';
import { mqttSub, mqttUnsub } from './Subscribe';
import '../styles.css';

const DropBox = ({ onDropIcon }) => {
  const [icons, setIcons] = useState([]);
  const [showDialog, setShowDialog] = useState(false);
  const [currentIcon, setCurrentIcon] = useState(null);
  const [currentPosition, setCurrentPosition] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    // Remove icons with null topics
    setIcons(prevIcons => prevIcons.filter(icon => icon.topic !== null));
}, [icons]);

  const handleIconDrop = (draggedIcon, position) => {
    const existingIcon = icons.find(icon => icon.id === draggedIcon.id);

    if (existingIcon) {
      // Update existing icon position
      setIcons(prevIcons =>
        prevIcons.map(icon =>
          icon.id === draggedIcon.id ? { ...icon, position } : icon
        )
      );
    } else {
      // Add new icon
      const newIcon = { ...draggedIcon, position, topic: '' };
      setIcons(prev => prev.concat(newIcon));
      setCurrentIcon(newIcon);
      setCurrentPosition(position);
      setShowDialog(true); // Show dialog for new icon topic
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const data = event.dataTransfer.getData('application/json');
    const draggedData = JSON.parse(data);
    
    const dropBox = event.currentTarget;
    const rect = dropBox.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    handleIconDrop(draggedData, { x, y });
  };

  const handleDialogSubmit = (newTopic, colorThresholds) => {
    if (currentIcon && newTopic.trim()) {
        // Unsubscribe from the old topic
        mqttUnsub(currentIcon.topic);
        
        // Update the icon with the new topic
        const updatedIcons = icons.map(icon => 
            icon.iconKey === currentIcon.iconKey 
                ? { ...icon, topic: newTopic } 
                : icon
        );

        setIcons(updatedIcons);
        
        // Subscribe to the new topic
        mqttSub(newTopic, (receivedTopic, message) => {
            console.log(`Received message on topic ${receivedTopic}: ${message}`);
        });

    } else {
        // Handle null topic case
        handleUnsubscribe(currentIcon.iconKey);
    }
};


  const handleUnsubscribe = (id) => {
    const iconToUnsubscribe = icons.find(icon => icon.id === id);
    if (iconToUnsubscribe) {
      mqttUnsub(iconToUnsubscribe.topic);
      setIcons(prevIcons => prevIcons.filter(icon => icon.id !== id));
    }
  };

  return (
    <div>
      <div
        className="dropbox"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        style={{
          position: 'absolute',
          left: 0, // Align DropBox to the left side
          top: 0,
          width: '300px', 
          height: '500px',
          border: '1px solid #ccc',
          marginRight: '20px'
        }}
      >
        {icons.map((icon, index) => (
          <IconComponent
            key={icon.iconKey}
            topic={icon.topic}
            position={icon.position}
            iconKey={icon.iconKey}
            handleUnsubscribe={handleUnsubscribe}
            onPositionChange={handleIconDrop} // Update position when dragged
          />
        ))}
      </div>
      
      {showDialog && (
        <TopicDialog
          open={showDialog}
          onClose={() => setShowDialog(false)}
          onSubmit={handleDialogSubmit}
          dialogStyle={{ right: 0 }} // Add style prop for dialog to position it to the right
        />
      )}
    </div>
  );
};

export default DropBox;
