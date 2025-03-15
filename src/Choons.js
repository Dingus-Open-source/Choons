document.addEventListener('DOMContentLoaded', () => {
    const playBtn = document.getElementById('playBtn');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const volumeSlider = document.getElementById('volumeSlider');
    
    playBtn.addEventListener('click', () => {
        const isPlaying = playBtn.textContent === 'Pause';
        playBtn.textContent = isPlaying ? 'Play' : 'Pause';
        // Add play/pause logic here
    });

    prevBtn.addEventListener('click', () => {
        // Add previous track logic
    });

    nextBtn.addEventListener('click', () => {
        // Add next track logic
    });

    volumeSlider.addEventListener('input', (e) => {
        window.electronAPI.updateVolume(e.target.value);
    });
});