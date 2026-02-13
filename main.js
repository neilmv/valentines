let highestZ = 1;
let musicPlayed = false;
let firstPaperDragged = false;
let heartContainer = null;

class Paper {
  holdingPaper = false;
  mouseTouchX = 0;
  mouseTouchY = 0;
  mouseX = 0;
  mouseY = 0;
  prevMouseX = 0;
  prevMouseY = 0;
  velX = 0;
  velY = 0;
  rotation = Math.random() * 30 - 15;
  currentPaperX = 0;
  currentPaperY = 0;
  rotating = false;
  rotationTimer = null;

  // Pinch-to-zoom state
  isPinching = false;
  pinchStartDist = 0;
  pinchStartScale = 1;
  currentScale = 1;
  pinchStartAngle = 0;
  pinchStartRotation = 0;
  pinchMidX = 0;
  pinchMidY = 0;

  constructor(paperElement) {
    this.paper = paperElement;
    this.init();
  }

  init() {
    this.paper.style.transform = `rotateZ(${this.rotation}deg)`;

    this.paper.addEventListener('mousedown', (e) => this.handleStart(e));
    this.paper.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
    this.paper.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  handleStart(e) {
    e.preventDefault();
    if (this.holdingPaper) return;

    this.holdingPaper = true;
    this.paper.style.zIndex = highestZ;
    highestZ += 1;

    this.mouseTouchX = e.clientX;
    this.mouseTouchY = e.clientY;
    this.prevMouseX = e.clientX;
    this.prevMouseY = e.clientY;

    if (e.button === 2) {
      this.rotating = true;
    }

    if (!firstPaperDragged) {
      firstPaperDragged = true;

      if (!isMobile()) {
        playRomanticMusic();
      } else {
        showMusicPlayButton();
      }
    }

    document.addEventListener('mousemove', this.handleMoveBound = (e) => this.handleMove(e));
    document.addEventListener('mouseup', this.handleEndBound = () => this.handleEnd());
  }

  handleTouchStart(e) {
    if (e.touches.length === 2) {
      if (this.rotationTimer) {
        clearTimeout(this.rotationTimer);
        this.rotationTimer = null;
      }
      this.rotating = false;
      this.holdingPaper = false;

      if (this.handleTouchMoveBound) {
        document.removeEventListener('touchmove', this.handleTouchMoveBound);
        this.handleTouchMoveBound = null;
      }

      this.paper.style.zIndex = highestZ;
      highestZ += 1;

      this.isPinching = true;
      this.pinchStartDist = this.getTouchDist(e.touches);
      this.pinchStartScale = this.currentScale;
      this.pinchStartAngle = this.getTouchAngle(e.touches);
      this.pinchStartRotation = this.rotation;

      this.pinchMidX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      this.pinchMidY = (e.touches[0].clientY + e.touches[1].clientY) / 2;

      if (!firstPaperDragged) {
        firstPaperDragged = true;
        setTimeout(() => {
          if (!musicPlayed) showMusicPlayButton();
        }, 100);
      }

      document.addEventListener(
        'touchmove',
        this.handlePinchMoveBound = (e) => this.handlePinchMove(e),
        { passive: false }
      );
      document.addEventListener('touchend', this.handlePinchEndBound = (e) => this.handlePinchEnd(e));

      e.preventDefault();
      return;
    }

    if (this.holdingPaper || e.touches.length > 1) return;

    const touch = e.touches[0];
    this.holdingPaper = true;
    this.paper.style.zIndex = highestZ;
    highestZ += 1;

    this.mouseTouchX = touch.clientX;
    this.mouseTouchY = touch.clientY;
    this.prevMouseX = touch.clientX;
    this.prevMouseY = touch.clientY;
    this.mouseX = touch.clientX;
    this.mouseY = touch.clientY;

    if (!firstPaperDragged) {
      firstPaperDragged = true;

      setTimeout(() => {
        if (!musicPlayed) {
          showMusicPlayButton();
        }
      }, 100);
    }

    this.rotationTimer = setTimeout(() => {
      this.rotating = true;
    }, 100000);

    document.addEventListener(
      'touchmove',
      this.handleTouchMoveBound = (e) => this.handleTouchMove(e),
      { passive: false }
    );
    document.addEventListener('touchend', this.handleEndBound = () => this.handleEnd());

    e.preventDefault();
  }

  getTouchDist(touches) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  getTouchAngle(touches) {
    const dx = touches[1].clientX - touches[0].clientX;
    const dy = touches[1].clientY - touches[0].clientY;
    return Math.atan2(dy, dx) * (180 / Math.PI);
  }

  handlePinchMove(e) {
    if (!this.isPinching || e.touches.length < 2) return;

    const dist = this.getTouchDist(e.touches);
    let newScale = this.pinchStartScale * (dist / this.pinchStartDist);
    newScale = Math.min(Math.max(newScale, 0.5), 4);
    this.currentScale = newScale;

    const angle = this.getTouchAngle(e.touches);
    const angleDelta = angle - this.pinchStartAngle;
    this.rotation = this.pinchStartRotation + angleDelta;

    const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
    const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
    this.currentPaperX += midX - this.pinchMidX;
    this.currentPaperY += midY - this.pinchMidY;
    this.pinchMidX = midX;
    this.pinchMidY = midY;

    this.updateTransform();
    e.preventDefault();
  }

  handlePinchEnd(e) {
    if (e.touches.length === 1) {
      this.isPinching = false;

      if (this.handlePinchMoveBound) {
        document.removeEventListener('touchmove', this.handlePinchMoveBound);
        this.handlePinchMoveBound = null;
      }
      if (this.handlePinchEndBound) {
        document.removeEventListener('touchend', this.handlePinchEndBound);
        this.handlePinchEndBound = null;
      }

      const touch = e.touches[0];
      this.holdingPaper = true;
      this.prevMouseX = touch.clientX;
      this.prevMouseY = touch.clientY;
      this.mouseX = touch.clientX;
      this.mouseY = touch.clientY;

      document.addEventListener(
        'touchmove',
        this.handleTouchMoveBound = (ev) => this.handleTouchMove(ev),
        { passive: false }
      );
      document.addEventListener('touchend', this.handleEndBound = () => this.handleEnd());
      return;
    }

    this.isPinching = false;

    if (this.handlePinchMoveBound) {
      document.removeEventListener('touchmove', this.handlePinchMoveBound);
      this.handlePinchMoveBound = null;
    }
    if (this.handlePinchEndBound) {
      document.removeEventListener('touchend', this.handlePinchEndBound);
      this.handlePinchEndBound = null;
    }
  }

  handleMove(e) {
    if (!this.holdingPaper) return;

    this.mouseX = e.clientX;
    this.mouseY = e.clientY;

    if (!this.rotating) {
      this.velX = this.mouseX - this.prevMouseX;
      this.velY = this.mouseY - this.prevMouseY;
      this.currentPaperX += this.velX;
      this.currentPaperY += this.velY;
    }

    this.updateTransform();

    this.prevMouseX = this.mouseX;
    this.prevMouseY = this.mouseY;
  }

  handleTouchMove(e) {
    if (!this.holdingPaper) return;

    if (e.touches.length === 2) {
      this.holdingPaper = false;
      this.rotating = false;
      if (this.rotationTimer) {
        clearTimeout(this.rotationTimer);
        this.rotationTimer = null;
      }
      if (this.handleTouchMoveBound) {
        document.removeEventListener('touchmove', this.handleTouchMoveBound);
        this.handleTouchMoveBound = null;
      }
      if (this.handleEndBound) {
        document.removeEventListener('touchend', this.handleEndBound);
        this.handleEndBound = null;
      }
      this.handleTouchStart(e);
      return;
    }

    if (e.touches.length === 1) {
      const touch = e.touches[0];
      this.mouseX = touch.clientX;
      this.mouseY = touch.clientY;

      if (!this.rotating) {
        this.velX = this.mouseX - this.prevMouseX;
        this.velY = this.mouseY - this.prevMouseY;
        this.currentPaperX += this.velX;
        this.currentPaperY += this.velY;
      }

      this.updateTransform();

      this.prevMouseX = this.mouseX;
      this.prevMouseY = this.mouseY;
    }

    e.preventDefault();
  }

  handleEnd() {
    if (!this.holdingPaper) return;

    this.holdingPaper = false;
    this.rotating = false;

    if (this.rotationTimer) {
      clearTimeout(this.rotationTimer);
      this.rotationTimer = null;
    }

    if (this.handleMoveBound) {
      document.removeEventListener('mousemove', this.handleMoveBound);
      this.handleMoveBound = null;
    }
    if (this.handleEndBound) {
      document.removeEventListener('mouseup', this.handleEndBound);
      document.removeEventListener('touchend', this.handleEndBound);
      this.handleEndBound = null;
    }
    if (this.handleTouchMoveBound) {
      document.removeEventListener('touchmove', this.handleTouchMoveBound);
      this.handleTouchMoveBound = null;
    }
  }

  updateTransform() {
    if (this.rotating) {
      const dx = this.mouseX - this.mouseTouchX;
      const dy = this.mouseY - this.mouseTouchY;
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);
      this.rotation = angle;
    }

    this.paper.style.transform =
      `translateX(${this.currentPaperX}px) translateY(${this.currentPaperY}px) rotateZ(${this.rotation}deg) scale(${this.currentScale})`;
  }
}

function isMobile() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    (window.innerWidth <= 768);
}

function playRomanticMusic() {
  if (musicPlayed) return;

  musicPlayed = true;
  const music = document.getElementById('romanticMusic');
  const musicIndicator = document.getElementById('musicIndicator');

  musicIndicator.classList.add('show');
  music.volume = 0.5;

  const playPromise = music.play();

  if (playPromise !== undefined) {
    playPromise.then(() => {
      console.log("Romantic music started playing 💖");
      startHeartsAnimation();

      setTimeout(() => {
        musicIndicator.classList.remove('show');
      }, 5000);

    }).catch(error => {
      console.log("Autoplay was prevented, showing play button:", error);
      showMusicPlayButton();
    });
  }
}

function showMusicPlayButton() {
  if (document.getElementById('playButtonOverlay') || musicPlayed) return;

  const playButtonOverlay = document.createElement('div');
  playButtonOverlay.id = 'playButtonOverlay';
  playButtonOverlay.innerHTML = `
    <div style="
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.85);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      backdrop-filter: blur(10px);
      animation: fadeIn 0.5s ease;
    ">
      <div style="
        background: linear-gradient(135deg, #ffffff, #fff5f7);
        padding: 35px 25px;
        border-radius: 25px;
        text-align: center;
        max-width: 85%;
        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        border: 3px solid #ffb6c1;
        animation: slideUp 0.5s ease;
      ">
        <div style="
          background: linear-gradient(45deg, #e91e63, #ff4081);
          width: 80px;
          height: 80px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          box-shadow: 0 10px 20px rgba(233, 30, 99, 0.3);
        ">
          <i class="fas fa-music" style="font-size: 40px; color: white;"></i>
        </div>
        <h2 style="
          font-family: 'Dancing Script', cursive; 
          color: #e91e63; 
          margin: 10px 0 15px; 
          font-size: 32px;
          font-weight: bold;
        ">
          Play Our Song 💖
        </h2>
        <p style="
          color: #666; 
          margin-bottom: 30px; 
          font-size: 17px;
          line-height: 1.5;
          font-family: 'Dancing Script', cursive;
        ">
          This special song reminds me of every moment with you
        </p>
        <button id="playMusicBtn" style="
          background: linear-gradient(45deg, #e91e63, #ff4081);
          color: white;
          border: none;
          padding: 18px 40px;
          font-size: 20px;
          border-radius: 50px;
          cursor: pointer;
          font-family: 'Dancing Script', cursive;
          box-shadow: 0 8px 20px rgba(233, 30, 99, 0.4);
          transition: all 0.3s;
          width: 100%;
          margin-bottom: 15px;
        ">
          <i class="fas fa-play"></i> Play Romantic Music
        </button>
        <p style="
          color: #999; 
          font-size: 15px; 
          margin-top: 10px;
          font-style: italic;
        ">
          (Tap anywhere to play our special song)
        </p>
      </div>
    </div>
  `;

  document.body.appendChild(playButtonOverlay);

  document.getElementById('playMusicBtn').addEventListener('click', startMusicWithAnimation);

  playButtonOverlay.addEventListener('click', function (e) {
    if (e.target === this) {
      startMusicWithAnimation();
    }
  });

  document.addEventListener('click', function startMusicOnAnyClick(e) {
    if (!e.target.closest('#playButtonOverlay')) {
      startMusicWithAnimation();
    }
    document.removeEventListener('click', startMusicOnAnyClick);
  });
}

function startMusicWithAnimation() {
  const music = document.getElementById('romanticMusic');
  const musicIndicator = document.getElementById('musicIndicator');

  musicIndicator.classList.add('show');
  music.volume = 0.5;

  music.play().then(() => {
    console.log("Music started after user click");
    musicPlayed = true;
    startHeartsAnimation();
    hidePlayButton();

    setTimeout(() => {
      musicIndicator.classList.remove('show');
    }, 5000);

  }).catch(e => {
    console.log("Still can't play music:", e);
    const playBtn = document.querySelector('#playButtonOverlay button');
    if (playBtn) {
      playBtn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Please Enable Audio';
      playBtn.style.background = '#ff4444';
    }
  });
}

function hidePlayButton() {
  const overlay = document.getElementById('playButtonOverlay');
  if (overlay) {
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.5s';
    setTimeout(() => {
      if (overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
    }, 500);
  }
}

// Heart animation system
function createHeartContainer() {
  const container = document.createElement('div');
  container.id = 'heart-container';
  document.body.appendChild(container);
  return container;
}

function startHeartsAnimation() {
  if (!heartContainer) {
    heartContainer = createHeartContainer();
  }

  const colors = ['#ff6b9d', '#ff8fab', '#ffb3c6', '#ffccd5', '#fff0f3', '#ff9eb5', '#ff85a1'];
  const isMobileDevice = isMobile();

  const initialHearts = isMobileDevice ? 50 : 25;
  const heartInterval = isMobileDevice ? 1500 : 2500;
  const maxTotalHearts = isMobileDevice ? 200 : 100;

  let totalHeartsCreated = 0;

  for (let i = 0; i < initialHearts; i++) {
    setTimeout(() => {
      if (totalHeartsCreated < maxTotalHearts) {
        createFloatingHeart(colors);
        totalHeartsCreated++;
      }
    }, i * 80);
  }

  const interval = setInterval(() => {
    if (musicPlayed && totalHeartsCreated < maxTotalHearts) {
      const batchSize = isMobileDevice ? 4 : 2;
      for (let i = 0; i < batchSize && totalHeartsCreated < maxTotalHearts; i++) {
        setTimeout(() => {
          createFloatingHeart(colors);
        }, i * 100);
        totalHeartsCreated++;
      }
    } else if (!musicPlayed) {
      clearInterval(interval);
    }
  }, heartInterval);
}

function createFloatingHeart(colors) {
  if (!heartContainer) return;

  const heart = document.createElement('div');
  heart.className = 'heart-float';

  const startX = Math.random() * window.innerWidth;
  heart.style.left = `${startX}px`;
  heart.style.bottom = '0px';

  const color = colors[Math.floor(Math.random() * colors.length)];
  heart.style.background = color;

  const size = isMobile() ? 10 + Math.random() * 25 : 15 + Math.random() * 30;
  heart.style.width = `${size}px`;
  heart.style.height = `${size}px`;

  heartContainer.appendChild(heart);

  const speed = isMobile() ? 2 + Math.random() * 2.5 : 3 + Math.random() * 3;
  heart.style.animation = `floatUp ${speed}s ease-in forwards`;

  setTimeout(() => {
    if (heart.parentNode) {
      heart.parentNode.removeChild(heart);
    }
  }, (speed + 0.5) * 1000);
}

// Initialize the app
document.addEventListener('DOMContentLoaded', function () {
  heartContainer = createHeartContainer();

  const papers = Array.from(document.querySelectorAll('.paper'));
  papers.forEach(paper => {
    new Paper(paper);
  });

  papers.forEach(paper => {
    paper.addEventListener('click', function () {
      if (!musicPlayed && firstPaperDragged) {
        showMusicPlayButton();
      }
    });
  });

  console.log("%c💖 For my love on Valentine's Day 💖", "color: #e91e63; font-size: 16px; font-weight: bold;");
  console.log("%cDrag any paper to discover my messages for you! 💌", "color: #2196f3; font-size: 14px;");

  if (isMobile()) {
    console.log("Mobile device detected - optimized for touch");
    document.body.classList.add('mobile');
  }
});