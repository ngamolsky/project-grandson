"""Image processing and management components."""

import base64
import io
import time
from collections import deque
from typing import Dict, List

from loguru import logger
from PIL import Image
from pipecat.frames.frames import (
    Frame,
    ImageRawFrame,
    LLMFullResponseEndFrame,
    LLMMessagesFrame,
    TextFrame,
)
from pipecat.processors.frame_processor import FrameDirection, FrameProcessor


class ImageManager:
    def __init__(self, max_summary_length: int = 4000, max_recent_frames: int = 10):
        self.recent_frames = deque(maxlen=max_recent_frames)
        self.unsummarized_frames = deque()
        self.narrative_summary = ""
        self.max_summary_length = max_summary_length
        logger.debug("ImageManager initialized with narrative focus")

    def add_frame(self, frame: ImageRawFrame) -> None:
        self.recent_frames.append(frame)
        self.unsummarized_frames.append(frame)

    def get_frames(self) -> List[ImageRawFrame]:
        logger.debug(f"Retrieving {len(self.recent_frames)} image frames")
        return list(self.recent_frames)

    def get_unsummarized_frames(self) -> List[ImageRawFrame]:
        return list(self.unsummarized_frames)

    def clear_unsummarized_frames(self) -> None:
        self.unsummarized_frames.clear()

    def update_summary(self, new_text: str) -> None:
        # Update the narrative summary, keeping the most recent content
        timestamp = time.strftime("%H:%M:%S")
        new_entry = f"[{timestamp}] {new_text}"

        if self.narrative_summary:
            combined = f"{self.narrative_summary}\n{new_entry}"
        else:
            combined = new_entry

        # Keep the summary within length limits while preserving most recent entries
        if len(combined) > self.max_summary_length:
            # Split into entries and keep most recent ones
            entries = combined.split("\n")
            truncated = []
            current_length = 0

            for entry in reversed(entries):
                if current_length + len(entry) + 1 <= self.max_summary_length:
                    truncated.insert(0, entry)
                    current_length += len(entry) + 1
                else:
                    break

            self.narrative_summary = "\n".join(truncated)
        else:
            self.narrative_summary = combined

        logger.debug(f"Updated narrative summary: {len(self.narrative_summary)} chars")

    def get_summary(self) -> str:
        return self.narrative_summary

    def recent_images_to_llm_messages(self) -> List[Dict[str, str]]:
        """Convert image frames to base64-encoded content items."""
        content = []
        for frame in self.recent_frames:
            buffer = io.BytesIO()
            Image.frombytes(frame.format, frame.size, frame.image).save(
                buffer, format="JPEG"
            )
            encoded_image = base64.b64encode(buffer.getvalue()).decode("utf-8")

            content.append(
                {
                    "type": "image",
                    "source": {
                        "type": "base64",
                        "media_type": "image/jpeg",
                        "data": encoded_image,
                    },
                }
            )

        return content


class ImageFrameProcessor(FrameProcessor):
    def __init__(self, image_manager: ImageManager):
        super().__init__()
        self.image_manager = image_manager
        logger.debug("ImageFrameProcessor initialized")

    async def process_frame(self, frame: Frame, direction: FrameDirection):
        await super().process_frame(frame, direction)
        if isinstance(frame, ImageRawFrame):
            self.image_manager.add_frame(frame)
        await self.push_frame(frame, direction)


class SummarizeImageFrames(FrameProcessor):
    def __init__(
        self, image_manager: ImageManager, summary_interval_seconds: float = 2.0
    ):
        super().__init__()
        self.image_manager = image_manager
        self.summary_interval = summary_interval_seconds
        self.last_summary_time = 0
        self.pending_summary = False
        logger.debug(
            f"SummarizeImageFrames initialized with {summary_interval_seconds}s interval"
        )

    async def process_frame(self, frame: Frame, direction: FrameDirection):
        await super().process_frame(frame, direction)

        if isinstance(frame, ImageRawFrame):
            current_time = time.time()
            unsummarized_frames = self.image_manager.get_unsummarized_frames()

            should_summarize = (
                len(unsummarized_frames) > 0
                and current_time - self.last_summary_time >= self.summary_interval
                and not self.pending_summary
            )

            if should_summarize:
                self.pending_summary = True
                self.last_summary_time = current_time

                system_message = f"""
You are analyzing a continuous stream of screen captures. Provide a brief, focused update on what has changed.
Current narrative context:
{self.image_manager.get_summary()}

Guidelines:
- Focus only on what's new or different
- Be concise but specific
- Describe user actions and interface changes
- Use present tense
- Keep it to 1-2 sentences
"""

                summary_frame = LLMMessagesFrame(
                    messages=[
                        {"role": "system", "content": system_message},
                        {
                            "role": "user",
                            "content": self.image_manager.recent_images_to_llm_messages(),
                        },
                    ],
                )
                logger.debug(
                    "Created LLM messages frame for periodic image summarization"
                )
                await self.push_frame(summary_frame, direction)


class ProcessImageSummaryFrame(FrameProcessor):
    def __init__(
        self, image_manager: ImageManager, summarize_processor: SummarizeImageFrames
    ):
        super().__init__()
        self.current_summary = ""
        self.image_manager = image_manager
        self.summarize_processor = summarize_processor
        logger.debug("ProcessImageSummaryFrame initialized")

    async def process_frame(self, frame: Frame, direction: FrameDirection):
        await super().process_frame(frame, direction)
        if isinstance(frame, TextFrame):
            self.current_summary += frame.text

        if isinstance(frame, LLMFullResponseEndFrame):
            logger.debug("Received LLMFullResponseEndFrame")
            self.summarize_processor.pending_summary = False
            self.image_manager.update_summary(self.current_summary)
            self.image_manager.clear_unsummarized_frames()
            self.current_summary = ""
