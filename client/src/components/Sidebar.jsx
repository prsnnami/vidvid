import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Button,
  Checkbox,
  Flex,
  FormControl,
  FormLabel,
  Input,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Select,
  Stack,
} from '@chakra-ui/react';
import FontPicker from 'font-picker-react';

const Sidebar = ({
  handleDimensionsChange,
  removeImage,
  handleFileUpload,
  isImage,
  ar,
  canvas,
  handleTitleToggle,
  layers,
  setLayers,
  setActiveFont,
}) => {
  const handleCanvasBgColorChange = e => {
    setLayers({
      ...layers,
      canvas: { ...layers.canvas, bgColor: e.target.value },
    });
    canvas.set('backgroundColor', e.target.value);
  };

  const handleFontChange = nextFont => {
    const subtitleLayer = canvas.getItemByName('subtitle');
    const titleLayer = canvas.getItemByName('title');

    if (!subtitleLayer) return;

    setLayers({
      ...layers,
      subtitle: { ...layers.subtitle, fontFamily: nextFont.family },
    });
    setActiveFont(nextFont);
    subtitleLayer.set('fontFamily', nextFont.family);
    if (titleLayer) titleLayer.set('fontFamily', nextFont.family);
    canvas.renderAll();
  };

  const handleTextChange = e => {
    const activeObject = canvas.getItemByName(e.target.name);
    if (!activeObject) return;

    setLayers({
      ...layers,
      [e.target.name]: {
        ...layers[e.target.name],
        fontUppercase: e.target.checked,
      },
    });
    if (e.target.checked) {
      activeObject.set('text', activeObject.text.toUpperCase());
    } else {
      activeObject.set('text', activeObject.text.toLowerCase());
    }
    canvas.renderAll();
  };

  const handleFontStyleChange = e => {
    let activeObject = canvas.getItemByName(e.target.name);
    if (!activeObject) return;

    setLayers({
      ...layers,
      [e.target.name]: {
        ...layers[e.target.name],
        italic: e.target.checked,
      },
    });
    if (e.target.checked) {
      activeObject.set('fontStyle', 'italic');
    } else {
      activeObject.set('fontStyle', 'normal');
    }

    canvas.renderAll();
  };

  const handleFontColorChange = e => {
    let activeObject = canvas.getItemByName(e.target.name);
    if (!activeObject) return;

    setLayers({
      ...layers,
      [e.target.name]: {
        ...layers[e.target.name],
        color: e.target.value,
      },
    });
    activeObject.set('fill', e.target.value);
    canvas.renderAll();
  };

  const handleFontWeightChange = e => {
    let activeObject = canvas.getItemByName(e.target.name);
    if (!activeObject) return;

    setLayers({
      ...layers,
      [e.target.name]: {
        ...layers[e.target.name],
        fontWeight: e.target.value,
      },
    });
    activeObject.set('fontWeight', e.target.value);
    canvas.renderAll();
  };

  const renderUploadImage = () => {
    return (
      <Box d="flex">
        <label
          htmlFor="image_upload"
          style={{ cursor: 'pointer', display: 'block', flexGrow: 1 }}
        >
          <Button
            style={styles.uploadImageButton}
            colorScheme="teal"
            pointerEvents={'none'}
          >
            Upload Image
          </Button>
          <Input
            id="image_upload"
            type="file"
            onChange={e => handleFileUpload(e)}
            accept="image/*"
            style={{ display: 'none' }}
          />
        </label>
      </Box>
    );
  };

  const renderCanvasAccordion = () => {
    return (
      <AccordionItem>
        <h2>
          <AccordionButton>
            <Box flex="1" textAlign="left">
              Canvas
            </Box>
            <AccordionIcon />
          </AccordionButton>
        </h2>
        <AccordionPanel pb={4} bg="gray.200">
          <Stack>
            <FormControl id="a_r" isRequired>
              <FormLabel fontSize="xs">Aspect Ratio</FormLabel>
              <Select
                size="xs"
                background="white"
                onChange={e => handleDimensionsChange(e.target.value)}
                value={ar}
              >
                <option value="1:1">1:1 Square</option>
                <option value="16:9">16:9 Horizontal</option>
                <option value="9:16">9:16 Vertical</option>
                <option value="4:5">4:5 Portrait</option>
              </Select>
            </FormControl>
            <FormControl id="color" isRequired size="xs">
              <FormLabel fontSize="xs">Background Color</FormLabel>
              <Input
                size="xs"
                type="color"
                defaultValue={layers.canvas.bgColor}
                px="1"
                onChange={handleCanvasBgColorChange}
              />
            </FormControl>
          </Stack>
        </AccordionPanel>
      </AccordionItem>
    );
  };

  const renderSubtitleAccordion = () => {
    return (
      <AccordionItem>
        <h2>
          <AccordionButton>
            <Box flex="1" textAlign="left">
              Subtitle
            </Box>
            <AccordionIcon />
          </AccordionButton>
        </h2>
        <AccordionPanel pb={4} bg="gray.200">
          <Stack>
            <FormControl id="font_family" isRequired>
              <FormLabel fontSize="xs">Font Family</FormLabel>
              <FontPicker
                size="xs"
                apiKey={process.env.REACT_APP_GOOGLE_FONTS_API_KEY}
                activeFontFamily={layers.subtitle.fontFamily}
                onChange={handleFontChange}
                limit={400}
              />
            </FormControl>
            <FormControl id="uppercase" isRequired>
              <FormLabel fontSize="xs">Uppercase</FormLabel>
              <Checkbox
                size="sm"
                borderColor="black"
                name="subtitle"
                checked={layers.subtitle.fontUppercase}
                onChange={handleTextChange}
              >
                Uppercase
              </Checkbox>
            </FormControl>
            <FormControl id="font_size" isRequired>
              <FormLabel fontSize="xs">Font Size</FormLabel>
              <NumberInput
                size="xs"
                onChange={valueString => {
                  let subtitles = canvas.getItemByName('subtitle');
                  setLayers({
                    ...layers,
                    subtitle: {
                      ...layers.subtitle,
                      fontSize: parseInt(valueString),
                    },
                  });
                  subtitles.set('fontSize', parseInt(valueString));
                  canvas.renderAll();
                }}
                value={layers.subtitle.fontSize}
                step={2}
                defaultValue={40}
                min={10}
                max={200}
                bg="white"
                borderRadius={8}
              >
                <NumberInputField />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </FormControl>

            <FormControl id="font_size" isRequired>
              <FormLabel fontSize="xs">Italic</FormLabel>
              <Checkbox
                size="sm"
                borderColor="black"
                checked={layers.subtitle.italic}
                name="subtitle"
                onChange={handleFontStyleChange}
              >
                Italic
              </Checkbox>
            </FormControl>
            <FormControl id="font_size" isRequired>
              <FormLabel fontSize="xs">Font Weight</FormLabel>
              <Select
                size="xs"
                background="white"
                name="subtitle"
                onChange={handleFontWeightChange}
                value={layers.subtitle.fontWeight}
              >
                <option value="100">100</option>
                <option value="200">200</option>
                <option value="300">300</option>
                <option value="400">400</option>
                <option value="500">500</option>
                <option value="600">600</option>
                <option value="700">700</option>
                <option value="800">800</option>
                <option value="900">900</option>
              </Select>
            </FormControl>
            <FormControl id="color" isRequired>
              <FormLabel fontSize="xs">Font Color</FormLabel>
              <Input
                size="xs"
                type="color"
                px="1"
                name="subtitle"
                value={layers.subtitle.color}
                onChange={handleFontColorChange}
              />
            </FormControl>
          </Stack>
        </AccordionPanel>
      </AccordionItem>
    );
  };

  const renderTitleAccordion = () => {
    return (
      <AccordionItem>
        <h2>
          <AccordionButton>
            <Box flex="1" textAlign="left">
              Title
            </Box>
            <AccordionIcon />
          </AccordionButton>
        </h2>
        <AccordionPanel pb={4} bg="gray.200">
          <Stack>
            <FormControl id="font_size" isRequired>
              <FormLabel fontSize="xs">Show title?</FormLabel>
              <Checkbox
                borderColor="black"
                size="sm"
                checked={layers.canvas.title}
                onChange={e => handleTitleToggle(e.target.checked)}
              >
                Show Title
              </Checkbox>
            </FormControl>
            <FormControl id="uppercase" isRequired>
              <FormLabel fontSize="xs">Uppercase</FormLabel>
              <Checkbox
                size="sm"
                borderColor="black"
                name="title"
                checked={layers.title.fontUppercase}
                onChange={handleTextChange}
              >
                Uppercase
              </Checkbox>
            </FormControl>
            <FormControl id="font_size" isRequired>
              <FormLabel fontSize="xs">Font Size</FormLabel>
              <NumberInput
                size="xs"
                onChange={valueString => {
                  let title = canvas.getItemByName('title');
                  setLayers({
                    ...layers,
                    title: { ...layers.title, fontSize: parseInt(valueString) },
                  });

                  title.set('fontSize', parseInt(valueString));
                  canvas.renderAll();
                }}
                value={layers.title.fontSize}
                step={2}
                defaultValue={100}
                min={10}
                max={300}
                bg="white"
                borderRadius={8}
              >
                <NumberInputField />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
              <FormControl id="font_size" isRequired>
                <FormLabel fontSize="xs">Italic</FormLabel>
                <Checkbox
                  size="sm"
                  borderColor="black"
                  name="title"
                  checked={layers.title.italic}
                  onChange={handleFontStyleChange}
                >
                  Italic
                </Checkbox>
              </FormControl>
            </FormControl>
            <FormControl id="font_size" isRequired>
              <FormLabel fontSize="xs">Font Weight</FormLabel>
              <Select
                size="xs"
                background="white"
                name="title"
                onChange={handleFontWeightChange}
                value={layers.title.fontWeight}
              >
                <option value="100">100</option>
                <option value="200">200</option>
                <option value="300">300</option>
                <option value="400">400</option>
                <option value="500">500</option>
                <option value="600">600</option>
                <option value="700">700</option>
                <option value="800">800</option>
                <option value="900">900</option>
              </Select>
            </FormControl>
            <FormControl id="color" isRequired>
              <FormLabel fontSize="xs">Title Color</FormLabel>
              <Input
                size="xs"
                type="color"
                px="1"
                name="title"
                value={layers.title.color}
                onChange={handleFontColorChange}
              />
            </FormControl>
          </Stack>
        </AccordionPanel>
      </AccordionItem>
    );
  };

  const renderImageAccordion = () => {
    if (!isImage) return;

    return layers.images.map(image => {
      let imgLayer = canvas.getItemByName(image.name);
      return (
        <AccordionItem key={image.name}>
          <h2>
            <AccordionButton>
              <Box textAlign="left" textOverflow="ellipsis" overflow="hidden">
                {image.displayName}
              </Box>
              <AccordionIcon />
            </AccordionButton>
          </h2>
          <AccordionPanel pb={4} bg="gray.200">
            <Stack>
              <Button
                size="xs"
                colorScheme="teal"
                onClick={() => removeImage(image.name)}
              >
                Remove Image
              </Button>
              <Button
                size="xs"
                colorScheme="teal"
                // onClick={() => {
                //   console.log(canvas.getObjects().indexOf(imgLayer));
                //   console.log(imgLayer);
                // }}
                onClick={() => canvas.bringForward(imgLayer)}
              >
                Move to Front
              </Button>
              <Button
                size="xs"
                colorScheme="teal"
                onClick={() => canvas.sendBackwards(imgLayer)}
              >
                Move to Back
              </Button>
            </Stack>
          </AccordionPanel>
        </AccordionItem>
      );
    });
  };

  return (
    <Flex
      d="flex"
      flexDirection="column"
      w="300px"
      borderLeft="1px solid #edf2f7"
    >
      <Box flexGrow={1} overflowY={'auto'}>
        <Accordion w="100%" allowMultiple>
          {renderCanvasAccordion()}
          {renderSubtitleAccordion()}
          {renderTitleAccordion()}
          {renderImageAccordion()}
        </Accordion>
      </Box>
      {renderUploadImage()}
    </Flex>
  );
};

const styles = {
  uploadImageButton: {
    color: '#ffffff',
    borderRadius: 0,
    width: '100%',
  },
};

export default Sidebar;
