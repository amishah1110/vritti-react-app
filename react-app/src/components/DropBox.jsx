// Updated DropBox.jsx

import React, { useState } from 'react';
import IconComponent from './IconComponent';
import TopicDialog from './TopicDialog';

const DropBox = () => {
  const [icons, setIcons] = useState([]);
  const [showDialog, setShowDialog] = useState(false);
  const [currentIconData, setCurrentIconData] = useState(null);

  const handleIconDrop = (draggedIcon, position) => {
    // Ensure each icon gets its own unique entry in the state
    const newIcon = { ...draggedIcon, position, topic: '', iconKey: draggedIcon.iconKey }; 
    setIcons((prevIcons) => [...prevIcons, newIcon]);
    setCurrentIconData(null);
    setShowDialog(true); // Show dialog to configure topic
  };

  const handleDialogSubmit = (topic, thresholds) => {
    setIcons((prevIcons) =>
      prevIcons.map(icon =>
        icon === currentIconData ? { ...icon, topic, thresholds } : icon
      )
    );
    setShowDialog(false);
    setCurrentIconData(null);
  };

  const handleUnsubscribe = (iconKey) => {
    setIcons((prevIcons) => prevIcons.filter(icon => icon.iconKey !== iconKey));
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const dropX = event.clientX;
    const dropY = event.clientY;
    const dropBox = event.currentTarget;
    const rect = dropBox.getBoundingClientRect();
    const x = dropX - rect.left;
    const y = dropY - rect.top;

    const draggedData = JSON.parse(event.dataTransfer.getData('application/json'));
    handleIconDrop(draggedData, { x, y });
  };

  const handleExternalDrag = (e) => {
    setCurrentIconData(true);
  };

  const handleInternalDrag = () => {
    setCurrentIconData(false);
  };

  return (
    <div
      className="dropbox"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      style={{ position: 'relative', width: '100%', height: '500px', border: '1px solid #ccc' }}
    >
      {icons.map((icon) => (
        <IconComponent
          key={icon.iconKey}
          topic={icon.topic}
          position={icon.position}
          iconKey={icon.iconKey}
          handleUnsubscribe={handleUnsubscribe}
          onPositionChange={handleIconDrop}
          onDragStart={handleInternalDrag}
        />
      ))}
      {showDialog && (
        <TopicDialog
          open={showDialog}
          onClose={() => setShowDialog(false)}
          onSubmit={handleDialogSubmit}
        />
      )}
    </div>
  );
};

export default DropBox;
