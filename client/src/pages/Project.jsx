import { Button } from '@chakra-ui/button';
import { useDisclosure } from '@chakra-ui/hooks';
import { Box, Flex, Heading, Stack } from '@chakra-ui/layout';
import React, { useEffect, useRef, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { useMutation, useQuery } from 'react-query';
import { useNavigate, useParams } from 'react-router';
import Transcript from '../components/Editor/Transcript';
import Video from '../components/Editor/Video';
import ExportModal from '../components/ExportModal';
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

export default function Project() {
  const { id } = useParams();
  const [sharePath, setSharePath] = useState(null);
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

  const syncProjectMutation = useMutation(async function () {
    let body = {
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

    return await fetch('/borderer/projects/' + id + '/', {
      method: 'PATCH',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ layers: body }),
    });
  });

  function updateMeta(key, change) {
    setVideoMeta(videoMeta => ({ ...videoMeta, [key]: change }));
  }

  const projectQuery = useQuery(
    'projects',
    async () => {
      return await fetch('/borderer/projects/' + id)
        .then(res => {
          if (!res.ok) {
            throw new Error('Not 2xx response');
          } else {
            return res.json();
          }
        })
        .catch(e => {
          console.log('here, error');
          throw e;
        });
    },
    {
      retry: false,
      onSuccess: data => {
        console.log(data);
        setSharePath(data.layers.url.split('https://app.reduct.video/e/')[1]);
        setVideoMeta({
          ...videoMeta,
          aspectRatio: data.layers.a_r,
          color: data.layers.color,
          // font: 'http://fonts.gstatic.com/s/opensans/v20/mem8YaGs126MiZpBA-U1UpcaXcl0Aw.ttf',
          // fontFamily: 'Open Sans 400',
          fontSize: data.layers.fontSize,
          manifestUrl: data.layers.manifest_url,
          outlineColor: data.layers.outlineColor,
          outlineWidth: data.layers.outlineWidth,
          showTitle: data.layers.showTitle,
          subtitle: data.layers.subtitle,
          textColor: data.layers.textColor,
          textPosition: data.layers.textPosition,
          title: data.layers.title,
          titlePosition: data.layers.titlePosition,
          titleTextSize: data.layers.titleTextSize,
          fontUppercase: data.layers.fontUppercase,
        });
      },
    }
  );

  const canvasRef = useRef();
  const videoRef = useRef();
  const transcriptContainerRef = useRef();

  const handleSubtitleEdit = useDebouncedCallback(
    subtitle => updateMeta('subtitle', subtitle),
    400
  );

  const navigate = useNavigate();
  const exportModal = useDisclosure();

  useHotkeys('ctrl+space', () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  });

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

    // console.log(body);
    // setExportLoading(false);
    // return;

    fetch('/borderer/generate', {
      method: 'POST',
      body: JSON.stringify(body),
    }).then(res => {
      setExportLoading(false);
      navigate('/reels');
    });
  }

  if (projectQuery.isLoading) return 'Loading';

  if (!projectQuery.isSuccess) return 'Project not found';

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
          <Heading color="white">{projectQuery.data.project_name}</Heading>
          <Stack direction="row">
            <Button onClick={syncProjectMutation.mutate}>Sync Project</Button>
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
    </>
  );
}

function Editor({
  projectName,
  projectId,
  initialValue,
  sharePath,
  syncProject,
  saveProject,
}) {
  const [exportLoading, setExportLoading] = useState(false);

  const canvasRef = useRef();
  const videoRef = useRef();
  const transcriptContainerRef = useRef();

  const [videoMeta, setVideoMeta] = useState(initialValue);

  function updateMeta(key, change) {
    setVideoMeta(videoMeta => ({ ...videoMeta, [key]: change }));
  }

  const navigate = useNavigate();
  const exportModal = useDisclosure();

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

    // console.log(body);
    // setExportLoading(false);
    // return;

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
          justifyContent="space-between"
          bg="teal.500"
        >
          {projectId && <Heading color="white">{projectName}</Heading>}
          <Stack direction="row">
            {projectId ? (
              <Button onClick={syncProject}>Sync Project</Button>
            ) : (
              <Button onClick={saveProject}>Save Project</Button>
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
    </>
  );
}
