# Project Grandson

A modern desktop application that combines a Python backend with a frontend interface for enhanced interaction.

## Prerequisites

- Python 3.12 or higher
- [uv](https://github.com/astral-sh/uv) - Fast Python package installer and resolver

## Setup Instructions

### 1. Install UV

UV is a fast Python package installer and virtual environment manager. Install it using:

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

### 2. Start the Backend

Navigate to the backend directory and start the API:

```bash
cd backend
uv run api.py
```

The API will start and return a room URL that you can use for testing.

### 3. Testing

Join the returned room URL in your browser to test the backend functionality.

## Project Structure

```
.
├── backend/     # Python backend with API and bot functionality
└── frontend/    # Frontend application
```

## Development

The project uses modern development tools:
- Backend: FastAPI, pipecat, and various AI integrations
- Frontend: React-based UI

## Environment Variables

Make sure to set up your environment variables in `backend/.env` before running the application.


