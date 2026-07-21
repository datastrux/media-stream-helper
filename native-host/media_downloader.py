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
from urllib.parse import urljoin, urlparse
from pathlib import Path

# Native messaging protocol uses stdin/stdout with 4-byte length prefix


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


def download_with_ffmpeg(url, output_path, headers=None, progress_callback=None):
    """
    Download a media file using FFmpeg
    
    Args:
        url: URL to download
        output_path: Output file path
        headers: Dictionary of HTTP headers
        progress_callback: Function to call with progress updates
    
    Returns:
        dict with success status and message
    """
    try:
        # Build FFmpeg command
        cmd = ['ffmpeg']
        
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
        
        # Read stderr for progress (FFmpeg outputs to stderr)
        for line in process.stderr:
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
            stderr_output = process.stderr.read() if process.stderr else 'Unknown error'
            return {
                'success': False,
                'message': f'FFmpeg error (exit code {process.returncode}): {stderr_output}'
            }
    
    except Exception as e:
        return {
            'success': False,
            'message': f'Error: {str(e)}'
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
        
        result = download_with_ffmpeg(url, output_path, headers, progress_callback)
        
        return result
    
    except Exception as e:
        return {
            'success': False,
            'message': f'Error downloading HLS stream: {str(e)}'
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
            
            # Download based on media type
            if media_type == 'HLS' or url.lower().endswith('.m3u8'):
                result = download_hls_stream(url, output_path, headers, progress_callback)
            else:
                result = download_with_ffmpeg(url, output_path, headers, progress_callback)
            
            # Send final result
            send_message({
                'type': 'result',
                **result
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
