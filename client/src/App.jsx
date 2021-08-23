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
  Heading,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionIcon,
  AccordionPanel,
  Checkbox,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
} from '@chakra-ui/react';
import { fabric } from 'fabric';
import ere from 'element-resize-event';
import Transcript from './components/Editor/Transcript';
import { getSubtitle, loadTranscript } from './utils';
import FontPicker from 'font-picker-react';
import { useDebouncedCallback } from './utils/useDebouncedCallback';

const MAX_HEIGHT = 650;
const MAX_WIDTH = 800;

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
      vid.loop = true;

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
      fabric.Object.prototype.cornerColor = 'blue';
      fabric.Object.prototype.cornerStyle = 'circle';
      fabric.Object.prototype.borderColor = 'blue';
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
  const [subtitle, setSubtitle] = useState();

  const { video: vid, toggleVideo, loading: videoLoading } = useVideo();
  const { canvasRef, canvas } = useCanvas(canvasSize);

  useEffect(() => {
    if (vid && subtitle) {
      bootstrapElements();
    }
  }, [vid, subtitle]);

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
    const myText = new fabric.Textbox('', {
      originX: 'center',
      originY: 'center',
      left: 0.5 * canvasSize.width,
      top: 0.9 * canvasSize.height,
      width: 400,
      textAlign: 'center',
      editable: false,
      name: 'subtitle',
      fontSize: (1080 / 450) * 16,
      // fontSize: 75,
    });

    myText.setControlsVisibility({ mt: false, mb: false });
    canvas.add(myText);
    return { myText };
  }

  function loop() {
    // fabric.util.requestAnimFrame(function render() {
    //   if (subtitle) {
    //     subtitle.forEach(s => {
    //       if (s.start < vid.currentTime && s.end > vid.currentTime) {
    //         myText.set('text', s.text);
    //       }
    //     });
    //   }
    //   canvas.renderAll();

    //   fabric.util.requestAnimFrame(render);
    // });
    let animationFrameId;

    const render = () => {
      draw();

      animationFrameId = window.requestAnimationFrame(render);
    };
    render();
  }

  function draw() {
    if (canvas) {
      let myText = canvas.getItemByName('subtitle');
      if (subtitle) {
        subtitle.forEach(s => {
          if (s.start < vid.currentTime && s.end > vid.currentTime) {
            myText.set('text', s.text);
          }
        });
      }
      canvas.renderAll();
    }
  }

  useEffect(() => {
    const wrapper = wrapperRef.current;

    setWrapperSize({
      width: wrapper.offsetWidth,
      height: wrapper.offsetHeight,
    });

    ere(wrapper, () => {
      setWrapperSize({
        width: wrapper.offsetWidth,
        height: wrapper.offsetHeight,
      });
    });

    // if (aspectRatio) handleDimensionsChange(aspectRatio);
  }, []);

  useEffect(() => {
    loadTranscript(shareUrl).then(transcript => {
      let subtitle = getSubtitle(transcript);
      console.log(subtitle);
      setSubtitle(subtitle);
    });
  }, []);

  const handleSubtitleEdit = useDebouncedCallback(
    subtitle => setSubtitle(subtitle),
    400
  );

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
    scale = Math.min(scale, MAX_WIDTH / canvasSize.width);
  } else {
    scale = wrapperSize.height / canvasSize.height;
    scale = Math.min(scale, MAX_HEIGHT / canvasSize.height);
  }

  const containerHeight = scale * canvasSize.height;
  const containerWidth = scale * canvasSize.width;

  // if (!canvas) return 'loading';

  return (
    <Flex direction="row" height="100%">
      <Flex w="400px" borderRight="1px solid black" direction="column">
        <Heading px={4} className="apply-font" my="6">
          <span
            contentEditable
            suppressContentEditableWarning

            // onInput={e => updateMeta('title', e.target.innerText)}
          >
            Transcript
          </span>
        </Heading>
        {subtitle && (
          <Transcript
            video={vid}
            subtitle={subtitle}
            onEdit={edit => {
              handleSubtitleEdit(edit);
            }}
          />
        )}
      </Flex>
      <Flex
        flex="2"
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
        bg="gray.100"
        px="4"
      >
        <Stack direction="row" spacing="4">
          <Button onClick={() => toggleVideo()}>
            {vid?.paused ? 'Play' : 'Pause'}
          </Button>
          <Button onClick={() => console.log(canvas)}>Test</Button>
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
              <Box
                w={canvasSize.width}
                h={canvasSize.height}
                position="relative"
              >
                <Flex position="relative">
                  <Canvas
                    // height={canvasSize.height}
                    // width={canvasSize.width}
                    ref={canvasRef}
                    draw={draw}
                  />
                </Flex>
              </Box>
            </Box>
          </Box>
        </Box>
      </Flex>
      <Flex w="300px" borderLeft="1px solid black">
        <Accordion w="100%" allowMultiple>
          <AccordionItem>
            <h2>
              <AccordionButton>
                <Box flex="1" textAlign="left">
                  Canvas
                </Box>
                <AccordionIcon />
              </AccordionButton>
            </h2>
            <AccordionPanel pb={4} bg="gray.200">
              <Stack>
                <FormControl id="a_r" isRequired>
                  <FormLabel fontSize="xs">Aspect Ratio</FormLabel>
                  <Select
                    size="xs"
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
                <FormControl id="color" isRequired size="xs">
                  <FormLabel fontSize="xs">Background Color</FormLabel>
                  <Input
                    size="xs"
                    background="white"
                    type="color"
                    defaultValue="#FFC0CB"
                    // value={color}
                    px="1"
                    // onChange={e => handleColorChange(e.target.value)}
                    onChange={e => {
                      canvas.set('backgroundColor', e.target.value);
                    }}
                  />
                </FormControl>

                <FormControl id="grid" isRequired>
                  <FormLabel>Show Grid</FormLabel>
                  <Checkbox
                  // checked={showOutline}
                  // onChange={e => setShowOutline(e.target.checked)}
                  >
                    Show Grid
                  </Checkbox>
                </FormControl>
              </Stack>
            </AccordionPanel>
          </AccordionItem>
          <AccordionItem>
            <h2>
              <AccordionButton>
                <Box flex="1" textAlign="left">
                  Subtitle
                </Box>
                <AccordionIcon />
              </AccordionButton>
            </h2>
            <AccordionPanel pb={4} bg="gray.200">
              <Stack>
                <FormControl id="font_family" isRequired>
                  <FormLabel fontSize="xs">Font Family</FormLabel>
                  <FontPicker
                    size="xs"
                    apiKey={process.env.REACT_APP_GOOGLE_FONTS_API_KEY}
                    // activeFontFamily={activeFontFamily.family}
                    // variants={[
                    //   '100',
                    //   '100italic',
                    //   '200',
                    //   '200italic',
                    //   '300',
                    //   '300italic',
                    //   'regular',
                    //   'italic',
                    //   '500',
                    //   '500italic',
                    //   '600',
                    //   '600italic',
                    //   '700',
                    //   '700italic',
                    //   '800',
                    //   '800italic',
                    //   '900',
                    //   '900italic',
                    // ]}
                    onChange={nextFont => {
                      console.log(nextFont);
                      // updateMeta('activeFontFamily', nextFont);
                    }}
                    limit={400}
                  />
                </FormControl>
                <FormControl id="uppercase" isRequired>
                  <FormLabel fontSize="xs">Uppercase</FormLabel>
                  <Checkbox
                    size="sm"
                    borderColor="black"

                    // checked={fontUppercase}
                    // onChange={e => updateMeta('fontUppercase', e.target.checked)}
                  >
                    Uppercase
                  </Checkbox>
                </FormControl>
                <FormControl id="font_size" isRequired>
                  <FormLabel fontSize="xs">Font Size</FormLabel>
                  <NumberInput
                    size="xs"
                    // onChange={valueString =>
                    //   updateMeta('fontSize', parse(valueString))
                    // }
                    // value={format(fontSize)}
                    step={2}
                    defaultValue={22}
                    min={10}
                    max={200}
                    bg="white"
                    borderRadius={8}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>

                <FormControl id="font_size" isRequired>
                  <FormLabel fontSize="xs">Italic</FormLabel>
                  <Checkbox
                    size="sm"
                    borderColor="black"

                    // checked={italic}
                    // onChange={e => updateMeta('italic', e.target.checked)}
                  >
                    Italic
                  </Checkbox>
                </FormControl>
                <FormControl id="font_size" isRequired>
                  <FormLabel fontSize="xs">Font Weight</FormLabel>
                  <Select
                    size="xs"
                    background="white"
                    // onChange={e => updateMeta('fontWeight', e.target.value)}
                    // value={fontWeight}
                  >
                    <option value="100">100</option>
                    <option value="200">200</option>
                    <option value="300">300</option>
                    <option value="400">400</option>
                    <option value="500">500</option>
                    <option value="600">600</option>
                    <option value="700">700</option>
                    <option value="800">800</option>
                    <option value="900">900</option>
                  </Select>
                </FormControl>
                <FormControl id="color" isRequired>
                  <FormLabel fontSize="xs">Font Color</FormLabel>
                  <Input
                    size="xs"
                    background="white"
                    type="color"
                    px="1"
                    // value={textColor}
                    // onChange={e => handleTextColorChange(e.target.value)}
                  />
                </FormControl>
              </Stack>
            </AccordionPanel>
          </AccordionItem>
          <AccordionItem>
            <h2>
              <AccordionButton>
                <Box flex="1" textAlign="left">
                  Title
                </Box>
                <AccordionIcon />
              </AccordionButton>
            </h2>
            <AccordionPanel pb={4} bg="gray.200">
              <Stack>
                <FormControl id="font_size" isRequired>
                  <FormLabel fontSize="xs">Show title?</FormLabel>
                  <Checkbox
                    borderColor="black"
                    size="sm"
                    // checked={showTitle}
                    // onChange={e => updateMeta('showTitle', e.target.checked)}
                  >
                    Show Title
                  </Checkbox>
                </FormControl>

                <FormControl id="font_size" isRequired>
                  <FormLabel fontSize="xs">Title Font Size</FormLabel>
                  <NumberInput
                    size="xs"
                    // onChange={valueString =>
                    //   updateMeta('titleTextSize', parse(valueString))
                    // }
                    // value={format(titleTextSize)}
                    step={2}
                    defaultValue={22}
                    min={10}
                    max={200}
                    bg="white"
                    borderRadius={8}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>
                <FormControl id="color" isRequired>
                  <FormLabel fontSize="xs">Title Color</FormLabel>
                  <Input
                    size="xs"
                    background="white"
                    type="color"
                    px="1"
                    // value={textColor}
                    // onChange={e => handleTextColorChange(e.target.value)}
                  />
                </FormControl>
              </Stack>
            </AccordionPanel>
          </AccordionItem>
        </Accordion>
      </Flex>
    </Flex>
  );
}

const Canvas = React.forwardRef((props, canvasRef) => {
  const { draw, ...rest } = props;

  useEffect(() => {
    let frameCount = 0;
    let animationFrameId;

    const render = () => {
      frameCount++;
      draw(frameCount);
      animationFrameId = window.requestAnimationFrame(render);
    };
    render();

    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [draw]);

  return <canvas ref={canvasRef} {...rest} id="my-canvas" />;
});
