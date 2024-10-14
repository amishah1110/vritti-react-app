import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const DrawingCanvas = () => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState('pencil');
  const [startCoords, setStartCoords] = useState({ x: 0, y: 0 });
  const [drawings, setDrawings] = useState([]);
  const [downloadedImages, setDownloadedImages] = useState([]);
  const [drawingCount, setDrawingCount] = useState(
    localStorage.getItem('drawingCount') ? parseInt(localStorage.getItem('drawingCount')) : 0
  );
  const [eraserSize, setEraserSize] = useState(10);
  const [drawingName, setDrawingName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const handleMouseDown = (e) => {
    const x = e.nativeEvent.offsetX;
    const y = e.nativeEvent.offsetY;
    setIsDrawing(true);
    setStartCoords({ x, y });

    if (tool === 'pencil') {
      setDrawings(prev => [...prev, { tool: 'pencil', path: [{ x, y }] }]);
    } else if (tool === 'eraser') {
      erase(x, y);
    }
  };

  const handleMouseMove = (e) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const endX = e.nativeEvent.offsetX;
    const endY = e.nativeEvent.offsetY;

    if (tool === 'eraser') {
      erase(endX, endY);
    } else if (tool === 'pencil') {
      const currentDrawing = drawings[drawings.length - 1];
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(currentDrawing.path[currentDrawing.path.length - 1].x, currentDrawing.path[currentDrawing.path.length - 1].y);
      ctx.lineTo(endX, endY);
      ctx.stroke();
      currentDrawing.path.push({ x: endX, y: endY });
    } else if (tool === 'rectangle' || tool === 'circle') {
      redrawCanvas();
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      if (tool === 'rectangle') {
        const width = endX - startCoords.x;
        const height = endY - startCoords.y;
        ctx.strokeRect(startCoords.x, startCoords.y, width, height);
      } else if (tool === 'circle') {
        const radius = Math.sqrt((endX - startCoords.x) ** 2 + (endY - startCoords.y) ** 2);
        ctx.beginPath();
        ctx.arc(startCoords.x, startCoords.y, radius, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  };

  const handleMouseUp = (e) => {
    const endX = e.nativeEvent.offsetX;
    const endY = e.nativeEvent.offsetY;
    setIsDrawing(false);

    if (tool === 'rectangle' || tool === 'circle') {
      const newDrawing = { tool, startX: startCoords.x, startY: startCoords.y, endX, endY };
      setDrawings(prev => [...prev, newDrawing]);
    }
  };

  const erase = (x, y) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(x - eraserSize / 2, y - eraserSize / 2, eraserSize, eraserSize);
  };

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawings.forEach(drawing => drawShape(ctx, drawing));
  };

  const drawShape = (ctx, drawing) => {
    const { tool, startX, startY, endX, endY, path } = drawing;

    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';

    ctx.beginPath();
    if (tool === 'rectangle') {
      ctx.rect(startX, startY, endX - startX, endY - startY);
      ctx.stroke();
    } else if (tool === 'circle') {
      const radius = Math.sqrt((endX - startX) ** 2 + (endY - startY) ** 2);
      ctx.arc(startX, startY, radius, 0, Math.PI * 2);
      ctx.stroke();
    } else if (tool === 'pencil') {
      ctx.moveTo(path[0].x, path[0].y);
      path.forEach(point => {
        ctx.lineTo(point.x, point.y);
      });
      ctx.stroke();
    }
  };

  const handleToolChange = (selectedTool) => {
    setTool(selectedTool);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setDrawings([]);
  };

  const saveToCache = () => {
    if (!drawingName.trim()) {
      alert('Please enter a name for your drawing.');
      return;
    }
  
    const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"> <rect width="100%" height="100%" fill="#fff"/> ${drawings.map(drawing => {
          if (drawing.tool === 'pencil') {
            return `<path d="M${drawing.path.map(point => `${point.x},${point.y}`).join(' L')}" stroke="#000" fill="none" stroke-width="2"/>`;
          }
          return '';
        }).join('')}
      </svg>`;
  
    // Create a Blob from the SVG string
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
  
    // Create a link to download
    const a = document.createElement('a');
    a.href = url;
    a.download = `${drawingName}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  
    // Save the URL to the state
    setDownloadedImages(prev => [...prev, url]);
  
    setDrawingCount(drawingCount + 1);
    localStorage.setItem('drawingCount', drawingCount + 1);
    setDrawingName(''); // Clear the input after saving
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
    localStorage.removeItem(key);
    console.log(`Deleted ${key} from localStorage`);

    const newCount = drawingCount - 1;
    setDrawingCount(newCount);
    localStorage.setItem('drawingCount', newCount);
  };

  // const renderSavedDrawings = () => {
  //   const savedDrawings = [];
  //   for (let i = 0; i < localStorage.length; i++) {
  //     const key = localStorage.key(i);
  //     if (key !== 'drawingCount' && localStorage.getItem(key)) {
  //       savedDrawings.push(
  //         <div key={key} style={{ marginBottom: '10px' }}>
  //           <button className="CanvasIconLoadButton" onClick={() => loadDrawing(key)}> Load - {key}</button>
  //           <button className="CanvasIconDeleteButton" onClick={() => deleteDrawing(key)}> Delete - {key}</button>
  //         </div>
  //       );
  //     }
  //   }
  //   return savedDrawings;
  // };

  const handleEraserSizeChange = (e) => {
    setEraserSize(parseInt(e.target.value));
  };

  return (
    <div className="drawing-canvas">
      <h1>Drawing Canvas</h1>
      <div>
        <h2>Tools</h2>
        <button id="CanvasPencilButton" onClick={() => handleToolChange('pencil')}>Pencil</button>
        <button id="CanvasEraserButton" onClick={() => handleToolChange('eraser')}>Eraser</button>
        <input type="range" min="5" max="50" value={eraserSize} onChange={handleEraserSizeChange} style={{ display: tool === 'eraser' ? 'inline-block' : 'none' }} />
        <span id="eraserSpan" style={{ display: tool === 'eraser' ? 'inline-block' : 'none' }}>Eraser Size: {eraserSize}px</span>
        <button id="CanvasClearButton" onClick={clearCanvas}>Clear Canvas</button>
        
        {/* Input for drawing name */}
        <input 
          type="text" 
          placeholder="Enter drawing name" 
          value={drawingName} 
          onChange={(e) => setDrawingName(e.target.value)} 
          style={{ marginLeft: '10px' }} 
        />
        
        <button id="CanvasSaveButton" onClick={saveToCache}>Save Drawing</button>
        <button id="CanvasBackHomeButton" onClick={() => navigate('/')}>Back to Home</button>
      </div>

      <div className='shapes'>
        <h2>Shapes</h2>
        <button id="CanvasRectangleButton" onClick={() => handleToolChange('rectangle')}>Rectangle</button>
        <button id="CanvasCircleButton" onClick={() => handleToolChange('circle')}>Circle</button>
      </div>

      <canvas ref={canvasRef} width={800} height={500} style={{ border: '2px solid black' }} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} />

      <div style={{ marginTop: '20px' }}>
        <h2>Downloaded Images</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
          {downloadedImages.map((imageUrl, index) => (
            <img key={index} src={imageUrl} alt={`Drawing ${index}`} style={{ width: '100px', height: 'auto', margin: '5px' }} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default DrawingCanvas;
