
// ================== NAVEGACIÓN ==================
const buttons = document.querySelectorAll(".menu-btn");
const seccionInicio = document.getElementById("seccion-inicio");
const seccionBiblioteca = document.getElementById("seccion-biblioteca");

buttons.forEach(btn => {
    btn.addEventListener("click", () => {
        buttons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        const texto = btn.textContent.trim();

        if (texto === "Inicio") {
            seccionInicio.style.display = "block";
            seccionBiblioteca.style.display = "none";
        } else {
            seccionInicio.style.display = "none";
            seccionBiblioteca.style.display = "block";
        }
    });
});

// ================== ESTADO GLOBAL ==================
window.lista = [];
window.indexActual = 0;

// ================== CARGAR TOP ==================
async function cargarTopCanciones() {
    try {
        const res = await fetch('/top-canciones');
        const canciones = await res.json();

        window.lista = canciones;
        renderizarCanciones(window.lista);

    } catch (e) {
        console.error("Error cargando:", e);
    }
}

// ================== RENDER ==================
function renderizarCanciones(canciones) {
    const contenedor = document.querySelector(".cards");
    contenedor.innerHTML = "";

    canciones.forEach((c, i) => {
        const card = document.createElement("div");
        card.className = "card-cancion";

        card.innerHTML = `
            <img src="${c.thumbnail}">
            <p>${c.titulo}</p>
        `;

        card.onclick = () => {
            window.indexActual = i;
            window.reproducir(window.lista[window.indexActual]);
        };

        contenedor.appendChild(card);
    });
}

// ================== INICIO ==================
cargarTopCanciones();



// ================== CONTROL SCROLL MÓVIL (OCULTAR MENU) ==================
let ultimoScroll = 0;
const sidebar = document.querySelector('.sidebar'); 

window.addEventListener('scroll', () => {
    // Solo ejecutamos la lógica en pantallas móviles (menores o iguales a 768px)
    if (window.innerWidth <= 768 && sidebar) {
        let scrollActual = window.pageYOffset || document.documentElement.scrollTop;

        // Si el usuario baja más de 50px, esconde la barra completa
        if (scrollActual > ultimoScroll && scrollActual > 50) {
            sidebar.classList.add('sidebar-oculto');
        } else {
            // Si sube, la vuelve a mostrar
            sidebar.classList.remove('sidebar-oculto');
        }
        
        // Evitamos valores negativos causados por el rebote elástico en iOS/Safari
        ultimoScroll = scrollActual <= 0 ? 0 : scrollActual; 
    }
});