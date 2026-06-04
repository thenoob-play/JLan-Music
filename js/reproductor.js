const audio = document.getElementById("audio-player");
const progressBar = document.getElementById("progress-bar");
const currentTimeEl = document.getElementById("current");
const durationEl = document.getElementById("duration");
const volume = document.getElementById("volume");

// 🔊 volumen
volume.addEventListener("input", () => {
    audio.volume = volume.value;
});

// ▶️ play / pause
function togglePlay() {
    if (audio.paused) {
        audio.play();
    } else {
        audio.pause();
    }
}

// ⏱ FORMATO TIEMPO
function formatTime(time) {
    let minutes = Math.floor(time / 60);
    let seconds = Math.floor(time % 60);
    if (seconds < 10) seconds = "0" + seconds;
    return `${minutes}:${seconds}`;
}

// 📊 cuando carga la canción
audio.addEventListener("loadedmetadata", () => {
    progressBar.max = Math.floor(audio.duration);
    durationEl.textContent = formatTime(audio.duration);
});

// 🔄 actualizar progreso
audio.addEventListener("timeupdate", () => {
    progressBar.value = Math.floor(audio.currentTime);
    currentTimeEl.textContent = formatTime(audio.currentTime);
});

// 🎯 mover barra manualmente
progressBar.addEventListener("input", () => {
    audio.currentTime = progressBar.value;
});