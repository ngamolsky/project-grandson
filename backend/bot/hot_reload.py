import logging
import subprocess
import sys
import time
from pathlib import Path

from watchdog.events import FileSystemEventHandler
from watchdog.observers import Observer


class RestartHandler(FileSystemEventHandler):
    def __init__(self, process_manager):
        self.process_manager = process_manager
        self.last_restart = time.time()
        self.cooldown = 1  # Cooldown period in seconds

    def on_modified(self, event):
        if event.src_path.endswith(".py"):
            current_time = time.time()
            if current_time - self.last_restart >= self.cooldown:
                logging.info(f"File changed: {event.src_path}")
                self.process_manager.restart_process()
                self.last_restart = current_time


class ProcessManager:
    def __init__(self, main_file):
        self.main_file = main_file
        self.process = None

    def start_process(self):
        self.process = subprocess.Popen([sys.executable, self.main_file])

    def stop_process(self):
        if self.process:
            self.process.terminate()
            self.process.wait()

    def restart_process(self):
        logging.info("Restarting process...")
        self.stop_process()
        self.start_process()


def run_with_reload(main_file):
    logging.basicConfig(level=logging.INFO)

    # Get the directory containing the main file
    watch_path = Path(main_file).parent

    process_manager = ProcessManager(main_file)
    event_handler = RestartHandler(process_manager)

    observer = Observer()
    observer.schedule(event_handler, str(watch_path), recursive=True)
    observer.start()

    try:
        process_manager.start_process()
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
        process_manager.stop_process()

    observer.join()
