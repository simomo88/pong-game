// Canvas and Context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game Constants
const PADDLE_HEIGHT = 120;
const PADDLE_WIDTH = 12;
const BALL_SIZE = 10;
const PADDLE_SPEED = 7;
const INITIAL_BALL_SPEED = 5;
const MAX_BALL_SPEED = 10;

// Game Objects
const paddleLeft = {
    x: 20,
    y: canvas.height / 2 - PADDLE_HEIGHT / 2,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
    dy: 0,
    speed: PADDLE_SPEED
};

const paddleRight = {
    x: canvas.width - PADDLE_WIDTH - 20,
    y: canvas.height / 2 - PADDLE_HEIGHT / 2,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
    dy: 0,
    speed: PADDLE_SPEED * 0.8 // Slightly slower AI
};

const ball = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    size: BALL_SIZE,
    dx: INITIAL_BALL_SPEED,
    dy: INITIAL_BALL_SPEED,
    speed: INITIAL_BALL_SPEED
};

// Game State
let playerScore = 0;
let computerScore = 0;
let isPaused = false;
let gameStarted = false;

// Input handling
const keys = {
    ArrowUp: false,
    ArrowDown: false
};

let mouseY = canvas.height / 2;

// Team names
let leftTeam = "ARGENTINA";
let rightTeam = "FRANCE";

// Event Listeners
window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp') keys.ArrowUp = true;
    if (e.key === 'ArrowDown') keys.ArrowDown = true;
    if (e.key.toLowerCase() === 'r') resetGame();
    if (e.key === ' ') {
        e.preventDefault();
        isPaused = !isPaused;
    }
});

window.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowUp') keys.ArrowUp = false;
    if (e.key === 'ArrowDown') keys.ArrowDown = false;
});

document.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseY = e.clientY - rect.top;
});

// Update Functions
function updatePaddleLeft() {
    let targetY = mouseY - PADDLE_HEIGHT / 2;
    
    // Also allow arrow keys
    if (keys.ArrowUp) targetY = paddleLeft.y - paddleLeft.speed;
    if (keys.ArrowDown) targetY = paddleLeft.y + paddleLeft.speed;
    
    // Smooth movement
    if (keys.ArrowUp || keys.ArrowDown) {
        paddleLeft.y = targetY;
    } else {
        paddleLeft.y += (mouseY - (paddleLeft.y + PADDLE_HEIGHT / 2)) * 0.12;
    }
    
    // Boundary collision
    if (paddleLeft.y < 0) paddleLeft.y = 0;
    if (paddleLeft.y + PADDLE_HEIGHT > canvas.height) {
        paddleLeft.y = canvas.height - PADDLE_HEIGHT;
    }
}

function updatePaddleRight() {
    // AI: Follow the ball with prediction
    const paddleCenter = paddleRight.y + PADDLE_HEIGHT / 2;
    const ballCenter = ball.y;
    const difference = ballCenter - paddleCenter;
    
    // AI difficulty adjusts based on score
    const scoreGap = Math.abs(playerScore - computerScore);
    let difficulty = 0.09;
    if (scoreGap > 2) difficulty += 0.02;
    
    if (Math.abs(difference) > 15) {
        if (difference > 0) {
            paddleRight.y += paddleRight.speed * difficulty;
        } else {
            paddleRight.y -= paddleRight.speed * difficulty;
        }
    }
    
    // Boundary collision
    if (paddleRight.y < 0) paddleRight.y = 0;
    if (paddleRight.y + PADDLE_HEIGHT > canvas.height) {
        paddleRight.y = canvas.height - PADDLE_HEIGHT;
    }
}

function updateBall() {
    ball.x += ball.dx;
    ball.y += ball.dy;
    
    // Top and bottom wall collision (field boundaries)
    if (ball.y - ball.size < 0) {
        ball.y = ball.size;
        ball.dy = -ball.dy;
        playSound('bounce');
    }
    if (ball.y + ball.size > canvas.height) {
        ball.y = canvas.height - ball.size;
        ball.dy = -ball.dy;
        playSound('bounce');
    }
    
    // Left paddle collision
    if (
        ball.x - ball.size < paddleLeft.x + paddleLeft.width &&
        ball.y > paddleLeft.y &&
        ball.y < paddleLeft.y + paddleLeft.height &&
        ball.dx < 0
    ) {
        ball.x = paddleLeft.x + paddleLeft.width + ball.size;
        ball.dx = -ball.dx;
        
        // Add spin based on where ball hits the paddle
        const hitPos = (ball.y - (paddleLeft.y + PADDLE_HEIGHT / 2)) / (PADDLE_HEIGHT / 2);
        ball.dy += hitPos * 5;
        
        // Increase speed slightly
        ball.speed = Math.min(ball.speed + 0.15, MAX_BALL_SPEED);
        ball.dx = Math.abs(ball.speed);
        
        playSound('hit');
    }
    
    // Right paddle collision
    if (
        ball.x + ball.size > paddleRight.x &&
        ball.y > paddleRight.y &&
        ball.y < paddleRight.y + paddleRight.height &&
        ball.dx > 0
    ) {
        ball.x = paddleRight.x - ball.size;
        ball.dx = -ball.dx;
        
        // Add spin
        const hitPos = (ball.y - (paddleRight.y + PADDLE_HEIGHT / 2)) / (PADDLE_HEIGHT / 2);
        ball.dy += hitPos * 5;
        
        // Increase speed
        ball.speed = Math.min(ball.speed + 0.15, MAX_BALL_SPEED);
        ball.dx = -Math.abs(ball.speed);
        
        playSound('hit');
    }
    
    // Out of bounds - goal!
    if (ball.x < 0) {
        computerScore++;
        playSound('goal');
        updateScore();
        resetBall();
    }
    if (ball.x > canvas.width) {
        playerScore++;
        playSound('goal');
        updateScore();
        resetBall();
    }
}

function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.speed = INITIAL_BALL_SPEED;
    ball.dx = (Math.random() > 0.5 ? 1 : -1) * INITIAL_BALL_SPEED;
    ball.dy = (Math.random() - 0.5) * INITIAL_BALL_SPEED;
}

function updateScore() {
    document.getElementById('playerScore').textContent = playerScore;
    document.getElementById('computerScore').textContent = computerScore;
}

function resetGame() {
    playerScore = 0;
    computerScore = 0;
    paddleLeft.y = canvas.height / 2 - PADDLE_HEIGHT / 2;
    paddleRight.y = canvas.height / 2 - PADDLE_HEIGHT / 2;
    resetBall();
    updateScore();
    isPaused = false;
}

// Sound effects (using Web Audio API)
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

function playSound(type) {
    try {
        const now = audioContext.currentTime;
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        
        osc.connect(gain);
        gain.connect(audioContext.destination);
        
        if (type === 'hit') {
            osc.frequency.value = 600;
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
            osc.start(now);
            osc.stop(now + 0.1);
        } else if (type === 'bounce') {
            osc.frequency.value = 800;
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
            osc.start(now);
            osc.stop(now + 0.05);
        } else if (type === 'goal') {
            // Goal sound - ascending tones
            for (let i = 0; i < 3; i++) {
                const osc2 = audioContext.createOscillator();
                const gain2 = audioContext.createGain();
                osc2.connect(gain2);
                gain2.connect(audioContext.destination);
                
                osc2.frequency.value = 400 + (i * 200);
                gain2.gain.setValueAtTime(0.2, now + i * 0.1);
                gain2.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.15);
                osc2.start(now + i * 0.1);
                osc2.stop(now + i * 0.1 + 0.15);
            }
        }
    } catch (e) {
        // Audio context not available
    }
}

// Draw Functions
function drawPaddle(paddle, isLeft) {
    // Paddle
    ctx.fillStyle = isLeft ? '#FF6B35' : '#004E89';
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
    
    // Paddle highlight (shiny effect)
    ctx.fillStyle = isLeft ? 'rgba(255, 200, 100, 0.5)' : 'rgba(100, 150, 255, 0.5)';
    ctx.fillRect(paddle.x, paddle.y, paddle.width / 2, paddle.height);
    
    // Paddle glow
    ctx.shadowColor = isLeft ? 'rgba(255, 107, 53, 0.8)' : 'rgba(0, 78, 137, 0.8)';
    ctx.shadowBlur = 15;
    ctx.strokeStyle = isLeft ? 'rgba(255, 200, 100, 0.8)' : 'rgba(100, 200, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.strokeRect(paddle.x - 2, paddle.y - 2, paddle.width + 4, paddle.height + 4);
    ctx.shadowColor = 'transparent';
}

function drawBall() {
    // Ball shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.arc(ball.x, ball.y + 3, ball.size, 0, Math.PI * 2);
    ctx.fill();
    
    // Ball (soccer ball colors - black and white)
    ctx.fillStyle = '#FFF';
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.size, 0, Math.PI * 2);
    ctx.fill();
    
    // Soccer ball pattern
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(ball.x - 3, ball.y - 2, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(ball.x + 3, ball.y - 2, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(ball.x, ball.y + 4, 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Ball glow
    ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
    ctx.shadowBlur = 12;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.size + 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowColor = 'transparent';
}

function drawCenterLine() {
    // Center circle
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, 40, 0, Math.PI * 2);
    ctx.stroke();
    
    // Center line
    ctx.setLineDash([15, 15]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Center dot
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, 3, 0, Math.PI * 2);
    ctx.fill();
}

function drawGoalAreas() {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    
    // Left goal area
    ctx.strokeRect(0, canvas.height / 2 - 60, 80, 120);
    ctx.strokeRect(0, canvas.height / 2 - 80, 40, 160);
    
    // Right goal area
    ctx.strokeRect(canvas.width - 80, canvas.height / 2 - 60, 80, 120);
    ctx.strokeRect(canvas.width - 40, canvas.height / 2 - 80, 40, 160);
}

function drawFieldMarkings() {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    
    // Top and bottom lines
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(canvas.width, 0);
    ctx.moveTo(0, canvas.height);
    ctx.lineTo(canvas.width, canvas.height);
    ctx.stroke();
    
    // Side lines
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, canvas.height);
    ctx.moveTo(canvas.width, 0);
    ctx.lineTo(canvas.width, canvas.height);
    ctx.stroke();
}

function drawPauseScreen() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 40px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2 - 20);
    
    ctx.font = '20px Arial';
    ctx.fillStyle = '#FFF';
    ctx.fillText('Press SPACE to resume', canvas.width / 2, canvas.height / 2 + 30);
}

function drawGame() {
    // Clear canvas
    ctx.fillStyle = '#0a5c2a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Grass texture overlay
    ctx.fillStyle = 'rgba(10, 92, 42, 0.3)';
    for (let i = 0; i < 50; i++) {
        ctx.fillRect(
            Math.random() * canvas.width,
            Math.random() * canvas.height,
            Math.random() * 3,
            Math.random() * 3
        );
    }
    
    // Draw field elements
    drawFieldMarkings();
    drawGoalAreas();
    drawCenterLine();
    drawPaddle(paddleLeft, true);
    drawPaddle(paddleRight, false);
    drawBall();
    
    // Draw pause screen if paused
    if (isPaused) {
        drawPauseScreen();
    }
}

// Main game loop
function gameLoop() {
    if (!isPaused) {
        updatePaddleLeft();
        updatePaddleRight();
        updateBall();
    }
    
    drawGame();
    requestAnimationFrame(gameLoop);
}

// Initialize game
updateScore();
gameLoop();
