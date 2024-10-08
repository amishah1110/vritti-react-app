// src/DrawingCanvas.jsx
import React, { useRef, useEffect, useState } from 'react';

const DrawingCanvas = () => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000'); // Default color for the pencil

  const startDrawing = (e) => {
    setIsDrawing(true);
    draw(e);
  };

  const endDrawing = () => {
    setIsDrawing(false);
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath(); // Reset the path
  };

  const draw = (e) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.lineWidth = 5; // Line width
    ctx.lineCap = 'round';
    ctx.strokeStyle = color;

    ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
  };

  const handleColorChange = (e) => {
    setColor(e.target.value);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight - 100; // Adjust for the button bar
  }, []);

  return (
    <div>
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseUp={endDrawing}
        onMouseMove={draw}
        style={{ border: '1px solid black' }}
      />
      <div>
        <input type="color" value={color} onChange={handleColorChange} />
        <button onClick={clearCanvas}>Clear</button>
      </div>
    </div>
  );
};

export default DrawingCanvas;
