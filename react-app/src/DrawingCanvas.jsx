import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const DrawingCanvas = () => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState('pencil'); // Default tool
  const [startCoords, setStartCoords] = useState({ x: 0, y: 0 });
  const [drawings, setDrawings] = useState([]); // Store drawn shapes
  const [drawingCount, setDrawingCount] = useState(
    localStorage.getItem('drawingCount') ? parseInt(localStorage.getItem('drawingCount')) : 0
  );
  const navigate = useNavigate(); // Hook for navigation

  const handleMouseDown = (e) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    setIsDrawing(true);
    const x = e.nativeEvent.offsetX;
    const y = e.nativeEvent.offsetY;
    setStartCoords({ x, y });

    if (tool === 'pencil') {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const handleMouseMove = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const endX = e.nativeEvent.offsetX;
    const endY = e.nativeEvent.offsetY;
  
    // Redraw existing shapes every time mouse moves
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawings.forEach(drawing => drawShape(ctx, drawing));
  
    if (tool === 'eraser') {
      ctx.strokeStyle = '#fff'; // White for erasing
      ctx.lineWidth = 10; // Size for eraser
      ctx.beginPath();
      ctx.moveTo(endX, endY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    } else if (tool === 'pencil') {
      ctx.strokeStyle = '#000'; // Black for drawing
      ctx.lineWidth = 2; // Size for pencil
      ctx.lineTo(endX, endY);
      ctx.stroke();
    } else if (tool === 'rectangle') {
      const width = endX - startCoords.x;
      const height = endY - startCoords.y;
      ctx.strokeStyle = '#000'; // Black for drawing
      ctx.strokeRect(startCoords.x, startCoords.y, width, height);
    } else if (tool === 'circle') {
      const radius = Math.sqrt((endX - startCoords.x) ** 2 + (endY - startCoords.y) ** 2);
      ctx.beginPath();
      ctx.arc(startCoords.x, startCoords.y, radius, 0, Math.PI * 2);
      ctx.strokeStyle = '#000'; // Black for drawing
      ctx.stroke();
    }
  };
  

  const handleMouseUp = (e) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    setIsDrawing(false);

    const endX = e.nativeEvent.offsetX;
    const endY = e.nativeEvent.offsetY;

    if (tool === 'rectangle' || tool === 'circle') {
      const newDrawing = { tool, startX: startCoords.x, startY: startCoords.y, endX, endY };
      setDrawings([...drawings, newDrawing]); // Store the new drawing
      drawShape(ctx, newDrawing); // Draw the shape immediately
    }
  };

  const drawShape = (ctx, drawing) => {
    const { tool, startX, startY, endX, endY } = drawing;
    ctx.beginPath();
    if (tool === 'rectangle') {
      ctx.rect(startX, startY, endX - startX, endY - startY);
      ctx.strokeStyle = '#000';
      ctx.stroke();
    } else if (tool === 'circle') {
      const radius = Math.sqrt((endX - startX) ** 2 + (endY - startY) ** 2);
      ctx.arc(startX, startY, radius, 0, Math.PI * 2);
      ctx.strokeStyle = '#000';
      ctx.stroke();
    }
  };

  const handleToolChange = (selectedTool) => {
    setTool(selectedTool);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
    setDrawings([]); // Reset the drawings state
  };

  const saveToCache = () => {
    const canvas = canvasRef.current;
    const dataURL = canvas.toDataURL('image/svg+xml'); // Convert canvas to SVG data URL

    const newDrawingKey = `drawing-${drawingCount + 1}`; // Unique key for each drawing
    localStorage.setItem(newDrawingKey, dataURL); // Save drawing to localStorage
    setDrawingCount(drawingCount + 1);
    localStorage.setItem('drawingCount', drawingCount + 1); // Save updated count to localStorage

    console.log(`Drawing saved as ${newDrawingKey}!`);
  };

  const loadDrawing = (key) => {
    const dataURL = localStorage.getItem(key);
    if (dataURL) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };
      img.src = dataURL;
    }
  };

  const deleteDrawing = (key) => {
    localStorage.removeItem(key); // Remove drawing from localStorage
    console.log(`Deleted ${key} from localStorage`);

    // Update the drawing count
    const newCount = drawingCount - 1;
    setDrawingCount(newCount);
    localStorage.setItem('drawingCount', newCount);

    // Reorganize keys after deletion
    for (let i = 1; i <= newCount; i++) {
      if (!localStorage.getItem(`drawing-${i}`)) {
        localStorage.setItem(`drawing-${i}`, localStorage.getItem(`drawing-${i + 1}`));
        localStorage.removeItem(`drawing-${i + 1}`);
      }
    }
  };

  const renderSavedDrawings = () => {
    const drawings = [];
    for (let i = 1; i <= drawingCount; i++) {
      const key = `drawing-${i}`;
      if (localStorage.getItem(key)) {
        drawings.push(
          <div key={key} style={{ marginBottom: '10px' }}>
            <button className="CanvasIconLoadButton" onClick={() => loadDrawing(key)}>
              Load Drawing {i}
            </button>
            <button className="CanvasIconDeleteButton" onClick={() => deleteDrawing(key)}>
              Delete Drawing {i}
            </button>
          </div>
        );
      }
    }
    return drawings;
  };

  return (
    <div className="drawing-canvas">
      <h1>Drawing Canvas</h1>
      <div>
        <button id="CanvasPencilButton" onClick={() => handleToolChange('pencil')}>Pencil</button>
        <button id="CanvasEraserButton" onClick={() => handleToolChange('eraser')}>Eraser</button>
        {/* <button id="CanvasRectangleButton" onClick={() => handleToolChange('rectangle')}>Rectangle</button>
        <button id="CanvasCircleButton" onClick={() => handleToolChange('circle')}>Circle</button> */}
        <button id="CanvasClearButton" onClick={clearCanvas}>Clear Canvas</button>
        <button id="CanvasSaveButton" onClick={saveToCache}>Save Drawing</button>
        <button id="CanvasBackHomeButton" onClick={() => navigate('/')}>Back to Home</button>
      </div>

      <div className='shapes'>
      <button id="CanvasRectangleButton" onClick={() => handleToolChange('rectangle')}>Rectangle</button>
      <button id="CanvasCircleButton" onClick={() => handleToolChange('circle')}>Circle</button>
      </div>

      <canvas
        ref={canvasRef}
        width={800}
        height={500}
        style={{ border: '2px solid #000', marginTop: '20px', backgroundColor: '#fff' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      />

      <div style={{ marginTop: '20px' }}>
        <h2>Saved Drawings</h2>
        {renderSavedDrawings()}
      </div>
    </div>
  );
};

export default DrawingCanvas;


// src/DrawingCanvas.jsx
// import React, { useRef, useEffect, useState } from 'react';

// const DrawingCanvas = () => {
//   const canvasRef = useRef(null);
//   const [isDrawing, setIsDrawing] = useState(false);
//   const [color, setColor] = useState('#000'); // Default color for the pencil

//   const startDrawing = (e) => {
//     setIsDrawing(true);
//     draw(e);
//   };

//   const endDrawing = () => {
//     setIsDrawing(false);
//     const ctx = canvasRef.current.getContext('2d');
//     ctx.beginPath(); // Reset the path
//   };

//   const draw = (e) => {
//     if (!isDrawing) return;

//     const canvas = canvasRef.current;
//     const ctx = canvas.getContext('2d');
//     ctx.lineWidth = 5; // Line width
//     ctx.lineCap = 'round';
//     ctx.strokeStyle = color;

//     ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
//     ctx.stroke();
//     ctx.beginPath();
//     ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
//   };

//   const handleColorChange = (e) => {
//     setColor(e.target.value);
//   };

//   const clearCanvas = () => {
//     const canvas = canvasRef.current;
//     const ctx = canvas.getContext('2d');
//     ctx.clearRect(0, 0, canvas.width, canvas.height);
//   };

//   useEffect(() => {
//     const canvas = canvasRef.current;
//     canvas.width = window.innerWidth;
//     canvas.height = window.innerHeight - 100; // Adjust for the button bar
//   }, []);

//   return (
//     <div>
//       <canvas
//         ref={canvasRef}
//         onMouseDown={startDrawing}
//         onMouseUp={endDrawing}
//         onMouseMove={draw}
//         style={{ border: '1px solid black' }}
//       />
//       <div>
//         <input type="color" value={color} onChange={handleColorChange} />
//         <button onClick={clearCanvas}>Clear</button>
//       </div>
//     </div>
//   );
// };

// export default DrawingCanvas;