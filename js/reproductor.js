// ================== ESTADO GLOBAL ==================
window.lista = window.lista || [];
window.indexActual = window.indexActual || 0;
window.historialVideos = window.historialVideos || new Set();

let siguienteAudio = new Audio();
let siguienteCancion = null;
let precargando = false;

// ================== ELEMENTOS ==================
const audioPlayer = document.getElementById("audio-player");
const btnPlay = document.querySelector(".play");
const songInfo = document.querySelector(".song");

const progressBar = document.getElementById("progress-bar");
const currentTimeEl = document.getElementById("current");
const durationEl = document.getElementById("duration");
const volumeBar = document.getElementById("volume");

window.reproducir = async function(cancion) {
    if (!cancion || !cancion.url) return;

    try {
        const index = window.lista.findIndex(c => c.url === cancion.url);
        if (index !== -1) window.indexActual = index;

        window.historialVideos.add(cancion.url);

        // 🔥 SOLUCIÓN PREVIA: Guardamos la canción actual en el objeto global window
        window.cancionActual = cancion; 

        songInfo.innerHTML = "Cargando...";

        const res = await fetch('/stream', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: cancion.url })
        });

        const data = await res.json();

        if (!data.audio_url) {
            throw new Error("No se obtuvo audio");
        }

        const nombreCanal = data.canal || cancion.canal || 'Desconocido';

        // 🔥 NUEVO: Validar y recortar el título a 15 caracteres max si es necesario
        const tituloOriginal = data.titulo || "Sin título";
        const tituloRecortado = tituloOriginal.length > 15 
            ? tituloOriginal.substring(0, 15) + "..." 
            : tituloOriginal;

        audioPlayer.src = data.audio_url;

        audioPlayer.play().catch(err => {
            console.warn("Play bloqueado (normal):", err);
        });

        // Modificado para usar tituloRecortado
        songInfo.innerHTML = `
            <div style="display:flex; gap:10px; align-items:center;">
                <img src="${cancion.thumbnail || ''}" style="width:40px; height:40px; border-radius:4px;">
                <div>
                    <strong title="${tituloOriginal}">${tituloRecortado}</strong><br>
                    <small style="color:#aaa;">${nombreCanal}</small>
                </div>
            </div>
        `;

        btnPlay.textContent = "⏸";

        try {
            cargarRelacionados(data.titulo, nombreCanal);
            precargarSiguiente();
        } catch (e) {
            console.warn("Error secundario:", e);
        }

    } catch (e) {
        console.error("Error REAL:", e);
        songInfo.innerHTML = "Error al reproducir";
    }
};

// ================== SIGUIENTE INTELIGENTE ==================
function elegirSiguiente() {
    const disponibles = window.lista.filter(v =>
        !window.historialVideos.has(v.url)
    );

    if (disponibles.length === 0) {
        window.historialVideos.clear();
        return window.lista[0];
    }

    return disponibles[Math.floor(Math.random() * disponibles.length)];
}

// ================== PRECARGA ==================
async function precargarSiguiente() {
    if (precargando || !window.lista.length) return;

    precargando = true;

    try {
        const cancion = elegirSiguiente();
        if (!cancion) return;

        const res = await fetch('/stream', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: cancion.url })
        });

        const data = await res.json();

        if (data.audio_url) {
            siguienteAudio = new Audio(data.audio_url);
            siguienteCancion = cancion;
        }

    } catch (e) {
        console.error("Error precargando:", e);
    }

    precargando = false;
}

// ================== AUTO NEXT SIN CORTE ==================
audioPlayer.addEventListener("ended", async () => {
    try {
        if (siguienteAudio && siguienteAudio.src) {

            audioPlayer.src = siguienteAudio.src;
            await audioPlayer.play();

            window.indexActual = (window.indexActual + 1) % window.lista.length;
            window.historialVideos.add(siguienteCancion.url);
            window.cancionActual = siguienteCancion;

            // 🔥 NUEVO: Recortar título también en la transición automática
            const tituloOriginal = siguienteCancion.titulo || "Sin título";
            const tituloRecortado = tituloOriginal.length > 15 
                ? tituloOriginal.substring(0, 15) + "..." 
                : tituloOriginal;

            songInfo.innerHTML = `
                <div style="display:flex; gap:10px; align-items:center;">
                    <img src="${siguienteCancion.thumbnail}" style="width:40px; height:40px; border-radius:4px;">
                    <div>
                        <strong title="${tituloOriginal}">${tituloRecortado}</strong><br>
                        <small style="color:#aaa;">${siguienteCancion.canal}</small>
                    </div>
                </div>
            `;

            precargarSiguiente();

        } else {
            nextSong();
        }

    } catch (e) {
        console.error("Error en auto-next:", e);
        nextSong();
    }
});

// ================== NEXT / PREV ==================
window.nextSong = function() {
    if (!window.lista.length) return;

    const siguiente = elegirSiguiente();
    if (siguiente) window.reproducir(siguiente);
};

window.prevSong = function() {
    if (!window.lista.length) return;

    window.indexActual = (window.indexActual - 1 + window.lista.length) % window.lista.length;
    window.reproducir(window.lista[window.indexActual]);
};

// ================== PROGRESO ==================
audioPlayer.addEventListener("timeupdate", () => {
    if (!isNaN(audioPlayer.currentTime)) {
        progressBar.value = audioPlayer.currentTime;
        currentTimeEl.textContent = formatTime(audioPlayer.currentTime);
    }

    if (!isNaN(audioPlayer.duration) && audioPlayer.duration !== Infinity) {
        progressBar.max = audioPlayer.duration;
        durationEl.textContent = formatTime(audioPlayer.duration);

        if (audioPlayer.duration - audioPlayer.currentTime < 8) {
            precargarSiguiente();
        }
    }
});

// ================== CONTROLES ==================
btnPlay.addEventListener("click", () => {
    if (!audioPlayer.src) return;

    if (audioPlayer.paused) {
        audioPlayer.play();
        btnPlay.textContent = "⏸";
    } else {
        audioPlayer.pause();
        btnPlay.textContent = "▶";
    }
});

progressBar.addEventListener("input", () => {
    if (!isNaN(audioPlayer.duration)) {
        audioPlayer.currentTime = progressBar.value;
    }
});

// ================== VOLUMEN ==================
volumeBar.addEventListener("input", () => {
    audioPlayer.volume = volumeBar.value;
});

// ================== ERROR ==================
audioPlayer.addEventListener("error", () => {
    console.warn("Error en audio, saltando...");
    nextSong();
});

// ================== UTIL ==================
function formatTime(seconds) {
    if (isNaN(seconds) || seconds === Infinity) return "0:00";
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec < 10 ? "0" : ""}${sec}`;
}