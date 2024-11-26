import React, { useState, useRef, useEffect } from 'react';

const DropBox = () => {
  const [lineData, setLineData] = useState(null);
  const canvasRef = useRef(null);

  // This effect ensures the canvas and context are ready before drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Canvas setup code here (e.g., stroke styles)
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'black';
      } else {
        console.error("Failed to get canvas context!");
      }
    } else {
      console.error("Canvas is not available!");
    }
  }, []); // Empty array means it runs only once after initial render

  // Draw the line when lineData is updated
  const drawLine = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      console.error("Canvas is not available!");
      return; // Ensure canvas is available
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error("Failed to get canvas context!");
      return; // Ensure context is available
    }

    if (lineData) {
      const { start, end } = lineData;
      ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear previous drawings
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
    }
  };

  // This is an example of how you can set lineData (for connecting icons)
  const connectIcons = (startPosition, endPosition) => {
    setLineData({ start: startPosition, end: endPosition });
  };

  // Trigger drawing whenever lineData changes
  useEffect(() => {
    drawLine();
  }, [lineData]);

  return (
    <div style={{ position: 'relative' }}>
      {/* Canvas to draw lines */}
      <canvas
        ref={canvasRef}
        width={300}
        height={500}
        style={{ border: '1px solid black' }}
      ></canvas>

      <button onClick={() => connectIcons({ x: 50, y: 50 }, { x: 250, y: 250 })}>
        Draw Line
      </button>
    </div>
  );
};

export default DropBox;
