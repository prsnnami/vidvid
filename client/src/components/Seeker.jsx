import { Flex, IconButton, Slider, SliderFilledTrack, SliderThumb, SliderTrack, Text } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { FaVolumeMute, FaVolumeUp } from "react-icons/fa";
import { getTimeStamp } from "../utils";
import { useDebouncedCallback } from "../utils/useDebouncedCallback";

function Seeker ({ video }) {
  const [progress, setProgress] = useState(0);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    // Update the document title using the browser API
    if (video) {
      // setDuration(mediaRef.current.duration);
      video.addEventListener('timeupdate', handleTimeUpdated);
    }
    return function cleanup () {
      if (video) {
        // removeEventListener
        video.removeEventListener('timeupdate', handleTimeUpdated);
      }
    };
  }, [video]);

  function handleTimeUpdated (e) {
    let currentTime = e.target.currentTime;
    let duration = e.target.duration;
    setTime(currentTime);
    setDuration(duration);

    setProgress((currentTime / duration) * 100);
  }

  function handleThumbSlide (progress) {
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
export default Seeker;
