from functools import partial
import sys
import urllib.request
import argparse
from multiprocessing import Pool
import os
import requests

# Initiate the parser


# def download_chunk(hash, url):
#     if not os.path.isdir('chunks/'+hash):
#         os.makedirs('chunks/'+hash)

#     urllib.request.urlretrieve(
#         f'{url}dash/{hash}/init-stream0.m4s', f'chunks/{hash}/init-stream0.m4s')
#     urllib.request.urlretrieve(
#         f'{url}dash/{hash}/chunk-stream0-00001.m4s', f'chunks/{hash}/chunk-stream0-00001.m4s')

def download_chunk(hash, url, id):
    print('started fetching chunk' + hash)
    if not os.path.isdir(f'tmp/{id}/chunks/'+hash):
        os.makedirs(f'tmp/{id}/chunks/'+hash)

    init = requests.get(f'{url}/dash/{hash}/init-stream0.m4s')
    chunk = requests.get(f'{url}/dash/{hash}/chunk-stream0-00001.m4s')
    f = open(f'tmp/{id}/chunks/{hash}/{hash}.mp4', 'wb')
    f.write(init.content)
    f.write(chunk.content)
    f.close()
    print('fetched chunk ' + hash)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()

    parser.add_argument("--url", "-u", help="URL")
    parser.add_argument("--hashes", "-s",  help="Hashes")
    parser.add_argument("--id", "-i",  help="Id")

    args = parser.parse_args()
    if(args.url and args.hashes):
        hashes = args.hashes.split(',')
        partial_download_chunk = partial(
            download_chunk, url=args.url, id=args.id)
        pool = Pool()
        pool.map(partial_download_chunk, hashes)
        # pool.map(partial_download_chunk, enumerate(hashes))
