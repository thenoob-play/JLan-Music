// Variable global simulada del usuario que está navegando
const USUARIO_LOGUEADO_ID = 1; 
const PLAYLIST_ACTUAL_ID = 1; // Playlist por defecto

document.addEventListener("DOMContentLoaded", () => {
    const btnLike = document.getElementById("btn-like-reproductor");
    const btnAgregar = document.getElementById("btn-agregar-reproductor");

    // ================= MANEJO DEL BOTÓN LIKE (CORAZÓN) =================
    btnLike.addEventListener("click", () => {
        // CORREGIDO: Buscamos window.cancionActual en lugar de una variable indefinida
        if (!window.cancionActual || !window.cancionActual.url) {
            alert("No hay ninguna canción reproduciéndose en este momento.");
            return;
        }

        const datosLike = {
            direccion: window.cancionActual.url,         
            usuario_idusuario: USUARIO_LOGUEADO_ID 
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
                btnLike.style.color = "red"; 
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
        // CORREGIDO: Buscamos window.cancionActual
        if (!window.cancionActual || !window.cancionActual.url) {
            alert("Primero reproduce una canción para poder añadirla.");
            return;
        }

        const datosCancion = {
            direccion: window.cancionActual.url,
            orden: 1, 
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




// ================= MANEJO PARA CREAR NUEVAS PLAYLISTS =================
document.addEventListener("DOMContentLoaded", () => {
    const btnSidebarCrear = document.getElementById("btn-sidebar-crear");
    const btnBibliotecaCrear = document.getElementById("btn_canciones");
    const modal = document.getElementById("modal-playlist");
    const btnCancelar = document.getElementById("btn-cancelar");
    const btnGuardar = document.getElementById("btn-guardar");
    const inputNombre = document.getElementById("nombre-playlist-input");

    // Función para abrir el modal
    const abrirModal = () => {
        modal.style.display = "flex";
        inputNombre.value = "";
        inputNombre.focus();
    };

    // Eventos para abrir el modal desde los dos botones del HTML
    if(btnSidebarCrear) btnSidebarCrear.addEventListener("click", abrirModal);
    if(btnBibliotecaCrear) btnBibliotecaCrear.addEventListener("click", abrirModal);

    // Evento para cerrar el modal
    if(btnCancelar) {
        btnCancelar.addEventListener("click", () => {
            modal.style.display = "none";
        });
    }

    // Evento para guardar la playlist en Python -> MySQL
    if(btnGuardar) {
        btnGuardar.addEventListener("click", () => {
            const nombre = inputNombre.value.trim();
            if (!nombre) {
                alert("Por favor, escribe un nombre para tu playlist.");
                return;
            }

            // Según tu diagrama: pide nombre_playlist y usuario_idusuario
            const datosNuevaPlaylist = {
                nombre_playlist: nombre,
                usuario_idusuario: USUARIO_LOGUEADO_ID // ID 1 de prueba
            };

            fetch('http://localhost:5000/crear-playlist', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(datosNuevaPlaylist)
            })
            .then(response => response.json())
            .then(data => {
                if (data.ok) {
                    alert(`¡Playlist "${nombre}" creada con éxito!`);
                    modal.style.display = "none";
                    // Aquí podrías llamar una función para recargar tu biblioteca visualmente
                } else {
                    alert("Error al crear playlist: " + data.error);
                }
            })
            .catch(err => {
                console.error("Error de conexión:", err);
                alert("No se pudo conectar con el servidor local.");
            });
        });
    }
});
