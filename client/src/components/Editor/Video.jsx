import { Button } from '@chakra-ui/button';
import { Input } from '@chakra-ui/input';
import { Box, Flex, Stack } from '@chakra-ui/layout';
import { Select } from '@chakra-ui/select';
import { Spinner } from '@chakra-ui/spinner';
import React, { useEffect, useState } from 'react';
import { drawScaledImage, getWrapLines } from '../../utils';
import Canvas from '../VideoCanvas';

async function loadManifest(shareUrl) {
  const manifestRet = await fetch(`/proxy/${shareUrl}/manifest-path.json`);
  const manifest = await manifestRet.json();
  return manifest;
}

const Video = React.forwardRef(
  ({ videoRef, sharePath, subtitle }, canvasRef) => {
    const [canvasSize, setCanvasSize] = useState({ height: 360, width: 640 });
    const [videoSize, setVideoSize] = useState({ height: 360, width: 480 });
    const [aspectRatio, setAspectRatio] = useState('16:9');
    const [videoLoading, setVideoLoading] = useState(true);
    const [isPlaying, setIsPlaying] = useState(false);
    const [poster, setPoster] = useState(null);
    const [manifestUrl, setManifestUrl] = useState();
    const [buffering, setBuffering] = useState();

    const [color, setColor] = useState('#000000');

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
      // vid.oncanplay = function (e) {
      //   console.log('can play', this);
      // };

      vid.onloadeddata = function (e) {
        setVideoSize({ height: this.videoHeight, width: this.videoWidth });
        setVideoLoading(false);
      };

      vid.onwaiting = () => setBuffering(true);
      vid.onseeking = () => setBuffering(true);
      vid.oncanplay = () => setBuffering(false);

      vid.addEventListener('play', () => setIsPlaying(true));
      vid.addEventListener('pause', () => setIsPlaying(false));
    }

    useEffect(() => {
      let vid = document.createElement('video');
      videoRef.current = vid;
      init(vid);
      return () => {
        if (vid) {
          vid.remove();
        }
        if (videoRef.current) {
          videoRef.current = null;
        }
      };
    }, [sharePath]);

    function predraw(ctx) {
      console.log('predraw');
    }

    function draw(ctx) {
      if (videoRef.current && !videoLoading) {
        drawScaledImage(ctx, videoRef.current, canvasSize, videoSize);
        ctx.font = '22px Arial';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.lineWidth = 4;
        ctx.miterLimit = 2;

        subtitle.forEach(s => {
          if (
            s.start < videoRef.current.currentTime &&
            s.end > videoRef.current.currentTime
          ) {
            let lines = getWrapLines(ctx, s.line, canvasSize.width * 0.8);
            lines.reverse().forEach((line, i) => {
              ctx.strokeText(
                line,
                canvasSize.width / 2,
                canvasSize.height - canvasSize.height * 0.1 - i * 24
              );
              ctx.fillText(
                line,
                canvasSize.width / 2,
                canvasSize.height - canvasSize.height * 0.1 - i * 24
              );
            });
          }
        });
      }
    }

    function handleDimensionsChange(e) {
      const aspectRatio = e.target.value;
      setAspectRatio(aspectRatio);
      let height, width;

      switch (aspectRatio) {
        case '1:1':
          width = 360;
          height = 360;
          break;
        case '16:9':
          width = 640;
          height = 360;
          break;
        case '9:16':
          width = 360;
          height = 640;
          break;
        case '4:5':
          width = 360;
          height = 450;
          break;
        default:
          height = canvasSize.height;
          width = canvasSize.width;
      }

      setCanvasSize({ height, width });
    }

    return (
      <Box>
        <Stack direction="row" px="6" py="4">
          <Button
            bg="white"
            onClick={() => {
              if (!videoRef.current) return;
              if (videoRef.current.paused) {
                videoRef.current.play();
              } else {
                videoRef.current.pause();
              }
            }}
          >
            {!isPlaying ? 'Play' : 'Pause'}
          </Button>
          <Select
            background="white"
            onChange={handleDimensionsChange}
            value={aspectRatio}
          >
            <option>1:1</option>
            <option>16:9</option>
            <option>9:16</option>
            <option>4:5</option>
          </Select>
          <Input
            background="white"
            type="color"
            value={color}
            onChange={e => setColor(e.target.value)}
          />
        </Stack>
        <Flex justifyContent="center" alignItems="center">
          <Box position="relative">
            <Flex
              justifyContent="center"
              alignItems="center"
              position="absolute"
              h="100%"
              w="100%"
              bg="rgba(0,0,0,0.2)"
              hidden={!buffering}
            >
              <Spinner color="teal" size="xl" thickness="8px" />
            </Flex>
            <Canvas
              __predraw={predraw}
              ref={canvasRef}
              draw={draw}
              height={canvasSize.height}
              width={canvasSize.width}
              color={color}
            />
          </Box>
        </Flex>
      </Box>
    );
  }
);

export default Video;
