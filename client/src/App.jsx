import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import QuickEditor from './pages/QuickEditor';
import Home from './pages/Home';
import Project from './pages/Project';
import Reels from './pages/Reels';
import Projects from './pages/Projects';
import TestPage from './components/TestPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/reels" element={<Reels />} />
      <Route path="/editor/:sharePath" element={<QuickEditor />} />
      <Route path="/project/:id" element={<Project />} />
      <Route path="/projects" element={<Projects />} />
      <Route path="/demo" element={<TestPage />} />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
