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
import Transctipt from '../components/Editor/Transcript';
import Video from '../components/Editor/Video';
import { getSubtitle, loadTranscript } from '../utils';
import Test from './Test';

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

  const navigate = useNavigate();
  const exportModal = useDisclosure();

  useEffect(() => {
    let shareUrl = 'https://app.reduct.video/e/' + sharePath;

    if (shareUrl[shareUrl.length - 1] === '/') {
      shareUrl = shareUrl.slice(0, shareUrl.length - 1);
    }

    loadTranscript(shareUrl).then(transcript => {
      setTranscript(transcript);
      let subtitle = getSubtitle(transcript);
      setSubtitle(subtitle);
      console.log(subtitle);
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
        line: i.line,
      })),
      url: 'https://app.reduct.video/e/' + sharePath,
      manifest_url: manifestUrl,
      a_r: aspectRatio[0],
      color: color[0],
    };
    fetch('/borderer/generate', {
      method: 'POST',
      body: JSON.stringify(body),
    }).then(res => {
      setExportLoading(false);
      navigate('/reels');
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
          <Box flex="1" overflowY="auto" ref={transcriptContainerRef}>
            <Heading px={4}>Transcript</Heading>
            <Box p={4} flex={1}>
              {/* <Transctipt
                tx={transcript}
                subtitle={subtitle}
                transcriptContainerRef={transcriptContainerRef}
                video={videoRef.current}
                onEdit={edit => {
                  setSubtitle(edit);
                }}
              /> */}
              {subtitle && (
                <Test
                  video={videoRef.current}
                  subtitle={subtitle}
                  onEdit={edit => {
                    setSubtitle(edit);
                  }}
                />
              )}
            </Box>
          </Box>
          <Box id="video" flex="1" bg="gray.200" h="100%" overflowY="auto">
            <Video
              ref={canvasRef}
              videoRef={videoRef}
              sharePath={sharePath}
              subtitle={subtitle}
              color={color}
              aspectRatio={aspectRatio}
              setManifestUrl={setManifestUrl}
            />
          </Box>
        </Flex>
      </Flex>
      <ExportModal
        isOpen={exportModal.isOpen}
        onClose={exportModal.onClose}
        onSubmit={onSubmit}
        loading={exportLoading}
      />
    </>
  );
}

function ExportModal({ isOpen, onClose, onSubmit, loading }) {
  const nameRef = useRef();
  const selectRef = useRef();

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
