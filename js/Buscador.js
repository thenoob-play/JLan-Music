const searchInput = document.querySelector(".search-box input");
let debounceTimer;

searchInput.addEventListener("input", () => {
    const query = searchInput.value.trim();
    clearTimeout(debounceTimer);

    if (!query) {
        cargarTopCanciones();
        return;
    }

    debounceTimer = setTimeout(() => {
        ejecutarBusqueda(query);
    }, 500);
});

async function ejecutarBusqueda(query) {
    try {
        const res = await fetch('/buscar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query })
        });

        const canciones = await res.json();

        window.lista = canciones;
        renderizarCanciones(window.lista);

        document.getElementById("seccion-inicio").style.display = "block";
        document.getElementById("seccion-biblioteca").style.display = "none";

    } catch (e) {
        console.error("Error búsqueda:", e);
    }
}