#
# Copyright (c) 2024, Daily
#
# SPDX-License-Identifier: BSD 2-Clause License
#

import argparse
import asyncio
import os
from typing import Tuple

from config import VisionConfig
from dotenv import load_dotenv
from frame_processors.image_processor import (
    ImageFrameProcessor,
    ImageManager,
    ProcessImageSummaryFrame,
    SummarizeImageFrames,
)
from frame_processors.transcript_processor import TranscriptProcessor
from loguru import logger
from message_handler import MessageHandler
from pipecat.audio.vad.silero import SileroVADAnalyzer
from pipecat.frames.frames import (
    BotInterruptionFrame,
)
from pipecat.pipeline.parallel_pipeline import ParallelPipeline
from pipecat.pipeline.pipeline import Pipeline
from pipecat.pipeline.runner import PipelineRunner
from pipecat.pipeline.task import PipelineParams, PipelineTask
from pipecat.processors.frameworks.rtvi import (
    RTVIBotTranscriptionProcessor,
    RTVIUserTranscriptionProcessor,
)
from pipecat.services.anthropic import (
    AnthropicContextAggregatorPair,
    AnthropicLLMContext,
    AnthropicLLMService,
)
from pipecat.services.cartesia import CartesiaTTSService
from pipecat.transports.services.daily import DailyParams, DailyTransport


class VisionAssistant:
    def __init__(self):
        self.image_manager = ImageManager(
            max_summary_length=4000, max_recent_frames=VisionConfig.MAX_FRAMES
        )
        self.message_handler = None

        load_dotenv(override=True)
        logger.info("VisionAssistant initialized with narrative focus")

    async def initialize_services(
        self,
        room_url: str,
        token: str,
    ) -> Tuple[DailyTransport, CartesiaTTSService, AnthropicLLMService]:
        logger.info(f"Initializing services for room: {room_url}")

        transport = DailyTransport(
            room_url,
            token,
            "Respond bot",
            DailyParams(
                audio_out_enabled=True,
                transcription_enabled=True,
                vad_enabled=True,
                vad_analyzer=SileroVADAnalyzer(),
            ),
        )
        logger.debug("Daily transport initialized")

        tts = CartesiaTTSService(
            api_key=os.getenv("CARTESIA_API_KEY"),
            voice_id=VisionConfig.VOICE_ID,
        )
        logger.debug("TTS service initialized")

        llm = AnthropicLLMService(
            api_key=os.getenv("ANTHROPIC_API_KEY"),
            model="claude-3-5-sonnet-20240620",
            enable_prompt_caching_beta=True,
        )

        vision_llm = AnthropicLLMService(
            api_key=os.getenv("ANTHROPIC_API_KEY"),
            model="claude-3-5-sonnet-20240620",
            enable_prompt_caching_beta=True,
        )
        logger.debug("LLM services initialized")

        return transport, tts, llm, vision_llm

    async def setup_pipeline(
        self,
        transport: DailyTransport,
        tts: CartesiaTTSService,
        llm: AnthropicLLMService,
        vision_llm: AnthropicLLMService,
        context: AnthropicLLMContext,
    ) -> Tuple[PipelineTask, AnthropicContextAggregatorPair]:
        logger.info("Setting up pipeline...")
        llm_context_aggregator = llm.create_context_aggregator(context)

        self.message_handler = MessageHandler(context, self.image_manager)
        summarize_processor = SummarizeImageFrames(
            self.image_manager,
            summary_interval_seconds=2.0,  # More frequent updates
        )

        # Create the summarize processor first so we can pass it to ProcessImageSummaryFrame
        summarize_processor = SummarizeImageFrames(self.image_manager)

        pipeline = Pipeline(
            [
                transport.input(),
                ImageFrameProcessor(self.image_manager),
                ParallelPipeline(
                    # Main conversation pipeline
                    [
                        TranscriptProcessor(self.message_handler, self.image_manager),
                        RTVIUserTranscriptionProcessor(),
                        llm_context_aggregator.user(),
                        llm,  # LLM
                        RTVIBotTranscriptionProcessor(),
                        tts,  # TTS
                        transport.output(),  # Transport bot output
                        llm_context_aggregator.assistant(),  # Assistant spoken response
                    ],
                    # Continuous image summary pipeline
                    [
                        summarize_processor,
                        vision_llm,
                        ProcessImageSummaryFrame(
                            self.image_manager, summarize_processor
                        ),
                    ],
                ),
            ],
        )

        logger.debug("Pipeline configured with narrative focus")
        return PipelineTask(
            pipeline, PipelineParams(allow_interruptions=True, enable_metrics=True)
        ), llm_context_aggregator

    async def run(self, room_url: str, token: str):
        logger.info("Starting VisionAssistant...")
        transport, tts, llm, vision_llm = await self.initialize_services(
            room_url, token
        )

        context = self.setup_initial_context()
        task, context_aggregator = await self.setup_pipeline(
            transport, tts, llm, vision_llm, context
        )

        # Set up event handlers
        self.setup_event_handlers(transport, task, context_aggregator)

        # Run the pipeline
        logger.info("Starting pipeline runner...")
        runner = PipelineRunner()
        await runner.run(task)

    def setup_initial_context(self):
        logger.info("Setting up initial context...")
        system_prompt = """
        You are an AI assistant designed to help older individuals use applications on their smartphones or computers. 
        Your responses will be converted to audio and relayed back to the user, so they should be brief, clear, and conversational. 
        Always provide just one step at a time, waiting for the user's response before moving on to the next step.

        Be kind and patient.

        Your response will be turned into speech so use only simple words and punctuation.
        """

        anthropic_context = AnthropicLLMContext(
            messages=[
                {
                    "role": "user",
                    "content": system_prompt,
                },
                {
                    "role": "user",
                    "content": "Start the conversation by saying 'hello'.",
                },
            ],
        )

        # Initialize context setup code here
        logger.debug("Initial context created with system prompt and greeting")
        return anthropic_context

    def setup_event_handlers(
        self,
        transport: DailyTransport,
        task: PipelineTask,
        context_aggregator: AnthropicContextAggregatorPair,
    ) -> None:
        """Set up Daily transport event handlers for participa  nt management and messaging.

        Args:
            transport: The Daily transport instance
            task: The pipeline task instance
        """
        logger.info("Setting up event handlers...")

        @transport.event_handler("on_first_participant_joined")
        async def on_first_participant_joined(transport, participant):
            participant_id = participant["id"]
            logger.info(f"First participant joined with ID: {participant_id}")

            # Start capturing participant's transcription and screen video
            await transport.capture_participant_transcription(participant_id)
            await transport.capture_participant_video(
                participant_id,
                framerate=VisionConfig.FRAMES_PER_SECOND,
                video_source="screenVideo",
            )
            logger.debug("Started capturing participant transcription and video")

            # Initialize the conversation
            context_frame = context_aggregator.user().get_context_frame()
            await task.queue_frames([context_frame])
            logger.debug("Queued initial context frame")

        @transport.event_handler("on_app_message")
        async def on_app_message(transport, message, sender):
            logger.debug(f"Received app message: {message}")

            message_text = message.get("message", "")
            frames = self.image_manager.get_frames()

            if not frames:
                logger.debug("No image frames available")
                return

            # Handle interruption message
            if message_text == VisionConfig.INTERRUPT_MESSAGE:
                logger.info("Processing interruption request")
                await task.queue_frames([BotInterruptionFrame()])
                return

            await self.message_handler.handle_new_message(message_text, frames)

            context_frame = context_aggregator.user().get_context_frame()
            await task.queue_frames([context_frame])
            logger.debug("Queued message context frame for processing")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Project Grandson")
    parser.add_argument("--room-url", type=str, help="Room URL")
    parser.add_argument("--token", type=str, help="Daily token")
    parser.add_argument("--reload", action="store_true", help="Reload code on change")

    args = parser.parse_args()

    logger.info(f"Running with args: {args.room_url} {args.token} {args.reload}")

    assistant = VisionAssistant()
    asyncio.run(assistant.run(args.room_url, args.token))
