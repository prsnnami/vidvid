import { useRef, useState } from 'react';
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
  Spinner,
  Stack,
} from '@chakra-ui/react';
import { FaCaretDown } from 'react-icons/fa';
import { useQuery } from 'react-query';

export default function SaveModal({ isOpen, onClose, onSubmit, loading }) {
  const nameRef = useRef();
  const newClientNameRef = useRef();
  const [client, setClient] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit(
      nameRef.current.value,
      newClientNameRef.current ? newClientNameRef.current.value : null,
      client
    );
  }

  // const clientsQuery = useQuery('clients', async function () {
  //   return await fetch('/borderer/clients').then(res => res.json());
  // });
  const clientsQuery = useQuery(['clients'], async () => {
    return await fetch('/borderer/clients/')
      .then(res => {
        if (!res.ok) {
          throw new Error('Not 2xx response');
        } else {
          return res.json();
        }
      })
      .catch(e => {
        throw e;
      });
  });

  console.log(clientsQuery);

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <form onSubmit={handleSubmit}>
          <ModalHeader>Save Project</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Stack>
              <FormControl id="name" isRequired>
                <FormLabel>Enter Project Name</FormLabel>
                <Input ref={nameRef} placeholder="Enter file name" />
              </FormControl>

              <FormControl id="client" isRequired>
                <FormLabel>Select Client</FormLabel>
                <Select
                  placeholder="Select Client"
                  isDisabled={clientsQuery.isLoading}
                  icon={clientsQuery.isLoading ? <Spinner /> : <FaCaretDown />}
                  onChange={e => setClient(e.target.value)}
                  required
                >
                  {clientsQuery.data?.map(client => (
                    <option value={client.id} key={client.id}>
                      {client.client_name}
                    </option>
                  ))}
                  <option value="create-new-client">Create New Client</option>
                </Select>
              </FormControl>
              {client === 'create-new-client' && (
                <FormControl id="client_name" isRequired>
                  <FormLabel>Enter Client Name</FormLabel>
                  <Input
                    ref={newClientNameRef}
                    placeholder="Enter Client name"
                  />
                </FormControl>
              )}
            </Stack>
          </ModalBody>

          <ModalFooter>
            <Button colorScheme="teal" mr={3} isLoading={loading} type="submit">
              Save
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
