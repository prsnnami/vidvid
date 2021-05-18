import {
  border,
  Box,
  Button,
  ChakraProvider,
  Checkbox,
  Flex,
  Grid,
  Input,
  Select,
  Stack,
  theme,
  useColorMode,
} from '@chakra-ui/react';
import React, { useEffect, useRef, useState } from 'react';
import { ColorModeSwitcher } from './ColorModeSwitcher';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import Home from './pages/Home';
import Canvas from './components/VideoCanvas';
import Editor from './pages/Editor';
import Test from './pages/Test';
import Reels from './pages/Reels';

function Borderer() {
  const videoRef = useRef();
  const [dimensions, setDimensions] = useState({
    height: 640,
    width: 640,
  });
  const [videoDimensions, setVideoDimensions] = useState({
    height: 640,
    width: 640,
  });
  const [scale, setScale] = useState(1);
  const canvasRef = useRef(null);
  const [borderPercent, setBorderPercent] = useState(0);
  const [color, setColor] = useState('#000000');
  const [overlay, setOverlay] = useState(false);

  const draw = (ctx, frameCount) => {
    if (videoRef.current) {
      const scaledHeight = videoDimensions.height * scale;
      const scaledWidth = videoDimensions.width * scale;
      const ar = scaledWidth / scaledHeight;

      if (overlay) {
        const top = (dimensions.height - scaledHeight) / 2;
        const left = (dimensions.width - scaledWidth) / 2;

        const borderHeight = (borderPercent * scaledHeight) / 100;
        ctx.drawImage(videoRef.current, left, top, scaledWidth, scaledHeight);
        ctx.fillStyle = color;
        ctx.fillRect(
          0,
          dimensions.height - borderHeight,
          dimensions.width,
          borderHeight
        );
      } else {
        const bottomDisplacement = (scaledHeight * borderPercent) / 100;
        const h = scaledHeight - bottomDisplacement;
        const w = scaledWidth - bottomDisplacement * ar;

        const top = (dimensions.height - scaledHeight) / 2;
        const left = (dimensions.width - w) / 2;
        ctx.drawImage(videoRef.current, left, top, w, h);
      }

      // ctx.drawImage(videoRef.current, 100, 100, 500, 500);
    }
  };

  function onVideoSelect(blob) {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.remove();
      videoRef.current = null;
    }

    const video = document.createElement('video');
    video.src = URL.createObjectURL(blob);
    video.autoplay = false;
    video.loop = true;

    video.onerror = e => console.error('error in video loading', e);

    video.oncanplay = function (e) {
      console.dir(this);
      console.log(this.videoHeight, this.videoWidth, scale);
      setVideoDimensions({ height: this.videoHeight, width: this.videoWidth });
      setScale(
        Math.min(
          dimensions.width / this.videoWidth,
          dimensions.height / this.videoHeight
        )
      );
      const ctx = canvasRef.current.getContext('2d');
      // ctx.drawImage(videoRef.current, 0, 0, 640, 640);
    };

    console.log('reached here');
    videoRef.current = video;
    console.log('details', video.videoHeight, video.videoWidth);
    // video.play();
    // setTimeout(() => video.pause(), 10);

    // videoRef.current.play();

    // videoRef.current.src = URL.createObjectURL(video);
    // const ctx = canvasRef.current.getContext('2d');
    // ctx.drawImage(video, 0, 0, 640, 640);
    // videoRef.current.pause();
    // window.requestAnimationFrame(() => videoRef.current.pause());
  }

  function handleDimensionsChange(e) {
    const aspectRatio = e.target.value;
    if (aspectRatio === '1:1') {
      setDimensions({
        height: 640,
        width: 640,
      });
      setScale(
        Math.min(640 / videoDimensions.height, 640 / videoDimensions.width)
      );
    } else if (aspectRatio === '16:9') {
      setDimensions({
        height: 360,
        width: 640,
      });
      setScale(
        Math.min(360 / videoDimensions.height, 640 / videoDimensions.width)
      );
    } else if (aspectRatio === '9:16') {
      setDimensions({
        height: 640,
        width: 360,
      });
      setScale(
        Math.min(640 / videoDimensions.height, 360 / videoDimensions.width)
      );
    } else if (aspectRatio === '4:5') {
      setDimensions({
        height: 450,
        width: 360,
      });
      setScale(
        Math.min(450 / videoDimensions.height, 360 / videoDimensions.width)
      );
    }

    const scaledHeight = videoDimensions.height * scale;
    const scaledWidth = videoDimensions.width * scale;
    const ar = scaledWidth / scaledHeight;

    const bottomDisplacement = (scaledHeight * borderPercent) / 200;
    const h = scaledHeight - bottomDisplacement;
    const w = scaledWidth - bottomDisplacement * ar;

    const top = (dimensions.height - scaledHeight) / 2;
    const left = (dimensions.width - w) / 2;

    console.log({
      aspectRatio,
      dimensions,
      scale,
      top,
      left,
      h,
      w,
    });
  }

  return (
    <Box textAlign="center" fontSize="xl">
      <Grid minH="100vh" p={3}>
        <Stack direction="row">
          {/* <Checkbox onChange={e => setOverlay(e.target.checked)}>
              Overlay
            </Checkbox> */}
          <Select onChange={handleDimensionsChange}>
            <option>1:1</option>
            <option>16:9</option>
            <option>9:16</option>
            <option>4:5</option>
          </Select>
          {/* <Input
              type="number"
              min="0"
              max="100"
              placeholder="Bottom Border %"
              value={borderPercent}
              onChange={e => setBorderPercent(Number(e.target.value) || 0)}
            /> */}
          <Input
            type="color"
            value={color}
            onChange={e => setColor(e.target.value)}
          />
        </Stack>
        <Flex p={4} justifyContent="center">
          <div>
            <Canvas
              color={color}
              ref={canvasRef}
              draw={draw}
              height={dimensions.height}
              width={dimensions.width}
            />
          </div>
        </Flex>
        <Box justifySelf="center">
          <Input
            type="file"
            accept="video/*"
            onChange={e => onVideoSelect(e.target.files[0])}
          />
        </Box>
        <Flex justifyContent="center">
          <Stack direction="row">
            <Button
              onClick={() => {
                if (!videoRef.current) return;
                if (videoRef.current.paused) {
                  videoRef.current.play();
                } else {
                  videoRef.current.pause();
                }
              }}
            >
              Play/Pause
            </Button>
            <Button
              onClick={() => {
                console.log('scale', scale);
              }}
            >
              Test
            </Button>
          </Stack>
        </Flex>
      </Grid>
    </Box>
  );
}

function BordererTestPage() {
  let videoRef = useRef();
  let preload = true;
  const didInit = useRef(false);
  const [isOpen, setIsOpen] = useState(false);

  const [tx, setTx] = useState();

  let sharePath =
    'https://app.reduct.video/e/how-the-zebra-gets-research-in-front-of-everyone-from-the-ceo-to-individual-designers-engineers-and-pms-3-mins-f08661432b-7f13df6723f0bd72c4d6';

  useEffect(() => {
    let shareUrl = sharePath;
    if (shareUrl[shareUrl.length - 1] === '/') {
      shareUrl = shareUrl.slice(0, shareUrl.length - 1);
    }

    const $vid = videoRef.current;
    $vid.poster = `${shareUrl}/posterframe.jpg`;

    const loadManifest = async () => {
      const manifestRet = await fetch(`${shareUrl}/manifest-path.json`);
      const manifest = await manifestRet.json();

      // Initialize Reduct player

      /* global Reduct */
      console.log('here');
      const play = new Reduct.Player($vid);
      play.init(`${shareUrl}/${manifest}`, {
        streaming: { bufferingGoal: 5, rebufferingGoal: 3 },
      });
      $vid.onVideoRender?.();
    };

    let transcript;

    const loadTranscript = async () => {
      const transRet = await fetch(`${shareUrl}/transcript.json`);
      transcript = await transRet.json();
      setTx(transcript);
    };

    if (preload) {
      didInit.current = true;
      loadManifest();
    }
    loadTranscript();

    $vid.onplay = () => {
      if (!didInit.current) {
        didInit.current = true;
        loadManifest();
      }
      setIsOpen(true);
    };

    $vid.onpause = () => {
      setIsOpen(false);
    };

    $vid.ontimeupdate = () => {
      if (!transcript) return;
      const t = $vid.currentTime;

      let found = false;
      transcript.segments.forEach(seg => {
        seg.wdlist.forEach(({ $elt }) => {
          if ($elt) $elt.style.background = 'transparent';
        });

        if (seg.end < t) {
          return;
        }
        if (found) {
          return;
        }

        seg.wdlist.forEach(({ $elt, end }) => {
          if (found) {
            return;
          }
          if (!$elt) {
            return;
          }
        });
      });
    };
  }, []);

  return (
    <>
      <h1>Borderer Test Page</h1>
      <button
        onClick={() => {
          if (videoRef.current) {
            if (videoRef.current.paused) {
              videoRef.current.play();
            } else {
              videoRef.current.pause();
            }
          }
        }}
      >
        Play/Pause
      </button>
      <button onClick={() => console.log(tx)}>Transctipt</button>
      <video ref={videoRef} />
    </>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      {/* <Route path="/test/:sharePath" element={<Test />} /> */}
      <Route path="/reels" element={<Reels />} />
      <Route path="/editor/:sharePath" element={<Editor />} />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
