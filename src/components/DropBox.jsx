import React from 'react';
import IconComponent from './IconComponent';

const DropBox = ({ icons, onIconDrop, onIconDragStart, colorThresholds }) => {
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
    onIconDrop(draggedIcon, { x, y });
  };

  return (
    <div
      className="dropbox"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {icons.map(icon => (
        <IconComponent
          key={icon.id}
          topic={icon.topic}
          hoverText={`Topic: ${icon.topic}`}
          latestValue={icon.latestValue}
          position={icon.position}
          iconKey={icon.iconKey}
          onPositionChange={() => {}}
        />
      ))}
    </div>
  );
};

export default DropBox;
