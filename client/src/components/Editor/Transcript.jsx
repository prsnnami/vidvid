import { Box, Heading, Text } from '@chakra-ui/layout';
import React, { useEffect, useRef, useState } from 'react';

function scrollToContent(element, container, offsetValue = 0) {
  // container.scrollTop = element.offsetTop - offsetValue;
  if (element.offsetTop > container.scrollTop) {
    const offsetBottom = element.offsetTop + element.offsetHeight;
    const scrollBottom = container.scrollTop + container.offsetHeight / 2;
    if (offsetBottom > scrollBottom) {
      container.scrollTop = offsetBottom - container.offsetHeight + offsetValue;
    }
  }
}

export default function Transctipt({
  tx: transcript,
  subtitle,
  video,
  onEdit,
}) {
  // const [transcript, setTranscript] = useState(tx);
  const transcribeContainerRef = useRef();
  function onTimeUpdate() {
    const t = video.currentTime;

    let found = false;
    transcript.segments.forEach(seg => {
      seg.wdlist.forEach(({ wordRef }) => {
        if (wordRef) wordRef.style.background = 'transparent';
      });

      if (seg.end < t) {
        return;
      }
      if (found) {
        return;
      }

      seg.wdlist.forEach(({ wordRef, end }) => {
        if (found) {
          return;
        }
        if (!wordRef) {
          return;
        }

        if (end - 0.1 > t) {
          wordRef.style.backgroundColor = 'rgba(251, 232, 177, 0.8)';
          wordRef.style.borderRadius = '5px';
          wordRef.style.transitionProperty = 'left, top, width, height';
          wordRef.style.transitionDuration = '0.1s';

          scrollToContent(wordRef, transcribeContainerRef?.current, 24);

          found = true;
        }
      });
    });
  }

  useEffect(() => {
    if (transcript && video) {
      video.addEventListener('timeupdate', onTimeUpdate, false);
      return () => {
        video.removeEventListener('timeupdate', onTimeUpdate, false);
      };
    }
  }, [transcript, video]);

  function onWordChange(sIdx, wIdx, value) {
    // let newTranscript = { ...transcript };
    // newTranscript.segments[sIdx].wdlist[wIdx].word = value;
    // setTranscript(newTranscript);
    console.log('on word change', value);
  }

  console.log({ transcript, subtitle });

  if (!transcript || !subtitle) return null;
  return (
    <Box>
      {transcript.segments.map((segment, segmentIdx) => (
        <Box key={segmentIdx} ref={transcribeContainerRef} py={2}>
          <Heading size="md">{segment.speaker_name}</Heading>
          {/* <Box>
            {segment.wdlist.map((word, wordIdx) => (
              <span
                key={wordIdx}
                onInput={e =>
                  onWordChange(segmentIdx, wordIdx, e.target.innerText)
                }
                ref={wordRef => {
                  word.wordRef = wordRef;
                }}
              >
                {word.word}
              </span>
            ))}
          </Box> */}

          <Box
          // contentEditable
          // suppressContentEditableWarning
          // onInput={e => console.log('onInput', e)}
          >
            {subtitle[segmentIdx].map((chunk, chunkIdx) => (
              <Text
                as="span"
                key={chunkIdx}
                contentEditable
                suppressContentEditableWarning
                onInput={e => onEdit(e.target.innerText, segmentIdx, chunkIdx)}
              >
                {chunk.words.map((word, wordIdx) => (
                  <span
                    key={wordIdx}
                    onBlur={e => console.log('changed')}
                    onClick={e => video.pause()}
                    // onInput={e =>
                    //   onWordChange(segmentIdx, wordIdx, e.target.innerText)
                    // }
                    ref={wordRef => {
                      word.wordRef = wordRef;
                    }}
                  >
                    {word.word}
                  </span>
                ))}
              </Text>
            ))}
          </Box>
        </Box>
      ))}
    </Box>
  );
}
