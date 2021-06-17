import { findByLabelText } from '@testing-library/dom';
import { Editor, Node, Transforms } from 'slate';

export function drawScaledImage(ctx, image, cs, is) {
  ctx.clearRect(0, 0, cs.width, cs.height);
  let scale = Math.min(cs.width / is.width, cs.height / is.height);

  const ar = (is.width * scale) / (is.height * scale);
  let top = (cs.height - is.height * scale) / 2;
  let left = (cs.width - is.width * scale) / 2;
  ctx.drawImage(image, left, top, is.width * scale, is.height * scale);
}

export function getWrapLines(ctx, text, maxWidth) {
  var words = text.trim().split(' ');
  var lines = [];
  var currentLine = words[0];

  for (var i = 1; i < words.length; i++) {
    var word = words[i];
    var width = ctx.measureText(currentLine + ' ' + word).width;
    if (width < maxWidth) {
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  lines.push(currentLine);
  return lines;
}

export function debounce(func, wait) {
  let timeout;
  return function () {
    const context = this;
    const args = arguments;
    const later = function () {
      timeout = null;
      func.apply(context, args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export function getSubtitle(transcript) {
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
        words: chunk.map(word => ({ ...word, text: word.word })),
        text: chunk.map(line => line.word).join(''),
      };
    });
    lines.push(...segmentChunks);
  });

  return lines;
}

export async function loadTranscript(shareUrl) {
  const transRet = await fetch(`/proxy/${shareUrl}/transcript.json`);
  return await transRet.json();
}

export function getTimeStamp(start) {
  const startValue = Math.floor(start);
  let minute = Math.floor(startValue / 60);
  let seconds = startValue % 60;
  return `${('00' + minute).substr(-2)}:${('00' + seconds).substr(-2)}`;
}

export const getSelectionNodes = (editor, selection) => {
  try {
    const orderedSelection = [selection.anchor, selection.focus].sort(
      (a, b) => {
        return a.path[0] - b.path[0];
      }
    );
    const selectionStart = orderedSelection[0];
    const selectionEnd = orderedSelection[1];
    let counterAnchor = 0;
    let goalAnchor = selectionStart.offset;
    let targetWordIndexAnchor = null;
    let selectedLeafWordsAnchor =
      editor.children[selectionStart.path[0]].line.words;

    // let pathValue = selectionStart.path;
    // let selectedLeafWordsAnchor2 = editor.children[selectionStart.path].children[0].words;

    selectedLeafWordsAnchor.forEach((word, wordIndex) => {
      const wordLength = word.word.length;

      counterAnchor = counterAnchor + wordLength;
      if (counterAnchor <= goalAnchor) {
        targetWordIndexAnchor = wordIndex;
      }
    });

    const startWord =
      targetWordIndexAnchor === null
        ? selectedLeafWordsAnchor[0]
        : selectedLeafWordsAnchor[targetWordIndexAnchor + 1];

    let counter = 0;
    let goal = selectionEnd.offset;
    let targetWordIndex = null;
    let selectedLeafWords = editor.children[selectionEnd.path[0]].line.words;
    selectedLeafWords.forEach((word, wordIndex) => {
      const wordLength = word.word.length;

      counter = counter + wordLength;
      if (counter <= goal) {
        targetWordIndex = wordIndex;
      }
    });

    const endWord =
      targetWordIndex === null
        ? selectedLeafWords[0]
        : selectedLeafWords[targetWordIndex + 1];
    // return { startSec: startWord.start, endSec: endWord.end };
    return { startWord, endWord };
  } catch (error) {
    console.error('error finding times from selection:: ', error);
  }
};

function splitTextAtOffset(text, offset) {
  const textBefore = text.slice(0, offset);
  const textAfter = text.slice(offset);
  return [textBefore, textAfter];
}

export function handleSplitLine(editor) {
  const { anchor, focus } = editor.selection;
  const { offset: anchorOffset, path: anchorPath } = anchor;
  const { offset: focusOffset } = focus;

  if (focusOffset !== anchorOffset) return false;
  // Transforms.splitNodes(editor);
  // return;

  const [lineIdx, wordIdx] = anchorPath;

  const lineNode = editor.children[lineIdx];
  const wordNode = lineNode.children[wordIdx];
  const word = wordNode.word;
  const wordText = Node.string(wordNode);
  if (wordIdx === 0 && anchorOffset === 0) {
    console.info('Beginning of line');
    return false;
  }
  if (
    anchorOffset === word.text.length &&
    wordIdx === lineNode.children.length - 1
  ) {
    console.info('End of line');
    return false;
  }

  const [textBefore, textAfter] = splitTextAtOffset(wordText, anchorOffset);
  if (textAfter.trim() === '' && wordIdx === lineNode.children.length - 1) {
    console.info('Empty Line Skip');
    return false;
  }

  Transforms.splitNodes(editor);

  const wordAfter = { ...word, text: textAfter };
  const wordNodeAfter = {
    type: 'span',
    word: wordAfter,
    children: [{ text: wordAfter.text }],
  };

  let nodesAfter = lineNode.children.slice(
    wordIdx + 1,
    lineNode.children.length
  );

  if (wordAfter.text.trim() !== '') {
    nodesAfter = [wordNodeAfter, ...nodesAfter];
  }

  let lineAfter = {
    ...lineNode,
    children: nodesAfter,
    line: { ...lineNode.line, start: nodesAfter[0].word.start },
  };

  console.log(Node.last(editor, [lineIdx]));

  Transforms.removeNodes(editor, {
    at: {
      anchor: { path: [lineIdx, wordIdx + 1, 0], offset: 0 },
      focus: {
        path: [lineIdx, lineNode.children.length, 0],
        offset: Node.string(Node.last(editor, [lineIdx])[0]).length,
      },
    },
  });
  Transforms.insertNodes(editor, [lineAfter], {
    at: [lineIdx + 1],
  });
  // const nextPoint = Editor.after(editor, editor.selection.anchor);

  Transforms.setSelection(editor, {
    anchor: { path: [lineIdx + 1, 0, 0], offset: 0 },
    focus: { path: [lineIdx + 1, 0, 0], offset: 0 },
  });

  // debugger;

  return false;
}

export function handleMergeLine(editor, event) {
  const { anchor, focus } = editor.selection;
  const { offset: anchorOffset, path: anchorPath } = anchor;
  const { offset: focusOffset } = focus;

  if (focusOffset !== anchorOffset) return false;

  const [lineIdx, wordIdx] = anchorPath;

  if (wordIdx === 0 && anchorOffset === 0) {
    event.preventDefault();
    if (lineIdx === 0) {
      console.info('First Block');
      return false;
    }

    const lineNode = editor.children[lineIdx];
    const previousLineNode = editor.children[lineIdx - 1];

    const mergedLine = {
      ...previousLineNode,
      children: [...previousLineNode.children, ...lineNode.children],
      line: {
        start: previousLineNode.line.start,
        end: lineNode.line.end,
        line: previousLineNode.line.text + lineNode.line.text,
        words: [...previousLineNode.line.words, ...lineNode.line.words],
      },
    };

    const range = {
      anchor: {
        path: [lineIdx, 0],
        offset: 0,
      },
      focus: {
        path: [lineIdx - 1, 0],
        offset: 6,
      },
    };

    const options = {
      at: range,
      mode: 'highest',
    };

    Transforms.removeNodes(editor, options);

    const options2 = {
      at: [lineIdx - 1],
      mode: 'highest',
    };

    Transforms.insertNodes(editor, [mergedLine], options2);

    Transforms.setSelection(editor, {
      anchor: {
        path: [lineIdx - 1, previousLineNode.children.length - 1, 0],
        offset:
          previousLineNode.children[previousLineNode.children.length - 1]
            .children[0].text.length,
      },
      focus: {
        path: [lineIdx - 1, previousLineNode.children.length - 1, 0],
        offset:
          previousLineNode.children[previousLineNode.children.length - 1]
            .children[0].text.length,
      },
    });
  }
}

export function handleUpDownTraversal(editor, key) {
  const { anchor, focus } = editor.selection;
  const { offset: anchorOffset, path: anchorPath } = anchor;
  const { offset: focusOffset } = focus;

  if (focusOffset !== anchorOffset) return false;

  const [lineIdx, wordIdx] = anchorPath;

  const offset = getOffset(editor, lineIdx, wordIdx, anchorOffset);

  let nextLine;
  if (key === 'ArrowUp') nextLine = lineIdx - 1;
  if (key === 'ArrowDown') nextLine = lineIdx + 1;

  const point = getPointFromOffset(editor, nextLine, offset);

  Transforms.setSelection(editor, {
    anchor: point,
    focus: point,
  });
}

function getPointFromOffset(editor, lineIdx, totalOffset) {
  let items = editor.children[lineIdx].children;

  const fulltext = Node.string(editor.children[lineIdx]);
  if (totalOffset >= fulltext.length) {
    return {
      path: [lineIdx, items.length - 1, 0],
      offset: Node.string(items[items.length - 1]).length,
    };
  }

  let path = [lineIdx, 0, 0];
  let offset = totalOffset;
  for (let i = 0; i < items.length; i++) {
    let str = Node.string(items[i]);
    if (offset < str.length) {
      path[1] = i;
      break;
    }
    offset -= str.length;
  }

  return {
    path,
    offset,
  };
}

function getOffset(editor, lineIdx, wordIdx, anchorOffset) {
  const text = editor.children[lineIdx].children.reduce((acc, curr, idx) => {
    if (idx < wordIdx) acc = acc + curr.children[0].text;
    if (idx === wordIdx) {
      if (anchorOffset !== 0) {
        acc = acc + curr.children[0].text.slice(0, anchorOffset);
      }
    }
    return acc;
  }, '');
  return text.length;
}
