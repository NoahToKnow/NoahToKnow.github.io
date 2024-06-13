// Create and style the game canvas
const canvas = document.createElement('canvas');
canvas.width = 800;
canvas.height = 600;
canvas.style.border = '1px solid black';
document.getElementById('game-container').appendChild(canvas);

const ctx = canvas.getContext('2d');

// Game properties
const playerSpeed = 3;
const enemySpeed = 1;
const swordRange = 30;
const playerMaxHealth = 100;
const enemyMaxHealth = 50;
let gameOver = false;
let score = 0;
let timeLeft = 120; // 120 seconds
let currentLevel = 0;
let checkpointLevel = 4; // Set checkpoint level to 5 (0-indexed)
let checkpointCollected = false;
let deathCount = 0;

// Player properties
const player = {
  x: 50,
  y: 50,
  width: 20,
  height: 20,
  color: 'blue',
  health: playerMaxHealth,
  dx: 0,
  dy: 0,
  attacking: false,
  shield: false,
};

// Weapon properties
const weapon = {
  width: 5,
  height: 20,
  color: 'brown',
  visible: false,
  x: 0,
  y: 0,
  direction: 'right'
};

// Shield properties
const shield = {
  width: 30,
  height: 20,
  color: 'gray',
  visible: false,
  x: 0,
  y: 0,
};

// Levels
const levels = [
  { enemies: 2, coins: 3 },
  { enemies: 3, coins: 4 },
  { enemies: 4, coins: 5 },
  { enemies: 5, coins: 6 },
  { enemies: 6, coins: 7 },
  { enemies: 7, coins: 8 },
  { enemies: 8, coins: 9 },
  { enemies: 9, coins: 10 },
  { enemies: 10, coins: 11 },
  { enemies: 12, coins: 12 },
];

// Coins
let coins = [];

// Enemies
let enemies = [];

// Arrows
let arrows = [];

// Explosions
let explosions = [];

// Power-ups
let powerUps = [];

// Checkpoints
let checkpoints = [];

// Goal
const goal = { x: 750, y: 550, width: 20, height: 20, color: 'green' };

// Handle player movement
let forwardPressed = false;
let leftPressed = false;
let rightPressed = false;
let backwardPressed = false;
let attackPressed = false;
let shieldPressed = false;

document.addEventListener('keydown', (event) => {
  if (event.key === 'w' || event.key === 'W') forwardPressed = true;
  if (event.key === 'a' || event.key === 'A') leftPressed = true;
  if (event.key === 'd' || event.key === 'D') rightPressed = true;
  if (event.key === 's' || event.key === 'S') backwardPressed = true;
  if (event.key === 'f' || event.key === 'F') attackPressed = true; // "F" for attack
  if (event.key === ' ') shieldPressed = true; // Space for shield
  if (event.key === 'r') restartGame();
});

document.addEventListener('keyup', (event) => {
  if (event.key === 'w' || event.key === 'W') forwardPressed = false;
  if (event.key === 'a' || event.key === 'A') leftPressed = false;
  if (event.key === 'd' || event.key === 'D') rightPressed = false;
  if (event.key === 's' || event.key === 'S') backwardPressed = false;
  if (event.key === 'f' || event.key === 'F') attackPressed = false; // "F" for attack
  if (event.key === ' ') shieldPressed = false; // Space for shield
});

// Initialize game elements for the current level
function initializeLevel() {
  const level = levels[currentLevel];

  player.x = 50;
  player.y = 50;
  player.health = playerMaxHealth;
  player.attacking = false;
  player.shield = false;

  coins = [];
  for (let i = 0; i < level.coins; i++) {
    coins.push({
      x: Math.random() * (canvas.width - 20),
      y: Math.random() * (canvas.height - 20),
      width: 10,
      height: 10,
      collected: false,
    });
  }

  enemies = [];
  for (let i = 0; i < level.enemies; i++) {
    enemies.push({
      x: Math.random() * (canvas.width - 20),
      y: Math.random() * (canvas.height - 20),
      width: 20,
      height: 20,
      color: 'red',
      health: enemyMaxHealth + i * 10,
      dx: (Math.random() > 0.5 ? 1 : -1) * enemySpeed,
      dy: (Math.random() > 0.5 ? 1 : -1) * enemySpeed,
    });
  }

  arrows = [];
  explosions = [];
  powerUps = [
    {
      x: Math.random() * (canvas.width - 20),
      y: Math.random() * (canvas.height - 20),
      width: 15,
      height: 15,
      color: 'purple',
    },
  ];

  checkpoints = [];
  if (currentLevel === checkpointLevel && !checkpointCollected) {
    checkpoints.push({
      x: canvas.width / 2 - 10,
      y: canvas.height / 2 - 10,
      width: 20,
      height: 20,
      color: 'cyan',
    });
  }

  timeLeft = 120; // Reset time for the new level
}

// Check collision
function checkCollision(a, b) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

// Draw explosion
function drawExplosion(x, y) {
  ctx.fillStyle = 'orange';
  ctx.beginPath();
  ctx.arc(x, y, 30, 0, Math.PI * 2);
  ctx.fill();
}

// Game loop
function gameLoop() {
  if (gameOver) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Update player
  player.dx = 0;
  player.dy = 0;
  if (forwardPressed) player.dy = -playerSpeed;
  if (backwardPressed) player.dy = playerSpeed;
  if (leftPressed) player.dx = -playerSpeed;
  if (rightPressed) player.dx = playerSpeed;
  player.x += player.dx;
  player.y += player.dy;

  // Prevent player from going out of bounds
  if (player.x < 0) player.x = 0;
  if (player.x > canvas.width - player.width) player.x = canvas.width - player.width;
  if (player.y < 0) player.y = 0;
  if (player.y > canvas.height - player.height) player.y = canvas.height - player.height;

  // Draw player
  ctx.fillStyle = player.color;
  ctx.fillRect(player.x, player.y, player.width, player.height);

  // Handle shield
  if (shieldPressed) {
    player.shield = true;
    shield.visible = true;
    shield.x = player.x + player.width;
    shield.y = player.y + player.height / 2 - shield.height / 2;
    ctx.fillStyle = shield.color;
    ctx.fillRect(shield.x, shield.y, shield.width, shield.height);
  } else {
    player.shield = false;
    shield.visible = false;
  }

  // Handle attack
  if (attackPressed) {
    player.attacking = true;
    weapon.visible = true;
    weapon.direction = rightPressed ? 'right' : leftPressed ? 'left' : weapon.direction;
    if (weapon.direction === 'right') {
      weapon.x = player.x + player.width;
      weapon.y = player.y + player.height / 2 - weapon.height / 2;
    } else if (weapon.direction === 'left') {
      weapon.x = player.x - weapon.width;
      weapon.y = player.y + player.height / 2 - weapon.height / 2;
    }

    ctx.fillStyle = weapon.color;
    ctx.fillRect(weapon.x, weapon.y, weapon.width, weapon.height);
  } else {
    player.attacking = false;
    weapon.visible = false;
  }

  // Update and draw coins
  coins.forEach((coin) => {
    if (!coin.collected) {
      ctx.fillStyle = 'yellow';
      ctx.fillRect(coin.x, coin.y, coin.width, coin.height);

      // Check for collision with player
      if (checkCollision(player, coin)) {
        coin.collected = true;
        score += 10;
      }
    }
  });

  // Update and draw power-ups
  powerUps.forEach((powerUp, index) => {
    ctx.fillStyle = powerUp.color;
    ctx.fillRect(powerUp.x, powerUp.y, powerUp.width, powerUp.height);

    // Check for collision with player
    if (checkCollision(player, powerUp)) {
      player.health = Math.min(player.health + 20, playerMaxHealth); // Increase health
      powerUps.splice(index, 1); // Remove the power-up from the array
    }
  });

  // Update and draw checkpoints
  checkpoints.forEach((checkpoint, index) => {
    ctx.fillStyle = checkpoint.color;
    ctx.fillRect(checkpoint.x, checkpoint.y, checkpoint.width, checkpoint.height);

    // Check for collision with player
    if (checkCollision(player, checkpoint)) {
      checkpointCollected = true; // Collect the checkpoint
      checkpoints.splice(index, 1); // Remove the checkpoint from the array
    }
  });

  // Update and draw enemies
  enemies.forEach((enemy, index) => {
    enemy.x += enemy.dx;
    enemy.y += enemy.dy;

    // Reverse direction if enemy hits canvas boundary
    if (enemy.x <= 0 || enemy.x >= canvas.width - enemy.width) enemy.dx *= -1;
    if (enemy.y <= 0 || enemy.y >= canvas.height - enemy.height) enemy.dy *= -1;

    // Draw enemy
    ctx.fillStyle = enemy.color;
    ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);

    // Draw enemy health bar
    ctx.fillStyle = 'black';
    ctx.fillRect(enemy.x, enemy.y - 10, enemy.width, 5);
    ctx.fillStyle = 'green';
    ctx.fillRect(enemy.x, enemy.y - 10, (enemy.width * enemy.health) / enemyMaxHealth, 5);

    // Shoot arrows at the player
    if (Math.random() < 0.002) { // Reduced random chance to shoot an arrow (0.2%)
      const arrow = {
        x: enemy.x,
        y: enemy.y + enemy.height / 2 - 2,
        width: 10,
        height: 5,
        color: 'black',
        dx: (player.x - enemy.x) / 100,
        dy: (player.y - enemy.y) / 100,
      };
      arrows.push(arrow);
    }

    // Check for collision with player
    if (checkCollision(player, enemy)) {
      player.health -= 1;
      if (player.health <= 0) {
        deathCount++;
        if (deathCount >= 3) {
          checkpointCollected = false; // Lose checkpoint if player dies 3 times
        }
        gameOver = true;
        alert('Game Over! You ran out of health.');
        return;
      }
    }

    // Check for attack
    if (player.attacking && weapon.visible && checkCollision(weapon, enemy)) {
      enemy.health -= 5;
      if (enemy.health <= 0) {
        // Create explosion effect
        explosions.push({ x: enemy.x + enemy.width / 2, y: enemy.y + enemy.height / 2 });
        // Increase player's health
        player.health = Math.min(player.health + 10, playerMaxHealth);
        // Remove enemy
        enemies.splice(index, 1);
        score += 20;
      }
    }
  });

  // Draw explosions
  explosions.forEach((explosion, index) => {
    drawExplosion(explosion.x, explosion.y);
    // Remove explosion after being drawn once
    explosions.splice(index, 1);
  });

  // Update and draw arrows
  arrows.forEach((arrow, index) => {
    arrow.x += arrow.dx;
    arrow.y += arrow.dy;

    // Draw arrow
    ctx.fillStyle = arrow.color;
    ctx.fillRect(arrow.x, arrow.y, arrow.width, arrow.height);

    // Check for collision with player
    if (checkCollision(arrow, player)) {
      if (player.shield) {
        // Deflect the arrow
        arrows.splice(index, 1);
      } else {
        player.health -= 10;
        arrows.splice(index, 1); // Remove arrow from array
        if (player.health <= 0) {
          deathCount++;
          if (deathCount >= 3) {
            checkpointCollected = false; // Lose checkpoint if player dies 3 times
          }
          gameOver = true;
          alert('Game Over! You ran out of health.');
        }
      }
    }
  });

  // Draw goal
  ctx.fillStyle = goal.color;
  ctx.fillRect(goal.x, goal.y, goal.width, goal.height);

  // Check for collision with goal
  if (checkCollision(player, goal)) {
    if (currentLevel < levels.length - 1) {
      currentLevel++;
      initializeLevel();
    } else {
      gameOver = true;
      alert(`You Win! Score: ${score}`);
      return;
    }
  }

  // Draw player health bar
  ctx.fillStyle = 'black';
  ctx.fillRect(player.x, player.y - 10, player.width, 5);
  ctx.fillStyle = 'green';
  ctx.fillRect(player.x, player.y - 10, (player.width * player.health) / playerMaxHealth, 5);

  // Draw score and time left
  ctx.fillStyle = 'black';
  ctx.font = '20px Arial';
  ctx.fillText(`Score: ${score}`, 10, 20);
  ctx.fillText(`Time Left: ${timeLeft}`, 10, 40);

  // Update time left
  timeLeft -= 0.0167; // Approximately 1 second per frame at 60 FPS
  if (timeLeft <= 0) {
    gameOver = true;
    alert('Time\'s up! Game Over.');
    return;
  }

  requestAnimationFrame(gameLoop);
}

// Restart game
function restartGame() {
  gameOver = false;
  score = 0;
  timeLeft = 120;
  currentLevel = 0;
  checkpointCollected = false;
  deathCount = 0;
  initializeLevel();
  gameLoop();
}

// Start the game
initializeLevel();
gameLoop();