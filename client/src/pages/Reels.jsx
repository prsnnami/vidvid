import { Button } from '@chakra-ui/button';
import { Image } from '@chakra-ui/image';
import { Box, Flex, Grid, Heading, Stack, Text } from '@chakra-ui/layout';
import { Spinner } from '@chakra-ui/spinner';
import React from 'react';
import { FaExclamationTriangle } from 'react-icons/fa';
import { useMutation, useQuery } from 'react-query';

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
              <Reel key={reel} reel={reelsQuery.data[reel]} id={reel} />
            ))}
          </Grid>
        )}
      </Box>
    </Box>
  );
}

function Reel({ reel, id }) {
  const deleteReelMutation = useMutation(async id => {
    return await fetch('/borderer/delete_reel', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id }),
    })
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

  function deleteReel(id) {
    if (window.confirm('Are You sure you want to delete this reel?')) {
      deleteReelMutation.mutate(id);
    }
  }

  return (
    <Stack spacing="2">
      <Flex
        height="200px"
        w="200px"
        bgColor="gray.400"
        justifyContent="center"
        alignItems="center"
      >
        {reel.thumbnail ? (
          <Image
            src={'/borderer' + reel.thumbnail}
            h="100%"
            w="100%"
            objectFit="cover"
          />
        ) : !reel.error ? (
          <Stack
            alignItems={'center'}
            justifyContent={'center'}
            flexDirection={'column'}
            color="white"
          >
            <Spinner />
            <Text>{reel.status}</Text>
          </Stack>
        ) : (
          <Stack
            alignItems={'center'}
            justifyContent={'center'}
            flexDirection={'column'}
            color="white"
          >
            <FaExclamationTriangle />
            <Text>{reel.error_message}</Text>
          </Stack>
        )}
      </Flex>
      <Stack>
        <Text>{reel.name}</Text>
        <Stack direction="row">
          <Button
            as="a"
            target="_blank"
            href={'/borderer/download?file=' + encodeURIComponent(reel.output)}
            disabled={!reel.output}
          >
            Download
          </Button>
          <Button
            isLoading={deleteReelMutation.isLoading}
            onClick={() => deleteReel(id)}
          >
            Delete
          </Button>
        </Stack>
      </Stack>
    </Stack>
  );
}
