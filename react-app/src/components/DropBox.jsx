import React, { useState } from 'react';
import IconComponent from './IconComponent';

const DropBox = () => {
  const [icons, setIcons] = useState([]);

  const handleIconDrop = (draggedIcon, position) => {
    const newIcon = { ...draggedIcon, position };
    setIcons((prevIcons) => [...prevIcons, newIcon]);
  };

  const handleUnsubscribe = (iconKey) => {
    setIcons((prevIcons) => prevIcons.filter(icon => icon.iconKey !== iconKey));
  };

  const handleIconPositionChange = (iconKey, newPosition) => {
    setIcons((prevIcons) =>
      prevIcons.map(icon =>
        icon.iconKey === iconKey ? { ...icon, position: newPosition } : icon
      )
    );
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

    const draggedIcon = JSON.parse(event.dataTransfer.getData('application/json'));
    handleIconDrop(draggedIcon, { x, y });
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
          hoverText={`Topic: ${icon.topic}`}
          latestValue={icon.latestValue}
          position={icon.position}
          iconKey={icon.iconKey}
          handleUnsubscribe={handleUnsubscribe}
          onPositionChange={(newPosition) => handleIconPositionChange(icon.iconKey, newPosition)}
        />
      ))}
    </div>
  );
};

export default DropBox;
