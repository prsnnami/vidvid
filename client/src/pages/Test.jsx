import { Box, Flex } from '@chakra-ui/layout';
import { Select } from '@chakra-ui/select';
import ere from 'element-resize-event';
import React, { useEffect, useRef, useState } from 'react';

export default function Test({ maxHeight, maxWidth, maxScale }) {
  maxHeight = 450;
  const aspectRatio = useState();
  const [canvasSize, setCanvasSize] = useState({ height: 1920, width: 1920 });
  const [wrapperSize, setWrapperSize] = useState({ height: 0, width: 0 });
  const [scale, setScale] = useState(1);
  const wrapperRef = useRef();

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
      // if (wrapperSize.height === 0) return;
      let scale;
      console.log(canvasSize);
      if (canvasSize.width > canvasSize.height) {
        scale = wrapperSize.width / canvasSize.width;
      } else {
        scale = wrapperSize.height / canvasSize.height;
      }

      if (maxHeight) {
        scale = Math.min(scale, maxHeight / canvasSize.height);
      }
      if (maxWidth) {
        scale = Math.min(scale, maxWidth / canvasSize.width);
      }

      if (maxScale) {
        scale = Math.min(scale, maxScale);
      }

      setScale(scale);
    }
    updateState();
  }, [wrapperSize, canvasSize, maxHeight, maxWidth, maxScale]);

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
    <Flex h="100%" w="100%" pt="60px">
      <Box h="100%" w="50%" bg="gray.100"></Box>
      <Flex h="100%" w="50%" bg="gray.200" px="3">
        <Flex
          flexDirection="column"
          alignItems="center"
          justifyContent="flex-start"
          h="100%"
          w="100%"
          py="28px"
          margin="0 auto"
          overflow="hidden"
          ref={wrapperRef}
        >
          <Box pb="4">
            <Select
              background="white"
              onChange={handleDimensionsChange}
              value={aspectRatio[0]}
            >
              <option value="1:1">1:1 Square</option>
              <option value="16:9">16:9 Horizontal</option>
              <option value="9:16">9:16 Vertical</option>
              <option value="4:5">4:5 Portrait</option>
            </Select>
          </Box>
          <Box>
            <Box
              style={{
                maxWidth: '100%',
                overflow: 'hidden',
                width: containerWidth + 'px',
                height: containerHeight + 'px',
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
                  border="1px solid"
                >
                  {`${wrapperSize.width}x${wrapperSize.height}`}
                </Box>
              </Box>
            </Box>
          </Box>
        </Flex>
      </Flex>
    </Flex>
  );
}
