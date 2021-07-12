import { Button } from '@chakra-ui/button';
import { Input } from '@chakra-ui/input';
import { Text } from '@chakra-ui/layout';
import { Box, Flex, Stack } from '@chakra-ui/layout';
import { Select } from '@chakra-ui/select';
import { SliderTrack } from '@chakra-ui/slider';
import { SliderThumb } from '@chakra-ui/slider';
import { SliderFilledTrack } from '@chakra-ui/slider';
import { Slider } from '@chakra-ui/slider';
import { Spinner } from '@chakra-ui/spinner';
import React, { useEffect, useRef, useState } from 'react';
import { drawScaledImage, getTimeStamp, getWrapLines } from '../../utils';
import { useDebouncedCallback } from '../../utils/useDebouncedCallback';
import { FaPause, FaPlay, FaVolumeMute, FaVolumeUp } from 'react-icons/fa';
import Canvas from '../VideoCanvas';
import ere from 'element-resize-event';
import {
  Checkbox,
  FormControl,
  FormLabel,
  Heading,
  Icon,
  IconButton,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
} from '@chakra-ui/react';
import FontPicker from 'font-picker-react';

async function loadManifest(shareUrl) {
  const manifestRet = await fetch(`/proxy/${shareUrl}/manifest-path.json`);
  const manifest = await manifestRet.json();
  return manifest;
}

const MAX_HEIGHT = 450;

const Video = React.forwardRef(
  (
    {
      videoRef,
      sharePath,
      subtitle,
      color,
      aspectRatio,
      setManifestUrl,
      textColor,
      fontSize,
      activeFontFamily,
      textPosition,
      outlineColor,
      outlineWidth,
      fontWeight,
      italic,
      showTitle,
      titlePosition,
      titleTextSize,
      title,
    },
    canvasRef
  ) => {
    const [canvasSize, setCanvasSize] = useState({ height: 1080, width: 1920 });
    const [videoSize, setVideoSize] = useState({ height: 360, width: 480 });
    const [wrapperSize, setWrapperSize] = useState({ height: 0, width: 0 });
    const [scale, setScale] = useState(1);

    const [videoLoading, setVideoLoading] = useState(true);
    const [isPlaying, setIsPlaying] = useState(false);
    const [poster, setPoster] = useState(null);
    const [buffering, setBuffering] = useState();
    const [videoPlayed, setVideoPlayed] = useState(false);

    const [showOutline, setShowOutline] = useState(false);

    const wrapperRef = useRef();

    // const [color, setColor] = useState('#000000');
    const handleColorChange = useDebouncedCallback(
      value => color[1](value),
      200
    );

    const handleTextColorChange = useDebouncedCallback(
      value => textColor[1](value),
      200
    );

    const format = val => val + ' px';
    const parse = val => Number(val.replace(/^\px/, ''));

    async function init(vid) {
      let shareUrl = 'https://app.reduct.video/e/' + sharePath;

      if (shareUrl[shareUrl.length - 1] === '/') {
        shareUrl = shareUrl.slice(0, shareUrl.length - 1);
      }
      setPoster(`${shareUrl}/posterframe.jpg`);

      const manifest = await loadManifest(shareUrl);
      setManifestUrl(manifest);

      // Initialize Reduct player

      /* global Reduct */

      // console.log(`${shareUrl}/${manifest}`);
      const play = new Reduct.Player(vid);
      play.init(`/proxy/${shareUrl}/${manifest}`, {
        streaming: { bufferingGoal: 5, rebufferingGoal: 3 },
      });
      vid.onVideoRender?.();

      vid.onloadeddata = function (e) {
        console.log('loadedData');
        setVideoSize({ height: this.videoHeight, width: this.videoWidth });
        setVideoLoading(false);
      };

      vid.onwaiting = () => setBuffering(true);
      vid.onseeking = () => setBuffering(true);
      vid.oncanplay = () => setBuffering(false);

      vid.addEventListener('play', () => {
        setVideoPlayed(true);
        setIsPlaying(true);
      });
      vid.addEventListener('pause', () => setIsPlaying(false));
    }

    useEffect(() => {
      let vid = document.createElement('video');
      videoRef.current = vid;
      init(vid);
      return () => {
        console.log('cleanup', vid);
        if (vid) {
          vid.pause();
          vid.remove();
        }
        if (videoRef.current) {
          videoRef.current = null;
        }
      };
    }, [sharePath]);

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
    }, []);

    useEffect(() => {
      function updateState() {
        let scale;
        if (canvasSize.width > canvasSize.height) {
          scale = wrapperSize.width / canvasSize.width;
        } else {
          scale = wrapperSize.height / canvasSize.height;
        }

        scale = Math.min(scale, MAX_HEIGHT / canvasSize.height);

        setScale(scale);
      }
      updateState();
    }, [wrapperSize, canvasSize]);

    function drawThumbnail(ctx) {
      if (!videoLoading && poster) {
        const image = new Image();
        image.onload = () => {
          image.style.objectFit = 'contain';
          ctx.imageSmoothingEnabled = false;
          drawScaledImage(ctx, image, canvasSize, {
            height: image.height,
            width: image.width,
          });
        };
        image.src = poster;
      }
    }

    function draw(ctx) {
      if (videoRef.current && !videoLoading) {
        if (!videoPlayed) {
          drawThumbnail(ctx);
        } else {
          drawScaledImage(ctx, videoRef.current, canvasSize, videoSize);
          ctx.font =
            (italic[0] ? 'italic' : 'normal') +
            ' normal ' +
            fontWeight[0] +
            ' ' +
            fontSize[0] +
            'px ' +
            activeFontFamily[0].family;
          ctx.fillStyle = textColor[0];
          ctx.textAlign = 'center';
          ctx.lineWidth = outlineWidth[0];
          ctx.strokeStyle = outlineColor[0];
          ctx.miterLimit = 2;

          let textRender = false;
          subtitle.forEach(s => {
            if (
              s.start < videoRef.current.currentTime &&
              s.end > videoRef.current.currentTime &&
              !textRender
            ) {
              let lines = getWrapLines(ctx, s.text, canvasSize.width * 0.8);
              lines.reverse().forEach((line, i) => {
                ctx.strokeText(
                  line,
                  canvasSize.width / 2,
                  canvasSize.height -
                    (canvasSize.height * textPosition[0]) / 100 -
                    i * (fontSize[0] * 1.2)
                );
                ctx.fillText(
                  line,
                  canvasSize.width / 2,
                  canvasSize.height -
                    (canvasSize.height * textPosition[0]) / 100 -
                    i * (fontSize[0] * 1.2)
                );
              });
              textRender = true;
            }
          });
          if (showTitle[0]) {
            ctx.font =
              'normal normal ' +
              fontWeight[0] +
              ' ' +
              titleTextSize[0] +
              'px ' +
              activeFontFamily[0].family;
            ctx.strokeText(
              title,
              canvasSize.width / 2,
              canvasSize.height - (canvasSize.height * titlePosition[0]) / 100
            );
            ctx.fillText(
              title,
              canvasSize.width / 2,
              canvasSize.height - (canvasSize.height * titlePosition[0]) / 100
            );
          }

          if (showOutline && aspectRatio[0] === '9:16') {
            ctx.beginPath();
            ctx.strokeStyle = 'teal';
            ctx.moveTo(0, 284);
            ctx.lineTo(1080, 284);
            ctx.moveTo(0, 1636);
            ctx.lineTo(1080, 1636);
            ctx.stroke();

            ctx.beginPath();
            ctx.strokeStyle = 'blue';
            ctx.moveTo(0, 420);
            ctx.lineTo(1080, 420);
            ctx.moveTo(0, 1500);
            ctx.lineTo(1080, 1500);
            ctx.stroke();
          }
        }
      }
    }

    function handleDimensionsChange(e) {
      const ar = e.target.value;
      aspectRatio[1](ar);
      let height, width;

      switch (ar) {
        case '1:1':
          width = 1920;
          height = 1920;
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

      setCanvasSize({ height, width });
    }

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
                  >
                    <Spinner color="teal" size="xl" thickness="8px" />
                  </Flex>
                  <Canvas
                    ref={canvasRef}
                    draw={draw}
                    height={canvasSize.height}
                    width={canvasSize.width}
                    color={color[0]}
                  />
                </Flex>
              </Box>
            </Box>
          </Box>
          <Seeker video={videoRef.current} />
        </Box>
        {/* <Box className="spacer" flexGrow="1" /> */}

        <Flex flexGrow="1">
          <Flex
            direction="column"
            w="100%"
            m="2"
            bg="white"
            borderRadius="8"
            p="4"
          >
            <Heading
              size="md"
              onClick={() => console.log({ showOutline, aspectRatio })}
            >
              Video Settings
            </Heading>
            <Stack py="4">
              <FormControl id="a_r" isRequired>
                <FormLabel>Aspect Ratio</FormLabel>
                <Select
                  size="sm"
                  background="white"
                  onChange={handleDimensionsChange}
                  value={aspectRatio[0]}
                >
                  <option value="1:1">1:1 Square</option>
                  <option value="16:9">16:9 Horizontal</option>
                  <option value="9:16">9:16 Vertical</option>
                  <option value="4:5">4:5 Portrait</option>
                </Select>
              </FormControl>
              <FormControl id="grid" isRequired>
                <FormLabel>Show Grid</FormLabel>
                <Checkbox
                  checked={showOutline}
                  onChange={e => setShowOutline(e.target.checked)}
                >
                  Show Grid
                </Checkbox>
              </FormControl>
              <FormControl id="color" isRequired>
                <FormLabel>Background Color</FormLabel>
                <Input
                  size="sm"
                  background="white"
                  type="color"
                  value={color[0]}
                  px="1"
                  onChange={e => handleColorChange(e.target.value)}
                />
              </FormControl>
              <FormControl id="font_size" isRequired>
                <FormLabel>Show title?</FormLabel>
                <Checkbox
                  checked={showTitle[0]}
                  onChange={e => showTitle[1](e.target.checked)}
                >
                  Show Title
                </Checkbox>
              </FormControl>
              <FormControl id="position" isRequired>
                <FormLabel>Title Position ({titlePosition[0]})</FormLabel>
                <Slider
                  size="sm"
                  aria-label="slider-ex-1"
                  value={titlePosition[0]}
                  focusThumbOnChange={false}
                  onChange={progress => titlePosition[1](progress)}
                  ml="2"
                  min={10}
                  max={90}
                >
                  <SliderTrack bg="gray.400">
                    <SliderFilledTrack bg="teal.500" />
                  </SliderTrack>
                  <SliderThumb bg="teal.500" />
                </Slider>
              </FormControl>
              <FormControl id="font_size" isRequired>
                <FormLabel>Title Font Size</FormLabel>
                <NumberInput
                  size="sm"
                  onChange={valueString => titleTextSize[1](parse(valueString))}
                  value={format(titleTextSize[0])}
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
            </Stack>
          </Flex>
          <Flex
            direction="column"
            w="100%"
            m="2"
            bg="white"
            borderRadius="8"
            p="4"
          >
            <Heading size="md">Subtitle Settings</Heading>
            <Stack py="4">
              <FormControl id="font_family" isRequired>
                <FormLabel>Font Family</FormLabel>
                <FontPicker
                  apiKey={process.env.REACT_APP_GOOGLE_FONTS_API_KEY}
                  activeFontFamily={activeFontFamily[0].family}
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
                    activeFontFamily[1](nextFont);
                  }}
                  limit={400}
                />
              </FormControl>
              <FormControl id="font_size" isRequired>
                <FormLabel>Font Size</FormLabel>
                <NumberInput
                  size="sm"
                  onChange={valueString => fontSize[1](parse(valueString))}
                  value={format(fontSize[0])}
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
                <FormLabel>Italic</FormLabel>
                <Checkbox
                  checked={italic[0]}
                  onChange={e => italic[1](e.target.checked)}
                >
                  Italic
                </Checkbox>
              </FormControl>
              <FormControl id="font_size" isRequired>
                <FormLabel>Font Weight</FormLabel>
                <Select
                  size="sm"
                  background="white"
                  onChange={e => fontWeight[1](e.target.value)}
                  value={fontWeight[0]}
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
                <FormLabel>Font Color</FormLabel>
                <Input
                  size="sm"
                  background="white"
                  type="color"
                  px="1"
                  value={textColor[0]}
                  onChange={e => handleTextColorChange(e.target.value)}
                />
              </FormControl>
              <FormControl id="position" isRequired>
                <FormLabel>Text Position ({textPosition[0]})</FormLabel>
                <Slider
                  size="sm"
                  aria-label="slider-ex-1"
                  value={textPosition[0]}
                  focusThumbOnChange={false}
                  onChange={progress => textPosition[1](progress)}
                  ml="2"
                  min={10}
                  max={90}
                >
                  <SliderTrack bg="gray.400">
                    <SliderFilledTrack bg="teal.500" />
                  </SliderTrack>
                  <SliderThumb bg="teal.500" />
                </Slider>
              </FormControl>
              <FormControl id="position" isRequired>
                <FormLabel>Outline Width</FormLabel>
                <NumberInput
                  size="sm"
                  onChange={e => outlineWidth[1](e)}
                  value={outlineWidth[0]}
                  step={0.5}
                  defaultValue={2}
                  min={0}
                  max={50}
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
              <FormControl id="position" isRequired>
                <FormLabel>Outline Color</FormLabel>
                <Input
                  size="sm"
                  background="white"
                  type="color"
                  px="1"
                  value={outlineColor[0]}
                  onChange={e => outlineColor[1](e.target.value)}
                />
              </FormControl>
            </Stack>
          </Flex>
        </Flex>
      </Flex>
    );
  }
);

export default Video;

function Seeker({ video }) {
  const [progress, setProgress] = useState(0);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    // Update the document title using the browser API
    if (video) {
      // setDuration(mediaRef.current.duration);
      video.addEventListener('timeupdate', handleTimeUpdated);
    }
    return function cleanup() {
      if (video) {
        // removeEventListener
        video.removeEventListener('timeupdate', handleTimeUpdated);
      }
    };
  }, [video]);

  function handleTimeUpdated(e) {
    let currentTime = e.target.currentTime;
    let duration = e.target.duration;
    setTime(currentTime);
    setDuration(duration);

    setProgress((currentTime / duration) * 100);
  }

  function handleThumbSlide(progress) {
    if (video) {
      // setProgress(progress);
      video.currentTime = (progress * video.duration) / 100;
    }
  }

  const debouncedHandleThumbSlide = useDebouncedCallback(
    value => handleThumbSlide(value),
    200
  );

  return (
    <Flex w="100%">
      <IconButton
        bg="white"
        mx={2}
        icon={video && video.paused ? <FaPlay /> : <FaPause />}
        onClick={() => {
          if (!video) return;

          if (video.paused) {
            video.play();
          } else {
            video.pause();
          }
        }}
        boxShadow="none"
      />
      <Flex
        p="1"
        pr="2"
        bg="white"
        flexGrow={1}
        alignItems="center"
        borderRadius={4}
      >
        <Text
          css={{
            fontSize: '0.9em',
            fontWeight: 500,
            color: '#929292',
            cursor: 'pointer',
          }}
          px="1"
        >
          {getTimeStamp(time)}
        </Text>
        <Slider
          aria-label="slider-ex-1"
          value={progress}
          focusThumbOnChange={false}
          onChange={progress => setProgress(progress)}
          // onChangeStart={() => video.pause()}
          onChangeEnd={debouncedHandleThumbSlide}
          ml="2"
        >
          <SliderTrack bg="gray.400">
            <SliderFilledTrack bg="teal.500" />
          </SliderTrack>
          <SliderThumb bg="teal.500" />
        </Slider>
        <Text
          css={{
            fontSize: '0.9em',
            fontWeight: 500,
            color: '#929292',
            cursor: 'pointer',
          }}
          px="1"
        >
          {getTimeStamp(duration)}
        </Text>
      </Flex>
      <IconButton
        bg="white"
        mx={2}
        icon={video && !video.muted ? <FaVolumeUp /> : <FaVolumeMute />}
        onClick={() => {
          console.dir(video);
          video.muted = !video.muted;
        }}
        boxShadow="none"
      />
    </Flex>
  );
}
