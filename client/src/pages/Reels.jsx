import { Button } from '@chakra-ui/button';
import { Image } from '@chakra-ui/image';
import {
  Box,
  Flex,
  Heading,
  SimpleGrid,
  Stack,
  Text,
  Grid,
} from '@chakra-ui/layout';
import { Spinner } from '@chakra-ui/spinner';
import React from 'react';
import { useQuery } from 'react-query';

async function getReels() {
  return fetch('/borderer/get_reels').then(res => res.json());
}

export default function Reels() {
  const reelsQuery = useQuery('reels', getReels, {
    // Refetch the data every second
    refetchInterval: 5000,
  });

  return (
    <Box px="4" pt="6">
      <Heading>Reels</Heading>
      <Box pt={4}>
        {reelsQuery.isLoading ? (
          <Flex h="300px" justifyContent="center" alignItems="center">
            <Spinner />
          </Flex>
        ) : Object.keys(reelsQuery.data).length === 0 ? (
          <Text>No Reels</Text>
        ) : (
          <Grid
            gap={8}
            templateColumns="repeat(auto-fit, 200px)"
            autoFlow="dense"
            flexGrow={1}
            pt={2}
            wrap="wrap"
          >
            {Object.keys(reelsQuery.data).map(reel => (
              <Stack spacing="2" key={reel}>
                <Flex
                  height="200px"
                  w="200px"
                  key={reel}
                  bgColor="gray.400"
                  justifyContent="center"
                  alignItems="center"
                >
                  {reelsQuery.data[reel].thumbnail ? (
                    <Image
                      src={'/borderer' + reelsQuery.data[reel].thumbnail}
                      h="100%"
                      w="100%"
                      objectFit="cover"
                    />
                  ) : (
                    <Spinner />
                  )}
                </Flex>
                <Stack direction="row">
                  <Text>{reelsQuery.data[reel].name}</Text>
                  <Button
                    as="a"
                    target="_blank"
                    href={
                      '/borderer/download?file=' +
                      encodeURIComponent(reelsQuery.data[reel].output)
                    }
                    disabled={!reelsQuery.data[reel].output}
                  >
                    Download
                  </Button>
                </Stack>
              </Stack>
            ))}
          </Grid>
        )}
      </Box>
    </Box>
  );
}
