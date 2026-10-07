const header = document.querySelector(".site-header");
const menuToggle = document.querySelector(".menu-toggle");
const navigation = document.querySelector(".site-nav");
const cursorGlow = document.querySelector(".cursor-glow");
const brandHeartButton = document.querySelector(".brand-heart-button");
let heartCelebration;
let heartCelebrationTimer;

brandHeartButton.addEventListener("click", () => {
  if (!window.matchMedia("(max-width: 980px), (pointer: coarse)").matches) {
    window.location.hash = "top";
    return;
  }
  heartCelebration?.remove();
  window.clearTimeout(heartCelebrationTimer);

  const source = brandHeartButton.querySelector("svg");
  const bounds = source.getBoundingClientRect();
  const celebration = document.createElement("div");
  celebration.className = "heart-celebration";
  celebration.setAttribute("aria-hidden", "true");
  const startX = bounds.left + bounds.width / 2 - window.innerWidth / 2;
  const startY = bounds.top + bounds.height / 2 - window.innerHeight / 2;
  const startScale = bounds.width / Math.min(260, window.innerWidth * 0.65);
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const heart = source.cloneNode(true);
  heart.setAttribute("class", "celebration-heart");
  heart.querySelector("clipPath").id = "celebration-heart-clip";
  heart.querySelector("image").setAttribute("clip-path", "url(#celebration-heart-clip)");
  celebration.append(heart);

  for (let index = 0; index < 14; index += 1) {
    const sparkle = document.createElement("span");
    const angle = (index / 14) * Math.PI * 2;
    sparkle.className = "celebration-sparkle";
    sparkle.textContent = "\u2665";
    sparkle.style.setProperty("--spark-x", `${Math.cos(angle) * (100 + index % 3 * 25)}px`);
    sparkle.style.setProperty("--spark-y", `${Math.sin(angle) * 150 - 35}px`);
    sparkle.style.setProperty("--spark-delay", `${0.7 + index * 0.045}s`);
    celebration.append(sparkle);
  }

  document.body.append(celebration);
  heartCelebration = celebration;
  if (!reducedMotion) {
    brandHeartButton.classList.add("is-animating");
    const frames = [];
    const spiralFrame = (progress) => {
      const eased = progress * progress * (3 - 2 * progress);
      const angle = progress * Math.PI * 2;
      const radius = Math.sin(progress * Math.PI) * Math.min(55, window.innerWidth * 0.12);
      const x = startX * (1 - eased) + Math.sin(angle) * radius;
      const y = startY * (1 - eased) + Math.cos(angle) * radius;
      return `translate(${x}px, ${y}px) scale(${startScale + (1 - startScale) * eased}) rotate(${360 * eased}deg)`;
    };
    for (let step = 0; step <= 40; step += 1) {
      frames.push({ offset: step / 40 * 0.35, transform: spiralFrame(step / 40) });
    }
    frames.push(
      { offset: 0.43, transform: "scale(1.08) rotate(360deg)" },
      { offset: 0.5, transform: "scale(1) rotate(360deg)" },
      { offset: 0.57, transform: "scale(1.06) rotate(360deg)" },
      { offset: 0.65, transform: "scale(1) rotate(360deg)" }
    );
    for (let step = 1; step <= 40; step += 1) {
      frames.push({ offset: 0.65 + step / 40 * 0.35, transform: spiralFrame(1 - step / 40) });
    }
    heart.animate(frames, { duration: 3600, fill: "both" });
  }
  heartCelebrationTimer = window.setTimeout(() => {
    celebration.remove();
    brandHeartButton.classList.remove("is-animating");
    if (heartCelebration === celebration) heartCelebration = null;
  }, reducedMotion ? 1400 : 3600);
});

const closeMenu = () => {
  menuToggle.setAttribute("aria-expanded", "false");
  navigation.classList.remove("is-open");
  document.body.classList.remove("is-locked");
};

menuToggle.addEventListener("click", () => {
  const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
  menuToggle.setAttribute("aria-expanded", String(!isOpen));
  navigation.classList.toggle("is-open", !isOpen);
  document.body.classList.toggle("is-locked", !isOpen);
});

navigation.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", closeMenu);
});

window.addEventListener("scroll", () => {
  header.classList.toggle("is-scrolled", window.scrollY > 120);
});

window.addEventListener("pointermove", (event) => {
  if (!cursorGlow) return;
  cursorGlow.style.left = `${event.clientX}px`;
  cursorGlow.style.top = `${event.clientY}px`;
});

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 }
);

document.querySelectorAll(".reveal").forEach((element) => {
  revealObserver.observe(element);
});

const counters = document.querySelectorAll("[data-count]");
const counterObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;

      const counter = entry.target;
      const target = Number(counter.dataset.count);
      const duration = 1300;
      const startTime = performance.now();

      const updateCounter = (currentTime) => {
        const progress = Math.min((currentTime - startTime) / duration, 1);
        const easedProgress = 1 - Math.pow(1 - progress, 3);
        counter.textContent = Math.floor(target * easedProgress);

        if (progress < 1) {
          requestAnimationFrame(updateCounter);
        } else {
          counter.textContent = target;
        }
      };

      requestAnimationFrame(updateCounter);
      counterObserver.unobserve(counter);
    });
  },
  { threshold: 0.7 }
);

counters.forEach((counter) => counterObserver.observe(counter));

const slides = [...document.querySelectorAll(".quote-slide")];
const previousButton = document.querySelector(".slider-button.prev");
const nextButton = document.querySelector(".slider-button.next");
const currentSlideLabel = document.querySelector("#slide-current");
const sliderProgress = document.querySelector(".slider-progress span");
let currentSlide = 0;
let sliderInterval;

const showSlide = (index) => {
  currentSlide = (index + slides.length) % slides.length;
  slides.forEach((slide, slideIndex) => {
    slide.classList.toggle("is-active", slideIndex === currentSlide);
  });
  currentSlideLabel.textContent = String(currentSlide + 1).padStart(2, "0");
  sliderProgress.style.transform = `translateX(${currentSlide * 100}%)`;
};

const startSlider = () => {
  window.clearInterval(sliderInterval);
  sliderInterval = window.setInterval(() => showSlide(currentSlide + 1), 6500);
};

previousButton.addEventListener("click", () => {
  showSlide(currentSlide - 1);
  startSlider();
});

nextButton.addEventListener("click", () => {
  showSlide(currentSlide + 1);
  startSlider();
});

startSlider();

const lightbox = document.querySelector("#lightbox");
const lightboxImage = lightbox.querySelector("img");
const lightboxCaption = lightbox.querySelector("figcaption");
const lightboxClose = lightbox.querySelector(".lightbox-close");
const lightboxPrevious = lightbox.querySelector(".lightbox-prev");
const lightboxNext = lightbox.querySelector(".lightbox-next");
const galleryItems = [...document.querySelectorAll(".gallery-item")];
let currentImage = 0;
let swipeStartX = 0;

const showLightboxImage = (index) => {
  currentImage = (index + galleryItems.length) % galleryItems.length;
  const item = galleryItems[currentImage];
  lightboxImage.src = item.dataset.full;
  lightboxImage.alt = item.querySelector("img").alt;
  lightboxCaption.textContent = item.dataset.caption;
};

const showPreviousImage = () => showLightboxImage(currentImage - 1);
const showNextImage = () => showLightboxImage(currentImage + 1);

galleryItems.forEach((item, index) => {
  item.addEventListener("click", () => {
    showLightboxImage(index);
    lightbox.showModal();
  });
});

lightboxClose.addEventListener("click", () => lightbox.close());
lightboxPrevious.addEventListener("click", showPreviousImage);
lightboxNext.addEventListener("click", showNextImage);

lightboxImage.addEventListener("pointerdown", (event) => {
  swipeStartX = event.clientX;
});

lightboxImage.addEventListener("pointerup", (event) => {
  const swipeDistance = event.clientX - swipeStartX;
  if (Math.abs(swipeDistance) < 50) return;
  if (swipeDistance > 0) {
    showPreviousImage();
  } else {
    showNextImage();
  }
});

lightbox.addEventListener("click", (event) => {
  if (event.target === lightbox) lightbox.close();
});

const gameBoard = document.querySelector("#game-board");
const startGameButton = document.querySelector("#start-game");
const scoreLabel = document.querySelector("#score");
const timerLabel = document.querySelector("#timer");
const gameResult = document.querySelector("#game-result");
const finalScoreLabel = document.querySelector("#final-score");
const resultMessage = document.querySelector("#result-message");
const playAgainButton = document.querySelector("#play-again");
const resultCloseButton = document.querySelector(".result-close");

let score = 0;
let timeRemaining = 20;
let gameTimer;
let heartTimer;
let isPlaying = false;

const clearHearts = () => {
  gameBoard.querySelectorAll(".game-heart").forEach((heart) => heart.remove());
};

const createHeart = () => {
  if (!isPlaying) return;

  clearHearts();
  const heart = document.createElement("button");
  const boardRect = gameBoard.getBoundingClientRect();
  const size = 64;
  const maxX = Math.max(boardRect.width - size, 0);
  const maxY = Math.max(boardRect.height - size, 0);

  heart.type = "button";
  heart.className = "game-heart";
  heart.setAttribute("aria-label", "Catch heart");
  heart.textContent = "♥";
  heart.style.left = `${Math.random() * maxX}px`;
  heart.style.top = `${Math.random() * maxY}px`;

  heart.addEventListener("click", () => {
    if (!isPlaying) return;
    score += 1;
    scoreLabel.textContent = score;
    heart.classList.add("is-caught");
    window.setTimeout(createHeart, 120);
  });

  gameBoard.appendChild(heart);
};

const closeResult = () => {
  gameResult.hidden = true;
  document.body.classList.remove("is-locked");
};

const endGame = () => {
  isPlaying = false;
  window.clearInterval(gameTimer);
  window.clearTimeout(heartTimer);
  clearHearts();
  startGameButton.disabled = false;
  startGameButton.innerHTML = "Start game <span>♥</span>";
  finalScoreLabel.textContent = score;

  if (score >= 20) {
    resultMessage.textContent = "You are a real dream team. This score is hard to beat.";
  } else if (score >= 12) {
    resultMessage.textContent = "A strong round and more than enough love for two.";
  } else {
    resultMessage.textContent = "Love does not need a high score, but you can always try again.";
  }

  gameResult.hidden = false;
  document.body.classList.add("is-locked");
};

const startGame = () => {
  closeResult();
  score = 0;
  timeRemaining = 20;
  isPlaying = true;
  scoreLabel.textContent = score;
  timerLabel.textContent = timeRemaining;
  startGameButton.disabled = true;
  startGameButton.textContent = "Game running...";
  gameBoard.querySelector(".game-board-message")?.remove();
  createHeart();

  gameTimer = window.setInterval(() => {
    timeRemaining -= 1;
    timerLabel.textContent = timeRemaining;
    if (timeRemaining <= 0) endGame();
  }, 1000);

  const relocateHeart = () => {
    if (!isPlaying) return;
    createHeart();
    heartTimer = window.setTimeout(relocateHeart, 1150);
  };

  heartTimer = window.setTimeout(relocateHeart, 1150);
};

startGameButton.addEventListener("click", startGame);
playAgainButton.addEventListener("click", startGame);
resultCloseButton.addEventListener("click", closeResult);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    if (lightbox.open) lightbox.close();
    if (!gameResult.hidden) closeResult();
  }

  if (lightbox.open && event.key === "ArrowLeft") showPreviousImage();
  if (lightbox.open && event.key === "ArrowRight") showNextImage();
});
