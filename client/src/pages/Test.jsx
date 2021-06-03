// @refresh reset
import { Button } from '@chakra-ui/button';
import { Box, Text as ChakraText } from '@chakra-ui/layout';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createEditor, Editor, Text, Transforms } from 'slate';

import { Slate, Editable, withReact } from 'slate-react';
import subtitle from '../subtitle.json';
import {
  getTimeStamp,
  getSelectionNodes,
  handleSplitLine,
  handleMergeLine,
} from '../utils';

function Span(props) {
  return <div {...props.attributes}>{props.children}</div>;
}

function isSameBlock(anchorPath, focusPath) {
  return anchorPath[0] === focusPath[0];
}

export default function Test() {
  const editor = useMemo(() => withReact(createEditor()), []);
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
      <span
        {...props.attributes}
        className="test"
        style={{
          fontWeight: props.leaf.bold ? 'bold' : 'normal',
          fontStyle: props.leaf.italic ? 'italic' : 'normal',
        }}
      >
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
        {props.children}
        {/* {props.words.map(word => (
        <span key={word.start}>{word.word}</span>
      ))} */}
      </Box>
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
    <Box border="2px solid black" m="4">
      <Slate
        editor={editor}
        value={value}
        onChange={newValue => setValue(newValue)}
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
              console.log('Backspave');
              handleMergeLine(editor, event);
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
