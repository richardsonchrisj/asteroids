// create Phaser.Game object named "game"
var game = new Phaser.Game(800, 600, Phaser.AUTO, 'my-game', {
    preload: preload,
    create: create,
    update: update
});

// declare global variables for game
var maxLives = 5;
var maxSpeed = 100;
var newLife = 10000;
var score = 0;
var shipLives = 3;
var arrowKey, asteroidGroup, asteroidParticles, boomSound, engineSound, explosion, fireKey, fireSound, gameOverText, gameTitle, healthBar, healthText, laser, lifeSound, livesBar, livesCrop, livesText, player, restartText, scoreText, space, startText, teleportSound;


// preload game assets - runs once at start
function preload() {
    game.load.audio('boom', '/sounds/boom.wav');
    game.load.audio('engine', 'sounds/engine.mp3');
    game.load.audio('fire', '/sounds/fire.wav');
    game.load.audio('teleport', '/sounds/teleport.mp3');
    game.load.audio('life', '/sounds/extra-life.wav');
    game.load.image('bullet', 'images/laser.png');
    game.load.image('green-bar', 'images/health-green.png');
    game.load.image('livesBar', 'images/ship-lives.png');
    game.load.image('red-bar', 'images/health-red.png');
    game.load.image('space', 'images/space-stars.jpg');
    game.load.image('title', 'images/asteroids-2084-title.png');
    game.load.spritesheet('asteroid', 'images/asteroid.png', 40, 40);
    game.load.spritesheet('explostion', 'images/explosion.png', 128, 128);
    game.load.spritesheet('particle', 'images/asteroid-particle.png', 20, 20);
    game.load.spritesheet('ship', 'images/spaceship.png', 64, 64);
}

// create game world - runs once after "preload" finished
function create() {
    game.physics.startSystem(Phaser.Physics.ARCADE);

    space = game.add.tileSprite(0, 0, 800, 600, 'space');

    laser = game.add.weapon(10, 'bullet');
    laser.bulletKillType = Phaser.Weapon.KILL_CAMERA_BOUNDS;
    laser.bulletSpeed = 600;
    laser.fireRate = 250;

    // set bullet collision area to match its visual size
    laser.setBulletBodyOffset(24, 12, 6, 6);

    player = game.add.sprite(game.world.centerX, game.world.centerY, 'ship');
    player.animations.add('moving', [0, 1, 2], 10, true);
    player.anchor.set(0.5, 0.5);
    game.physics.arcade.enable(player);
    player.body.setCircle(20, 12, 12);
    player.body.maxVelocity.set(400);
    player.body.drag.set(20);
    player.body.collideWorldBounds = true;
    player.angle = -90;
    player.health = 100;
    player.maxHealth = 100;

    // hide player until game starts
    player.exists = false;

    player.events.onKilled.add(function() {
        explosion.reset(player.x, player.y);
        shipLives -= 1;
        livesCrop = new Phaser.Rectangle(0, 0, shipLives * 25, 25);
        livesBar.crop(livesCrop);
        explosion.animations.play('explode', 30, false, true);

        // respawn player if lives are left
        if (shipLives > 0) {
            player.x = game.world.centerX;
            player.y = game.world.centerY;
            player.angle = -90;
            player.body.velocity.set(0);
            player.body.acceleration.set(0);
            player.revive(player.maxHealth);
            player.alpha = 0; // start as transparent
            game.add.tween(player).to({
                alpha: 1
            }, 2000, Phaser.Easing.Cubic.Out, true);
            teleportSound.play();

        } else {
            gameOverText.visible = true;
            gameOverText.scale.setTo(3);
            game.add.tween(gameOverText).to({
                alpha: 1
            }, 1000, Phaser.Easing.Cubic.Out, true);
            game.add.tween(gameOverText.scale).to({
                x: 1,
                y: 1
            }, 1000, Phaser.Easing.Cubic.Out, true);
            restartText.visible = true;
            restartText.alpha = 0;
            game.add.tween(restartText).to({
                alpha: 1
            }, 2000, Phaser.Easing.Cubic.Out, true, 2000);
            fireKey.onDown.addOnce(restartGame, this);
        }
    });
    laser.trackSprite(player, 0, 0, true);
    fireSound = game.add.audio('fire', 0.4);
    laser.onFire.add(function() {
        fireSound.play();
    });

    // add asteroids
    asteroidGroup = game.add.group();
    asteroidGroup.enableBody = true;
    for (var i = 0; i < 10; i++) {
        var asteroid = asteroidGroup.create(game.world.randomX, game.world.randomY, 'asteroid');
        asteroid.anchor.set(0.5, 0.5);
        asteroid.body.setCircle(15, 5, 5);
        asteroid.animations.add('spin-clock', [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], 16, true);
        asteroid.animations.add('spin-counter', [15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0], 16, true);
        if (Math.random() < 0.5) asteroid.animations.play('spin-clock');
        else asteroid.animations.play('spin-counter');
        asteroid.body.velocity.x = Math.random() * maxSpeed;
        if (Math.random() < 0.5) asteroid.body.velocity.x *= -1;
        asteroid.body.velocity.y = Math.random() * maxSpeed;
        if (Math.random() < 0.5) asteroid.body.velocity.y *= -1;
    }
    asteroidParticles = game.add.emitter(0, 0, 50);
    asteroidParticles.makeParticles('particle');
    asteroidParticles.gravity = 0;
    asteroidParticles.setAlpha(1, 0, 1000);
    explosion = game.add.sprite(100, 100, 'explostion');
    explosion.animations.add('explode', [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], 30, false);
    explosion.anchor.set(0.5, 0.5);
    explosion.visible = false;

    //add input
    arrowKey = game.input.keyboard.createCursorKeys();
    fireKey = game.input.keyboard.addKey(Phaser.KeyCode.SPACEBAR);
    fireKey.onDown.addOnce(startGame, this);

    //add text
    scoreText = game.add.text(20, 20, 'SCORE: ' + score, {
        font: 'Arial',
        fontSize: '20px',
        fontStyle: 'bold',
        fill: '#ffffff'
    });
    healthText = game.add.text(210, 20, 'SHIELDS', {
        font: 'Arial',
        fontSize: '20px',
        fontStyle: 'bold',
        fill: '#ffffff'
    });

    //add status bars
    game.add.image(300, 20, 'red-bar');
    healthBar = game.add.image(300, 20, 'green-bar');

    livesBar = game.add.image(655, 20, 'livesBar');
    livesCrop = new Phaser.Rectangle(0, 0, shipLives * 25, 25);
    livesBar.crop(livesCrop);

    gameTitle = game.add.image(game.world.centerX, game.world.centerY + 100, 'title');
    gameTitle.anchor.set(0.5, 0.5);
    gameTitle.scale.setTo(0.75);

    startText = game.add.text(game.world.centerX, game.world.centerY + 200, 'Press Fire to Start Mission', {
        font: 'Arial',
        fontSize: '20px',
        fontStyle: 'bold',
        fill: '#ffffff'
    });
    startText.anchor.set(0.5, 0.5);

    gameOverText = game.add.text(game.world.centerX, game.world.centerY - 100, 'Game Over', {
        font: 'Arial',
        fontSize: '48px',
        fontStyle: 'bold',
        fill: '#ff0000'
    });
    gameOverText.anchor.set(0.5, 0.5);
    gameOverText.visible = false;

    restartText = game.add.text(game.world.centerX, game.world.centerY + 200, 'Press Fire to Restart Game', {
        font: 'Arial',
        fontSize: '20px',
        fontStyle: 'bold',
        fill: '#ffffff'
    });
    restartText.anchor.set(0.5, 0.5);
    restartText.visible = false;

    livesText = game.add.text(590, 20, 'SHIPS', {
        font: 'Arial',
        fontSize: '20px',
        fontStyle: 'bold',
        fill: '#ffffff'
    });

    //sounds
    boomSound = game.add.audio('boom', 0.7);
    engineSound = game.add.audio('engine', 0.5);
    engineSound.loop = true;
    lifeSound = game.add.audio('life', 0.5);
    teleportSound = game.add.audio('teleport', 0.6);
}

// update gameplay - runs in continuous loop after "create" finished
function update() {

    game.physics.arcade.collide(player, asteroidGroup, collideAsteroid, null, this);
    game.physics.arcade.collide(laser.bullets, asteroidGroup, shootAsteroid, null, this);

    if (arrowKey.left.isDown) {
        // rotate player counter-clockwise (negative value)
        player.body.angularVelocity = -200;
    } else if (arrowKey.right.isDown) {
        // rotate player clockwise (positive value)
        player.body.angularVelocity = 200;
    } else {
        // stop rotating player
        player.body.angularVelocity = 0;
    }

    if (arrowKey.up.justDown) {
        engineSound.play();

    } else if (arrowKey.up.isDown && player.exists) {
        // accelerate player forward
        game.physics.arcade.accelerationFromRotation(player.rotation, 200, player.body.acceleration);
        player.animations.play('moving');
    } else if (arrowKey.up.justUp) {
        // stop accelerating player
        player.body.acceleration.set(0);
        player.animations.stop();
        player.frame = 1;
        engineSound.stop();
    }

    if (fireKey.isDown && player.exists) {
        // rotate player counter-clockwise (negative value)
        laser.fire();

    }

    // keep player onscreen (instead of collideWorldBounds)
    // will allow space tilesprite to keep scrolling
    if (player.left <= 50) player.left = 50;
    else if (player.right >= game.world.width - 50) player.right = game.world.width - 50;

    if (player.top <= 50) player.top = 50;
    else if (player.bottom >= game.world.height - 50) player.bottom = game.world.height - 50;

    // scroll space tilesprite in opposite direction of player velocity
    space.tilePosition.x = space.tilePosition.x - player.body.velocity.x / 40;
    space.tilePosition.y = space.tilePosition.y - player.body.velocity.y / 40;

    asteroidGroup.forEach(function(asteroid) {
        game.world.wrap(asteroid, 20);
    });

    asteroidGroup.forEach(function(asteroid) {
        game.world.wrap(asteroid, 20);
    });

    // randomly add new asteroid if dead asteroid available
    if (Math.random() < 0.02) {
        var asteroid = asteroidGroup.getFirstDead();
        if (asteroid) {
            // reset asteroid at random position in game
            asteroid.reset(game.world.randomX, game.world.randomY);

            // give asteroid random speed and direction
            asteroid.body.velocity.x = Math.random() * maxSpeed;
            if (Math.random() < 0.5) asteroid.body.velocity.x *= -1;

            asteroid.body.velocity.y = Math.random() * maxSpeed;
            if (Math.random() < 0.5) asteroid.body.velocity.y *= -1;

            // make asteroid fade into view
            asteroid.alpha = 0; // start as transparent
            game.add.tween(asteroid).to({
                alpha: 1
            }, 500, Phaser.Easing.Cubic.Out, true);
        }
    }
}

// add custom functions (for collisions, etc.)

function collideAsteroid(player, asteroid) {
    asteroidParticles.x = asteroid.x;
    asteroidParticles.y = asteroid.y;
    asteroidParticles.explode(1000, 5);
    asteroid.kill();
    player.damage(25);
    healthBar.scale.setTo(player.health / player.maxHealth, 1);
    game.camera.shake(0.02, 250);
    boomSound.play();

}

function shootAsteroid(bullet, asteroid) {
    asteroidParticles.x = asteroid.x;
    asteroidParticles.y = asteroid.y;
    asteroidParticles.explode(1000, 5);
    asteroid.kill();
    bullet.kill();
    boomSound.play();
    score += 250;
    scoreText.text = 'SCORE: ' + score;
    checkNewLife();
    maxSpeed += 2;
}

function checkNewLife() {
    if (score >= newLife) {
        if (shipLives < maxLives) {
            shipLives++;
            livesCrop = new Phaser.Rectangle(0, 0, shipLives * 25, 25);
            livesBar.crop(livesCrop);
            lifeSound.play();
            game.camera.flash(0x00ff00, 500);
        } else if (player.health < player.maxHealth) {
            player.health = player.maxHealth;
            healthBar = game.add.image(300, 20, 'green-bar');
            lifeSound.play();
        }
        newLife = newLife + 10000;
    }
}

function startGame() {
    // fade out start text
    game.add.tween(startText).to({
        alpha: 0
    }, 250, Phaser.Easing.Cubic.Out, true);

    // fade out and zoom out game title (after slight delay)
    game.add.tween(gameTitle).to({
        alpha: 0
    }, 3000, Phaser.Easing.Cubic.Out, true, 250);
    game.add.tween(gameTitle.scale).to({
        x: 3,
        y: 3
    }, 3000, Phaser.Easing.Cubic.Out, true, 250);

    teleportSound.play();
    player.exists = true;
    game.add.tween(player).to({
        alpha: 1
    }, 2000, Phaser.Easing.Cubic.Out);

}

function restartGame() {
    score = 0;
    shipLives = 3;
    newLife = 10000;
    maxSpeed = 100;
    game.state.restart();

}