# Reduct Video Experiments

## Requirements

- Node 12.0.0 or higher
- Python 3.8 or higher
- Postgres
- Pipenv _(for installation, click [here](https://pipenv.pypa.io/en/latest/) )_

_Note: Setup environment variables for Database connection as seen in `video-overlay/demo/.env.example`_

## Installation

### Client

1. `cd client`
2. `yarn`

### Proxy

1. `cd proxy`
2. `yarn`

### Backend

1. `cd video-overlay`
2. `pipenv install`

## Quick Start

### Client

1. `cd client`
2. `yarn start`

### Proxy

1. `cd proxy`
2. `yarn start`

### Backend

1. `cd video-overlay`
2. `pipenv run python manage.py runserver`
