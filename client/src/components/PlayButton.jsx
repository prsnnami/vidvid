import { Box, Button } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { FaPause, FaPlay } from 'react-icons/fa';

const PlayButton = ({ vid, toggleVideo }) => {
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
      <Button
        colorScheme="teal"
        style={styles.playButton}
        onClick={() => toggleVideo()}
        isDisabled={!vid}
      >
        {!isPlaying ? (
          <FaPlay style={{ color: '#ffffff' }} />
        ) : (
          <FaPause style={{ color: '#ffffff' }} />
        )}
      </Button>
    </Box>
  );
};

const styles = {
  playButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 70,
    minHeight: 70,
    cursor: 'pointer',
    border: 'none',
    borderRadius: '50%',
    outline: 'none',
    marginTop: 30,
    marginBottom: 10,
  },
};

export default PlayButton;
