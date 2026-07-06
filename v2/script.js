const canvas = document.querySelector("#hero-canvas");
const ctx = canvas.getContext("2d");
const cursor = document.querySelector(".cursor-dot");
const reveals = document.querySelectorAll("[data-reveal]");
const counters = document.querySelectorAll("[data-count]");

let width = 0;
let height = 0;
let stars = [];
let diskParticles = [];
let pointer = { x: 0.5, y: 0.5 };
let time = 0;

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function holeGeometry() {
  const compact = width < 820;
  return {
    cx: width * (compact ? 0.5 : 0.59) + (pointer.x - 0.5) * -18,
    cy: height * (compact ? 0.3 : 0.44) + (pointer.y - 0.5) * -12,
    r: Math.min(width, height) * (compact ? 0.16 : 0.13),
  };
}

function resizeCanvas() {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  width = canvas.offsetWidth;
  height = canvas.offsetHeight;
  canvas.width = width * ratio;
  canvas.height = height * ratio;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

  stars = Array.from({ length: Math.min(220, Math.floor(width / 6)) }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    r: Math.random() * 1.3 + 0.2,
    tw: Math.random() * Math.PI * 2,
  }));

  const count = Math.min(340, Math.floor(width / 4));
  diskParticles = Array.from({ length: count }, () => ({
    angle: Math.random() * Math.PI * 2,
    dist: 1.25 + Math.pow(Math.random(), 1.6) * 1.6,
    speed: 0.0035 + Math.random() * 0.004,
    size: 0.6 + Math.random() * 1.7,
  }));
}

function diskColor(t, alpha) {
  // hot inner (near-white amber) to cool outer (deep ember)
  const r = 255;
  const g = Math.round(214 - t * 130);
  const b = Math.round(160 - t * 130);
  return `rgba(${r}, ${g}, ${Math.max(b, 20)}, ${alpha})`;
}

function drawScene() {
  ctx.clearRect(0, 0, width, height);
  const { cx, cy, r } = holeGeometry();

  // starfield
  stars.forEach((s) => {
    const twinkle = 0.5 + 0.5 * Math.sin(time * 0.9 + s.tw);
    // stars near the hole get hidden (swallowed light)
    const d = Math.hypot(s.x - cx, s.y - cy);
    if (d < r * 1.15) return;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(238, 242, 247, ${0.25 + twinkle * 0.45})`;
    ctx.fill();
  });

  const squash = 0.22; // disk tilt

  const drawDiskPass = (front) => {
    diskParticles.forEach((p) => {
      const sin = Math.sin(p.angle);
      if (front ? sin < 0 : sin >= 0) return;
      const px = cx + Math.cos(p.angle) * p.dist * r;
      const py = cy + sin * p.dist * r * squash;
      const t = Math.min((p.dist - 1.25) / 1.6, 1);
      const doppler = front ? 1 : 0.62; // approaching side brighter
      const alpha = Math.min((1.05 - t * 0.6) * doppler, 1);
      ctx.beginPath();
      ctx.arc(px, py, p.size, 0, Math.PI * 2);
      ctx.fillStyle = diskColor(t, alpha);
      ctx.fill();
    });
  };

  // glow bed under the disk
  const bed = ctx.createRadialGradient(cx, cy, r * 0.8, cx, cy, r * 3.1);
  bed.addColorStop(0, "rgba(255, 122, 47, 0.16)");
  bed.addColorStop(0.5, "rgba(255, 122, 47, 0.05)");
  bed.addColorStop(1, "rgba(2, 4, 10, 0)");
  ctx.fillStyle = bed;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(1, squash * 2.4);
  ctx.beginPath();
  ctx.arc(0, 0, r * 3.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // back half of accretion disk
  drawDiskPass(false);

  // lensed photon halo — vertical ring bent above and below the shadow
  ctx.save();
  ctx.lineWidth = 2;
  const halo = ctx.createLinearGradient(cx, cy - r * 1.5, cx, cy + r * 1.5);
  halo.addColorStop(0, "rgba(255, 200, 130, 0.55)");
  halo.addColorStop(0.5, "rgba(255, 122, 47, 0.12)");
  halo.addColorStop(1, "rgba(255, 200, 130, 0.4)");
  ctx.strokeStyle = halo;
  ctx.beginPath();
  ctx.ellipse(cx, cy, r * 1.18, r * 1.32, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // event horizon shadow + photon rim
  const rim = ctx.createRadialGradient(cx, cy, r * 0.86, cx, cy, r * 1.14);
  rim.addColorStop(0, "rgba(2, 4, 10, 1)");
  rim.addColorStop(0.82, "rgba(2, 4, 10, 1)");
  rim.addColorStop(0.94, "rgba(255, 176, 87, 0.85)");
  rim.addColorStop(1, "rgba(255, 122, 47, 0)");
  ctx.beginPath();
  ctx.arc(cx, cy, r * 1.14, 0, Math.PI * 2);
  ctx.fillStyle = rim;
  ctx.fill();

  // front half of accretion disk (passes in front of the shadow)
  drawDiskPass(true);

  if (!reduceMotion) {
    diskParticles.forEach((p) => {
      p.angle += p.speed / Math.sqrt(p.dist); // Keplerian-ish: inner orbits faster
    });
    time += 0.016;
  }

  requestAnimationFrame(drawScene);
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
    cursor.style.width = "40px";
    cursor.style.height = "40px";
  });
  element.addEventListener("pointerleave", () => {
    cursor.style.width = "26px";
    cursor.style.height = "26px";
  });
});

window.addEventListener("resize", resizeCanvas);
resizeCanvas();
drawScene();

const carouselTrack = document.querySelector("[data-carousel-track]");
const carouselPrev = document.querySelector("[data-carousel-prev]");
const carouselNext = document.querySelector("[data-carousel-next]");
const carouselBar = document.querySelector("[data-carousel-bar]");

if (carouselTrack && carouselPrev && carouselNext && carouselBar) {
  const cardStep = () => {
    const card = carouselTrack.querySelector(".project-card");
    return card ? card.offsetWidth + 20 : carouselTrack.clientWidth;
  };

  const updateCarousel = () => {
    const maxScroll = carouselTrack.scrollWidth - carouselTrack.clientWidth;
    const progress = maxScroll > 0 ? carouselTrack.scrollLeft / maxScroll : 1;
    const visible = carouselTrack.clientWidth / carouselTrack.scrollWidth;
    carouselBar.style.width = `${Math.max(visible * 100, 8)}%`;
    carouselBar.style.left = `${progress * (100 - Math.max(visible * 100, 8))}%`;
    carouselPrev.disabled = carouselTrack.scrollLeft <= 4;
    carouselNext.disabled = carouselTrack.scrollLeft >= maxScroll - 4;
  };

  carouselPrev.addEventListener("click", () => {
    carouselTrack.scrollBy({ left: -cardStep(), behavior: "smooth" });
  });

  carouselNext.addEventListener("click", () => {
    carouselTrack.scrollBy({ left: cardStep(), behavior: "smooth" });
  });

  carouselTrack.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      carouselTrack.scrollBy({ left: -cardStep(), behavior: "smooth" });
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      carouselTrack.scrollBy({ left: cardStep(), behavior: "smooth" });
    }
  });

  carouselTrack.addEventListener("scroll", updateCarousel, { passive: true });
  window.addEventListener("resize", updateCarousel);
  updateCarousel();
}
