import { Button } from '@chakra-ui/button';
import { useDisclosure } from '@chakra-ui/hooks';
import { Box, Flex, Heading, Stack } from '@chakra-ui/layout';
import React, { useEffect, useRef, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { useMutation } from 'react-query';
import { useNavigate, useParams } from 'react-router';
import Transcript from '../components/Editor/Transcript';
import Video from '../components/Editor/Video';
import ExportModal from '../components/ExportModal';
import SaveModal from '../components/SaveModal';
import { getSubtitle, loadTranscript } from '../utils';
import { useDebouncedCallback } from '../utils/useDebouncedCallback';

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

  const [exportLoading, setExportLoading] = useState(false);
  const [videoMeta, setVideoMeta] = useState({
    transcript: null,
    subtitle: null,
    manifestUrl: null,
    aspectRatio: '16:9',
    color: '#000000',
    textColor: '#ffffff',
    fontSize: 75,
    activeFontFamily: OpenSans,
    textPosition: 10,
    outlineWidth: 2,
    outlineColor: '#000000',
    fontWeight: 400,
    italic: false,
    showTitle: false,
    titlePosition: 85,
    titleTextSize: 150,
    title: 'Transcript',
    fontUppercase: false,
  });

  function updateMeta(key, change) {
    setVideoMeta(videoMeta => ({ ...videoMeta, [key]: change }));
  }

  // const [transcript, setTranscript] = useState();
  // const [subtitle, setSubtitle] = useState();
  // const [manifestUrl, setManifestUrl] = useState();
  // const [exportLoading, setExportLoading] = useState(false);

  // const aspectRatio = useState('16:9');
  // const color = useState('#000000');
  // const textColor = useState('#ffffff');
  // const fontSize = React.useState(75);
  // const activeFontFamily = useState(OpenSans);
  // const textPosition = useState(10);
  // const outlineWidth = useState(2);
  // const outlineColor = useState('#000000');
  // const fontWeight = useState(400);
  // const italic = useState(false);
  // const showTitle = useState(false);
  // const titlePosition = useState(85);
  // const titleTextSize = useState(150);
  // const [title, setTitle] = useState('Transcript');
  // const fontUppercase = useState(false);

  const handleSubtitleEdit = useDebouncedCallback(
    subtitle => updateMeta('subtitle', subtitle),
    400
  );

  const navigate = useNavigate();
  const exportModal = useDisclosure();
  const saveModal = useDisclosure();

  useHotkeys('ctrl+space', () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  });

  useEffect(() => {
    let shareUrl = 'https://app.reduct.video/e/' + sharePath;

    if (shareUrl[shareUrl.length - 1] === '/') {
      shareUrl = shareUrl.slice(0, shareUrl.length - 1);
    }

    loadTranscript(shareUrl).then(transcript => {
      updateMeta('transcript', transcript);
      console.log(transcript);
      let subtitle = getSubtitle(transcript);
      updateMeta('subtitle', subtitle);
    });
  }, []);

  function padStart(num) {
    return String(Math.floor(num)).padStart(2, '0');
  }

  function getSRTTimestamp(time) {
    let hour = time / 3600;
    time %= 3600;
    let minutes = time / 60;
    time %= 60;
    let seconds = Math.floor(time);
    let milliseconds = (time % 1) * 100;
    return `${padStart(hour)}:${padStart(minutes)}:${padStart(
      seconds
    )},${padStart(milliseconds)}`;
  }

  function getSRT() {
    let srtText = videoMeta.subtitle.reduce((acc, curr, index) => {
      acc += `${index + 1}\n${getSRTTimestamp(
        curr.start
      )} --> ${getSRTTimestamp(curr.end)}\n${curr.text}\n\n`;
      return acc;
    }, '');

    let element = document.createElement('a');
    element.setAttribute(
      'href',
      'data:text/plain;charset=utf-8,' + encodeURIComponent(srtText)
    );
    element.setAttribute('download', videoMeta.title + '.srt');

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
  }

  function getFontLink() {
    if (videoMeta.activeFontFamily.id === 'open-sans') {
      return OpenSans.files.regular;
    } else {
      if (
        videoMeta.activeFontFamily.files[
          videoMeta.fontWeight + (videoMeta.italic ? 'italic' : '')
        ]
      ) {
        return videoMeta.activeFontFamily.files[
          videoMeta.fontWeight + (videoMeta.italic ? 'italic' : '')
        ];
      } else {
        return videoMeta.activeFontFamily.files.regular;
      }
    }
  }

  function getFontFamily() {
    let fontFamily =
      videoMeta.activeFontFamily.family + ' ' + videoMeta.fontWeight;
    if (videoMeta.italic) fontFamily = fontFamily + ' italic';
    return fontFamily;
  }

  const saveProjectMutation = useMutation(async function (project_name) {
    let body = {
      subtitle: videoMeta.subtitle.map(i => ({
        ...i,
        start: i.start,
        end: i.end,
        text: videoMeta.fontUppercase ? i.text.toUpperCase() : i.text,
      })),
      url: 'https://app.reduct.video/e/' + sharePath,
      manifest_url: videoMeta.manifestUrl,
      a_r: videoMeta.aspectRatio,
      color: videoMeta.color,
      textColor: videoMeta.textColor,
      font: getFontLink(),
      fontFamily: getFontFamily(),
      fontSize: videoMeta.fontSize,
      textPosition: videoMeta.textPosition,
      outlineWidth: videoMeta.outlineWidth,
      outlineColor: videoMeta.outlineColor,
      showTitle: videoMeta.showTitle,
      titlePosition: videoMeta.titlePosition,
      titleTextSize: videoMeta.titleTextSize,
      title: videoMeta.title,
    };

    console.log('here');

    await fetch('/borderer/projects/', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ project_name, layers: body }),
    })
      .then(res => res.json())
      .then(res => navigate('/project/' + res.id));
  });

  function onSubmit(name, quality) {
    setExportLoading(true);

    let body = {
      name,
      quality,
      subtitle: videoMeta.subtitle.map(i => ({
        ...i,
        start: i.start,
        end: i.end,
        text: videoMeta.fontUppercase ? i.text.toUpperCase() : i.text,
      })),
      url: 'https://app.reduct.video/e/' + sharePath,
      manifest_url: videoMeta.manifestUrl,
      a_r: videoMeta.aspectRatio,
      color: videoMeta.color,
      textColor: videoMeta.textColor,
      font: getFontLink(),
      fontFamily: getFontFamily(),
      fontSize: videoMeta.fontSize,
      textPosition: videoMeta.textPosition,
      outlineWidth: videoMeta.outlineWidth,
      outlineColor: videoMeta.outlineColor,
      showTitle: videoMeta.showTitle,
      titlePosition: videoMeta.titlePosition,
      titleTextSize: videoMeta.titleTextSize,
      title: videoMeta.title,
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
          <Stack direction="row">
            <Button onClick={saveModal.onOpen}>Save Project</Button>
            <Button onClick={getSRT}>Download SRT</Button>
            <Button onClick={exportModal.onOpen}>Export Video</Button>
          </Stack>
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
            <Heading px={4} className="apply-font">
              <span
                contentEditable
                suppressContentEditableWarning
                onInput={e => updateMeta('title', e.target.innerText)}
              >
                Transcript
              </span>
            </Heading>
            <Box p={4} flex={1}>
              {videoMeta.subtitle && (
                <Transcript
                  video={videoRef.current}
                  subtitle={videoMeta.subtitle}
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
              // subtitle={subtitle}
              // color={color}
              // textColor={textColor}
              // aspectRatio={aspectRatio}
              // setManifestUrl={setManifestUrl}
              // fontSize={fontSize}
              // activeFontFamily={activeFontFamily}
              // textPosition={textPosition}
              // outlineWidth={outlineWidth}
              // outlineColor={outlineColor}
              // fontWeight={fontWeight}
              // italic={italic}
              // showTitle={showTitle}
              // titlePosition={titlePosition}
              // titleTextSize={titleTextSize}
              // title={title}
              // fontUppercase={fontUppercase}
              videoMeta={videoMeta}
              updateMeta={updateMeta}
            />
          </Flex>
        </Flex>
      </Flex>
      <ExportModal
        isOpen={exportModal.isOpen}
        onClose={exportModal.onClose}
        onSubmit={onSubmit}
        loading={exportLoading}
        manifestUrl={videoMeta.manifestUrl}
      />
      <SaveModal
        isOpen={saveModal.isOpen}
        onClose={saveModal.onClose}
        onSubmit={saveProjectMutation.mutate}
        loading={saveProjectMutation.isLoading}
      />
    </>
  );
}
