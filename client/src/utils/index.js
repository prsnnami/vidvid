export function drawScaledImage(ctx, image, cs, is) {
  ctx.clearRect(0, 0, cs.width, cs.height);
  let scale = Math.min(cs.width / is.width, cs.height / is.height);

  const ar = (is.width * scale) / (is.height * scale);
  let top = (cs.height - is.height * scale) / 2;
  let left = (cs.width - is.width * scale) / 2;
  ctx.drawImage(image, left, top, is.width * scale, is.height * scale);
}

export function getWrapLines(ctx, text, maxWidth) {
  var words = text.split(' ');
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
        words: chunk,
        line: chunk.map(line => line.word).join(''),
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
