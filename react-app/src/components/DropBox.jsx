import React, { useState, useCallback } from "react";
import { useDrop } from "react-dnd";
import { useDrag } from "react-dnd";
import CanvasDraw from "react-canvas-draw";

// SVG icons data
const svgIcons = [
  { id: 1, svg: "<svg width='50' height='50' xmlns='http://www.w3.org/2000/svg'><circle cx='25' cy='25' r='20' fill='blue'/></svg>" },
  { id: 2, svg: "<svg width='50' height='50' xmlns='http://www.w3.org/2000/svg'><rect width='50' height='50' fill='green'/></svg>" },
  { id: 3, svg: "<svg width='50' height='50' xmlns='http://www.w3.org/2000/svg'><polygon points='25,0 50,50 0,50' fill='red'/></svg>" }
];

const DropboxComponent = () => {
  const [icons, setIcons] = useState([]);
  const [connections, setConnections] = useState([]);

  // Handle drag event for each icon
  const [{ isDragging }, drag] = useDrag({
    type: "ICON",
    item: { id: "unique-id" },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const handleDrop = (item, monitor) => {
    const delta = monitor.getDifferenceFromInitialOffset();
    const droppedIcon = {
      id: svgIcons[0].id,
      svg: svgIcons[0].svg,
      x: monitor.getClientOffset().x - delta.x, // Adjust for initial drop offset
      y: monitor.getClientOffset().y - delta.y, // Adjust for initial drop offset
    };

    setIcons((prevIcons) => [...prevIcons, droppedIcon]);
  };

  const [{ isOver }, drop] = useDrop({
    accept: "ICON",
    drop: handleDrop,
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  const handleConnect = (startId, endId) => {
    const startIcon = icons.find((icon) => icon.id === startId);
    const endIcon = icons.find((icon) => icon.id === endId);

    if (startIcon && endIcon) {
      const connection = {
        start: { x: startIcon.x + 25, y: startIcon.y + 25 }, // Center of start icon
        end: { x: endIcon.x + 25, y: endIcon.y + 25 }, // Center of end icon
      };
      setConnections((prevConnections) => [...prevConnections, connection]);
    }
  };

  const drawConnections = (ctx) => {
    connections.forEach(({ start, end }) => {
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.strokeStyle = "black";
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  };

  const renderIcon = (icon, index) => {
    return (
      <div
        key={index}
        style={{
          position: "absolute",
          left: icon.x,
          top: icon.y,
          cursor: "move",
          zIndex: 10,
        }}
        onClick={() => {
          if (icons.length >= 2) {
            handleConnect(icons[0].id, icon.id); // Example of connecting icons, replace with logic to select start and end
          }
        }}
      >
        <div dangerouslySetInnerHTML={{ __html: icon.svg }} />
      </div>
    );
  };

  return (
    <div
      style={{
        position: "relative",
        height: "600px",
        border: "1px solid black",
        backgroundColor: isOver ? "lightyellow" : "white", // Visual feedback for drop area
      }}
      ref={drop}
    >
      {/* Drag target area */}
      <div
        ref={drag}
        style={{
          width: "50px",
          height: "50px",
          backgroundColor: "lightgrey",
          textAlign: "center",
          lineHeight: "50px",
          cursor: "move",
        }}
      >
        Drag an SVG Icon
      </div>

      {/* Render dropped icons */}
      {icons.map((icon, index) => renderIcon(icon, index))}

      {/* Canvas to draw connections */}
      <CanvasDraw
        canvasWidth={800}
        canvasHeight={600}
        draw={drawConnections}
        hideGrid={true}
        brushColor="black"
        brushRadius={2}
      />
    </div>
  );
};

export default DropboxComponent;
