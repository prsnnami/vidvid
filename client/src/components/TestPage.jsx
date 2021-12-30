import {
  Box,
  Flex,
  Heading,
  Spinner,
  Button,
  Stack,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  FormControl,
  FormLabel,
  Input,
} from '@chakra-ui/react';
import React, { useEffect, useRef, useState } from 'react';
import {
  getSubtitle,
  getVideoDimensions,
  loadTranscript,
  useCanvas,
  useVideo,
} from '../utils';
import { useDebouncedCallback } from '../utils/useDebouncedCallback';
import Transcript from './Editor/Transcript';
import PlayButton from './PlayButton';
import Seeker from './Seeker';
import { fabric } from 'fabric';
import ere from 'element-resize-event';
import Sidebar from './Sidebar';

const shareUrl =
  'https://app.reduct.video/e/borderer-testing-84e3ce2ba0-f81df100c4861287a746';

const MAX_HEIGHT = 600;
const MAX_WIDTH = 800;

function TestPage() {
  const [canvasSize, setCanvasSize] = useState({ height: 1080, width: 1080 });
  const [ar, setAr] = useState('1:1');
  const [wrapperSize, setWrapperSize] = useState({ height: 0, width: 0 });
  const wrapperRef = useRef();
  const [subtitle, setSubtitle] = useState();

  const exportModal = useDisclosure();
  const nameRef = useRef();
  const inputRef = useRef();

  const {
    video: vid,
    toggleVideo,
    loading: videoLoading,
    buffering,
  } = useVideo();
  const { canvasRef, canvas } = useCanvas(canvasSize);

  const [layers, setLayers] = useState({
    canvas: {
      aspect_ratio: '1:1',
      bgColor: '',
      title: false,
      subtitle: true,
    },
    video: {
      url: '',
      manifest_url: '',
      name: '',
      quality: '1080p',
    },
    subtitle: {
      fontFamily: 'Open Sans',
      uppercase: false,
      fontSize: 40,
      italic: false,
      fontWeight: 400,
      color: 'black',
      fontLink: '',
      outlineColor: 'black',
      outlineWidth: 2,
    },
    title: {
      fontFamily: 'Open Sans',
      uppercase: false,
      fontSize: 100,
      italic: false,
      fontWeight: 400,
      color: 'white',
      fontLink: '',
      outlineColor: 'black',
      outlineWidth: 2,
    },
    images: [],
  });

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
      fontSize: layers.subtitle.fontSize,
      // fontSize: 75,
    });

    myText.setControlsVisibility({ mt: false, mb: false });
    canvas.add(myText);
    return { myText };
  }

  function handleTitleToggle(showTitle) {
    if (showTitle) {
      const title = new fabric.Textbox('Transcript', {
        originX: 'center',
        originY: 'center',
        left: 0.5 * canvasSize.width,
        top: 0.1 * canvasSize.height,
        width: 400,
        textAlign: 'center',
        editable: false,
        name: 'title',
        fontSize: layers.title.fontSize,
        fill: layers.title.color,
      });
      canvas.add(title);
    } else {
      const title = canvas.getItemByName('title');
      canvas.remove(title);
    }
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
    let subtitleElement = canvas.getItemByName('subtitle');
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

    subtitleElement.set({
      left: 0.5 * width,
      top: 0.9 * height,
    });

    videoElement.scaleToHeight(h);
    videoElement.scaleToWidth(w);
    canvas.setDimensions({ height, width });
    canvas.renderAll();
  }

  const removeImage = name => {
    let image = canvas.getItemByName(name);
    canvas.remove(image);
    setLayers({
      ...layers,
      images: layers.images.filter(i => i.name !== name),
    });
  };

  function handleFileUpload(e) {
    let file = e.target.files[0];
    let reader = new FileReader();
    reader.onload = function (readerEvent) {
      let image = new Image();
      image.src = readerEvent.target.result;
      image.onload = function () {
        let img = new fabric.Image(image, {
          name: file.name.split('.').join(Date.now + '.'),
          displayName: file.name,
          file: file,
        });

        img.set({
          left: 100,
          top: 60,
        });
        img.scaleToWidth(200);
        canvas.add(img).setActiveObject(img).renderAll();
        setLayers({ ...layers, images: [...layers.images, img] });
      };
    };
    reader.readAsDataURL(file);
  }

  function getCoords(name) {
    let item = canvas.getItemByName(name);
    console.log(canvas.getObjects().map(i => i.name));
    if (!item) return null;
    return {
      top: item.top,
      left: item.left,
      height: item.height,
      width: item.width,
    };
  }

  function getIndex(name) {
    const items = canvas.getObjects().map(i => i.name);
    return items.indexOf(name);
  }

  function onSubmit() {
    let body = {
      name: nameRef.current.value,
      src: inputRef.current.value,
      canvas: layers.canvas,
    };

    if (body.canvas.title) {
      body.title = {
        index: getIndex('title'),
        ...layers.title,
        ...getCoords('title'),
      };
    }
    body.subtitle = {
      index: getIndex('subtitle'),
      ...layers.subtitle,
      ...getCoords('subtitle'),
    };
    body.video = {
      index: getIndex('video'),
      ...layers.video,
      ...getCoords('video'),
    };
    body.images = layers.images.map(i => ({
      index: getIndex(i.name),
      name: i.name,
      ...getCoords(i.name),
    }));

    let formData = new FormData();

    formData.append('body', JSON.stringify(body));
    formData.append('input.mp4', inputRef.current.files[0]);
    layers.images.forEach(element => {
      formData.append(element.name, element.file);
    });

    console.log(layers.images);
    fetch('/borderer/generate_reel', {
      method: 'post',
      body: formData,
    });
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

  return (
    <>
      <Flex direction={'column'} height="100%">
        <Flex
          px="6"
          color="white"
          bg="teal.500"
          h="65px"
          alignItems={'center'}
          justifyContent="space-between"
        >
          Navbar
          <Flex>
            <Stack direction="row">
              <Button colorScheme="teal">Save Video</Button>
              <Button colorScheme="teal" onClick={exportModal.onOpen}>
                Export Video
              </Button>
            </Stack>
          </Flex>
        </Flex>
        <Flex direction="row" height="100%" flexGrow={1}>
          <Flex w="400px" borderRight="1px solid #edf2f7" direction="column">
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
            <Box
              py="2"
              display="flex"
              justifyContent="center"
              alignItems="center"
              flexGrow="1"
            >
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
                      <Flex
                        justifyContent="center"
                        alignItems="center"
                        position="absolute"
                        h="100%"
                        w="100%"
                        bg="rgba(0,0,0,0.2)"
                        hidden={!(buffering || videoLoading)}
                        id="spinner"
                        zIndex="1"
                      >
                        <Spinner color="teal" size="xl" thickness="8px" />
                      </Flex>
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
            <Flex justifyContent="center" alignItems="center" flexGrow="1">
              <PlayButton
                vid={vid}
                toggleVideo={toggleVideo}
                buffering={buffering}
              />
            </Flex>
            <Seeker video={vid} />
          </Flex>
          <Sidebar
            handleDimensionsChange={handleDimensionsChange}
            removeImage={removeImage}
            handleFileUpload={handleFileUpload}
            // isImage={isImage}
            isImage={layers.images.length}
            ar={ar}
            canvas={canvas}
            handleTitleToggle={handleTitleToggle}
            layers={layers}
            setLayers={setLayers}
          />
        </Flex>
      </Flex>
      <Modal isOpen={exportModal.isOpen} onClose={exportModal.onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Export Video</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Stack>
              <FormControl id="name" isRequired>
                <FormLabel>Enter File Name</FormLabel>
                <Input ref={nameRef} placeholder="Enter file name" />
              </FormControl>
              <FormControl id="video" isRequired>
                <FormLabel>Upload Video</FormLabel>
                <Input
                  type="file"
                  placeholder="Upload File"
                  accept="video/mp4"
                  ref={inputRef}
                ></Input>
              </FormControl>
            </Stack>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme={'teal'} mr={3} onClick={onSubmit}>
              Export
            </Button>
            <Button variant="ghost" onClick={exportModal.onClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
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

export default TestPage;
