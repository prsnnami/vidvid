import React, { useEffect, useRef, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import QuickEditor from './pages/QuickEditor';
import Home from './pages/Home';
import Project from './pages/Project';
import Reels from './pages/Reels';
import Projects from './pages/Projects';
import {
  Box,
  Button,
  Flex,
  Stack,
  FormControl,
  Select,
  FormLabel,
  Input,
} from '@chakra-ui/react';
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
  const [loading, setLoading] = useState(true);

  async function loadManifest(shareUrl) {
    const manifestRet = await fetch(`/proxy/${shareUrl}/manifest-path.json`);
    const manifest = await manifestRet.json();
    return manifest;
  }

  useEffect(() => {
    async function init() {
      if (videoRef.current) return;
      const vid = document.createElement('video');
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
        setLoading(false);
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

  return { video: videoRef.current, toggleVideo, loading };
}

function useCanvas() {
  const [canvas, setCanvas] = useState('');
  const canvasRef = useRef();

  useEffect(() => {
    const initCanvas = () => {
      fabric.Object.prototype.transparentCorners = false;
      // fabric.devicePixelRatio = Math.max(
      //   Math.floor(fabric.devicePixelRatio),
      //   1
      // );

      fabric.Object.prototype.cornerColor = 'blue';
      fabric.Object.prototype.cornerStyle = 'circle';
      fabric.Object.prototype.setControlsVisibility({ mtr: false });
      fabric.Canvas.prototype.getItemByName = function (name) {
        let objects = this.getObjects();
        let object = objects.find(i => i.name === name);
        return object;
      };
      return new fabric.Canvas(canvasRef.current, {
        backgroundColor: 'pink',
        height: 1080,
        width: 1080,
        preserveObjectStacking: true,
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

function getVideoDimensions(
  canvasWidth,
  canvasHeight,
  videoWidth,
  videoHeight
) {
  let scale = Math.min(canvasWidth / videoWidth, canvasHeight / videoHeight);

  let top = (canvasHeight - videoHeight * scale) / 2;
  let left = (canvasWidth - videoWidth * scale) / 2;
  return { left, top, width: videoWidth * scale, height: videoHeight * scale };
}

function TestPage() {
  const [canvasSize, setCanvasSize] = useState({ height: 1080, width: 1080 });
  const [ar, setAr] = useState('1:1');
  const [wrapperSize, setWrapperSize] = useState({ height: 0, width: 0 });
  const wrapperRef = useRef();

  const { video: vid, toggleVideo, loading: videoLoading } = useVideo();
  const { canvasRef, canvas } = useCanvas(canvasSize);

  useEffect(() => {
    if (vid) {
      const elements = bootstrapElements();
      console.log(elements);
      loop(elements);
    }
  }, [vid]);

  useEffect(() => {
    if (vid && !videoLoading) {
      let { left, top, width, height } = getVideoDimensions(
        canvasSize.width,
        canvasSize.height,
        vid.videoWidth,
        vid.videoHeight
      );

      const videoElement = new fabric.Image(vid, {
        left,
        top,
        name: 'video',
      });
      videoElement.scaleToHeight(height);
      videoElement.scaleToWidth(width);
      canvas.add(videoElement);
      canvas.sendToBack(videoElement);
    }
  }, [videoLoading, vid]);

  function bootstrapElements() {
    console.log(vid.height);
    console.log(vid.width);

    const myText = new fabric.Text('This is a dummy text', {
      fill: 'white',
    });
    canvas.add(myText);

    return { myText };
  }

  function loop({ myText }) {
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

  function handleDimensionsChange(ar) {
    let height, width;
    setAr(ar);

    switch (ar) {
      case '1:1':
        width = 1080;
        height = 1080;
        break;
      case '16:9':
        width = 1920;
        height = 1080;
        break;
      case '9:16':
        width = 1080;
        height = 1920;
        break;
      case '4:5':
        width = 1080;
        height = 1350;
        break;
      default:
        height = canvasSize.height;
        width = canvasSize.width;
    }

    // vid;

    setCanvasSize({ height, width });
    let videoElement = canvas.getItemByName('video');
    console.log(vid, vid.element);
    let {
      left,
      top,
      width: w,
      height: h,
    } = getVideoDimensions(width, height, vid.videoWidth, vid.videoHeight);

    videoElement.set({
      left,
      top,
    });
    videoElement.scaleToHeight(h);
    videoElement.scaleToWidth(w);
    canvas.setDimensions({ height, width });
    canvas.renderAll();
  }

  function handleFileUpload(e) {
    let reader = new FileReader();
    reader.onload = function (e) {
      let image = new Image();
      image.src = e.target.result;
      image.onload = function () {
        let img = new fabric.Image(image);
        img.set({
          left: 100,
          top: 60,
        });
        img.scaleToWidth(200);
        canvas.add(img).setActiveObject(img).renderAll();
      };
    };
    reader.readAsDataURL(e.target.files[0]);
  }

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
      <FormControl id="a_r" isRequired>
        <FormLabel>Aspect Ratio</FormLabel>
        <Select
          size="sm"
          background="white"
          onChange={e => handleDimensionsChange(e.target.value)}
          value={ar}
        >
          <option value="1:1">1:1 Square</option>
          <option value="16:9">16:9 Horizontal</option>
          <option value="9:16">9:16 Vertical</option>
          <option value="4:5">4:5 Portrait</option>
        </Select>
      </FormControl>
      <Stack direction="row">
        <Button onClick={() => toggleVideo()}>Test</Button>
        <Button onClick={() => console.log(canvas.getItemByName('video'))}>
          Test
        </Button>
        {/* <Button onClick={() => toggleVideo()}>Upload Image</Button> */}
        <Input type="file" onChange={handleFileUpload} accept="image/png" />
      </Stack>
      <Box py="2" display="flex" justifyContent="center">
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
                  // height={canvasSize.height}
                  // width={canvasSize.width}
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
