import { Button } from '@chakra-ui/button';
import { FormControl, FormLabel } from '@chakra-ui/form-control';
import { useDisclosure } from '@chakra-ui/hooks';
import { Input } from '@chakra-ui/input';
import { Box, Flex, Heading, Stack } from '@chakra-ui/layout';
import {
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from '@chakra-ui/modal';
import { Select } from '@chakra-ui/select';
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import Video from '../components/Editor/Video';
import { getSubtitle, loadTranscript } from '../utils';
import { useDebouncedCallback } from '../utils/useDebouncedCallback';
import Transcript from '../components/Editor/Transcript';

const OpenSans = {
  variants: ['regular'],
  files: {
    regular:
      'http://fonts.gstatic.com/s/opensans/v20/mem8YaGs126MiZpBA-U1UpcaXcl0Aw.ttf',
  },
  category: 'sans-serif',
  kind: 'webfonts#webfont',
  family: 'Open Sans',
  id: 'open-sans',
};

export default function Editor() {
  const { sharePath } = useParams();
  const canvasRef = useRef();
  const videoRef = useRef();
  const transcriptContainerRef = useRef();

  const [transcript, setTranscript] = useState();
  const [subtitle, setSubtitle] = useState();
  const [manifestUrl, setManifestUrl] = useState();
  const [exportLoading, setExportLoading] = useState(false);

  const aspectRatio = useState('16:9');
  const color = useState('#000000');
  const textColor = useState('#ffffff');
  const fontSize = React.useState(22);
  const activeFontFamily = useState(OpenSans);
  const textPosition = useState(10);

  const handleSubtitleEdit = useDebouncedCallback(
    subtitle => setSubtitle(subtitle),
    400
  );

  const navigate = useNavigate();
  const exportModal = useDisclosure();

  useEffect(() => {
    let shareUrl = 'https://app.reduct.video/e/' + sharePath;

    if (shareUrl[shareUrl.length - 1] === '/') {
      shareUrl = shareUrl.slice(0, shareUrl.length - 1);
    }

    loadTranscript(shareUrl).then(transcript => {
      setTranscript(transcript);
      console.log(transcript);
      let subtitle = getSubtitle(transcript);
      setSubtitle(subtitle);
    });
  }, []);

  function onSubmit(name, quality) {
    setExportLoading(true);
    let body = {
      name,
      quality,
      subtitle: subtitle.map(i => ({
        start: i.start,
        end: i.end,
        text: i.text,
      })),
      url: 'https://app.reduct.video/e/' + sharePath,
      manifest_url: manifestUrl,
      a_r: aspectRatio[0],
      color: color[0],
      textColor: textColor[0],
      font:
        activeFontFamily[0].id === 'open-sans'
          ? OpenSans.files.regular
          : activeFontFamily[0].files.regular,
      fontFamily: activeFontFamily[0].family,
      fontSize: fontSize[0],
      textPosition: textPosition[0],
    };

    // console.log(body);
    // setExportLoading(false);
    // return;

    fetch('/borderer/generate', {
      method: 'POST',
      body: JSON.stringify(body),
    }).then(res => {
      setExportLoading(false);
      // navigate('/reels');
    });
  }

  return (
    <>
      <Flex flexDirection="column" h="100%">
        <Flex
          h="60px"
          alignItems="center"
          flexShrink="0"
          px="4"
          justifyContent="flex-end"
          bg="teal.500"
        >
          <Button onClick={exportModal.onOpen}>Export Video</Button>
        </Flex>
        <Flex flexGrow="1" overflow="hidden">
          <Box
            flex={1}
            overflowY="auto"
            ref={transcriptContainerRef}
            paddingRight="4px"
            css={{
              '&::-webkit-scrollbar': {
                width: 4,
                height: 4,
              },
              '::-webkit-scrollbar-thumb': {
                background: '#c4c4c4',
                borderRadius: 4,
              },
            }}
          >
            <Heading px={4}>Transcript</Heading>
            <Box p={4} flex={1}>
              {subtitle && (
                <Transcript
                  video={videoRef.current}
                  subtitle={subtitle}
                  onEdit={edit => {
                    handleSubtitleEdit(edit);
                  }}
                />
              )}
            </Box>
          </Box>
          <Flex
            id="video"
            flex="2"
            bg="gray.200"
            h="100%"
            overflowY="auto"
            css={{
              '&::-webkit-scrollbar': {
                width: 4,
                height: 4,
              },
              '::-webkit-scrollbar-thumb': {
                background: '#c4c4c4',
                borderRadius: 4,
              },
            }}
            // px="2"
          >
            <Video
              ref={canvasRef}
              videoRef={videoRef}
              sharePath={sharePath}
              subtitle={subtitle}
              color={color}
              textColor={textColor}
              aspectRatio={aspectRatio}
              setManifestUrl={setManifestUrl}
              fontSize={fontSize}
              activeFontFamily={activeFontFamily}
              textPosition={textPosition}
            />
          </Flex>
        </Flex>
      </Flex>
      <ExportModal
        isOpen={exportModal.isOpen}
        onClose={exportModal.onClose}
        onSubmit={onSubmit}
        loading={exportLoading}
        manifestUrl={manifestUrl}
      />
    </>
  );
}

function ExportModal({ isOpen, manifestUrl, onClose, onSubmit, loading }) {
  const nameRef = useRef();
  const selectRef = useRef();

  //TODO: Get video resolutions from manifest

  console.log(manifestUrl);

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit(nameRef.current.value, selectRef.current.value);
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <form onSubmit={handleSubmit}>
          <ModalHeader>Export</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Stack>
              <FormControl id="name" isRequired>
                <FormLabel>Enter File Name</FormLabel>
                <Input ref={nameRef} placeholder="Enter file name" />
              </FormControl>
              <FormControl id="quality" isRequired>
                <FormLabel>Select Video Quality</FormLabel>
                <Select ref={selectRef} placeholder="Select Video Quality">
                  <option value="240p">240p</option>
                  <option value="480p">480p</option>
                  <option value="1080p">1080p</option>
                </Select>
              </FormControl>
            </Stack>
          </ModalBody>

          <ModalFooter>
            <Button colorScheme="blue" mr={3} isLoading={loading} type="submit">
              Export
            </Button>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
