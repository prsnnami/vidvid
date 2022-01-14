import { useEffect, useState } from 'react';

import { FaVolumeMute, FaVolumeUp } from 'react-icons/fa';
import {
  Flex,
  Text,
  Slider,
  Popover,
  IconButton,
  SliderThumb,
  SliderTrack,
  PopoverContent,
  PopoverTrigger,
  SliderFilledTrack,
} from '@chakra-ui/react';

import { getTimeStamp } from '../utils';
import { useDebouncedCallback } from '../utils/useDebouncedCallback';

function Seeker({ video }) {
  const [progress, setProgress] = useState(0);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);

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
          ml="2"
          value={progress}
          aria-label="slider-ex-1"
          focusThumbOnChange={false}
          onChangeEnd={debouncedHandleThumbSlide}
          onChange={progress => setProgress(progress)}
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

      <Popover>
        <PopoverTrigger>
          <IconButton
            mx={2}
            bg="white"
            boxShadow="none"
            icon={video && !video.muted ? <FaVolumeUp /> : <FaVolumeMute />}
          />
        </PopoverTrigger>

        <PopoverContent
          width="auto"
          borderRadius="8px"
          paddingBottom="12px"
          _focus={{
            border: 'none',
          }}
        >
          <Flex flexDirection="column" gridGap="8px">
            <IconButton
              bg="white"
              boxShadow="none"
              icon={video && !video.muted ? <FaVolumeUp /> : <FaVolumeMute />}
              onClick={() => {
                video.muted = !video.muted;
              }}
            />
            <Slider
              max={1}
              min={0}
              minH="32"
              step={0.01}
              value={volume}
              orientation="vertical"
              aria-label="slider-ex-3"
              onChange={vol => {
                setVolume(vol);
                video.volume = vol;
              }}
            >
              <SliderTrack>
                <SliderFilledTrack bg="teal.500" />
              </SliderTrack>
              <SliderThumb bg="teal.500" />
            </Slider>
          </Flex>
        </PopoverContent>
      </Popover>
    </Flex>
  );
}
export default Seeker;
