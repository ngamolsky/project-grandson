"""Configuration settings for the vision assistant."""

from dataclasses import dataclass


@dataclass
class VisionConfig:
    MAX_FRAMES: int = 2
    FRAMES_PER_SECOND: float = 0.2
    INTERRUPT_MESSAGE: str = "STOP"
    VOICE_ID: str = "79a125e8-cd45-4c13-8a67-188112f4dd22"
