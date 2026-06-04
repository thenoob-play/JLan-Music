const audioPlayer = document.getElementById("audio-player");
const btnPlay = document.querySelector(".play");
const songInfo = document.querySelector(".song");

let lista = [];
let indexActual = 0;

async function cargarTopCanciones() {
    try {
        const res = await fetch('/top-canciones');
        const canciones = await res.json();

        lista = canciones;

        const contenedor = document.querySelector(".cards");
        contenedor.innerHTML = "";

        canciones.forEach((c, i) => {
            const card = document.createElement("div");
            card.className = "card-cancion";

            card.innerHTML = `
                <img src="${c.thumbnail}" style="width:100%">
                <p>${c.titulo}</p>
            `;

            card.onclick = () => {
                indexActual = i;
                reproducir(c.url);
            };

            contenedor.appendChild(card);
        });

    } catch (e) {
        console.error("ERROR CARGANDO:", e);
    }
}

cargarTopCanciones();


// 🎧 REPRODUCIR
async function reproducir(url) {
    try {
        const res = await fetch('/stream', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url })
        });

        const data = await res.json();

        if (data.audio_url) {
            audioPlayer.src = data.audio_url;
            audioPlayer.play();

            songInfo.innerHTML = `<strong>${data.titulo}</strong>`;
            btnPlay.textContent = "⏸";
        } else {
            alert("No se pudo reproducir");
        }

    } catch (e) {
        console.error("ERROR:", e);
        alert("No se pudo cargar el audio");
    }
}


// ▶ / ⏸
btnPlay.addEventListener("click", () => {
    if (audioPlayer.paused) {
        audioPlayer.play();
        btnPlay.textContent = "⏸";
    } else {
        audioPlayer.pause();
        btnPlay.textContent = "▶";
    }
});


// ⏭
function nextSong() {
    if (indexActual < lista.length - 1) {
        indexActual++;
        reproducir(lista[indexActual].url);
    }
}

// ⏮
function prevSong() {
    if (indexActual > 0) {
        indexActual--;
        reproducir(lista[indexActual].url);
    }
}