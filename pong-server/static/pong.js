
/*

*) choice - 1P, 2P
*) sounds
*) splash screen
*) ball trail
*)

*/

// 1 = human vs pc
// 2 = human vs human
var players = 1;

var rightBar;
var leftBar;
var ball;
var level;

function startPong() {
    game.init();
    game.choosePlayers();
}

var game = {

    canvas: document.createElement("canvas"),

    controller: new Controller(),

    init: function () {
        this.canvas.width = 480;
        this.canvas.height = 270;
        this.context = this.canvas.getContext("2d");
        document.body.insertBefore(this.canvas, document.body.childNodes[0]);
    },

    clear: function () {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    },

    startGame: function () {

        var width = 10;

        leftBar = new Bar(10, game.canvas.height / 4, "black", 0, 100, true);
        rightBar = new Bar(10, game.canvas.height / 4, "black", game.canvas.width - width, 100, false);
        ball = new Ball(5, "#000000", game.canvas.width / 2, game.canvas.height / 2);
        level = new Level(game.canvas.width / 2 - 50, 40, "black", "30px", "Consolas");

        this.interval = setInterval(updateGameArea, 1000 / 60);
    },

    choosePlayers: function () {


        // TODO choose human or computer opponent

        this.startGame();
    },

};

function Level(x, y, fontColor, size, font) {
    this.levels = [
        {
            computerStrength: 0.35,
            //winningScore: 2
        },
        {
            computerStrength: 0.4,
            //winningScore: 2
        },
        {
            computerStrength: 0.45,
            barShorteningRate: 0.9,
        },
        {
            computerStrength: 0.5,
            barShorteningRate: 0.9,
        },
        {
            computerStrength: 0.55,
            barShorteningRate: 0.85
        },
        {
            computerStrength: 0.6,
            barShorteningRate: 0.85
        },
        {
            computerStrength: 0.65,
            barShorteningRate: 0.8
        },
        {
            computerStrength: 0.70,
            barShorteningRate: 0.7
        },
        {
            computerStrength: 0.75,
            barShorteningRate: 0.7
        },
        {
            computerStrength: 0.80,
            barShorteningRate: 0.7
        }
    ];
    this.assignLevelParameters = function () {
        this.winningScore = this.levels[this.level].winningScore || 5;
        this.computerStrength = this.levels[this.level].computerStrength || 1;
        this.barShorteningRate = this.levels[this.level].barShorteningRate || 1;
    };
    this.level = 0;
    this.wonTheGame = false;
    this.assignLevelParameters();
    this.isAfterLastLevel = function () {
        return this.level >= this.levels.length;
    };
    this.isLastLevel = function () {
        return this.level === this.levels.length - 1;
    };

    this.isEndOfLevel = function (score) {
        return score === this.winningScore;
    };

    this.scoreChanged = function (score, isLeftPlayer) {

        if (this.wonTheGame) {
            return;
        }

        if (this.isEndOfLevel(score)) {

            this.level++;
            rightBar.resetScore();
            leftBar.resetScore();

            rightBar.setOriginalHeight();
            leftBar.setOriginalHeight();

            if (isLeftPlayer) {
                leftBar.increaseLevelScore();
            } else {
                rightBar.increaseLevelScore();
            }

            var isHuman = !isLeftPlayer;
            var computerWon = players === 1 && !isHuman;

            if (computerWon) {
                this.wonTheGame = "You LOST ! ! !";
                return;
            }

            if (this.isAfterLastLevel()) {
                if (players === 1) {
                    this.wonTheGame = "You WON ! ! !";
                } else {

                    if (rightBar.levelScore.value === leftBar.levelScore.value) {
                        return;
                    }

                    if (rightBar.levelScore.value > leftBar.levelScore.value) {
                        this.wonTheGame = "Right WON ! ! !"
                    } else {
                        this.wonTheGame = "Left WON ! ! !";
                    }
                }

            } else {
                this.assignLevelParameters();
            }
        }
    };
    this.getLevelLabel = function () {
        return "Level: " + (this.level + 1);
    };
    this.paint = function (paintingContext) {
        paintingContext.font = size + " " + font;
        paintingContext.fillStyle = fontColor;
        if (this.wonTheGame) {
            paintingContext.fillText(this.wonTheGame, x - 40, y);
        } else {
            paintingContext.fillText(this.getLevelLabel(), x, y);
        }

    }
}

function Ball(radius, color, x, y) {
    this.radius = radius;
    this.color = color;
    this.x = x;
    this.y = y;
    this.dx = 2;
    this.dy = 2;

    this.restart = function () {
        this.x = game.canvas.width / 2;
        this.y = game.canvas.height / 2;
        this.dx = 2;
        this.dy = 2;
    };

    this.paint = function (paintingContext) {
        paintingContext.fillStyle = this.color;
        paintingContext.beginPath();
        paintingContext.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
        paintingContext.fill();
    };

    this.move = function () {
        this.x = this.x + this.dx;
        this.y = this.y + this.dy;
    };

    this.collide = function () {

        if (this.x >= game.canvas.width) {
            this.restart();
            leftBar.increaseScore();
            level.scoreChanged(leftBar.score.value, true);
            leftBar.shorten();
            return;
        }

        if (this.x <= 0) {
            this.restart();
            rightBar.increaseScore();
            level.scoreChanged(rightBar.score.value, false);
            rightBar.shorten();
            return;
        }

        // right bar - always controlled by human
        if (this.x + this.radius >= rightBar.x
            && this.y >= rightBar.y
            && this.y <= rightBar.y + rightBar.height
            && this.dx > 0) {

            this.dx = this.dx * -1;

            if (game.controller.moving) {
                this.dx--;
                this.setDirection();
            }

        }
        // left bar -
        else if (this.x - this.radius <= leftBar.x + leftBar.width
            && this.y >= leftBar.y
            && this.y <= leftBar.y + leftBar.height
            && this.dx < 0) {

            this.dx = this.dx * -1;

            if (players === 2 && game.controller.moving) {
                this.dx++;
                this.setDirection();
            }

        } else if (this.dy < 0
            && this.y - this.radius <= 0) {

            this.dy = this.dy * -1;

        } else if (this.dy > 0
            && this.y + this.radius >= game.canvas.height) {

            this.dy = this.dy * -1;
        }

    };

    this.setDirection = function () {

        if (Math.random() > 0.8) {

            if (this.dy >= 0) {
                this.dy = this.dy + 1;

            }
            if (this.dy <= 0) {
                this.dy = this.dy - 1;
            }
        }

        if (Math.random() > 0.2) {
            if (this.dy > 0 && game.controller.movingDirection === 'up') {
                this.dy = this.dy * -1;

            }
            if (this.dy < 0 && game.controller.movingDirection === 'down') {
                this.dy = this.dy * -1;
            }

        }

    }
}

function Text(size, fontColor, color, x, y) {
    this.value = 0;

    this.paint = function (paintingContext) {
        paintingContext.font = size + " " + fontColor;
        paintingContext.fillStyle = color;
        paintingContext.fillText(this.value, x, y);
    }
}

function Bar(width, height, color, x, y, isLeft) {
    this.width = width;
    this.height = height;
    this.x = x;
    this.y = y;
    this.step = 5;
    this.originalHeight = height;
    this.score = new Text("30px", "Consolas", "black", isLeft ? x + 10 : x - 20, 40);
    this.levelScore = new Text("30px", "Consolas", "black", isLeft ? x + 10 : x - 20, game.canvas.height - 30);

    this.paint = function (paintingContext) {
        paintingContext.fillStyle = color;
        paintingContext.fillRect(this.x, this.y, this.width, this.height);
        this.score.paint(paintingContext);
        players === 2 && this.levelScore.paint(paintingContext);

    };

    this.goUp = function () {
        if (this.y > this.step) {
            this.y = this.y - this.step;
        }
    };

    this.goDown = function () {
        var lowestYPoint = game.canvas.height - this.height;
        if (this.y + this.step < lowestYPoint) {
            this.y = this.y + this.step;
        }
    };

    this.setDiff = function (diff) {
        var nextY = this.y + diff;
        var lowestYPoint = game.canvas.height - this.height;
        if (nextY < 0 || nextY > lowestYPoint) {
            return;
        }
        this.y = this.y + diff;
    };

    this.shorten = function () {
        this.height = this.height * level.barShorteningRate;
    };

    this.setOriginalHeight = function () {
        this.height = this.originalHeight;
    };

    this.increaseScore = function () {
        this.score.value++;
    };

    this.increaseLevelScore = function () {
        this.levelScore.value++;
    };

    this.resetScore = function () {
        this.score.value = 0;
    };

}

function updateGameArea() {

    if (game.controller.pause) {
        return;
    }

    if (players === 1) {
        moveByComputer();
        moveRightBarByKeyboard();
    } else {
        moveRightBarByKeyboard();
        moveLeftBarByKeyboard();
    }

    ball.collide();
    ball.move();

    game.clear();

    rightBar.paint(game.context);
    leftBar.paint(game.context);
    ball.paint(game.context);
    level.paint(game.context);
}

function Controller() {
    this.keys = {};
    this.pause = false;
    this.lastY = 0;
    this.moving = false;
    this.movingDirection = false;
    var self = this;
    var onkeydown = onkeyup = function (e) {
        e = e || event;
        self.moving = self.keys[e.code] = e.type === 'keydown';

        if (e.code === 'ArrowUp') {
            self.movingDirection = 'up';
        } else if (e.code === 'ArrowDown') {
            self.movingDirection = 'down';
        } else {
            self.movingDirection = false;
        }

        if (e.code === 'Space') {
            self.pause = !self.pause;
        }
    };
    var touchstart = function (e) {
        var touch = e.touches[0];
        self.lastY = touch.clientY;
        self.moving = true;
        self.movingDirection = false;
    };
    var touchend = function (e) {
        self.moving = false;
        self.movingDirection = false;
    };
    var touchmove = function (e) {
        e.stopPropagation();
        var touch = e.touches[0];
        var diff = self.lastY - touch.clientY;
        self.lastY = touch.clientY;
        rightBar.setDiff(diff * -1);
        self.movingDirection = diff < 0 ? 'down' : 'up';

    };

    document.addEventListener('keydown', onkeydown);
    document.addEventListener('onkeyup', onkeyup);

    document.addEventListener('touchstart', touchstart);
    document.addEventListener('touchend', touchend);
    document.addEventListener("touchmove", touchmove);

}


function moveRightBarByKeyboard() {

    if (game.controller.keys["ArrowUp"]) {
        rightBar.goUp();
    }
    if (game.controller.keys["ArrowDown"]) {
        rightBar.goDown();
    }

}

function moveLeftBarByKeyboard() {

    if (game.controller.keys["KeyW"]) {
        leftBar.goUp();
    }
    if (game.controller.keys["KeyS"]) {
        leftBar.goDown();
    }

}

function moveByComputer() {

    if (ball.dx > 0) {
        return;
    }

    if (Math.random() > level.computerStrength) {
        return;
    }

    if (ball.y > (leftBar.y + leftBar.height / 2)) {
        leftBar.goDown();
    }

    if (ball.y < (leftBar.y + leftBar.height / 2)) {
        leftBar.goUp();
    }

}


