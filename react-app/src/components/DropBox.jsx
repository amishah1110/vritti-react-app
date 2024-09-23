// DropBox.jsx
import React, { useState } from 'react';
import IconComponent from './IconComponent';
import TopicDialog from './TopicDialog'; // Import your TopicDialog

const DropBox = () => {
  const [icons, setIcons] = useState([]);
  const [showDialog, setShowDialog] = useState(false);
  const [currentIconData, setCurrentIconData] = useState(null);

  const handleIconDrop = (draggedIcon, position) => {
    if (currentIconData) {
      const newIcon = { ...draggedIcon, position };
      setIcons((prevIcons) => [...prevIcons, newIcon]);
      setShowDialog(false); // Close dialog after adding icon
    } else {

      setIcons((prevIcons) =>
        prevIcons.map(icon =>
          icon.iconKey === draggedIcon.iconKey ? { ...icon, position } : icon
        )
      );
    }
  };

  const handleUnsubscribe = (iconKey) => {
    setIcons((prevIcons) => prevIcons.filter(icon => icon.iconKey !== iconKey));
  };

  const handleDragOver = (event) => {
    event.preventDefault();
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

    if (currentIconData) {
      handleIconDrop(draggedData, { x, y });
    } else {
      handleIconDrop(draggedData, { x, y });
    }
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
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      style={{ position: 'relative', width: '100%', height: '500px', border: '1px solid #ccc' }}
    >
      {icons.map(icon => (
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
          onSubmit={(topic, thresholds) => {
          }}
        />
      )}
    </div>
  );
};

export default DropBox;
