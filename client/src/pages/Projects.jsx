import { Box, Flex, Heading, Stack, Text } from '@chakra-ui/react';
import React from 'react';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';

export default function Projects() {
  const navigate = useNavigate();
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

  if (projectsQuery.isLoading) return <h1>Loading...</h1>;

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
      <Box>
        <Stack p="4">
          {projectsQuery.data?.map(project => (
            <Box
              key={project.id}
              boxShadow="md"
              rounded="md"
              p={8}
              cursor="pointer"
              bg="white"
              onClick={() => navigate('/project/' + project.id)}
            >
              <Heading size="lg" color="gray.600">
                {project.project_name}
              </Heading>
            </Box>
          ))}
        </Stack>
      </Box>
    </Box>
  );
}
