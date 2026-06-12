// Variable global simulada del usuario que está navegando (basado en tu base de datos)
const USUARIO_LOGUEADO_ID = 1; 
const PLAYLIST_ACTUAL_ID = 1; // Playlist por defecto donde se sumará al pulsar '+'

// Asegurar que el DOM esté completamente cargado
document.addEventListener("DOMContentLoaded", () => {
    const btnLike = document.getElementById("btn-like-reproductor");
    const btnAgregar = document.getElementById("btn-agregar-reproductor");

    // ================= MENEJO DEL BOTÓN LIKE (CORAZÓN) =================
    btnLike.addEventListener("click", () => {
        // Validación: revisamos si hay una canción cargada en el reproductor
        // Nota: Ajusta 'cancionActual.url' según cómo guardes tu estado en reproductor.js
        if (typeof cancionActual === 'undefined' || !cancionActual.url) {
            alert("No hay ninguna canción reproduciéndose en este momento.");
            return;
        }

        const datosLike = {
            direccion: cancionActual.url,         // URL o ID del video de YouTube
            usuario_idusuario: USUARIO_LOGUEADO_ID // ID del usuario del diagrama
        };

        fetch('http://localhost:5000/like', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(datosLike)
        })
        .then(response => response.json())
        .then(data => {
            if (data.ok) {
                alert("¡Añadido a tus canciones que te gustan!");
                btnLike.style.color = "red"; // Efecto visual simple
            } else {
                alert("Error: " + data.error);
            }
        })
        .catch(err => {
            console.error("Error al enviar el Like:", err);
            alert("No se pudo conectar con el servidor.");
        });
    });

    // ================= MANEJO DEL BOTÓN AGREGAR (+) =================
    btnAgregar.addEventListener("click", () => {
        if (typeof cancionActual === 'undefined' || !cancionActual.url) {
            alert("Primero reproduce una canción para poder añadirla.");
            return;
        }

        const datosCancion = {
            direccion: cancionActual.url,
            orden: 1, // Puedes calcular el orden dinámicamente según las canciones de la lista
            playlist_idplaylist: PLAYLIST_ACTUAL_ID,
            playlist_usuario_idusuario: USUARIO_LOGUEADO_ID
        };

        fetch('http://localhost:5000/agregar-cancion', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(datosCancion)
        })
        .then(response => response.json())
        .then(data => {
            if (data.ok) {
                alert("Canción agregada a la playlist con éxito.");
            } else {
                alert("Error: " + data.error);
            }
        })
        .catch(err => {
            console.error("Error al agregar la canción:", err);
            alert("Error de conexión al guardar la canción.");
        });
    });
});



document.addEventListener("DOMContentLoaded", () => {
    const btnLikeCanciones = document.querySelector(".likeCanciones");
    const seccionInicio = document.getElementById("seccion-inicio");
    const seccionBiblioteca = document.getElementById("seccion-biblioteca");
    const seccionLikes = document.getElementById("seccion-likes");
    const contenedorLikes = document.getElementById("contenedor-likes-canciones");
    
    // ID de usuario estático para las peticiones de Base de Datos
    const ID_USUARIO_ACTUAL = 1; 

    if (btnLikeCanciones && seccionLikes && contenedorLikes) {
        btnLikeCanciones.addEventListener("click", async () => {
            // 1. Alternar visibilidad de las secciones
            if (seccionInicio) seccionInicio.style.display = "none";
            if (seccionBiblioteca) seccionBiblioteca.style.display = "none";
            seccionLikes.style.display = "block";

            // 2. Colocar mensaje de carga inicial
            contenedorLikes.innerHTML = `<p class="status-message">Cargando tus canciones favoritas...</p>`;

            try {
                // 3. Llamada al Backend para traer los strings/direcciones de la tabla like_cancion
                const response = await fetch(`/obtener-likes/${ID_USUARIO_ACTUAL}`);
                const data = await response.json();

                if (!data.ok || data.likes.length === 0) {
                    contenedorLikes.innerHTML = `<p class="status-message">Aún no tienes canciones con "Like".</p>`;
                    return;
                }

                // Limpiar el contenedor para empezar a meter las tarjetas virtuales
                contenedorLikes.innerHTML = "";

                // 4. Iterar sobre las direcciones recuperadas de MySQL
                for (const urlVideo of data.likes) {
                    try {
                        // Consultar la metadata de YouTube usando tu endpoint de streaming
                        const resStream = await fetch('/stream', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ url: urlVideo })
                        });
                        const infoCancion = await resStream.json();

                        if (infoCancion.error) continue;

                        // Extraer el ID de video para renderizar la miniatura correcta
                        let videoId = "";
                        if (urlVideo.includes("v=")) {
                            videoId = urlVideo.split("v=")[1].split("&")[0];
                        } else {
                            videoId = urlVideo.split("/").pop();
                        }

                        // 5. Construcción dinámica del nodo HTML de la tarjeta
                        const card = document.createElement("div");
                        card.className = "card";
                        card.innerHTML = `
                            <img src="https://i.ytimg.com/vi/${videoId}/hqdefault.jpg" alt="${infoCancion.titulo}">
                            <h4>${infoCancion.titulo}</h4>
                            <p>${infoCancion.canal || 'YouTube Video'}</p>
                        `;

                        // 6. Asignar evento de reproducción al hacer click en cualquier parte de la tarjeta
                        card.addEventListener("click", () => {
                            const player = document.getElementById("audio-player");
                            if (player && infoCancion.audio_url) {
                                player.src = infoCancion.audio_url;
                                player.play();
                                
                                // Opcional: Actualizar el icono del botón de reproducción a Pausa
                                const playBtn = document.querySelector(".play");
                                if (playBtn) playBtn.textContent = "⏸";
                            }
                        });

                        // Inyectar tarjeta en la cuadrícula
                        contenedorLikes.appendChild(card);

                    } catch (errCard) {
                        console.error("Error al procesar la metadata de la canción:", errCard);
                    }
                }

            } catch (error) {
                console.error("Error al conectar con el servidor:", error);
                contenedorLikes.innerHTML = `<p class="status-message" style="color: #ff5555;">Error al conectar con el servidor de JLan.</p>`;
            }
        });
    }
});



