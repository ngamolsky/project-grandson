# Claude Desktop Vision Assistant

A Python-based desktop application that uses Claude 3.5 Sonnet to analyze your screen in real-time through screenshots and answer questions about what it sees.

## Features

- Real-time screen capture at configurable intervals
- Powered by Claude 3.5 Sonnet via Open Interpreter
- Interactive CLI interface for asking questions about your screen
- Temporary screenshot storage for privacy
- Conversation history tracking

## Prerequisites

- Python 3.12 or higher
- UV package manager

## Installation

1. Clone the repository:

```bash
cd claude-desktop
```

2. Create a virtual environment and install dependencies using UV:

```bash
uv sync
```

3. Create a `.env` file in the project root and add your API credentials:

```bash
ANTHROPIC_API_KEY=<your-anthropic-api-key>
```

4. Run the application:

```bash
uv run main.py
```

The application will:

1. Start capturing screenshots at regular intervals (default: every 60 seconds)
2. Present an interactive prompt where you can ask questions about what's on your screen
3. Analyze the most recent screenshot(s) using Claude 3.5 Sonnet
4. Provide detailed responses about the content of your screen

Example questions you can ask:

- "What applications are open on my screen?"
- "Can you describe the main content visible?"
- "What text is visible in the top-right corner?"

To exit the application, type 'exit', 'quit', or 'q'.

## Configuration

Key configuration options can be found in `vision_claude.py`:

- `CLAUDE_MODEL`: The Claude model version to use
- `NUM_SCREENSHOTS_TO_SEND`: Number of recent screenshots to maintain
- `SCREENSHOT_INTERVAL`: Time between screenshots (in seconds)

## Project Structure

claude-desktop/
├── README.md # Project documentation
├── pyproject.toml # Project dependencies and metadata
├── main.py # Application entry point
├── vision_claude.py # Core functionality
└── .env # API credentials (create this file)

## Dependencies

The project uses the following main dependencies:

- open-interpreter: For Claude API integration
- pillow: For image handling
- pyautogui: For screen capture
- python-dotenv: For environment variable management
