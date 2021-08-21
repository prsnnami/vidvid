import React, { useEffect, useRef, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import QuickEditor from './pages/QuickEditor';
import Home from './pages/Home';
import Project from './pages/Project';
import Reels from './pages/Reels';
import Projects from './pages/Projects';
import { Box, Button, Flex, Stack } from '@chakra-ui/react';
import { fabric } from 'fabric';
import ere from 'element-resize-event';

const MAX_HEIGHT = 450;

/* global Reduct */

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/reels" element={<Reels />} />
      <Route path="/editor/:sharePath" element={<QuickEditor />} />
      <Route path="/project/:id" element={<Project />} />
      <Route path="/projects" element={<Projects />} />
      <Route path="/test" element={<TestPage />} />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;

const baseUrl = 'https://app.reduct.video/e/';

const shareUrl =
  'https://app.reduct.video/e/borderer-testing-84e3ce2ba0-f81df100c4861287a746';

function useVideo() {
  const videoRef = useRef();

  async function loadManifest(shareUrl) {
    const manifestRet = await fetch(`/proxy/${shareUrl}/manifest-path.json`);
    const manifest = await manifestRet.json();
    return manifest;
  }

  useEffect(() => {
    async function init() {
      if (videoRef.current) return;
      const vid = document.createElement('video');
      vid.height = 1080;
      vid.width = 1920;
      vid.style.objectFit = 'fill';

      videoRef.current = vid;

      const manifest = await loadManifest(shareUrl);

      const play = new Reduct.Player(vid);
      play.init(`/proxy/${shareUrl}/${manifest}`, {
        streaming: { bufferingGoal: 5, rebufferingGoal: 3 },
      });
      vid.onVideoRender?.();

      vid.onloadeddata = function (e) {
        console.log(this.videoHeight, this.videoWidth);
        console.log('loadedData');
        vid.height = this.videoHeight;
        vid.width = this.videoWidth;
      };
    }
    init();
  }, []);

  function toggleVideo() {
    if (videoRef.current.paused) {
      videoRef.current.play();
      return;
    }
    videoRef.current.pause();
    return;
  }

  return { video: videoRef.current, toggleVideo };
}

function useCanvas() {
  const [canvas, setCanvas] = useState('');
  const canvasRef = useRef();

  useEffect(() => {
    const initCanvas = () => {
      fabric.Object.prototype.transparentCorners = false;
      fabric.Object.prototype.cornerColor = 'blue';
      fabric.Object.prototype.cornerStyle = 'circle';
      fabric.Object.prototype.setControlsVisibility({ mtr: false });
      return new fabric.Canvas(canvasRef.current, {
        backgroundColor: 'pink',
      });
    };

    if (canvasRef.current && !canvas) {
      const c = initCanvas();
      // initVideo(c);
      setCanvas(c);
    }
  }, [canvasRef.current, canvas]);

  return { canvasRef, canvas };
}

function TestPage() {
  const [canvasSize, setCanvasSize] = useState({ height: 1080, width: 1920 });
  const [wrapperSize, setWrapperSize] = useState({ height: 0, width: 0 });
  const wrapperRef = useRef();

  const { video: vid, toggleVideo } = useVideo();
  const { canvasRef, canvas } = useCanvas();

  useEffect(() => {
    if (vid) {
      const elements = bootstrapElements();
      console.log(elements);
      loop(elements);
    }
  }, [vid]);

  function bootstrapElements() {
    console.log(vid.height);
    const video1 = new fabric.Image(vid, {
      left: 0,
      top: 0,
      height: vid.height,
      width: vid.width,
      hasRotatingPoint: false,
      scaleX: 5,
      scaleY: 1.5,
    });
    // video1.scaleToHeight(540);
    // video1.scaleToWidth(vid.width);
    canvas.add(video1);

    const myText = new fabric.Text('fabric 2.0', {
      fill: 'white',
    });
    canvas.add(myText);

    return { video1, myText };
  }

  function loop({ myText, video1 }) {
    fabric.util.requestAnimFrame(function render() {
      canvas.renderAll();
      if (vid.currentTime > 5) myText.set('text', 'after 1 second');
      fabric.util.requestAnimFrame(render);
    });
  }

  useEffect(() => {
    const wrapper = wrapperRef.current;

    setWrapperSize({
      width: wrapper.offsetWidth,
      height: wrapper.offsetHeight,
    });

    ere(wrapper, () => {
      console.log('here');
      setWrapperSize({
        width: wrapper.offsetWidth,
        height: wrapper.offsetHeight,
      });
    });

    // if (aspectRatio) handleDimensionsChange(aspectRatio);
  }, []);

  let scale;
  if (canvasSize.width > canvasSize.height) {
    scale = wrapperSize.width / canvasSize.width;
  } else {
    scale = wrapperSize.height / canvasSize.height;
  }

  scale = Math.min(scale, MAX_HEIGHT / canvasSize.height);

  const containerHeight = scale * canvasSize.height;
  const containerWidth = scale * canvasSize.width;

  return (
    <Flex
      flexDirection="column"
      // alignItems="center"
      justifyContent="flex-start"
      h="100%"
      w="100%"
      pt="4"
      margin="0 auto"
      id="red"
      // overflow="hidden"
      // overflowY="auto"
      ref={wrapperRef}
    >
      <Box py="2">
        <Box
          style={{
            maxWidth: '100%',
            overflow: 'hidden',
            width: containerWidth + 'px',
            height: containerHeight + 'px',
            margin: '0 auto',
          }}
        >
          <Box
            style={{
              width: canvasSize.width,
              height: canvasSize.height,
              transform: 'scale(' + scale + ')',
              transformOrigin: '0 0 0',
            }}
          >
            <Box w={canvasSize.width} h={canvasSize.height} position="relative">
              <Flex position="relative">
                <canvas
                  id="my-canvas"
                  height={canvasSize.height}
                  width={canvasSize.width}
                  ref={canvasRef}
                />
              </Flex>
            </Box>
          </Box>
        </Box>
      </Box>
    </Flex>
  );
}
