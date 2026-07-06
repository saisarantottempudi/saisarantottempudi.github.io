const canvas = document.querySelector("#hero-canvas");
const ctx = canvas.getContext("2d");
const cursor = document.querySelector(".cursor-dot");
const reveals = document.querySelectorAll("[data-reveal]");
const counters = document.querySelectorAll("[data-count]");

let width = 0;
let height = 0;
let particles = [];
let pointer = { x: 0.72, y: 0.4 };

function resizeCanvas() {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  width = canvas.offsetWidth;
  height = canvas.offsetHeight;
  canvas.width = width * ratio;
  canvas.height = height * ratio;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

  const count = Math.min(86, Math.floor(width / 15));
  particles = Array.from({ length: count }, (_, index) => ({
    x: Math.random() * width,
    y: Math.random() * height,
    r: 1.1 + Math.random() * 2.8,
    vx: -0.35 + Math.random() * 0.7,
    vy: -0.25 + Math.random() * 0.5,
    hue: index % 3,
  }));
}

function drawCanvas() {
  ctx.clearRect(0, 0, width, height);

  const gx = pointer.x * width;
  const gy = pointer.y * height;
  const gradient = ctx.createRadialGradient(gx, gy, 20, gx, gy, Math.max(width, height) * 0.72);
  gradient.addColorStop(0, "rgba(34, 197, 94, 0.26)");
  gradient.addColorStop(0.38, "rgba(167, 139, 250, 0.16)");
  gradient.addColorStop(1, "rgba(15, 23, 42, 0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  particles.forEach((particle, index) => {
    particle.x += particle.vx;
    particle.y += particle.vy;

    if (particle.x < -20) particle.x = width + 20;
    if (particle.x > width + 20) particle.x = -20;
    if (particle.y < -20) particle.y = height + 20;
    if (particle.y > height + 20) particle.y = -20;

    const palette = [
      "rgba(34, 197, 94, 0.72)",
      "rgba(250, 204, 21, 0.55)",
      "rgba(167, 139, 250, 0.62)",
    ];

    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.r, 0, Math.PI * 2);
    ctx.fillStyle = palette[particle.hue];
    ctx.fill();

    for (let j = index + 1; j < particles.length; j += 1) {
      const next = particles[j];
      const distance = Math.hypot(particle.x - next.x, particle.y - next.y);
      if (distance < 118) {
        ctx.beginPath();
        ctx.moveTo(particle.x, particle.y);
        ctx.lineTo(next.x, next.y);
        ctx.strokeStyle = `rgba(248, 250, 252, ${0.12 - distance / 1100})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  });

  requestAnimationFrame(drawCanvas);
}

function animateCounter(counter) {
  const target = Number(counter.dataset.count);
  const duration = 1300;
  const start = performance.now();

  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    counter.textContent = Math.floor(eased * target);
    if (progress < 1) requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      if (entry.target.hasAttribute("data-counted")) return;
      entry.target.querySelectorAll?.("[data-count]").forEach((counter) => {
        counter.setAttribute("data-counted", "true");
        animateCounter(counter);
      });
      if (entry.target.hasAttribute("data-count")) {
        entry.target.setAttribute("data-counted", "true");
        animateCounter(entry.target);
      }
      observer.unobserve(entry.target);
    });
  },
  { threshold: 0.18 }
);

reveals.forEach((element) => observer.observe(element));
counters.forEach((counter) => observer.observe(counter));

window.addEventListener("pointermove", (event) => {
  pointer = {
    x: event.clientX / window.innerWidth,
    y: event.clientY / window.innerHeight,
  };

  cursor.style.opacity = "1";
  cursor.style.left = `${event.clientX}px`;
  cursor.style.top = `${event.clientY}px`;
});

document.querySelectorAll("a, button").forEach((element) => {
  element.addEventListener("pointerenter", () => {
    cursor.style.width = "34px";
    cursor.style.height = "34px";
  });
  element.addEventListener("pointerleave", () => {
    cursor.style.width = "18px";
    cursor.style.height = "18px";
  });
});

window.addEventListener("resize", resizeCanvas);
resizeCanvas();
drawCanvas();
