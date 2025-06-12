'use strict';

document.addEventListener('DOMContentLoaded', function () {
  const audioPlayer = document.getElementById('audioPlayer');
  const playPauseBtn = document.getElementById('playPauseBtn');
  const stopBtn = document.getElementById('stopBtn');
  const progressBar = document.querySelector('.progress-bar');
  const progressFill = document.querySelector('.progress-fill');
  const currentTimeSpan = document.querySelector('.current-time');
  const totalTimeSpan = document.querySelector('.total-time');
  const volumeSlider = document.querySelector('.volume-slider');
  const volumeFill = document.querySelector('.volume-fill');
  const musicTitle = document.querySelector('.music-title');
  const musicArtist = document.querySelector('.music-artist');
  const playlistItems = document.querySelectorAll('#playlist li');

  let isPlaying = false;
  let currentVolume = 0.7;

  // Set default volume
  audioPlayer.volume = currentVolume;
  updateVolumeDisplay();

  // Load and highlight selected track
  playlistItems.forEach(item => {
    item.addEventListener('click', function () {
      const source = this.getAttribute('data-src');
      const title = this.getAttribute('data-title');
      const artist = this.getAttribute('data-artist');

      audioPlayer.src = source;
      audioPlayer.load();
      musicTitle.textContent = title;
      musicArtist.textContent = artist;

      // Reset active class
      playlistItems.forEach(i => i.classList.remove('active'));
      this.classList.add('active');

      audioPlayer.play();
      isPlaying = true;
      playPauseBtn.innerHTML = '<ion-icon name="pause-outline"></ion-icon>';
    });
  });

  playPauseBtn.addEventListener('click', function () {
    if (!audioPlayer.src) return;

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

  stopBtn.addEventListener('click', function () {
    audioPlayer.pause();
    audioPlayer.currentTime = 0;
    playPauseBtn.innerHTML = '<ion-icon name="play-outline"></ion-icon>';
    isPlaying = false;
    updateProgress();
  });

  volumeSlider.addEventListener('click', function (e) {
    const rect = volumeSlider.getBoundingClientRect();
    const newVolume = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    currentVolume = newVolume;
    audioPlayer.volume = currentVolume;
    updateVolumeDisplay();
  });

  function updateVolumeDisplay() {
    const volumePercent = currentVolume * 100;
    volumeFill.style.width = volumePercent + '%';
    const icon = document.querySelector('.volume-control ion-icon');
    icon.setAttribute('name',
      currentVolume === 0 ? 'volume-mute-outline' :
      currentVolume < 0.5 ? 'volume-low-outline' :
      'volume-medium-outline'
    );
  }

  audioPlayer.addEventListener('timeupdate', updateProgress);
  audioPlayer.addEventListener('loadedmetadata', function () {
    totalTimeSpan.textContent = formatTime(audioPlayer.duration);
  });

  audioPlayer.addEventListener('ended', function () {
    playPauseBtn.innerHTML = '<ion-icon name="play-outline"></ion-icon>';
    isPlaying = false;
  });

  function updateProgress() {
    if (!audioPlayer.duration) return;
    const percent = (audioPlayer.currentTime / audioPlayer.duration) * 100;
    progressFill.style.width = percent + '%';
    currentTimeSpan.textContent = formatTime(audioPlayer.currentTime);
  }

  progressBar.addEventListener('click', function (e) {
    if (!audioPlayer.duration) return;
    const rect = progressBar.getBoundingClientRect();
    const newTime = (e.clientX - rect.left) / rect.width * audioPlayer.duration;
    audioPlayer.currentTime = newTime;
  });

  function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  }
});
