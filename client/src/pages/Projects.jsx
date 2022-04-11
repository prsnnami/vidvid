import {
  Box,
  Button,
  Flex,
  Heading,
  Stack,
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from '@chakra-ui/react';
import React from 'react';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';

function ProjectRow({ project }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const projectDeleteMutation = useMutation(async function ({ id }) {
    await fetch(`/borderer/projects/${id}/`, {
      method: 'DELETE',
    });
  });

  return (
    <Tr>
      <Td>{project.project_name}</Td>
      <Td>{project.client ? project.client.client_name : 'N/A'}</Td>
      <Td>
        <Stack direction="row">
          <Button size="sm" onClick={() => navigate('/project/' + project.id)}>
            View
          </Button>
          <Button
            size="sm"
            onClick={() =>
              projectDeleteMutation.mutate(
                { id: project.id },
                {
                  onSuccess: () => {
                    queryClient.invalidateQueries(['projects']);
                  },
                }
              )
            }
            isLoading={projectDeleteMutation.isLoading}
          >
            Delete
          </Button>
        </Stack>
      </Td>
    </Tr>
  );
}

export default function Projects() {
  const projectsQuery = useQuery('projects', async () => {
    return await fetch('/borderer/projects/')
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

  if (projectsQuery.isFetching) return <h1>Loading...</h1>;

  return (
    <Box bg="gray.200" h="100%">
      <Flex
        h="60px"
        alignItems="center"
        flexShrink="0"
        px="4"
        justifyContent="space-between"
        bg="teal.500"
      >
        <Heading color="white">Projects</Heading>
      </Flex>
      <Box p="6">
        <TableContainer
          bg="white"
          borderRadius={8}
          px="4"
          py="6"
          boxShadow={'xl'}
        >
          <Table colorScheme={'facebook'}>
            <Thead>
              <Tr>
                <Th>Project Name</Th>
                <Th w="20%">Client</Th>
                <Th w="10%">Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {projectsQuery.data?.length > 0 ? (
                projectsQuery.data?.map(project => (
                  <ProjectRow project={project} />
                ))
              ) : (
                <Tr>
                  <Td colSpan={3} textAlign="center">
                    No Projects
                  </Td>
                </Tr>
              )}
            </Tbody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
}
