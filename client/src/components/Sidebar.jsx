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
  Heading,
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
  handleCanvasChange,
  canvas,
  handleTitleToggle,
}) => {
  const renderUploadImage = () => {
    return (
      <Box d="flex" marginTop="-50px">
        <Button style={styles.uploadImageButton} colorScheme="teal">
          <label htmlFor="image_upload">Upload Image</label>
          <Input
            id="image_upload"
            type="file"
            onChange={e => handleFileUpload(e)}
            accept="image/png"
            style={{ display: 'none' }}
          />
        </Button>
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
                background="white"
                type="color"
                defaultValue="#FFC0CB"
                // value={color}
                px="1"
                // onChange={e => handleColorChange(e.target.value)}
                onChange={handleCanvasChange}
              />
            </FormControl>

            <FormControl id="grid" isRequired>
              <FormLabel>Show Grid</FormLabel>
              <Checkbox
              // checked={showOutline}
              // onChange={e => setShowOutline(e.target.checked)}
              >
                Show Grid
              </Checkbox>
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
                // activeFontFamily={activeFontFamily.family}
                // variants={[
                //   '100',
                //   '100italic',
                //   '200',
                //   '200italic',
                //   '300',
                //   '300italic',
                //   'regular',
                //   'italic',
                //   '500',
                //   '500italic',
                //   '600',
                //   '600italic',
                //   '700',
                //   '700italic',
                //   '800',
                //   '800italic',
                //   '900',
                //   '900italic',
                // ]}
                onChange={nextFont => {
                  console.log(nextFont);
                  // updateMeta('activeFontFamily', nextFont);
                }}
                limit={400}
              />
            </FormControl>
            <FormControl id="uppercase" isRequired>
              <FormLabel fontSize="xs">Uppercase</FormLabel>
              <Checkbox
                size="sm"
                borderColor="black"
                // checked={fontUppercase}
                // onChange={e => {

                // }}
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

                  subtitles.set('fontSize', parseInt(valueString));
                  canvas.renderAll();
                }}
                // value={format(fontSize)}
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
                // checked={italic}
                onChange={e => {
                  let subtitles = canvas.getItemByName('subtitle');
                  if (e.target.checked) {
                    subtitles.set('fontStyle', 'italic');
                  } else {
                    subtitles.set('fontStyle', 'normal');
                  }

                  canvas.renderAll();
                }}
              >
                Italic
              </Checkbox>
            </FormControl>
            <FormControl id="font_size" isRequired>
              <FormLabel fontSize="xs">Font Weight</FormLabel>
              <Select
                size="xs"
                background="white"
                onChange={e => {
                  let subtitles = canvas.getItemByName('subtitle');

                  subtitles.set('fontWeight', e.target.value);
                  canvas.renderAll();
                }}
                // value={fontWeight}
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
                background="white"
                type="color"
                px="1"
                // value={textColor}
                onChange={e => {
                  let subtitles = canvas.getItemByName('subtitle');

                  subtitles.set('fill', e.target.value);
                  canvas.renderAll();
                }}
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
                // checked={showTitle}
                onChange={e => handleTitleToggle(e.target.checked)}
              >
                Show Title
              </Checkbox>
            </FormControl>

            <FormControl id="font_size" isRequired>
              <FormLabel fontSize="xs">Title Font Size</FormLabel>
              <NumberInput
                size="xs"
                // onChange={valueString =>
                //   updateMeta('titleTextSize', parse(valueString))
                // }
                // value={format(titleTextSize)}
                step={2}
                defaultValue={22}
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
            <FormControl id="color" isRequired>
              <FormLabel fontSize="xs">Title Color</FormLabel>
              <Input
                size="xs"
                background="white"
                type="color"
                px="1"
                // value={textColor}
                // onChange={e => handleTextColorChange(e.target.value)}
              />
            </FormControl>
          </Stack>
        </AccordionPanel>
      </AccordionItem>
    );
  };

  const renderImageAccordion = () => {
    if (!isImage) return;

    return (
      <AccordionItem>
        <h2>
          <AccordionButton>
            <Box flex="1" textAlign="left">
              Image
            </Box>
            <AccordionIcon />
          </AccordionButton>
        </h2>
        <AccordionPanel pb={4} bg="gray.200">
          <Stack>
            <Button size="xs" colorScheme="teal" onClick={() => removeImage()}>
              Remove Image
            </Button>
          </Stack>
        </AccordionPanel>
      </AccordionItem>
    );
  };

  return (
    <Flex
      d="flex"
      flexDirection="column"
      w="300px"
      borderLeft="1px solid #edf2f7"
    >
      <Box minHeight="100%" overflow="scroll">
        <Accordion w="100%" paddingBottom="50px" allowMultiple>
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
