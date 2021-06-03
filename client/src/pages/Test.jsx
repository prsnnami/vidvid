// @refresh reset
import { Button } from '@chakra-ui/button';
import { Flex } from '@chakra-ui/layout';
import { Box, Text as ChakraText } from '@chakra-ui/layout';
import { Spinner } from '@chakra-ui/spinner';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createEditor, Editor, Node, Text, Transforms } from 'slate';

import { Slate, Editable, withReact } from 'slate-react';
// import subtitle from '../subtitle.json';
import {
  getTimeStamp,
  getSelectionNodes,
  handleSplitLine,
  handleMergeLine,
  handleUpDownTraversal,
} from '../utils';

function isSameBlock(anchorPath, focusPath) {
  return anchorPath[0] === focusPath[0];
}

export default function Test({ subtitle, onEdit, video }) {
  const editor = useMemo(() => withReact(createEditor()), []);
  const refs = useRef({});

  const [currentTime, setCurrentTime] = useState(0);
  const [value, setValue] = useState(
    subtitle.map(i => ({
      type: 'paragraph',
      line: i,
      inline: true,
      // children: [{ text: i.line, words: i.words }],
      children: i.words.map(word => ({
        type: 'span',
        word: word,
        children: [{ text: word.text }],
      })),
    }))
  );

  useEffect(() => {
    window.editor = editor;
  }, []);

  function handleTimeUpdated(e) {
    // setCurrentTime(e.target.currentTime);
    Object.values(refs.current).forEach(word => {
      if (word.ref.current) {
        word.ref.current.style.color = 'inherit';
        word.ref.current.style['-webkit-text-stroke-width'] = 'inherit';

        if (
          word.end > e.target.currentTime &&
          word.start < e.target.currentTime
        ) {
          word.ref.current.style.color = 'blue';
          word.ref.current.style['-webkit-text-stroke-width'] = 'thin';
        }
      }
    });
  }

  useEffect(() => {
    // Update the document title using the browser API
    if (video) {
      // setDuration(mediaRef.current.duration);
      video.addEventListener('timeupdate', handleTimeUpdated);
    }
    return function cleanup() {
      // removeEventListener
      video.removeEventListener('timeupdate', handleTimeUpdated);
    };
  }, [video]);

  function serialize() {
    return value.map(n => ({
      start: n.line.start,
      end: n.line.end,
      text: Node.string(n),
      words: n.line.words,
    }));
  }

  // Define a rendering function based on the element passed to `props`. We use
  // `useCallback` here to memoize the function for subsequent renders.
  const renderElement = useCallback(props => {
    switch (props.element.type) {
      case 'code':
        return <CodeElement {...props} />;
      case 'quote':
        return <blockquote {...props.attributes}>{props.children}</blockquote>;
      case 'span':
        return <Span {...props} />;
      case 'paragraph':
        return <Paragraph {...props} />;
      default:
        return <DefaultElement {...props} />;
    }
  }, []);

  const renderLeaf = useCallback(props => {
    // console.log(children);
    return (
      <span {...props.attributes} className="test">
        {props.children}
      </span>
    );
  }, []);

  function Paragraph(props) {
    return (
      <Box
        _before={{
          content: `"${getTimeStamp(props.element.line.start)}"`,
          paddingX: 4,
        }}
        display="flex"
        {...props.attributes}
      >
        <Flex flexWrap="wrap">{props.children}</Flex>
        {/* {props.words.map(word => (
        <span key={word.start}>{word.word}</span>
      ))} */}
      </Box>
    );
  }

  function Span(props) {
    let word = props.element.word;
    useEffect(() => {
      refs.current[props.children[0].key] = {
        ref: props.attributes.ref,
        ...word,
      };
    }, []);

    return (
      <div
        onClick={() => (video.currentTime = word.start)}
        {...props.attributes}
      >
        {props.children}
      </div>
    );
  }

  // const renderLeaf = useCallback(({ attributes, children, leaf }) => {
  //   return (
  //     <span
  //       onDoubleClick={handleTimedTextClick}
  //       className={'timecode text'}
  //       data-start={children.props.parent.start}
  //       data-previous-timings={children.props.parent.previousTimings}
  //       // title={'double click on a word to jump to the corresponding point in the media'}
  //       {...attributes}
  //     >
  //       {children}
  //     </span>
  //   );
  // }, []);

  return (
    <Box>
      <Button onClick={() => console.log(refs)}>Log</Button>
      <Slate
        editor={editor}
        value={value}
        onChange={newValue => {
          setValue(newValue);
          onEdit(serialize(newValue));
        }}
      >
        <Editable
          renderElement={renderElement}
          renderLeaf={renderLeaf}
          onKeyDown={event => {
            if (event.key === 'Enter') {
              event.preventDefault();
              handleSplitLine(editor);
            }
            if (event.key === 'Backspace') {
              handleMergeLine(editor, event);
            }
            if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
              event.preventDefault();
              handleUpDownTraversal(editor, event.key);
            }

            //TODO: Manage inline nodes arrow traversal
            // if (isSameBlock(anchorPath, focusPath)) {
            //   if (event.key === 'ArrowRight') {
            //     if (
            //       editor.children[editor.selection.anchor.path[0]].children[
            //         editor.selection.anchor.path[1]
            //       ].word.word.length === editor.selection.anchor.offset
            //     ) {
            //       Transforms.move(editor, { distance: 1, unit: 'character' });
            //     }
            //   }
            //   if (event.key === 'ArrowLeft') {
            //     if (editor.selection.anchor.offset === 0) {
            //       console.log('gere');
            //       Transforms.move(editor, {
            //         distance: 1,
            //         unit: 'character',
            //         reverse: true,
            //       });
            //     }
            //   }
            // }

            if (!event.ctrlKey) {
              return;
            }

            // Replace the `onKeyDown` logic with our new commands.
            switch (event.key) {
              case '`': {
                event.preventDefault();
                CustomEditor.toggleCodeBlock(editor);
                break;
              }

              case 'b': {
                event.preventDefault();
                CustomEditor.toggleBoldMark(editor);
                break;
              }

              default:
                break;
            }
          }}
        />
      </Slate>
    </Box>
  );
}

// Define a React component renderer for our code blocks.
const CodeElement = props => {
  return (
    <pre {...props.attributes}>
      <code>{props.children}</code>
    </pre>
  );
};

const DefaultElement = props => {
  return <p {...props.attributes}>{props.children}</p>;
};

const Leaf = props => {
  return (
    <span
      {...props.attributes}
      style={{ fontWeight: props.leaf.bold ? 'bold' : 'normal' }}
    >
      {props.children}
    </span>
  );
};

const CustomEditor = {
  isBoldMarkActive(editor) {
    const [match] = Editor.nodes(editor, {
      match: n => n.bold === true,
      universal: true,
    });

    return !!match;
  },

  isCodeBlockActive(editor) {
    const [match] = Editor.nodes(editor, {
      match: n => n.type === 'code',
    });

    return !!match;
  },

  toggleBoldMark(editor) {
    const isActive = CustomEditor.isBoldMarkActive(editor);
    Transforms.setNodes(
      editor,
      { bold: isActive ? null : true },
      { match: n => Text.isText(n), split: true }
    );
  },

  toggleCodeBlock(editor) {
    const isActive = CustomEditor.isCodeBlockActive(editor);
    Transforms.setNodes(
      editor,
      { type: isActive ? null : 'code' },
      { match: n => Editor.isBlock(editor, n) }
    );
  },
};
