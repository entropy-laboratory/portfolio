'use strict';

// Add the JavaScript code here or link to external JS file
document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    const audioPlayer = document.getElementById('audioPlayer');
    const playPauseBtn = document.getElementById('playPauseBtn');
    const stopBtn = document.getElementById('stopBtn');
    const progressBar = document.querySelector('.progress-bar');
    const progressFill = document.querySelector('.progress-fill');
    const currentTimeSpan = document.querySelector('.current-time');
    const totalTimeSpan = document.querySelector('.total-time');
    const volumeSlider = document.querySelector('.volume-slider');
    const volumeFill = document.querySelector('.volume-fill');
    
    let isPlaying = false;
    let currentVolume = 0.7; // Default volume (70%)
    
    // Initialize volume
    audioPlayer.volume = currentVolume;
    updateVolumeDisplay();
    
    // Play/Pause functionality
    playPauseBtn.addEventListener('click', function() {
        if (isPlaying) {
            audioPlayer.pause();
            playPauseBtn.innerHTML = '<ion-icon name="play-outline"></ion-icon>';
            isPlaying = false;
        } else {
            audioPlayer.play();
            playPauseBtn.innerHTML = '<ion-icon name="pause-outline"></ion-icon>';
            isPlaying = true;
        }
    });
    
    // Stop functionality
    stopBtn.addEventListener('click', function() {
        audioPlayer.pause();
        audioPlayer.currentTime = 0;
        playPauseBtn.innerHTML = '<ion-icon name="play-outline"></ion-icon>';
        isPlaying = false;
        updateProgress();
    });
    
    // Volume control
    volumeSlider.addEventListener('click', function(e) {
        const rect = volumeSlider.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const width = rect.width;
        const newVolume = clickX / width;
        
        // Ensure volume is between 0 and 1
        currentVolume = Math.max(0, Math.min(1, newVolume));
        audioPlayer.volume = currentVolume;
        updateVolumeDisplay();
    });
    
    // Progress bar control
    progressBar.addEventListener('click', function(e) {
        if (audioPlayer.duration) {
            const rect = progressBar.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const width = rect.width;
            const newTime = (clickX / width) * audioPlayer.duration;
            audioPlayer.currentTime = newTime;
        }
    });
    
    // Update progress bar and time
    audioPlayer.addEventListener('timeupdate', updateProgress);
    
    // Update total time when metadata loads
    audioPlayer.addEventListener('loadedmetadata', function() {
        totalTimeSpan.textContent = formatTime(audioPlayer.duration);
    });
    
    // Reset play button when audio ends
    audioPlayer.addEventListener('ended', function() {
        playPauseBtn.innerHTML = '<ion-icon name="play-outline"></ion-icon>';
        isPlaying = false;
        audioPlayer.currentTime = 0;
        updateProgress();
    });
    
    // Update progress bar and current time
    function updateProgress() {
        if (audioPlayer.duration) {
            const progress = (audioPlayer.currentTime / audioPlayer.duration) * 100;
            progressFill.style.width = progress + '%';
            currentTimeSpan.textContent = formatTime(audioPlayer.currentTime);
        }
    }
    
    // Update volume display
    function updateVolumeDisplay() {
        const volumePercent = currentVolume * 100;
        volumeFill.style.width = volumePercent + '%';
        
        // Update volume icon based on volume level
        const volumeIcon = document.querySelector('.volume-control ion-icon');
        if (currentVolume === 0) {
            volumeIcon.setAttribute('name', 'volume-mute-outline');
        } else if (currentVolume < 0.5) {
            volumeIcon.setAttribute('name', 'volume-low-outline');
        } else {
            volumeIcon.setAttribute('name', 'volume-medium-outline');
        }
    }
    
    // Format time in MM:SS format
    function formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return minutes + ':' + (remainingSeconds < 10 ? '0' : '') + remainingSeconds;
    }
    
    // Optional: Add drag functionality for volume slider
    let isDraggingVolume = false;
    
    volumeSlider.addEventListener('mousedown', function(e) {
        isDraggingVolume = true;
        updateVolumeFromEvent(e);
    });
    
    document.addEventListener('mousemove', function(e) {
        if (isDraggingVolume) {
            updateVolumeFromEvent(e);
        }
    });
    
    document.addEventListener('mouseup', function() {
        isDraggingVolume = false;
    });
    
    function updateVolumeFromEvent(e) {
        const rect = volumeSlider.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const width = rect.width;
        const newVolume = Math.max(0, Math.min(1, clickX / width));
        
        currentVolume = newVolume;
        audioPlayer.volume = currentVolume;
        updateVolumeDisplay();
    }
    
    // Optional: Add drag functionality for progress bar
    let isDraggingProgress = false;
    
    progressBar.addEventListener('mousedown', function(e) {
        isDraggingProgress = true;
        updateProgressFromEvent(e);
    });
    
    document.addEventListener('mousemove', function(e) {
        if (isDraggingProgress) {
            updateProgressFromEvent(e);
        }
    });
    
    document.addEventListener('mouseup', function() {
        isDraggingProgress = false;
    });
    
    function updateProgressFromEvent(e) {
        if (audioPlayer.duration) {
            const rect = progressBar.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const width = rect.width;
            const newTime = Math.max(0, Math.min(audioPlayer.duration, (clickX / width) * audioPlayer.duration));
            audioPlayer.currentTime = newTime;
        }
    }
});