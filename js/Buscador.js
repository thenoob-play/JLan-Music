const searchInput = document.querySelector(".search-box input");
let debounceTimer;

searchInput.addEventListener("input", () => {
    const query = searchInput.value.trim();

    // Limpiar el temporizador cada vez que el usuario escribe
    clearTimeout(debounceTimer);

    // Si el input está vacío, regresamos al "Inicio" (opcional)
    if (query.length === 0) {
        cargarTopCanciones();
        return;
    }

    // Esperar 500ms después de que el usuario deje de escribir para buscar
    debounceTimer = setTimeout(() => {
        ejecutarBusqueda(query);
    }, 500);
});

async function ejecutarBusqueda(query) {
    try {
        console.log("Buscando:", query);
        
        // Llamada a tu endpoint /buscar en app.py
        const response = await fetch('/buscar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: query })
        });

        const canciones = await response.json();
        
        // Reutilizamos la lógica para mostrar las canciones en la cuadrícula
        renderizarCanciones(canciones);
        
        // Cambiar visualmente a la sección de inicio si el usuario estaba en biblioteca
        document.getElementById("seccion-inicio").style.display = "block";
        document.getElementById("seccion-biblioteca").style.display = "none";
        
    } catch (error) {
        console.error("Error en la búsqueda:", error);
    }
}

// Función auxiliar para no repetir código de dibujado de cards
function renderizarCanciones(canciones) {
    const contenedorCards = document.querySelector(".cards");
    contenedorCards.innerHTML = ""; 

    canciones.forEach(cancion => {
        const card = document.createElement("div");
        card.className = "card-cancion";
        card.innerHTML = `
            <img src="${cancion.thumbnail}" alt="${cancion.titulo}" style="width:100%; border-radius:10px;">
            <p style="color:white; font-size:14px; margin-top:10px;">${cancion.titulo}</p>
        `;
        card.onclick = () => reproducirCancion(cancion.url);
        contenedorCards.appendChild(card);
    });
}