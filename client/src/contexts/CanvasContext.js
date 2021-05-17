import React from 'react';

const canvasContext = React.createContext();

export default function ContextProvider({ children }) {
  const canvasRef = React.useRef();

  return (
    <canvasContext.Provider value={{ canvasRef }}>
      {children}
    </canvasContext.Provider>
  );
}
