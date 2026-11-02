/* Los datos vienen de contenido.json (los carga motor.js en window.INVITACION) */
const DATOS = window.INVITACION;

/* Cuenta regresiva: la fecha se cambia en evento.inicio de contenido.json */
const fechaEvento = new Date(DATOS.evento.inicio).getTime();
const ids = ["dias", "horas", "minutos", "segundos"];
const actualizarTimer = () => {
  const d = Math.max(0, fechaEvento - Date.now());
  const valores = [
    Math.floor(d / 86400000),
    Math.floor((d % 86400000) / 3600000),
    Math.floor((d % 3600000) / 60000),
    Math.floor((d % 60000) / 1000),
  ];
  ids.forEach((id, i) => (document.getElementById(id).innerText = String(valores[i]).padStart(2, "0")));
  if (d === 0) clearInterval(timer);
};
const timer = document.getElementById("dias") && setInterval(actualizarTimer, 1000);
if (timer) actualizarTimer();

/* Música: el botón de la tarjeta y el flotante controlan la misma canción */
const music = document.getElementById("music");
const playPauseBtn = document.getElementById("playPauseBtn");
const progressBar = document.getElementById("progressBar");
const musicaFlotante = document.getElementById("musicaFlotante");
const alternarMusica = () => (music.paused ? music.play().catch(() => {}) : music.pause());
if (music) {
  music.volume = 0.5;
  [playPauseBtn, musicaFlotante].forEach((b) => b && b.addEventListener("click", alternarMusica));
  const marcar = (sonando) =>
    [playPauseBtn, musicaFlotante].forEach((b) => b && b.classList.toggle("sonando", sonando));
  music.addEventListener("play", () => marcar(true));
  music.addEventListener("pause", () => marcar(false));
  music.addEventListener("timeupdate", () => {
    if (music.duration) progressBar.style.width = (music.currentTime / music.duration) * 100 + "%";
  });
}

/* Nombres de la portada: cada letra aparece una por una */
let letraIndice = 0;
document.querySelectorAll(".nombres-reveal .nombre").forEach((nombre) => {
  const texto = nombre.textContent;
  nombre.textContent = "";
  [...texto].forEach((caracter) => {
    const span = document.createElement("span");
    span.className = "letra";
    span.style.setProperty("--i", letraIndice++);
    span.textContent = caracter === " " ? " " : caracter;
    nombre.appendChild(span);
  });
});

/* Sobre: se rompe el sello, se abre la solapa y sube la tarjeta */
const sobrePantalla = document.getElementById("envelopeScreen");
document.body.classList.add("bloqueado");
document.getElementById("openEnvelope").addEventListener("click", () => {
  document.getElementById("sobre").classList.add("open");
  if (music) music.play().catch(() => {});
  setTimeout(() => {
    document.getElementById("invitationContent").classList.remove("hidden");
    window.scrollTo(0, 0);
    sobrePantalla.classList.add("fade-out");
    document.body.classList.remove("bloqueado");
    requestAnimationFrame(() => document.body.classList.add("iniciada"));
    if (musicaFlotante) musicaFlotante.classList.add("mostrar");
    setTimeout(() => sobrePantalla.remove(), 1400);
  }, 2300);
});

/* Aparición suave de cada bloque al hacer scroll */
const observador = new IntersectionObserver(
  (entradas) =>
    entradas.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("visible");
        observador.unobserve(e.target);
      }
    }),
  { threshold: 0.15, rootMargin: "0px 0px -6% 0px" }
);
document.querySelectorAll("[data-revelar]").forEach((el) => observador.observe(el));

/* Galería: tira con desplazamiento, puntos y avance automático */
const galeria = document.getElementById("galeria");
if (galeria) {
  const slides = [...galeria.children];
  const puntos = [...document.querySelectorAll("#galeriaPuntos button")];
  let actual = 0;
  let tocada = false;
  const ir = (i) => galeria.scrollTo({ left: slides[i].offsetLeft - (galeria.clientWidth - slides[i].offsetWidth) / 2, behavior: "smooth" });
  const marcar = () => {
    const centro = galeria.scrollLeft + galeria.clientWidth / 2;
    actual = slides.reduce(
      (mejor, s, i) =>
        Math.abs(s.offsetLeft + s.offsetWidth / 2 - centro) <
        Math.abs(slides[mejor].offsetLeft + slides[mejor].offsetWidth / 2 - centro)
          ? i
          : mejor,
      0
    );
    puntos.forEach((p, i) => p.classList.toggle("activo", i === actual));
  };
  galeria.addEventListener("scroll", () => requestAnimationFrame(marcar), { passive: true });
  ["touchstart", "pointerdown", "wheel"].forEach((ev) =>
    galeria.addEventListener(ev, () => (tocada = true), { passive: true })
  );
  puntos.forEach((p) =>
    p.addEventListener("click", () => {
      tocada = true;
      ir(Number(p.dataset.ir));
    })
  );
  marcar();
  setInterval(() => {
    if (!tocada && !document.hidden && document.body.classList.contains("iniciada")) ir((actual + 1) % slides.length);
  }, 4500);
}

/* Confirmación por WhatsApp: el número va en confirmacion.whatsapp de contenido.json (ej. 5215512345678) */
document.querySelectorAll(".rsvp-form").forEach((form) => {
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const { whatsapp, mensajeWhatsapp: t } = DATOS.confirmacion;
    const datos = new FormData(form);
    let texto =
      `${t.saludo}\n` +
      `${t.nombre}: ${datos.get("nombre").trim()}\n` +
      `${t.asistentes}: ${datos.get("personas")}`;
    const mensaje = (datos.get("mensaje") || "").trim();
    if (mensaje) texto += `\n${t.mensaje}: ${mensaje}`;
    window.open(`https://wa.me/${whatsapp}?text=${encodeURIComponent(texto)}`, "_blank");
  });
});
