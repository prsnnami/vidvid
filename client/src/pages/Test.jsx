import { Box } from '@chakra-ui/layout';
import React, { useRef, useState } from 'react';
import Canvas from '../components/VideoCanvas';

export default function Test() {
  const canvasRef = useRef(null);
  const [text, setText] = useState('this is a test text');

  function predraw(ctx) {
    return;
  }

  function draw(ctx) {
    ctx.font = '20px Arial';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.lineWidth = 4;
    ctx.miterLimit = 2;
    ctx.lineJoin = 'round';
    ctx.fillText(text, 250, 250);
  }

  return (
    <Box>
      <Canvas
        ref={canvasRef}
        __predraw={predraw}
        draw={draw}
        height={500}
        width={500}
      />
      <input type="text" onChange={e => setText(e.target.value)} value={text} />
    </Box>
  );
}
