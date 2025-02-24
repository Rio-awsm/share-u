import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './Home';
import Room from './Room';


const App = () => {
  return (
    <Router>
      <div className="min-h-screen bg-black">
          
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/room/:roomId" element={<Room />} />
        </Routes>
      </div>
        
    </Router>
  );
};

export default App;
