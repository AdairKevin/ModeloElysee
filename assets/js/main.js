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

/* Desvanecido entre secciones: si una sección cambia de color respecto a la anterior,
   empieza con el color de arriba y se funde al suyo (se calcula aquí para que funcione
   aunque se oculten secciones en contenido.json) */
const contenido = document.getElementById("invitationContent");
/* Color y textura de papel de un bloque (si es transparente, se ve el fondo general) */
const fondoDe = (el) => {
  const estilo = getComputedStyle(el);
  return estilo.backgroundColor === "rgba(0, 0, 0, 0)" ? fondoDe(contenido) : [estilo.backgroundColor, estilo.backgroundImage];
};
const bloques = [...contenido.querySelectorAll(":scope > section, :scope > footer")];
bloques.forEach((el, i) => {
  if (!i) return;
  const [arriba, texturaArriba] = fondoDe(bloques[i - 1]);
  const [propio] = fondoDe(el);
  if (arriba === propio) return;
  el.style.setProperty("--fondo-arriba", arriba);
  el.style.setProperty("--textura-arriba", texturaArriba);
  el.classList.add("con-desvanecido");
  /* Si empieza con una foto a todo lo ancho (como el cierre), el desvanecido va encima de la foto;
     si es oscura, el texto claro baja hasta donde ya terminó el desvanecido */
  const [r, g, b] = propio.match(/\d+/g).map(Number);
  if (el.firstElementChild?.tagName === "IMG") el.classList.add("desvanecido-sobre-foto");
  else if (r + g + b < 300) el.classList.add("desvanecido-oscuro");
});

/* Calendario: dibuja el mes de evento.inicio, marca el día y arma los botones para guardar la fecha */
const calendario = document.getElementById("calendario");
if (calendario) {
  const { inicio: textoInicio, duracionHoras, tituloCalendario, lugarCalendario } = DATOS.evento;
  const inicio = new Date(textoInicio);
  const fin = new Date(inicio.getTime() + (duracionHoras || 6) * 3600000);
  const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  const primerDia = new Date(inicio.getFullYear(), inicio.getMonth(), 1).getDay();
  const diasMes = new Date(inicio.getFullYear(), inicio.getMonth() + 1, 0).getDate();
  let celdas = ["D", "L", "M", "M", "J", "V", "S"].map((d) => `<span class="cal-dia-semana">${d}</span>`).join("");
  celdas += "<span></span>".repeat(primerDia);
  for (let d = 1; d <= diasMes; d++) celdas += `<span${d === inicio.getDate() ? ' class="cal-evento"' : ""}>${d}</span>`;
  calendario.innerHTML = `<div class="cal-mes">${meses[inicio.getMonth()]} ${inicio.getFullYear()}</div><div class="cal-grid" aria-hidden="true">${celdas}</div>`;
  calendario.setAttribute("role", "img");
  calendario.setAttribute("aria-label", inicio.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long", year: "numeric" }));

  const fmt = (f) => f.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const ics = (t) => t.replace(/[\\,;]/g, "\\$&"); // el formato .ics exige escapar comas y punto y coma
  document.getElementById("btnGoogleCal").href =
    "https://calendar.google.com/calendar/render?action=TEMPLATE" +
    `&text=${encodeURIComponent(tituloCalendario)}&dates=${fmt(inicio)}/${fmt(fin)}&location=${encodeURIComponent(lugarCalendario)}`;
  document.getElementById("btnIcs").addEventListener("click", () => {
    const archivo = [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Mirai//Invitacion//ES", "BEGIN:VEVENT",
      `UID:${Date.now()}@mirai`, `DTSTAMP:${fmt(new Date())}`, `DTSTART:${fmt(inicio)}`, `DTEND:${fmt(fin)}`,
      `SUMMARY:${ics(tituloCalendario)}`, `LOCATION:${ics(lugarCalendario)}`,
      "BEGIN:VALARM", "TRIGGER:-P1D", "ACTION:DISPLAY", `DESCRIPTION:${ics(tituloCalendario)}`, "END:VALARM",
      "END:VEVENT", "END:VCALENDAR",
    ].join("\r\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([archivo], { type: "text/calendar" }));
    a.download = "evento.ics";
    a.click();
  });
}

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
  sobrePantalla.classList.add("abriendo");
  if (music) music.play().catch(() => {});
  setTimeout(() => {
    document.getElementById("invitationContent").classList.remove("hidden");
    window.scrollTo(0, 0);
    sobrePantalla.classList.add("fade-out");
    document.body.classList.remove("bloqueado");
    requestAnimationFrame(() => document.body.classList.add("iniciada"));
    if (musicaFlotante) musicaFlotante.classList.add("mostrar");
    setTimeout(() => sobrePantalla.remove(), 1400);
  }, 2600);
});

/* Aparición suave de cada bloque al hacer scroll */
const observador = new IntersectionObserver(
  /* Los que aparecen juntos entran escalonados (0.12s entre cada uno), no todos de golpe */
  (entradas) =>
    entradas
      .filter((e) => e.isIntersecting)
      .forEach((e, i) => {
        const el = e.target;
        el.style.transitionDelay = i * 0.12 + "s";
        el.addEventListener("transitionend", () => (el.style.transitionDelay = ""), { once: true });
        el.classList.add("visible");
        observador.unobserve(el);
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
