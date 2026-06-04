const buttons = document.querySelectorAll(".menu-btn");
const seccionInicio = document.getElementById("seccion-inicio");
const seccionBiblioteca = document.getElementById("seccion-biblioteca");

buttons.forEach(btn => {
    btn.addEventListener("click", () => {
        // 1. Quitar la clase active de todos los botones
        buttons.forEach(b => b.classList.remove("active"));
        // 2. Activar el botón que recibió el clic
        btn.classList.add("active");

        // 3. Lógica para mostrar/ocultar secciones
        const textoBoton = btn.textContent.trim();

        if (textoBoton === "Inicio") {
            seccionInicio.style.display = "block";
            seccionBiblioteca.style.display = "none";
        } else if (textoBoton === "Tu biblioteca") {
            seccionInicio.style.display = "none";
            seccionBiblioteca.style.display = "block";
        }
    });
});

// Función para cargar las canciones top al iniciar la página
async function cargarTopCanciones() {
    const response = await fetch('/top-canciones');
    const canciones = await response.json();
    
    const contenedorCards = document.querySelector(".cards");
    contenedorCards.innerHTML = ""; // Limpiar contenido previo

    canciones.forEach(cancion => {
        const card = document.createElement("div");
        card.className = "card-cancion"; // Asegúrate de darle estilos en CSS
        card.innerHTML = `
            <img src="${cancion.thumbnail}" alt="${cancion.titulo}" style="width:100%; border-radius:10px;">
            <p style="color:white; font-size:14px; margin-top:10px;">${cancion.titulo}</p>
        `;
        // Al hacer clic, podrías llamar a la función /stream
        card.onclick = () => reproducirCancion(cancion.url);
        contenedorCards.appendChild(card);
    });
}

// Llamar a la función cuando cargue el script
cargarTopCanciones();


// Función para el scroll lateral del carrusel
function scrollCanvas(direction) {
    const contenedor = document.querySelector(".cards");
    const cardWidth = 180 + 20;
    contenedor.scrollBy({
        left: direction * cardWidth,
        behavior: 'smooth'
    });
}

function actualizarBotones() {
    const contenedor = document.querySelector(".cards");
    const btnPrev = document.querySelector(".prev");
    const btnNext = document.querySelector(".next");

    // Mostrar prev solo si no estamos al inicio
    if (contenedor.scrollLeft > 0) {
        btnPrev.classList.add("visible");
    } else {
        btnPrev.classList.remove("visible");
    }

    // Mostrar next solo si hay más contenido a la derecha
    const hayMasContenido = contenedor.scrollLeft + contenedor.clientWidth < contenedor.scrollWidth - 5;
    if (hayMasContenido) {
        btnNext.classList.add("visible");
    } else {
        btnNext.classList.remove("visible");
    }
}

// Escuchar el scroll para actualizar los botones
document.querySelector(".cards").addEventListener("scroll", actualizarBotones);

// Llamar al cargar para mostrar el estado inicial
// (se llama dentro de cargarTopCanciones después de crear las cards)

// Función para reproducir (Placeholder para tu lógica de backend)
// Referencias a elementos del DOM
const audioPlayer = document.getElementById("audio-player");
const btnPlay = document.querySelector(".play");
const songInfoContainer = document.querySelector(".song");

async function reproducirCancion(url) {
    try {
        console.log("Solicitando stream para:", url);
        
        // 1. Llamada a tu endpoint /stream en app.py
        const response = await fetch('/stream', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: url })
        });

        const data = await response.json();

        if (data.audio_url) {
            // 2. Configurar el src del audio con la URL recibida de yt-dlp
            audioPlayer.src = data.audio_url;
            audioPlayer.play();

            // 3. Actualizar la interfaz (Nombre de canción y botón)
            songInfoContainer.textContent = `Reproduciendo: ${data.titulo}`;
            btnPlay.textContent = "⏸"; // Cambia el icono a pausa
        }
    } catch (error) {
        console.error("Error al reproducir:", error);
        alert("No se pudo cargar el audio de esta canción.");
    }
}

// Lógica para el botón Play/Pausa del footer
btnPlay.addEventListener("click", () => {
    if (audioPlayer.paused) {
        audioPlayer.play();
        btnPlay.textContent = "⏸";
    } else {
        audioPlayer.pause();
        btnPlay.textContent = "▶";
    }
});






