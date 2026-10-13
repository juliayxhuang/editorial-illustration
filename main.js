/* ════════════════════════════════════════════════════════════════════════════
   main.js — Interactive logic for the Florida Gator Editorial

   Sections:
   1. Walking Gator Comment System
   2. p5.js Mouse-Chasing Minigame
   3. Corner Gator (growth/death mechanic)
   4. Draggable Gator Words
   5. Game-Over Overlay
════════════════════════════════════════════════════════════════════════════ */

/* ─────────────────────────────────────────────
   SECTION 1: WALKING GATOR COMMENT SYSTEM
   Real comments from the original article only.
   A line-art gator walks in from one side,
   pauses with speech bubble, then walks off.
───────────────────────────────────────────── */

// Verified against the original News4JAX conversation on October 12, 2026.
// https://www.news4jax.com/news/local/2024/04/22/florida-man-uses-bare-hands-to-remove-8-foot-gator-from-busy-road/#commentDiv
const ARTICLE_COMMENTS = [
  {
    "author": "LM",
    "date": "April 26, 2024",
    "text": "Only takes one Stingray.....can't ask Irwin."
  },
  {
    "author": "facts matter",
    "date": "April 23, 2024",
    "text": "You know what we call that little Gator when we was little children living on the ditch bank...? Dinner!"
  },
  {
    "author": "Greco",
    "date": "April 22, 2024",
    "text": "\"8 Foot\" Maybe some alcohol involved in that measurement."
  },
  {
    "author": "SunshineNative",
    "date": "April 22, 2024",
    "text": "Leave it to the trained professionals.\nEven a 3 footer will do you a ‘good treat’ mate."
  },
  {
    "author": "ShanF",
    "date": "April 22, 2024",
    "text": "1) NOT an 8ft gator...2) Good grief he's got Dog the Bounty Hunter syndrome, 3) Put some shoes on. Reddest of the Reds right there."
  },
  {
    "author": "john marshall",
    "date": "April 22, 2024",
    "text": "Makes the guy at least 7 feet tall right?"
  },
  {
    "author": "Tow Missile",
    "date": "April 22, 2024",
    "text": "Lizard King"
  },
  {
    "author": "The Godfather",
    "date": "April 22, 2024",
    "text": "I'm thinkin' the Jags could use this guy on the O line !"
  },
  {
    "author": "Jawan T",
    "date": "April 22, 2024",
    "text": "A gator isn't a 250 pound person of solid muscle running at him at 15 mph..."
  },
  {
    "author": "The Godfather",
    "date": "April 23, 2024",
    "text": "How insightful. Ever heard of sarcastic humor ?"
  }
];

let commentIndex = 0;
let walkerActive = false;
const walkerLayer = document.getElementById("walking-comment-layer");

function launchWalker() {
  if (walkerActive) return;
  walkerActive = true;

  const idx = commentIndex % ARTICLE_COMMENTS.length;
  const { author, date, text } = ARTICLE_COMMENTS[idx];
  commentIndex++;

  // Randomly come from left or right
  const fromRight = Math.random() > 0.5;
  const vpW = window.innerWidth;

  // Build DOM
  const walker = document.createElement("div");
  walker.className = "walker";

  const bubbleEl = document.createElement("div");
  bubbleEl.className = "walker-bubble";
  for (const [className, value] of [["bubble-source", author], ["bubble-date", date], ["bubble-text", text]]) {
    const span = document.createElement("span");
    span.className = className;
    span.textContent = value;
    bubbleEl.appendChild(span);
  }

  const gatorEl = document.createElement("div");
  gatorEl.className = "walker-gator";
  const gatorImage = document.createElement("img");
  gatorImage.src = "gator.svg";
  gatorImage.alt = "";
  gatorEl.appendChild(gatorImage);
  gatorEl.classList.toggle("facing-right", !fromRight);

  walker.appendChild(bubbleEl);
  walker.appendChild(gatorEl);
  walker.style.alignItems = fromRight ? "flex-start" : "flex-end";
  bubbleEl.classList.toggle("facing-right", !fromRight);

  walkerLayer.appendChild(walker);

  // Pick a readable path at any height that fits the whole comment.
  const highestBottom = Math.max(24, window.innerHeight - walker.offsetHeight - 24);
  walker.style.bottom = (24 + Math.random() * (highestBottom - 24)) + "px";

  const walkerW = walker.offsetWidth;
  const startX = fromRight ? vpW : -walkerW;
  const endX = fromRight ? -walkerW : vpW;
  const duration = getWalkDuration(Math.abs(endX - startX));
  walker.style.left = startX + "px";
  const walk = walker.animate(
    [{ left: `${startX}px` }, { left: `${endX}px` }],
    { duration, easing: "linear", fill: "forwards" }
  );
  walker.addEventListener("pointerenter", () => walk.pause());
  walker.addEventListener("pointerleave", () => walk.play());
  walk.finished.then(() => {
    walker.remove();
    walkerActive = false;
    setTimeout(launchWalker, 1500);
  });
}

function getWalkDuration(distance) {
  return Math.max(800, (distance / 220) * 1000);
}

setTimeout(launchWalker, 2500);


/* ─────────────────────────────────────────────
   SECTION 2: p5.js MOUSE-CHASING MINIGAME
───────────────────────────────────────────── */
const gameOverOverlay = document.getElementById("gameover-overlay");
const pauseButton = document.getElementById("minigame-pause-button");
const pausedScreen = document.getElementById("minigame-paused");
let minigameActive = false;
let minigamePaused = false;

const minigameSketch = (p) => {
  const gatorSprite = document.getElementById("minigame-gator-sprite");
  let gatorX, gatorY;
  let gatorAngle = 0;
  const speed = 0.009;
  const GATOR_WIDTH = 180;
  let pointerInGame = false;
  let safeUntil = 0;

  p.setup = () => {
    const container = document.getElementById("minigame-container");
    const canvas = p.createCanvas(container.offsetWidth, container.offsetHeight);
    canvas.parent("minigame-container");
    canvas.elt.addEventListener("pointermove", () => {
      if (minigameActive) pointerInGame = true;
    });
    canvas.elt.addEventListener("pointerleave", () => { pointerInGame = false; });
    canvas.style("display", "block");
    gatorX = container.offsetWidth / 2;
    gatorY = container.offsetHeight / 2;
    p.textAlign(p.CENTER, p.CENTER);
    p.angleMode(p.DEGREES);
  };

  p.windowResized = () => {
    const container = document.getElementById("minigame-container");
    p.resizeCanvas(container.offsetWidth, container.offsetHeight);
  };

  p.draw = () => {
    if (!minigameActive) return;

    const isMouseOverCanvas = pointerInGame && (
      p.mouseX >= 0 && p.mouseX <= p.width &&
      p.mouseY >= 0 && p.mouseY <= p.height
    );

    p.background(217, 234, 211);

    const mx = p.mouseX;
    const my = p.mouseY;

    if (isMouseOverCanvas) {
      const dx = mx - gatorX;
      const dy = my - gatorY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 2) {
        gatorX += dx * speed;
        gatorY += dy * speed;
      }
      const targetAngle = p.degrees(Math.atan2(dy, dx));
      let angleDiff = targetAngle - gatorAngle;
      while (angleDiff > 180) angleDiff -= 360;
      while (angleDiff < -180) angleDiff += 360;
      gatorAngle += angleDiff * 0.06;
    }

    gatorSprite.style.left = gatorX + "px";
    gatorSprite.style.top = gatorY + "px";
    gatorSprite.style.transform = `translate(-50%, -50%) rotate(${gatorAngle}deg) scaleX(-1)`;

    if (isMouseOverCanvas && performance.now() > safeUntil) {
      const snoutAngleRad = p.radians(gatorAngle);
      const snoutTipX = gatorX + Math.cos(snoutAngleRad) * (GATOR_WIDTH * 0.47);
      const snoutTipY = gatorY + Math.sin(snoutAngleRad) * (GATOR_WIDTH * 0.47);
      const hitDist = Math.sqrt(
        (snoutTipX - mx) * (snoutTipX - mx) +
        (snoutTipY - my) * (snoutTipY - my)
      );
      if (hitDist < 20) triggerGameOver();
    }
  };

  p.resetGame = () => {
    const container = document.getElementById("minigame-container");
    gatorX = container.offsetWidth * 0.18;
    gatorY = container.offsetHeight * 0.52;
    gatorAngle = 0;
    pointerInGame = false;
    gatorSprite.style.opacity = "1";
    safeUntil = performance.now() + 900;
    minigameActive = true;
    minigamePaused = false;
    p.loop();
  };

  p.resumeGame = () => {
    pointerInGame = false;
    safeUntil = performance.now() + 900;
    minigameActive = true;
  };
};

let minigameInstance = new p5(minigameSketch);

document.getElementById("minigame-start-button").addEventListener("click", () => {
  document.getElementById("minigame-start").classList.add("hidden");
  pauseButton.classList.remove("hidden");
  minigameInstance.resetGame();
});

pauseButton.addEventListener("click", () => {
  minigamePaused = !minigamePaused;
  minigameActive = !minigamePaused;
  pauseButton.textContent = minigamePaused ? "Resume" : "Pause";
  pausedScreen.classList.toggle("hidden", !minigamePaused);
  if (!minigamePaused) minigameInstance.resumeGame();
});

function triggerGameOver() {
  if (!minigameActive) return;
  minigameActive = false;
  pauseButton.classList.add("hidden");
  gameOverOverlay.classList.remove("hidden");
  minigameInstance.noLoop();
}

gameOverOverlay.addEventListener("click", () => {
  gameOverOverlay.classList.add("hidden");
  pauseButton.textContent = "Pause";
  pauseButton.classList.remove("hidden");
  minigameInstance.resetGame();
});


/* ─────────────────────────────────────────────
   SECTION 3: CORNER GATOR
───────────────────────────────────────────── */
const TOTAL_GATOR_WORDS = document.querySelectorAll(".draggable-gator").length;
let gatorWordsFed = 0;
const CORNER_MIN_H = 180;

function updateCornerGator() {
  const fractionFed = TOTAL_GATOR_WORDS ? gatorWordsFed / TOTAL_GATOR_WORDS : 0;
  const maxHeight = Math.max(CORNER_MIN_H,
    Math.min(window.innerHeight * 0.84, window.innerHeight - 116));
  const height = CORNER_MIN_H + fractionFed * (maxHeight - CORNER_MIN_H);
  const width = height * 87 / 314;
  const art = document.getElementById("corner-gator-art");
  const wrap = document.getElementById("corner-gator-wrap");
  art.style.width = width + "px";
  art.style.height = height + "px";
  art.style.setProperty("--art-height", height + "px");
  art.style.setProperty("--art-width", width + "px");
  art.classList.toggle("full", gatorWordsFed >= TOTAL_GATOR_WORDS);
  document.getElementById("corner-gator-feed-label").textContent =
    gatorWordsFed >= TOTAL_GATOR_WORDS ? "Thanks!" : "Feed me!";
  document.getElementById("corner-gator-mouth-zone").title =
    gatorWordsFed >= TOTAL_GATOR_WORDS ? "Thanks!" : "Feed gator words here!";
  wrap.style.width = Math.max(90, width + 10) + "px";

  const articleRight = document.querySelector(".article-body").getBoundingClientRect().right;
  const freeSpace = window.innerWidth - articleRight;
  wrap.style.right = window.innerWidth > 700
    ? Math.max(0, (freeSpace - wrap.getBoundingClientRect().width) / 2) + "px"
    : "0px";
}

updateCornerGator();
window.addEventListener("resize", updateCornerGator);


/* ─────────────────────────────────────────────
   SECTION 4: DRAGGABLE GATOR WORDS
───────────────────────────────────────────── */
const dragGhost = document.getElementById("drag-ghost");
let currentDrag = null;
let pendingResetDrag = null;
let suppressResetClick = false;

function startDragging(el, e, label = el.textContent) {
  currentDrag = el;
  el.classList.add("dragging");
  const appearance = getComputedStyle(el);
  for (const property of ["fontFamily", "fontSize", "fontWeight", "lineHeight", "letterSpacing", "textTransform", "color", "textShadow", "webkitTextStroke"]) {
    dragGhost.style[property] = appearance[property];
  }
  dragGhost.textContent = label;
  dragGhost.style.display = "block";
  dragGhost.style.left = e.clientX + "px";
  dragGhost.style.top = e.clientY + "px";
}

document.addEventListener("mousemove", (e) => {
  if (pendingResetDrag && !currentDrag &&
      Math.hypot(e.clientX - pendingResetDrag.x, e.clientY - pendingResetDrag.y) > 6) {
    startDragging(pendingResetDrag.el, e, "Mike Dragich");
    pendingResetDrag = null;
  }
  if (currentDrag) {
    dragGhost.style.left = e.clientX + "px";
    dragGhost.style.top  = e.clientY + "px";
  }
});

function initDraggableGators() {
  document.querySelectorAll(".draggable-gator:not(.fed)").forEach((el) => {
    el.addEventListener("mousedown", (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      if (el.classList.contains("fed")) return;
      startDragging(el, e);
    });
  });

  document.addEventListener("mouseup", (e) => {
    pendingResetDrag = null;
    if (!currentDrag) return;
    const dragged = currentDrag;
    currentDrag.classList.remove("dragging");
    dragGhost.style.display = "none";

    const mouthZone = document.getElementById("corner-gator-mouth-zone");
    const rect = mouthZone.getBoundingClientRect();
    const overMouth = (
      e.clientX >= rect.left && e.clientX <= rect.right &&
      e.clientY >= rect.top  && e.clientY <= rect.bottom
    );

    if (dragged.classList.contains("reset-gator-source")) {
      const artRect = document.getElementById("corner-gator-art").getBoundingClientRect();
      const overArt = e.clientX >= artRect.left && e.clientX <= artRect.right &&
        e.clientY >= artRect.top && e.clientY <= artRect.bottom;
      if (overMouth || overArt) resetFeeding();
      suppressResetClick = true;
      setTimeout(() => { suppressResetClick = false; }, 0);
    } else if (overMouth) {
      feedGator(dragged);
    }
    currentDrag = null;
    mouthZone.classList.remove("hover-active");
  });
}

function feedGator(el) {
  el.classList.add("fed");
  gatorWordsFed++;
  updateCornerGator();

  const mouthZone = document.getElementById("corner-gator-mouth-zone");
  mouthZone.classList.add("hover-active");
  setTimeout(() => mouthZone.classList.remove("hover-active"), 400);

}

function resetFeeding() {
  document.querySelectorAll(".draggable-gator.fed").forEach((el) => el.classList.remove("fed"));
  gatorWordsFed = 0;
  updateCornerGator();
}

document.querySelectorAll(".reset-gator-source").forEach((el) => {
  el.addEventListener("mousedown", (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    pendingResetDrag = { el, x: e.clientX, y: e.clientY };
  });
  el.addEventListener("dragstart", (e) => e.preventDefault());
  el.addEventListener("click", (e) => {
    if (suppressResetClick) e.preventDefault();
  });
});

document.addEventListener("mousemove", (e) => {
  if (!currentDrag) return;
  const mouthZone = document.getElementById("corner-gator-mouth-zone");
  const rect = mouthZone.getBoundingClientRect();
  mouthZone.classList.toggle("hover-active",
    e.clientX >= rect.left && e.clientX <= rect.right &&
    e.clientY >= rect.top  && e.clientY <= rect.bottom
  );
});

initDraggableGators();
