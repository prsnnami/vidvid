// import { Button } from '@chakra-ui/button';
// import { FormControl, FormLabel } from '@chakra-ui/form-control';
// import { useDisclosure } from '@chakra-ui/hooks';
// import { Input } from '@chakra-ui/input';
// import { Box, Heading, Stack, Text } from '@chakra-ui/layout';
// import {
//   Modal,
//   ModalBody,
//   ModalCloseButton,
//   ModalContent,
//   ModalFooter,
//   ModalHeader,
//   ModalOverlay,
// } from '@chakra-ui/modal';
// import { Progress } from '@chakra-ui/progress';
// import { Select } from '@chakra-ui/select';
// import {
//   Slider,
//   SliderFilledTrack,
//   SliderThumb,
//   SliderTrack,
// } from '@chakra-ui/slider';
// import React, { useEffect, useRef, useState } from 'react';
// import { useNavigate, useParams } from 'react-router';
// import Transctipt from '../components/Editor/Transcript';
// import Canvas from '../components/VideoCanvas';

// function drawScaledImage(ctx, image, cs, is) {
//   ctx.clearRect(0, 0, cs.width, cs.height);
//   let scale = Math.min(cs.width / is.width, cs.height / is.height);

//   const ar = (is.width * scale) / (is.height * scale);
//   let top = (cs.height - is.height * scale) / 2;
//   let left = (cs.width - is.width * scale) / 2;
//   ctx.drawImage(image, left, top, is.width * scale, is.height * scale);
// }

// function getLines(ctx, text, maxWidth) {
//   var words = text.split(' ');
//   var lines = [];
//   var currentLine = words[0];

//   for (var i = 1; i < words.length; i++) {
//     var word = words[i];
//     var width = ctx.measureText(currentLine + ' ' + word).width;
//     if (width < maxWidth) {
//       currentLine += ' ' + word;
//     } else {
//       lines.push(currentLine);
//       currentLine = word;
//     }
//   }
//   lines.push(currentLine);
//   return lines;
// }

// export default function Editor() {
//   const { sharePath } = useParams();
//   const [loading, setLoading] = useState(false);
//   const [transcript, setTranscript] = useState(null);
//   const [poster, setPoster] = useState(null);
//   const canvasRef = useRef(null);
//   const videoRef = useRef();
//   const [canvasSize, setCanvasSize] = useState({ height: 640, width: 640 });
//   const [videoSize, setVideoSize] = useState({ height: 360, width: 480 });
//   const [color, setColor] = useState('#000000');
//   const [scale, setScale] = useState(1);
//   const [subTitle, setSubTitle] = useState(null);
//   const exportModal = useDisclosure();
//   const [aspectRatio, setAspectRatio] = useState('1:1');
//   const [manifestUrl, setManifestUrl] = useState();
//   const nameRef = useRef();
//   const selectRef = useRef();
//   const [mutationLoading, setMutationLoading] = useState(false);
//   const [isPlaying, setIsPlaying] = useState(false);
//   const navigate = useNavigate();

//   function getSubtitle(transcript) {
//     let lines = [];
//     transcript.segments.forEach(segment => {
//       let segmentChunks = segment.wdlist.reduce((prev, curr, i) => {
//         const chunkIndex = Math.floor(i / 8);
//         if (!prev[chunkIndex]) {
//           prev[chunkIndex] = []; // start a new chunk
//         }

//         prev[chunkIndex].push(curr);
//         return prev;
//       }, []);

//       segmentChunks = segmentChunks.map(chunk => {
//         return {
//           start: chunk[0].start,
//           end: chunk[chunk.length - 1].end,
//           words: chunk,
//           line: chunk.map(line => line.word).join(''),
//         };
//       });
//       lines.push(segmentChunks);
//     });

//     setSubTitle(lines);
//   }

//   async function loadManifest(shareUrl) {
//     const manifestRet = await fetch(`/proxy/${shareUrl}/manifest-path.json`);
//     const manifest = await manifestRet.json();
//     setManifestUrl(manifest);
//     return manifest;
//   }

//   async function loadTranscript(shareUrl) {
//     const transRet = await fetch(`/proxy/${shareUrl}/transcript.json`);
//     let transcript = await transRet.json();
//     setTranscript(transcript);
//     getSubtitle(transcript);
//   }

//   async function init($vid) {
//     let shareUrl = 'https://app.reduct.video/e/' + sharePath;
//     // let shareUrl =
//     //   'http://localhost:8080/https://app.reduct.video/e/' + sharePath;

//     if (shareUrl[shareUrl.length - 1] === '/') {
//       shareUrl = shareUrl.slice(0, shareUrl.length - 1);
//     }

//     $vid = document.createElement('video');
//     videoRef.current = $vid;
//     setPoster(`${shareUrl}/posterframe.jpg`);

//     loadTranscript(shareUrl);
//     const manifest = await loadManifest(shareUrl);

//     // Initialize Reduct player

//     /* global Reduct */

//     // console.log(`${shareUrl}/${manifest}`);
//     const play = new Reduct.Player($vid);
//     play.init(`/proxy/${shareUrl}/${manifest}`, {
//       streaming: { bufferingGoal: 5, rebufferingGoal: 3 },
//     });
//     $vid.onVideoRender?.();
//     $vid.oncanplay = function (e) {
//       setVideoSize({ height: this.videoHeight, width: this.videoWidth });
//       setScale(
//         Math.min(
//           canvasSize.width / this.videoWidth,
//           canvasSize.height / this.videoHeight
//         )
//       );
//     };
//     $vid.onloadeddata = function () {
//       // console.log('video loaded');
//       window.$vid = $vid;
//     };

//     $vid.onwaiting = () => console.log('buffering now');
//     $vid.addEventListener('play', () => setIsPlaying(true));
//     $vid.addEventListener('pause', () => setIsPlaying(false));
//   }

//   useEffect(() => {
//     let $vid;
//     setLoading(true);
//     init($vid).then(() => setLoading(false));
//     return () => {
//       console.log('this shouldnt log');
//       if ($vid) {
//         $vid.remove();
//       }
//       if (videoRef.current) {
//         videoRef.current = null;
//       }
//     };
//   }, [sharePath]);

//   function predraw(ctx) {
//     if (!loading && poster) {
//       const image = new Image();
//       image.onload = () => {
//         image.style.objectFit = 'contain';
//         ctx.imageSmoothingEnabled = false;
//         drawScaledImage(ctx, image, canvasSize, {
//           height: image.height,
//           width: image.width,
//         });
//       };
//       image.src = poster;
//     }
//   }

//   function draw(ctx) {
//     if (videoRef.current && !loading && !videoRef.current.paused) {
//       drawScaledImage(ctx, videoRef.current, canvasSize, videoSize);
//       ctx.font = '22px Arial';
//       ctx.fillStyle = 'white';
//       ctx.textAlign = 'center';
//       ctx.lineWidth = 4;
//       ctx.miterLimit = 2;

//       subTitle
//         .flatMap(x => x)
//         .forEach(s => {
//           if (
//             s.start < videoRef.current.currentTime &&
//             s.end > videoRef.current.currentTime
//           ) {
//             let lines = getLines(ctx, s.line, canvasSize.width * 0.8);
//             lines.reverse().forEach((line, i) => {
//               ctx.strokeText(
//                 line,
//                 canvasSize.width / 2,
//                 canvasSize.height - canvasSize.height * 0.1 - i * 24
//               );
//               ctx.fillText(
//                 line,
//                 canvasSize.width / 2,
//                 canvasSize.height - canvasSize.height * 0.1 - i * 24
//               );
//             });
//           }
//         });
//     }
//   }
//   function handleDimensionsChange(e) {
//     const aspectRatio = e.target.value;
//     setAspectRatio(aspectRatio);
//     let height, width;

//     switch (aspectRatio) {
//       case '1:1':
//         height = 640;
//         width = 640;
//         break;
//       case '16:9':
//         height = 360;
//         width = 640;
//         break;
//       case '9:16':
//         height = 640;
//         width = 360;
//         break;
//       case '4:5':
//         height = 450;
//         width = 360;
//         break;
//       default:
//         height = canvasSize.height;
//         width = canvasSize.width;
//     }

//     setCanvasSize({ height, width });
//     setScale(Math.min(height / videoSize.height, width / videoSize.width));
//   }

//   function handleSubmit(e) {
//     e.preventDefault();
//     setMutationLoading(true);
//     let body = {
//       name: nameRef.current.value,
//       quality: selectRef.current.value,
//       subtitle: subTitle
//         .flatMap(x => x)
//         .map(i => ({ start: i.start, end: i.end, line: i.line })),
//       url: 'https://app.reduct.video/e/' + sharePath,
//       manifest_url: manifestUrl,
//       a_r: aspectRatio,
//       color,
//     };
//     fetch('/borderer/generate', {
//       method: 'POST',
//       body: JSON.stringify(body),
//     }).then(res => {
//       setMutationLoading(false);
//       navigate('/reels');
//     });
//   }

//   if (loading) return 'Loading...';

//   return (
//     <>
//       <Box>
//         <Stack direction="row">
//           <Box flex={1} px={2}>
//             <Stack direction="row">
//               <Button
//                 onClick={() => {
//                   console.log(videoRef.current?.paused);
//                   if (!videoRef.current) return;
//                   if (videoRef.current.paused) {
//                     videoRef.current.play();
//                   } else {
//                     videoRef.current.pause();
//                   }
//                 }}
//               >
//                 {!isPlaying ? 'Play' : 'Pause'}
//               </Button>
//               <Button onClick={() => exportModal.onOpen()}>Export</Button>

//               <Select onChange={handleDimensionsChange} value={aspectRatio}>
//                 <option>1:1</option>
//                 <option>16:9</option>
//                 <option>9:16</option>
//                 <option>4:5</option>
//               </Select>
//               <Input
//                 type="color"
//                 value={color}
//                 onChange={e => setColor(e.target.value)}
//               />
//             </Stack>
//             <Canvas
//               __predraw={predraw}
//               ref={canvasRef}
//               draw={draw}
//               height={canvasSize.height}
//               width={canvasSize.width}
//               color={color}
//             />
//             <Seeker video={videoRef.current} />
//           </Box>

//           <Box p={4} flex={1} maxH="100vh" overflowY="scroll">
//             <Transctipt
//               tx={transcript}
//               subtitle={subTitle}
//               video={videoRef.current}
//               onEdit={(line, segmentIdx, chunkIdx) => {
//                 let edit = [...subTitle];
//                 edit[segmentIdx][chunkIdx].line = line;
//                 setSubTitle(edit);
//               }}
//             />
//           </Box>
//         </Stack>
//       </Box>
//       <Modal isOpen={exportModal.isOpen} onClose={exportModal.onClose}>
//         <ModalOverlay />
//         <ModalContent>
//           <form onSubmit={handleSubmit}>
//             <ModalHeader>Export</ModalHeader>
//             <ModalCloseButton />
//             <ModalBody>
//               <Stack>
//                 <FormControl id="name" isRequired>
//                   <FormLabel>Enter File Name</FormLabel>
//                   <Input ref={nameRef} placeholder="Enter file name" />
//                 </FormControl>
//                 <FormControl id="quality" isRequired>
//                   <FormLabel>Select Video Quality</FormLabel>
//                   <Select ref={selectRef} placeholder="Select Video Quality">
//                     <option value="240p">240p</option>
//                     <option value="480p">480p</option>
//                     <option value="1080p">1080p</option>
//                   </Select>
//                 </FormControl>
//               </Stack>
//             </ModalBody>

//             <ModalFooter>
//               <Button colorScheme="blue" mr={3} type="submit">
//                 Export
//               </Button>
//               <Button variant="ghost" onClick={exportModal.onClose}>
//                 Cancel
//               </Button>
//             </ModalFooter>
//           </form>
//         </ModalContent>
//       </Modal>
//     </>
//   );
// }

// function Seeker({ video }) {
//   const [videoProgress, setVideoProgress] = useState(0);

//   function onTimeUpdate() {
//     setVideoProgress((video.currentTime / video.duration) * 100);
//   }

//   useEffect(() => {
//     if (video) {
//       video.addEventListener('timeupdate', onTimeUpdate, false);
//       return () => {
//         video.removeEventListener('timeupdate', onTimeUpdate, false);
//       };
//     }
//   }, []);

//   function handleSliderChange(value) {
//     if (!video) return;
//     console.log(value);
//     const d = video.duration;
//     const seek = (d * value) / 100;
//     setVideoProgress(value);
//     video.currentTime = seek;
//   }

//   return (
//     <Slider
//       aria-label="slider-ex-1"
//       value={videoProgress}
//       onChange={handleSliderChange}
//       focusThumbOnChange={false}
//     >
//       <SliderTrack>
//         <SliderFilledTrack />
//       </SliderTrack>
//       <SliderThumb />
//     </Slider>
//   );
// }

// function Borderer() {
//   const videoRef = useRef();
//   const [dimensions, setDimensions] = useState({
//     height: 640,
//     width: 640,
//   });
//   const [videoDimensions, setVideoDimensions] = useState({
//     height: 640,
//     width: 640,
//   });
//   const [scale, setScale] = useState(1);
//   const canvasRef = useRef(null);
//   const [borderPercent, setBorderPercent] = useState(0);
//   const [color, setColor] = useState('#000000');
//   const [overlay, setOverlay] = useState(false);

//   const draw = (ctx, frameCount) => {
//     if (videoRef.current) {
//       const scaledHeight = videoDimensions.height * scale;
//       const scaledWidth = videoDimensions.width * scale;
//       const ar = scaledWidth / scaledHeight;

//       if (overlay) {
//         const top = (dimensions.height - scaledHeight) / 2;
//         const left = (dimensions.width - scaledWidth) / 2;

//         const borderHeight = (borderPercent * scaledHeight) / 100;
//         ctx.drawImage(videoRef.current, left, top, scaledWidth, scaledHeight);
//         ctx.fillStyle = color;
//         ctx.fillRect(
//           0,
//           dimensions.height - borderHeight,
//           dimensions.width,
//           borderHeight
//         );
//       } else {
//         const bottomDisplacement = (scaledHeight * borderPercent) / 100;
//         const h = scaledHeight - bottomDisplacement;
//         const w = scaledWidth - bottomDisplacement * ar;

//         const top = (dimensions.height - scaledHeight) / 2;
//         const left = (dimensions.width - w) / 2;
//         ctx.drawImage(videoRef.current, left, top, w, h);
//       }

//       // ctx.drawImage(videoRef.current, 100, 100, 500, 500);
//     }
//   };

//   function onVideoSelect(blob) {
//     if (videoRef.current) {
//       videoRef.current.pause();
//       videoRef.current.remove();
//       videoRef.current = null;
//     }

//     const video = document.createElement('video');
//     video.src = URL.createObjectURL(blob);
//     video.autoplay = false;
//     video.loop = true;

//     video.onerror = e => console.error('error in video loading', e);

//     video.oncanplay = function (e) {
//       console.dir(this);
//       console.log(this.videoHeight, this.videoWidth, scale);
//       setVideoDimensions({ height: this.videoHeight, width: this.videoWidth });
//       setScale(
//         Math.min(
//           dimensions.width / this.videoWidth,
//           dimensions.height / this.videoHeight
//         )
//       );
//       const ctx = canvasRef.current.getContext('2d');
//       // ctx.drawImage(videoRef.current, 0, 0, 640, 640);
//     };

//     console.log('reached here');
//     videoRef.current = video;
//     console.log('details', video.videoHeight, video.videoWidth);
//     // video.play();
//     // setTimeout(() => video.pause(), 10);

//     // videoRef.current.play();

//     // videoRef.current.src = URL.createObjectURL(video);
//     // const ctx = canvasRef.current.getContext('2d');
//     // ctx.drawImage(video, 0, 0, 640, 640);
//     // videoRef.current.pause();
//     // window.requestAnimationFrame(() => videoRef.current.pause());
//   }

//   function handleDimensionsChange(e) {
//     const aspectRatio = e.target.value;
//     if (aspectRatio === '1:1') {
//       setDimensions({
//         height: 640,
//         width: 640,
//       });
//       setScale(
//         Math.min(640 / videoDimensions.height, 640 / videoDimensions.width)
//       );
//     } else if (aspectRatio === '16:9') {
//       setDimensions({
//         height: 360,
//         width: 640,
//       });
//       setScale(
//         Math.min(360 / videoDimensions.height, 640 / videoDimensions.width)
//       );
//     } else if (aspectRatio === '9:16') {
//       setDimensions({
//         height: 640,
//         width: 360,
//       });
//       setScale(
//         Math.min(640 / videoDimensions.height, 360 / videoDimensions.width)
//       );
//     } else if (aspectRatio === '4:5') {
//       setDimensions({
//         height: 450,
//         width: 360,
//       });
//       setScale(
//         Math.min(450 / videoDimensions.height, 360 / videoDimensions.width)
//       );
//     }

//     const scaledHeight = videoDimensions.height * scale;
//     const scaledWidth = videoDimensions.width * scale;
//     const ar = scaledWidth / scaledHeight;

//     const bottomDisplacement = (scaledHeight * borderPercent) / 200;
//     const h = scaledHeight - bottomDisplacement;
//     const w = scaledWidth - bottomDisplacement * ar;

//     const top = (dimensions.height - scaledHeight) / 2;
//     const left = (dimensions.width - w) / 2;

//     console.log({
//       aspectRatio,
//       dimensions,
//       scale,
//       top,
//       left,
//       h,
//       w,
//     });
//   }

//   return (
//     <Box textAlign="center" fontSize="xl">
//       <Grid minH="100vh" p={3}>
//         <Stack direction="row">
//           {/* <Checkbox onChange={e => setOverlay(e.target.checked)}>
//               Overlay
//             </Checkbox> */}
//           <Select onChange={handleDimensionsChange}>
//             <option>1:1</option>
//             <option>16:9</option>
//             <option>9:16</option>
//             <option>4:5</option>
//           </Select>
//           {/* <Input
//               type="number"
//               min="0"
//               max="100"
//               placeholder="Bottom Border %"
//               value={borderPercent}
//               onChange={e => setBorderPercent(Number(e.target.value) || 0)}
//             /> */}
//           <Input
//             type="color"
//             value={color}
//             onChange={e => setColor(e.target.value)}
//           />
//         </Stack>
//         <Flex p={4} justifyContent="center">
//           <div>
//             <Canvas
//               color={color}
//               ref={canvasRef}
//               draw={draw}
//               height={dimensions.height}
//               width={dimensions.width}
//             />
//           </div>
//         </Flex>
//         <Box justifySelf="center">
//           <Input
//             type="file"
//             accept="video/*"
//             onChange={e => onVideoSelect(e.target.files[0])}
//           />
//         </Box>
//         <Flex justifyContent="center">
//           <Stack direction="row">
//             <Button
//               onClick={() => {
//                 if (!videoRef.current) return;
//                 if (videoRef.current.paused) {
//                   videoRef.current.play();
//                 } else {
//                   videoRef.current.pause();
//                 }
//               }}
//             >
//               Play/Pause
//             </Button>
//             <Button
//               onClick={() => {
//                 console.log('scale', scale);
//               }}
//             >
//               Test
//             </Button>
//           </Stack>
//         </Flex>
//       </Grid>
//     </Box>
//   );
// }

// function BordererTestPage() {
//   let videoRef = useRef();
//   let preload = true;
//   const didInit = useRef(false);
//   const [isOpen, setIsOpen] = useState(false);

//   const [tx, setTx] = useState();

//   let sharePath =
//     'https://app.reduct.video/e/how-the-zebra-gets-research-in-front-of-everyone-from-the-ceo-to-individual-designers-engineers-and-pms-3-mins-f08661432b-7f13df6723f0bd72c4d6';

//   useEffect(() => {
//     let shareUrl = sharePath;
//     if (shareUrl[shareUrl.length - 1] === '/') {
//       shareUrl = shareUrl.slice(0, shareUrl.length - 1);
//     }

//     const $vid = videoRef.current;
//     $vid.poster = `${shareUrl}/posterframe.jpg`;

//     const loadManifest = async () => {
//       const manifestRet = await fetch(`${shareUrl}/manifest-path.json`);
//       const manifest = await manifestRet.json();

//       // Initialize Reduct player

//       /* global Reduct */
//       console.log('here');
//       const play = new Reduct.Player($vid);
//       play.init(`${shareUrl}/${manifest}`, {
//         streaming: { bufferingGoal: 5, rebufferingGoal: 3 },
//       });
//       $vid.onVideoRender?.();
//     };

//     let transcript;

//     const loadTranscript = async () => {
//       const transRet = await fetch(`${shareUrl}/transcript.json`);
//       transcript = await transRet.json();
//       setTx(transcript);
//     };

//     if (preload) {
//       didInit.current = true;
//       loadManifest();
//     }
//     loadTranscript();

//     $vid.onplay = () => {
//       if (!didInit.current) {
//         didInit.current = true;
//         loadManifest();
//       }
//       setIsOpen(true);
//     };

//     $vid.onpause = () => {
//       setIsOpen(false);
//     };

//     $vid.ontimeupdate = () => {
//       if (!transcript) return;
//       const t = $vid.currentTime;

//       let found = false;
//       transcript.segments.forEach(seg => {
//         seg.wdlist.forEach(({ $elt }) => {
//           if ($elt) $elt.style.background = 'transparent';
//         });

//         if (seg.end < t) {
//           return;
//         }
//         if (found) {
//           return;
//         }

//         seg.wdlist.forEach(({ $elt, end }) => {
//           if (found) {
//             return;
//           }
//           if (!$elt) {
//             return;
//           }
//         });
//       });
//     };
//   }, []);

//   return (
//     <>
//       <h1>Borderer Test Page</h1>
//       <button
//         onClick={() => {
//           if (videoRef.current) {
//             if (videoRef.current.paused) {
//               videoRef.current.play();
//             } else {
//               videoRef.current.pause();
//             }
//           }
//         }}
//       >
//         Play/Pause
//       </button>
//       <button onClick={() => console.log(tx)}>Transctipt</button>
//       <video ref={videoRef} />
//     </>
//   );
// }
