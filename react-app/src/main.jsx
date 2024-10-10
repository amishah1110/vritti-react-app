// // src/main.jsx
// import React from 'react';
// import ReactDOM from 'react-dom/client'; 
// import { BrowserRouter as Router } from 'react-router-dom';
// import App from './App';

// const root = ReactDOM.createRoot(document.getElementById('root'));
// root.render(
//     <Router>
//         <App />
//     </Router>
// );

// src/main.jsx
// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import App from './App';
import DrawingCanvas from './DrawingCanvas'; // Make sure this is the correct path to your DrawingCanvas component

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <Router>
        <Routes>
            <Route path="/" element={<App />} /> 
            <Route path="/draw" element={<DrawingCanvas />} /> 
        </Routes>
    </Router>
);

