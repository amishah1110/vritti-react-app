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

  const handleIconDrop = (draggedIcon, position) => {
    const existingIcon = icons.find(icon => icon.iconKey === draggedIcon.iconKey);

    if (existingIcon) {
      // Update existing icon position
      setIcons(prevIcons =>
        prevIcons.map(icon =>
          icon.iconKey === draggedIcon.iconKey ? { ...icon, position } : icon
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

  const handleDialogSubmit = (topic, colorThresholds) => {
    if (currentIcon && topic.trim()) {
      const trimmedTopic = topic.trim();
      
      if (!icons.some(icon => icon.topic === trimmedTopic)) {
        const updatedIcons = icons.map(icon =>
          icon.iconKey === currentIcon.iconKey ? { ...icon, topic: trimmedTopic } : icon
        );

        setIcons(updatedIcons);
        
        // Subscribe to the new topic using mqttSub
        mqttSub(trimmedTopic, (receivedTopic, message) => {
          const value = parseFloat(message);
          setIcons(prev =>
            prev.map(icon =>
              icon.topic === receivedTopic ? { ...icon, latestValue: value } : icon
            )
          );
        });

        setShowDialog(false);
        setCurrentIcon(null);
        setCurrentPosition(null);
      } else {
        alert("An icon with this topic already exists. Please enter a unique topic.");
      }
    }
  };

  const handleUnsubscribe = (iconKey) => {
    const iconToUnsubscribe = icons.find(icon => icon.iconKey === iconKey);
    if (iconToUnsubscribe) {
      mqttUnsub(iconToUnsubscribe.topic);
      setIcons(prevIcons => prevIcons.filter(icon => icon.iconKey !== iconKey));
    }
  };

  return (
    <div>
      {/* Shifted DropBox to the left */}
      <div
        className="dropbox"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        style={{
          position: 'absolute',
          left: 0, // Align DropBox to the left side
          top: 0,
          width: '300px', // Adjust width as needed
          height: '500px',
          border: '1px solid #ccc',
          marginRight: '20px' // Adds some space between dropbox and other elements
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

      {/* TopicDialog positioned to the right */}
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
