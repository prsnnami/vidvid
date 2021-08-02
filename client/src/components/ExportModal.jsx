import {
  Button,
  FormControl,
  FormLabel,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  Stack,
} from '@chakra-ui/react';
import React, { useRef } from 'react';

export default function ExportModal({
  isOpen,
  manifestUrl,
  onClose,
  onSubmit,
  loading,
}) {
  const nameRef = useRef();
  const selectRef = useRef();

  //TODO: Get video resolutions from manifest

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit(nameRef.current.value, selectRef.current.value);
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <form onSubmit={handleSubmit}>
          <ModalHeader>Export</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Stack>
              <FormControl id="name" isRequired>
                <FormLabel>Enter File Name</FormLabel>
                <Input ref={nameRef} placeholder="Enter file name" />
              </FormControl>
              <FormControl id="quality" isRequired>
                <FormLabel>Select Video Quality</FormLabel>
                <Select ref={selectRef} placeholder="Select Video Quality">
                  <option value="240p">240p</option>
                  <option value="480p">480p</option>
                  <option value="1080p">1080p</option>
                </Select>
              </FormControl>
            </Stack>
          </ModalBody>

          <ModalFooter>
            <Button colorScheme="blue" mr={3} isLoading={loading} type="submit">
              Export
            </Button>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
