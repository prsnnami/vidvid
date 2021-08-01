import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Editor from './pages/Editor';
import Home from './pages/Home';
import Project from './pages/Project';
import Reels from './pages/Reels';
import Test from './pages/Test';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/reels" element={<Reels />} />
      <Route path="/editor/:sharePath" element={<Editor />} />
      <Route path="/project/:id" element={<Project />} />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
