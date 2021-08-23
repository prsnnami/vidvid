import { Box, Flex, FormControl, FormLabel, Heading, Input, Select, Stack } from "@chakra-ui/react";
import React, { useEffect, useRef, useState } from "react";
import { getSubtitle, getVideoDimensions, loadTranscript, useCanvas, useVideo } from "../utils";
import { useDebouncedCallback } from "../utils/useDebouncedCallback";
import Transcript from "./Editor/Transcript";
import PlayButton from "./PlayButton";
import Seeker from "./Seeker";
import { fabric } from 'fabric';
import ere from 'element-resize-event';
import Sidebar from "./Sidebar";

const shareUrl =
  'https://app.reduct.video/e/borderer-testing-84e3ce2ba0-f81df100c4861287a746';

const MAX_HEIGHT = 600;
const MAX_WIDTH = 800;

function TestPage () {
  const [canvasSize, setCanvasSize] = useState({ height: 1080, width: 1080 });
  const [ar, setAr] = useState('1:1');
  const [wrapperSize, setWrapperSize] = useState({ height: 0, width: 0 });
  const wrapperRef = useRef();
  const [subtitle, setSubtitle] = useState();
  const [isImage, setIsImage] = useState();

  const { video: vid, toggleVideo, loading: videoLoading, buffering } = useVideo();
  const { canvasRef, canvas } = useCanvas(canvasSize);

  const [layers, setLayers] = useState({
    canvas: {
      aspect_ratio: '1:1',
      bgColor: '',
      title: false,
      subtitle: true,
    },
    video: {
      top: 0,
      left: 0,
      height: 0,
      width: 0,
      url: '',
      manifest_url: '',
      name: '',
      quality: '1080p',
    },
    subtitle: {
      fontFamily: 'Open Sans',
      uppercase: false,
      fontSize: 22,
      italic: false,
      fontWeight: 400,
      color: 'black',
      top: 0,
      left: 0,
      height: 0,
      width: 0,
      fontLink: '',
      outlineColor: 'black',
      outlineWidth: 2,
    },
    title: {
      fontFamily: 'Open Sans',
      uppercase: false,
      fontSize: 22,
      italic: false,
      fontWeight: 400,
      color: 'black',
      top: 0,
      left: 0,
      height: 0,
      width: 0,
      fontLink: '',
      outlineColor: 'black',
      outlineWidth: 2,
    },
    image: {
      top: 0,
      left: 0,
      height: 0,
      width: 0,
      image: null,
    }
  })

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

  const handleCanvasChange = (e) => {
    canvas.set('backgroundColor', e.target.value);
  }
  function bootstrapElements () {
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

  function loop () {
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

  function draw () {
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

  function handleDimensionsChange (ar) {
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

  const removeImage = () => {
    let image = canvas.getItemByName("image")
    canvas.remove(image);
    setIsImage(false);
  }

  function handleFileUpload (e) {
    let reader = new FileReader();
    reader.onload = function (e) {
      let image = new Image();
      image.src = e.target.result;
      image.onload = function () {
        let img = new fabric.Image(image, {
          name: 'image'
        });

        img.set({
          left: 100,
          top: 60,
        });
        img.scaleToWidth(200);
        canvas.add(img).setActiveObject(img).renderAll();
        setIsImage(true)
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
          <PlayButton vid={vid} toggleVideo={toggleVideo} buffering={buffering} />
        </Flex>
        <Seeker video={vid} />
      </Flex>
      <Sidebar
        handleDimensionsChange={handleDimensionsChange}
        removeImage={removeImage}
        handleFileUpload={handleFileUpload}
        isImage={isImage}
        ar={ar}
        handleCanvasChange={handleCanvasChange}
      />
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

export default TestPage;