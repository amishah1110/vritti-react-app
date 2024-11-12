import React, { useState, useEffect } from 'react';
import IconComponent from './IconComponent';
import TopicDialog from './TopicDialog';
import { mqttSub, mqttUnsub } from './Subscribe';
import '../styles.css';

const DropBox = ({ onDropIcon }) => {
  const [icons, setIcons] = useState([]);
  const [showDialog, setShowDialog] = useState(false);
  const [currentIcon, setCurrentIcon] = useState(null);
  const [currentPosition, setCurrentPosition] = useState(null);

  useEffect(() => {
    // Remove icons with null topics
    setIcons((prevIcons) => prevIcons.filter((icon) => icon.topic !== null));
  }, []);

  const handleIconDrop = (draggedIcon, position) => {
    const existingIcon = icons.find((icon) => icon.id === draggedIcon.id);
  
    if (existingIcon) {
      // Update existing icon position
      setIcons((prevIcons) => prevIcons.map((icon) => icon.id === draggedIcon.id ? { ...icon, position } : icon));
    } else {
      // Add new icon
      const newIcon = { ...draggedIcon, position, topic: '' };
      setIcons((prev) => prev.concat(newIcon));
      setCurrentIcon(newIcon);
      setCurrentPosition(position);
      setShowDialog(true); // Show dialog for new icon topic
    }
  };
  

  const handleDragStart = (icon) => {
    const iconData = {
      id: icon.id,
      svg: icon.svg, // Ensure the icon's SVG representation is included
      color: icon.color, // Include any other necessary properties
      latestValue: icon.latestValue, // If applicable
    };
    event.dataTransfer.setData('application/json', JSON.stringify(iconData));
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
      setIcons((prevIcons) =>
        prevIcons.map((icon) =>
          icon.id === currentIcon.id ? { ...icon, topic: newTopic } : icon
        )
      );

      // Subscribe to the new topic
      mqttSub(newTopic, (receivedTopic, message) => {
        console.log(`Received message on topic ${receivedTopic}: ${message}`);
      });

      setShowDialog(false);
    } else {
      handleUnsubscribe(currentIcon.id);
    }
  };

  const handleUnsubscribe = (id) => {
    const iconToUnsubscribe = icons.find((icon) => icon.id === id);
    if (iconToUnsubscribe) {
      mqttUnsub(iconToUnsubscribe.topic);
      setIcons((prevIcons) => prevIcons.filter((icon) => icon.id !== id));
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
          left: 0,
          top: 0,
          width: '300px',
          height: '500px',
          border: '1px solid #ccc',
          marginRight: '20px',
        }}
      >
        {icons.map((icon) => (
          <IconComponent
            key={icon.id}
            topic={icon.topic}
            position={icon.position}
            iconKey={icon.id}
            handleUnsubscribe={handleUnsubscribe}
            onPositionChange={handleIconDrop}
          />
        ))}
      </div>

      {showDialog && (
        <TopicDialog
          open={showDialog}
          onClose={() => setShowDialog(false)}
          onSubmit={handleDialogSubmit}
          dialogStyle={{ right: 0 }}
        />
      )}
    </div>
  );
};

export default DropBox;
