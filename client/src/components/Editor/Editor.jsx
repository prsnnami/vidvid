import { Button } from '@chakra-ui/button';
import { useDisclosure } from '@chakra-ui/hooks';
import { Box, Flex, Heading, Stack } from '@chakra-ui/layout';
import React, { useEffect, useRef, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { useNavigate } from 'react-router';
import Transcript from '../../components/Editor/Transcript';
import Video from '../../components/Editor/Video';
import ExportModal from '../../components/ExportModal';
import { getSubtitle, loadTranscript } from '../../utils';
import { useDebouncedCallback } from '../../utils/useDebouncedCallback';
import SaveModal from '../SaveModal';

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

const initialData = {
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
};

export default function Editor({
  projectName,
  projectId,
  initialValue,
  sharePath,
  syncProjectMutation,
  saveProjectMutation,
}) {
  const [exportLoading, setExportLoading] = useState(false);

  const canvasRef = useRef();
  const videoRef = useRef();
  const transcriptContainerRef = useRef();

  const [videoMeta, setVideoMeta] = useState(initialValue || initialData);

  function updateMeta(key, change) {
    setVideoMeta(videoMeta => ({ ...videoMeta, [key]: change }));
  }

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

  // useHotkeys(
  //   'ctrl+s',
  //   () => {
  //     if (projectId) {
  //       let body = getBody();
  //       syncProjectMutation.mutate(body);
  //     }
  //   },
  //   {
  //     filterPreventDefault: false,
  //   }
  // );

  useEffect(() => {
    if (!projectId) {
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
    }
  }, [projectId, sharePath]);

  const handleSubtitleEdit = useDebouncedCallback(
    subtitle => updateMeta('subtitle', subtitle),
    400
  );

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

  function onSubmit(name, quality) {
    setExportLoading(true);

    let body = {
      name,
      quality,
      subtitle: videoMeta.subtitle,
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
      fontUppercase: videoMeta.fontUppercase,
    };

    fetch('/borderer/generate', {
      method: 'POST',
      body: JSON.stringify(body),
    }).then(res => {
      setExportLoading(false);
      navigate('/reels');
    });
  }

  function getBody() {
    return {
      subtitle: videoMeta.subtitle,
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
      fontUppercase: videoMeta.fontUppercase,
      activeFontFamily: videoMeta.activeFontFamily,
    };
  }

  function syncProject() {
    let body = getBody();
    syncProjectMutation.mutate(body);
  }

  function saveProject(projectName) {
    let body = getBody();
    saveProjectMutation.mutate({ projectName, body });
  }

  return (
    <>
      <Flex flexDirection="column" h="100%">
        <Flex
          h="60px"
          alignItems="center"
          flexShrink="0"
          px="4"
          justifyContent="space-between"
          bg="teal.500"
        >
          <Heading color="white">{projectId ? projectName : ''}</Heading>
          <Stack direction="row">
            {projectId ? (
              <Button
                onClick={syncProject}
                isLoading={syncProjectMutation.isLoading}
              >
                Save
              </Button>
            ) : (
              <Button onClick={saveModal.onOpen}>Add Project</Button>
            )}
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
      {!projectId && (
        <SaveModal
          isOpen={saveModal.isOpen}
          onClose={saveModal.onClose}
          onSubmit={saveProject}
          loading={saveProjectMutation.isLoading}
        />
      )}
    </>
  );
}
