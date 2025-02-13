"""Transcript processing components."""

from frame_processors.image_processor import ImageManager, ImageRawFrame
from loguru import logger
from message_handler import MessageHandler
from pipecat.frames.frames import Frame, TranscriptionFrame
from pipecat.processors.frame_processor import FrameDirection, FrameProcessor


class TranscriptProcessor(FrameProcessor):
    def __init__(self, message_handler: MessageHandler, image_manager: ImageManager):
        super().__init__()
        self.message_handler = message_handler
        self.image_manager = image_manager

    async def process_frame(self, frame: Frame, direction: FrameDirection):
        await super().process_frame(frame, direction)

        # Block image frames from being processed by downstream processors
        if isinstance(frame, ImageRawFrame):
            return

        if isinstance(frame, TranscriptionFrame):
            logger.debug(f"Processing transcription frame: {frame.text}")
            await self.message_handler.handle_new_message(
                frame.text, self.image_manager.get_frames()
            )

        await self.push_frame(frame, direction)
