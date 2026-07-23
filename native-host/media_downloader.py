#!/usr/bin/env python3
"""
Media Stream Helper - Native Messaging Host
Handles downloading and concatenating HLS streams and video segments
"""

import sys
import json
import struct
import subprocess
import os
import tempfile
import re
import time
import hashlib
from urllib.parse import urljoin, urlparse
from pathlib import Path

# Native messaging protocol uses stdin/stdout with 4-byte length prefix

# Configuration
MAX_RETRY_ATTEMPTS = 5
RETRY_DELAYS = [2, 4, 8, 16, 32]  # Exponential backoff in seconds


def send_message(message):
    """Send a message to the Chrome extension"""
    encoded_message = json.dumps(message).encode('utf-8')
    sys.stdout.buffer.write(struct.pack('I', len(encoded_message)))
    sys.stdout.buffer.write(encoded_message)
    sys.stdout.buffer.flush()


def read_message():
    """Read a message from the Chrome extension"""
    text_length_bytes = sys.stdin.buffer.read(4)
    if len(text_length_bytes) == 0:
        sys.exit(0)
    
    text_length = struct.unpack('I', text_length_bytes)[0]
    text = sys.stdin.buffer.read(text_length).decode('utf-8')
    return json.loads(text)


def check_ffmpeg():
    """Check if FFmpeg is available"""
    try:
        result = subprocess.run(
            ['ffmpeg', '-version'],
            capture_output=True,
            timeout=5
        )
        return result.returncode == 0
    except (FileNotFoundError, subprocess.TimeoutExpired):
        return False


def is_network_error(error_message):
    """
    Determine if an error is network-related and should trigger a retry
    
    Args:
        error_message: Error message from FFmpeg or exception
    
    Returns:
        bool: True if error is network-related
    """
    if not error_message:
        return False
    
    error_lower = str(error_message).lower()
    network_indicators = [
        'connection refused',
        'connection timed out',
        'connection reset',
        'could not resolve host',
        'i/o error',
        'protocol error',
        'server returned',
        'connection failed',
        'network is unreachable',
        'temporary failure in name resolution',
        'errno',
        'timeout',
    ]
    
    # Don't retry on authentication or permission errors
    non_retry_indicators = [
        '403',
        '404',
        '401',
        'forbidden',
        'unauthorized',
        'not found',
    ]
    
    # Check if it's a non-retryable error first
    for indicator in non_retry_indicators:
        if indicator in error_lower:
            return False
    
    # Check if it's a network error
    for indicator in network_indicators:
        if indicator in error_lower:
            return True
    
    return False


def get_state_file_path(url, output_path):
    """
    Generate a unique state file path for a download
    
    Args:
        url: Download URL
        output_path: Output file path
    
    Returns:
        str: Path to state file
    """
    # Create hash from URL and output path
    state_id = hashlib.md5(f"{url}{output_path}".encode()).hexdigest()[:16]
    return os.path.join(tempfile.gettempdir(), f"download_state_{state_id}.json")


def save_download_state(url, output_path, headers, media_type, attempt):
    """
    Save download state to temporary file for resume capability
    
    Args:
        url: Download URL
        output_path: Output file path
        headers: HTTP headers
        media_type: Media type
        attempt: Current attempt number
    """
    try:
        state = {
            'url': url,
            'output_path': output_path,
            'headers': headers,
            'media_type': media_type,
            'attempt': attempt,
            'timestamp': time.time()
        }
        
        state_file = get_state_file_path(url, output_path)
        with open(state_file, 'w') as f:
            json.dump(state, f)
    except Exception as e:
        # State saving is not critical, just log error
        print(f"Warning: Could not save download state: {e}", file=sys.stderr)


def load_download_state(url, output_path):
    """
    Load download state from temporary file
    
    Args:
        url: Download URL
        output_path: Output file path
    
    Returns:
        dict: Download state or None if not found
    """
    try:
        state_file = get_state_file_path(url, output_path)
        if os.path.exists(state_file):
            with open(state_file, 'r') as f:
                return json.load(f)
    except Exception as e:
        print(f"Warning: Could not load download state: {e}", file=sys.stderr)
    return None


def clear_download_state(url, output_path):
    """
    Clear download state file after successful completion
    
    Args:
        url: Download URL
        output_path: Output file path
    """
    try:
        state_file = get_state_file_path(url, output_path)
        if os.path.exists(state_file):
            os.remove(state_file)
    except Exception as e:
        print(f"Warning: Could not clear download state: {e}", file=sys.stderr)


def download_with_ffmpeg(url, output_path, headers=None, progress_callback=None, is_hls=False):
    """
    Download a media file using FFmpeg
    
    Args:
        url: URL to download
        output_path: Output file path
        headers: Dictionary of HTTP headers
        progress_callback: Function to call with progress updates
        is_hls: Whether this is an HLS stream (enables reconnection)
    
    Returns:
        dict with success status and message
    """
    try:
        # Build FFmpeg command
        cmd = ['ffmpeg']
        
        # Add reconnection options for streaming content
        if is_hls:
            cmd.extend([
                '-reconnect', '1',
                '-reconnect_streamed', '1',
                '-reconnect_delay_max', '5'
            ])
        
        # Add connection timeout (30 seconds in microseconds)
        cmd.extend(['-timeout', '30000000'])
        
        # Add headers
        if headers:
            if 'User-Agent' in headers:
                cmd.extend(['-user_agent', headers['User-Agent']])
            
            if 'Referer' in headers:
                cmd.extend(['-headers', f"Referer: {headers['Referer']}"])
            elif 'referer' in headers:
                cmd.extend(['-headers', f"Referer: {headers['referer']}"])
        
        # Input URL
        cmd.extend(['-i', url])
        
        # Copy streams (no re-encoding)
        cmd.extend(['-c', 'copy'])
        
        # Overwrite output file
        cmd.extend(['-y'])
        
        # Output file
        cmd.append(output_path)
        
        # Log the command for debugging
        cmd_str = ' '.join([f'"{arg}"' if ' ' in str(arg) else str(arg) for arg in cmd])
        if progress_callback:
            progress_callback({
                'status': 'starting',
                'message': f'FFmpeg command: {cmd_str[:200]}...'
            })
        
        # Send progress update
        if progress_callback:
            progress_callback({'status': 'downloading', 'message': 'Starting download...'})
        
        # Run FFmpeg
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            universal_newlines=True
        )
        
        # Collect all stderr output for both progress and error reporting
        stderr_lines = []
        
        # Read stderr for progress (FFmpeg outputs to stderr)
        for line in process.stderr:
            stderr_lines.append(line)
            # Parse FFmpeg progress lines
            if progress_callback and ('time=' in line or 'frame=' in line):
                progress_callback({
                    'status': 'downloading',
                    'message': line.strip()
                })
        
        # Wait for completion
        process.wait()
        
        if process.returncode == 0:
            file_size = os.path.getsize(output_path)
            return {
                'success': True,
                'message': f'Downloaded successfully ({file_size} bytes)',
                'output_path': output_path,
                'file_size': file_size
            }
        else:
            # Use collected stderr output for error message (last 20 lines)
            if stderr_lines:
                stderr_output = ''.join(stderr_lines[-20:])
            else:
                stderr_output = 'No error output available (process may not have started)'
            
            # Create detailed error message
            error_message = f'FFmpeg failed (exit code {process.returncode}):\n{stderr_output}'
            
            # Log full command for debugging
            cmd_str = ' '.join([f'"{arg}"' if ' ' in str(arg) else str(arg) for arg in cmd])
            
            return {
                'success': False,
                'message': error_message,
                'command': cmd_str,
                'is_network_error': is_network_error(error_message)
            }
    
    except Exception as e:
        error_message = f'Error: {str(e)}'
        return {
            'success': False,
            'message': error_message,
            'is_network_error': is_network_error(error_message)
        }


def download_with_retry(download_func, url, output_path, headers=None, media_type='unknown', 
                        progress_callback=None, max_retries=MAX_RETRY_ATTEMPTS, is_hls=False):
    """
    Wrapper function that adds automatic retry with exponential backoff
    
    Args:
        download_func: The download function to call
        url: Download URL
        output_path: Output file path
        headers: HTTP headers
        media_type: Media type string
        progress_callback: Progress callback function
        max_retries: Maximum number of retry attempts
        is_hls: Whether this is an HLS stream
    
    Returns:
        dict: Result from download function
    """
    attempt = 0
    last_error = None
    
    while attempt < max_retries:
        attempt += 1
        
        # Save state for potential resume
        save_download_state(url, output_path, headers, media_type, attempt)
        
        # Notify about attempt
        if progress_callback:
            if attempt == 1:
                progress_callback({
                    'status': 'downloading',
                    'message': f'Starting download... (attempt {attempt}/{max_retries})'
                })
            else:
                progress_callback({
                    'status': 'retrying',
                    'message': f'Retrying download... (attempt {attempt}/{max_retries})',
                    'attempt': attempt,
                    'max_attempts': max_retries
                })
        
        # Attempt download
        result = download_func(url, output_path, headers, progress_callback, is_hls)
        
        # Success!
        if result.get('success'):
            # Clear state file on success
            clear_download_state(url, output_path)
            return result
        
        # Check if error is network-related
        last_error = result.get('message', 'Unknown error')
        is_net_error = result.get('is_network_error', False)
        
        if not is_net_error:
            # Not a network error, don't retry
            if progress_callback:
                progress_callback({
                    'status': 'failed',
                    'message': f'Download failed (non-retryable error): {last_error}'
                })
            return result
        
        # Network error - retry if attempts remain
        if attempt < max_retries:
            delay = RETRY_DELAYS[min(attempt - 1, len(RETRY_DELAYS) - 1)]
            
            if progress_callback:
                progress_callback({
                    'status': 'waiting',
                    'message': f'Network error, retrying in {delay}s... (attempt {attempt}/{max_retries})',
                    'delay': delay,
                    'attempt': attempt,
                    'max_attempts': max_retries
                })
            
            time.sleep(delay)
        else:
            # Max retries reached
            if progress_callback:
                progress_callback({
                    'status': 'failed',
                    'message': f'Download failed after {max_retries} attempts: {last_error}'
                })
    
    # All retries exhausted
    return {
        'success': False,
        'message': f'Download failed after {max_retries} attempts. Last error: {last_error}',
        'attempts': max_retries
    }


def parse_m3u8(content, base_url):
    """
    Parse M3U8 playlist content
    
    Args:
        content: M3U8 file content
        base_url: Base URL for resolving relative URLs
    
    Returns:
        list of segment URLs or variant playlists
    """
    segments = []
    is_master_playlist = False
    
    for line in content.split('\n'):
        line = line.strip()
        
        # Check for master playlist indicator
        if line.startswith('#EXT-X-STREAM-INF'):
            is_master_playlist = True
        
        # Skip comments and empty lines
        if not line or line.startswith('#'):
            continue
        
        # This is a URL
        if line:
            # Resolve relative URLs
            if line.startswith('http'):
                segments.append(line)
            else:
                segments.append(urljoin(base_url, line))
    
    return {
        'segments': segments,
        'is_master': is_master_playlist
    }


def download_hls_stream(url, output_path, headers=None, progress_callback=None):
    """
    Download HLS stream (.m3u8) and all segments, then concatenate
    
    Args:
        url: M3U8 playlist URL
        output_path: Final output file path
        headers: HTTP headers dictionary
        progress_callback: Function to call with progress updates
    
    Returns:
        dict with success status and message
    """
    try:
        # For HLS, FFmpeg handles everything - just use it directly
        # FFmpeg will automatically download all segments and merge them
        
        if progress_callback:
            progress_callback({
                'status': 'analyzing',
                'message': 'Analyzing HLS playlist...'
            })
        
        # Use retry wrapper with HLS-specific options enabled
        result = download_with_retry(
            download_with_ffmpeg,
            url,
            output_path,
            headers,
            'HLS',
            progress_callback,
            is_hls=True
        )
        
        return result
    
    except Exception as e:
        error_message = f'Error downloading HLS stream: {str(e)}'
        return {
            'success': False,
            'message': error_message,
            'is_network_error': is_network_error(error_message)
        }


def handle_download_request(request):
    """Handle a download request from the extension"""
    try:
        action = request.get('action')
        
        if action == 'check_ffmpeg':
            # Check if FFmpeg is available
            available = check_ffmpeg()
            send_message({
                'success': True,
                'ffmpeg_available': available
            })
            return
        
        elif action == 'download':
            url = request.get('url')
            output_path = request.get('output_path')
            headers = request.get('headers', {})
            media_type = request.get('media_type', 'unknown')
            max_retries = request.get('max_retries', MAX_RETRY_ATTEMPTS)
            
            if not url or not output_path:
                send_message({
                    'success': False,
                    'message': 'Missing required parameters: url or output_path'
                })
                return
            
            # Progress callback to send updates
            def progress_callback(progress):
                send_message({
                    'type': 'progress',
                    **progress
                })
            
            # Download based on media type (with retry)
            if media_type == 'HLS' or url.lower().endswith('.m3u8'):
                result = download_hls_stream(url, output_path, headers, progress_callback)
            else:
                # Use retry wrapper for non-HLS downloads too
                result = download_with_retry(
                    download_with_ffmpeg,
                    url,
                    output_path,
                    headers,
                    media_type,
                    progress_callback,
                    max_retries=max_retries,
                    is_hls=False
                )
            
            # Send final result
            send_message({
                'type': 'result',
                **result
            })
        
        elif action == 'resume_download':
            # Resume a previously failed download
            url = request.get('url')
            output_path = request.get('output_path')
            
            if not url or not output_path:
                send_message({
                    'success': False,
                    'message': 'Missing required parameters: url or output_path'
                })
                return
            
            # Try to load previous state
            state = load_download_state(url, output_path)
            
            if state:
                # Resume with saved parameters
                headers = state.get('headers', {})
                media_type = state.get('media_type', 'unknown')
                
                # Progress callback
                def progress_callback(progress):
                    send_message({
                        'type': 'progress',
                        **progress
                    })
                
                progress_callback({
                    'status': 'resuming',
                    'message': f'Resuming download from attempt {state.get("attempt", 0)}...'
                })
                
                # Resume download
                if media_type == 'HLS' or url.lower().endswith('.m3u8'):
                    result = download_hls_stream(url, output_path, headers, progress_callback)
                else:
                    result = download_with_retry(
                        download_with_ffmpeg,
                        url,
                        output_path,
                        headers,
                        media_type,
                        progress_callback,
                        is_hls=False
                    )
                
                send_message({
                    'type': 'result',
                    **result
                })
            else:
                # No saved state found, start fresh
                send_message({
                    'success': False,
                    'message': 'No saved download state found. Starting new download instead.'
                })
        
        else:
            send_message({
                'success': False,
                'message': f'Unknown action: {action}'
            })
    
    except Exception as e:
        send_message({
            'success': False,
            'message': f'Error handling request: {str(e)}'
        })


def main():
    """Main entry point for native messaging host"""
    try:
        # Read and handle messages in a loop
        while True:
            message = read_message()
            handle_download_request(message)
    
    except Exception as e:
        # Send error message
        send_message({
            'success': False,
            'message': f'Fatal error: {str(e)}'
        })
        sys.exit(1)


if __name__ == '__main__':
    main()
