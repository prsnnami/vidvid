import { Button } from '@chakra-ui/button';
import { Box, Flex, Heading } from '@chakra-ui/layout';
import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router';
import Transctipt from '../components/Editor/Transcript';
import Video from '../components/Editor/Video';
import Canvas from '../components/VideoCanvas';

function getSubtitle(transcript) {
  let lines = [];
  transcript.segments.forEach(segment => {
    let segmentChunks = segment.wdlist.reduce((prev, curr, i) => {
      const chunkIndex = Math.floor(i / 8);
      if (!prev[chunkIndex]) {
        prev[chunkIndex] = []; // start a new chunk
      }

      prev[chunkIndex].push(curr);
      return prev;
    }, []);

    segmentChunks = segmentChunks.map(chunk => {
      return {
        start: chunk[0].start,
        end: chunk[chunk.length - 1].end,
        words: chunk,
        line: chunk.map(line => line.word).join(''),
      };
    });
    lines.push(...segmentChunks);
  });

  return lines;
}

async function loadTranscript(shareUrl) {
  const transRet = await fetch(`/proxy/${shareUrl}/transcript.json`);
  return await transRet.json();
}

export default function Test() {
  const { sharePath } = useParams();
  const canvasRef = useRef();
  const videoRef = useRef();
  const transcriptContainerRef = useRef();

  const [transcript, setTranscript] = useState();
  const [subtitle, setSubtitle] = useState();

  useEffect(() => {
    let shareUrl = 'https://app.reduct.video/e/' + sharePath;

    if (shareUrl[shareUrl.length - 1] === '/') {
      shareUrl = shareUrl.slice(0, shareUrl.length - 1);
    }

    loadTranscript(shareUrl).then(transcript => {
      setTranscript(transcript);
      let subtitle = getSubtitle(transcript);
      setSubtitle(subtitle);
    });
  }, []);

  return (
    <Flex flexDirection="column" h="100%">
      <Flex
        h="60px"
        alignItems="center"
        flexShrink="0"
        px="4"
        justifyContent="flex-end"
        bg="teal.500"
      >
        <Button>Export Video</Button>
      </Flex>
      <Flex flexGrow="1" overflow="hidden">
        <Box flex="1" overflowY="auto" ref={transcriptContainerRef}>
          <Heading px={4}>Transcript</Heading>
          <Box p={4} flex={1}>
            <Transctipt
              tx={transcript}
              subtitle={subtitle}
              transcriptContainerRef={transcriptContainerRef}
              video={videoRef.current}
              onEdit={edit => {
                setSubtitle(edit);
              }}
            />
          </Box>
        </Box>
        <Box id="video" flex="1" bg="gray.200" h="100%" overflowY="auto">
          <Video
            ref={canvasRef}
            videoRef={videoRef}
            sharePath={sharePath}
            subtitle={subtitle}
          />
        </Box>
      </Flex>
    </Flex>
  );
}
