import kaplay from "kaplay";
// import "kaplay/global"; // uncomment if you want to use without the k. prefix

// constants
const GAME_SCALE = 4;
const PIXEL_DEPTH = 16;
const PLAYER_ANIM_SPEED = 8;

const k = kaplay({
  debugKey: "r",
  crisp: false,
  canvas: document.getElementById("game") as HTMLCanvasElement,
});

k.loadRoot("./"); // A good idea for Itch.io publishing later
k.setBackground(k.color(20, 162, 227).color);
k.loadSprite("room2a", "assets/maps/room2a.png");

// k.loadSpriteAtlas('sprites/player/Adam_16x16.png', {
//   hero: {
//     x: 0,
//     y: 0,
//     width: 384,
//     height: 224,
//     sliceX: 24,
//     sliceY: 7,
//     anims: {
//       // idle: {from: 0, to: 3},
//       // run: {from: 4, to: 7},
//       // hit: 8,
//       idle_right: {from: 24, to: 29},
//       idle_up: {from: 30, to: 35},
//       idle_left: {from: 36, to: 41},
//       idle_down: {from: 42, to: 47},
//       right: {from: 48, to: 53},
//       up: {from: 54, to: 59},
//       left: {from: 60, to: 65},
//       down: {from: 66, to: 71},
//     },
//   },
// });

// sword player
k.loadSpriteAtlas("sprites/player/sword-guy/sword-guy-6x10.png", {
  hero: {
    x: 0,
    y: 0,
    width: 192,
    height: 320,
    sliceX: 6,
    sliceY: 10,
    anims: {
      // idle: {from: 0, to: 3},
      // run: {from: 4, to: 7},
      // hit: 8,
      idle_down: { from: 0, to: 5 },
      idle_right: { from: 6, to: 11 },
      idle_up: { from: 12, to: 17 },
      idle_left: { from: 6, to: 11 },
      walk_down: { from: 18, to: 23 },
      walk_right: { from: 24, to: 29 },
      walk_up: { from: 30, to: 35 },
      walk_left: { from: 24, to: 29 },
      attack_down: { from: 36, to: 39 },
      attack_right: { from: 42, to: 45 },
      attack_up: { from: 48, to: 51 },
      attack_left: { from: 42, to: 45 },
    },
  },
});

k.loadSprite("alex", "sprites/npc/Alex_idle_16x16.png", {
  sliceX: 4,
  anims: {
    down: {
      from: 3,
      to: 3,
    },
  },
});

const map = k.add([k.sprite("room2a"), k.pos(0, 0), k.scale(GAME_SCALE)]);

const alex = k.add([
  k.z(0),
  k.sprite("alex"),
  k.area({ shape: new k.Rect(k.vec2(0, 10), 15, 14) }),
  k.body({
    isStatic: false,
    mass: 5,
  }),
  k.anchor("center"),
  //k.color(150, 0, 0),
  k.color("#FF0000"),
  //k.opacity(0.4),
  k.pos(20 * PIXEL_DEPTH * GAME_SCALE, 45 * PIXEL_DEPTH * GAME_SCALE),
  k.scale(GAME_SCALE),
  k.health(100, 100),
  "enemy",
  "npc",
]);

alex.play("down");

const player = k.add([
  k.z(1),
  k.sprite("hero"),
  k.body(),
  k.anchor("center"),
  k.pos(25 * PIXEL_DEPTH * GAME_SCALE, 45 * PIXEL_DEPTH * GAME_SCALE), //k.height(), k.width() for unique screen width / height
  k.area({ shape: new k.Rect(k.vec2(0, 5), 15, 10) }),
  k.scale(GAME_SCALE),
  {
    speed: 15000, // Player movement speed
  },
]);

//add sword down
const swordHitBoxes = {
  left: k.add([
    k.rect(7 * PIXEL_DEPTH, 6 * PIXEL_DEPTH),
    k.pos(0, 0),
    k.area(),
    k.color("#FF0000"),
    k.opacity(0.4),
    "attack",
  ]),
  down: k.add([
    k.rect(9 * PIXEL_DEPTH, 5 * PIXEL_DEPTH),
    k.pos(0, 0),
    k.area(),
    k.color("#FF0000"),
    k.opacity(0.4),
    "attack",
  ]),
  up: k.add([
    k.rect(9 * PIXEL_DEPTH, 5 * PIXEL_DEPTH),
    k.pos(0, 0),
    k.area(),
    k.color("#FF0000"),
    k.opacity(0.4),
    "attack",
  ]),
  right: k.add([
    k.rect(7 * PIXEL_DEPTH, 6 * PIXEL_DEPTH),
    k.pos(0, 0),
    k.area(),
    k.color("#FF0000"),
    k.opacity(0.4),
    "attack",
  ]),
};

player.play("idle_down", { loop: true, speed: PLAYER_ANIM_SPEED });

//set initial camera pos
k.setCamPos(player.pos.x, player.pos.y);

const playerAnimCode = {
  "1_0": "walk_right",
  "-1_0": "walk_left",
  "0_1": "walk_down",
  "0_-1": "walk_up",
  "1_1": "walk_right",
  "-1_1": "walk_left",
  "1_-1": "walk_right",
  "-1_-1": "walk_left",
  "0_0": "idle_down",
};

// Add these variables before the onUpdate loop
let currentMoveX = 0;
let currentMoveY = 0;
let lastDirection = "down";
let velocityX = 0;
let velocityY = 0;
let playerIsAttacking = false;
const acceleration = 0.5; // How quickly player reaches max speed
const deceleration = 0.2; // How quickly player slows down
const cameraLerpSpeed = 0.1; // How quickly camera catches up to player

// trigger attach on space bar hit
k.onKeyDown("space", () => {
  if (playerIsAttacking) {
    return;
  }

  playerIsAttacking = true;

  switch (lastDirection) {
    case "down":
      swordHitBoxes[lastDirection].pos = k.vec2(
        player.pos.x - 4.5 * PIXEL_DEPTH,
        player.pos.y - 0.6 * PIXEL_DEPTH
      );
      break;
    case "up":
      swordHitBoxes[lastDirection].pos = k.vec2(
        player.pos.x - 4.5 * PIXEL_DEPTH,
        player.pos.y - 3.5 * PIXEL_DEPTH
      );
      break;
    case "left":
      swordHitBoxes[lastDirection].pos = k.vec2(
        player.pos.x - 4.5 * PIXEL_DEPTH,
        player.pos.y - 2 * PIXEL_DEPTH
      );
      break;
    case "right":
      swordHitBoxes[lastDirection].pos = k.vec2(
        player.pos.x - 2.5 * PIXEL_DEPTH,
        player.pos.y - 2 * PIXEL_DEPTH
      );
      break;
  }
  //swordHitBoxes[lastDirection].pos = k.vec2(player.pos.x - 4.5 * PIXEL_DEPTH, player.pos.y - 20);

  player.play(`attack_${lastDirection}`, {
    loop: false,
    speed: PLAYER_ANIM_SPEED * 2,
    onEnd: () => {
      //swordHitBoxes[lastDirection].hidden = false;
      swordHitBoxes[lastDirection].pos = k.vec2(0, 0);
      playerIsAttacking = false;
      player.play(`idle_${lastDirection}`, { loop: true, speed: 5 });
    },
  });
});

k.onCollide("attack", "enemy", (a, b, col) => {
  b.hurt(20);

  switch (lastDirection) {
    case "down":
      k.tween(
        b.pos,
        k.vec2(b.pos.x, b.pos.y + 32),
        0.2,
        (p) => (b.pos = p),
        k.easings.easeOutCubic
      );
      break;
    case "up":
      k.tween(
        b.pos,
        k.vec2(b.pos.x, b.pos.y - 32),
        0.2,
        (p) => (b.pos = p),
        k.easings.easeOutCubic
      );
      break;
    case "left":
      k.tween(
        b.pos,
        k.vec2(b.pos.x - 32, b.pos.y),
        0.2,
        (p) => (b.pos = p),
        k.easings.easeOutCubic
      );
      break;
    case "right":
      k.tween(
        b.pos,
        k.vec2(b.pos.x + 32, b.pos.y),
        0.2,
        (p) => (b.pos = p),
        k.easings.easeOutCubic
      );
      break;
  }

  //alex.moveTo(k.vec2(b.pos.x - 2 * PIXEL_DEPTH, b.pos.y));
  if (b.hp() <= 0) {
    k.addKaboom(k.vec2(b.pos.x + 2 * PIXEL_DEPTH, b.pos.y + 2 * PIXEL_DEPTH));
    b.destroy();
  }
});

// Modify the onUpdate function
k.onUpdate(() => {
  if (playerIsAttacking) {
    return;
  }

  // Get direction from keyboard input
  const moveX =
    k.isKeyDown("right") || k.isKeyDown("d")
      ? 1
      : k.isKeyDown("left") || k.isKeyDown("a")
      ? -1
      : 0;
  const moveY =
    k.isKeyDown("down") || k.isKeyDown("s")
      ? 1
      : k.isKeyDown("up") || k.isKeyDown("w")
      ? -1
      : 0;

  // Lerp the velocity
  const targetVelX = moveX * player.speed;
  const targetVelY = moveY * player.speed;

  velocityX = k.lerp(
    velocityX,
    targetVelX,
    moveX !== 0 ? acceleration : deceleration
  );
  velocityY = k.lerp(
    velocityY,
    targetVelY,
    moveY !== 0 ? acceleration : deceleration
  );

  // Only change animation if movement direction changes
  if (moveX !== currentMoveX || moveY !== currentMoveY) {
    // If both inputs are 0, use idle animation based on last direction
    if (moveX === 0 && moveY === 0) {
      player.play(`idle_${lastDirection}`, { loop: true, speed: 5 });
    } else {
      // Update last direction based on movement
      if (moveX > 0) lastDirection = "right";
      else if (moveX < 0) lastDirection = "left";
      else if (moveY > 0) lastDirection = "down";
      else if (moveY < 0) lastDirection = "up";

      let playerAnimSprite = playerAnimCode[`${moveX}_${moveY}`];
      player.flipX = moveX == -1 ? true : false;
      player.play(playerAnimSprite, { loop: true, speed: PLAYER_ANIM_SPEED });
    }
    currentMoveX = moveX;
    currentMoveY = moveY;
  }

  if (player.pos.y > alex.pos.y) {
    player.z = 100;
    alex.z = 0;
  } else {
    player.z = 0;
    alex.z = 100;
  }

  // Move player using interpolated velocity
  player.move(velocityX * k.dt(), velocityY * k.dt());

  // Smooth camera follow
  const currentCamPos = k.getCamPos();
  const targetCamPos = player.pos;

  const newCamX = k.lerp(currentCamPos.x, targetCamPos.x, cameraLerpSpeed);
  const newCamY = k.lerp(currentCamPos.y, targetCamPos.y, cameraLerpSpeed);

  k.setCamPos(newCamX, newCamY);
});
