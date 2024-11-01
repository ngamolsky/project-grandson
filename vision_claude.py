import logging
import os
import tempfile
import threading
import time
from datetime import datetime

import pyautogui
from dotenv import load_dotenv
from interpreter import interpreter

load_dotenv()

CLAUDE_MODEL = "claude-3-5-sonnet-20241022"
NUM_SCREENSHOTS_TO_SEND = 2
SCREENSHOT_INTERVAL = 60

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Disable other loggers
for log_name, log_obj in logging.Logger.manager.loggerDict.items():
    if log_name != __name__:
        if isinstance(log_obj, logging.Logger):
            log_obj.setLevel(logging.WARNING)


class VisionClaude:
    def __init__(self, screenshot_interval=SCREENSHOT_INTERVAL):
        interpreter.llm.model = CLAUDE_MODEL
        interpreter.auto_run = True
        logger.info(f"Initializing VisionClaude with model: {CLAUDE_MODEL}")

        self.interpreter = interpreter
        self.conversation_history = []
        self.screenshot_interval = screenshot_interval
        self.should_capture = True
        self.screenshot_thread = None
        self.screenshot_history = []

    def capture_screenshot(self):
        """Capture and save screenshot"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        screenshot = pyautogui.screenshot()

        # Save to temp directory
        temp_dir = tempfile.gettempdir()
        filepath = os.path.join(temp_dir, f"screenshot_{timestamp}.png")
        screenshot.save(filepath)
        logger.debug(f"Screenshot captured and saved to: {filepath}")
        return filepath

    def analyze_image(self, image_path, query=None):
        """Analyze screenshot using Open Interpreter"""
        if query is None:
            query = "What do you see in this image? Please describe it in detail."

        logger.debug(f"Analyzing image: {image_path}")
        logger.debug(f"Query: {query}")

        # Create the prompt for the interpreter
        prompt = f"""
        Analyze the screenshot at: {image_path}
        Question: {query}
        """

        response = self.interpreter.chat(prompt)
        logger.debug("Analysis complete")
        logger.debug(f"Response received: {response[:100]}...")  # Log first 100 chars

        self.conversation_history.append(
            {
                "query": query,
                "response": response,
                "image_path": image_path,
                "timestamp": datetime.now(),
            }
        )
        return response

    def start_auto_capture(self):
        """Start automatic screenshot capture in a separate thread"""
        logger.debug("Starting automatic screenshot capture")
        self.should_capture = True
        self.screenshot_thread = threading.Thread(target=self._auto_capture_loop)
        self.screenshot_thread.daemon = True  # Thread will stop when main program exits
        self.screenshot_thread.start()

    def stop_auto_capture(self):
        """Stop automatic screenshot capture"""
        logger.debug("Stopping automatic screenshot capture")
        self.should_capture = False

    def _auto_capture_loop(self):
        """Internal method to continuously capture screenshots"""
        logger.debug("Auto capture loop started")
        while self.should_capture:
            image_path = self.capture_screenshot()
            self.screenshot_history.append(
                {"path": image_path, "timestamp": datetime.now()}
            )
            # Remove old screenshots if we have more than NUM_SCREENSHOTS_TO_SEND
            while len(self.screenshot_history) > NUM_SCREENSHOTS_TO_SEND:
                old_screenshot = self.screenshot_history.pop(0)
                # Delete the file
                try:
                    os.remove(old_screenshot["path"])
                    logger.debug(f"Deleted old screenshot: {old_screenshot['path']}")
                except OSError as e:
                    logger.warning(f"Failed to delete old screenshot: {e}")
            logger.debug(f"Screenshot captured: {image_path}")
            time.sleep(self.screenshot_interval)

    def get_recent_screenshots(self, count=NUM_SCREENSHOTS_TO_SEND):
        """Get the most recent screenshot(s)"""
        return self.screenshot_history[-count:] if self.screenshot_history else []

    def interactive_session(self):
        """Start an interactive session"""
        logger.debug("Starting Vision Claude interactive session")
        self.start_auto_capture()  # Start automatic captures

        try:
            while True:
                user_input = input("\nYour question (or 'exit', 'quit', 'q' to quit): ")

                if user_input.lower() in ["exit", "quit", "q"]:
                    logger.info("Ending interactive session")
                    break

                # Get most recent screenshot and analyze it
                recent_screenshots = self.get_recent_screenshots()
                if recent_screenshots:
                    latest_screenshot = recent_screenshots[-1]
                    response = self.analyze_image(latest_screenshot["path"], user_input)
                    logger.debug(
                        f"Analysis of screenshot from {latest_screenshot['timestamp']}:"
                    )
                    logger.debug(response)
                else:
                    logger.warning(
                        "No screenshots available yet. Please wait a moment and try again."
                    )
        finally:
            # Ensure cleanup happens before exit
            self.stop_auto_capture()
