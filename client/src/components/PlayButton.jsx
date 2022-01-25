import { Box, Button, IconButton } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { FaPause, FaPlay } from 'react-icons/fa';

const PlayButton = ({ vid, toggleVideo, buffering }) => {
  const [isPlaying, setIsPlaying] = useState();

  useEffect(() => {
    function onPlay() {
      setIsPlaying(true);
    }

    function onPause() {
      setIsPlaying(false);
    }

    if (vid) {
      vid.addEventListener('pause', onPause);
      vid.addEventListener('play', onPlay);
    }

    return () => {
      if (vid) {
        vid.removeEventListener('pause', onPause);
        vid.removeEventListener('play', onPlay);
      }
    };
  }, [vid]);

  return (
    <Box d="flex" alignItems="center" justifyContent="center">
      <IconButton
        bg="white"
        mx={2}
        onClick={() => toggleVideo()}
        isDisabled={buffering || !vid}
        isLoading={buffering || !vid}
      >
        {!isPlaying ? <FaPlay /> : <FaPause />}
      </IconButton>
    </Box>
  );
};

const styles = {
  playButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',

    cursor: 'pointer',
    border: 'none',
    borderRadius: '50%',
    outline: 'none',
  },
};

export default PlayButton;
