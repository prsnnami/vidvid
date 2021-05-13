import React, { useEffect } from 'react';

const Canvas = React.forwardRef((props, canvasRef) => {
  const { draw, __predraw, ...rest } = props;
  // const canvasRef = useRef(null);

  const predraw = (context, canvas) => {
    context.save();
    __predraw?.(context, canvas);
    // resizeCanvasToDisplaySize(context, canvas);
    const { width, height } = context.canvas;
    context.clearRect(0, 0, width, height);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    let frameCount = 0;
    let animationFrameId;

    predraw(context, canvas);

    const render = () => {
      frameCount++;
      draw(context, frameCount);
      animationFrameId = window.requestAnimationFrame(render);
    };
    render();

    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      {...rest}
      style={{ ...(rest.styles || {}), background: props.color || 'black' }}
    />
  );
});

// function areEqual(prevProps, nextProps) {
//   console.log('checking here');
//   return (
//     prevProps.draw === nextProps.draw && prevProps.height === nextProps.height
//   );
// }

// export default React.memo(Canvas, areEqual);

export default Canvas;
