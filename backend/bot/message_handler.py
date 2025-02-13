"""Message handling and context management."""

from typing import List

from frame_processors.image_processor import ImageManager
from loguru import logger
from pipecat.frames.frames import ImageRawFrame
from pipecat.services.anthropic import AnthropicLLMContext


class MessageHandler:
    def __init__(self, context: AnthropicLLMContext, image_manager: ImageManager):
        self.context = context
        self.image_manager = image_manager
        logger.debug("MessageHandler initialized")

    async def handle_new_message(self, text: str, frames: List[ImageRawFrame]) -> None:
        """Process a new message with associated image frames."""
        if not frames:
            logger.debug("No frames provided, skipping message handling")
            return

        # Include the current summary in the context
        content = self.image_manager.recent_images_to_llm_messages()

        # Add current summary
        content.append({"type": "text", "text": self.image_manager.get_summary()})

        # Add user message
        content.append({"type": "text", "text": text})

        self.context.add_message({"role": "user", "content": content})

    def update_image_summaries(self, summary: str) -> None:
        """Update previous image-containing messages with their summaries."""
        if not self.context.messages:
            logger.debug("No messages to update summaries for")
            return

        updates = 0
        for i, msg in enumerate(self.context.messages):
            if (
                msg["role"] == "user"
                and isinstance(msg["content"], list)
                and msg["content"]
                and msg["content"][0].get("type") == "image"
            ):
                self.context.messages[i] = {
                    "role": "user",
                    "content": summary,
                }
                updates += 1
        logger.debug(f"Updated {updates} message(s) with image summaries")
