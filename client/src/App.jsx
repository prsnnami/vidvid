import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Editor from './pages/Editor';
import Home from './pages/Home';
import Reels from './pages/Reels';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/reels" element={<Reels />} />
      <Route path="/editor/:sharePath" element={<Editor />} />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
