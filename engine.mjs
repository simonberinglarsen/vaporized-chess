const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.style.width = '900px';
canvas.style.height = '600px';
canvas.width = 600;
canvas.height = 400;

let lastTime = 0;
const fps = 30;
const interval = 1000 / fps;
let tick = 0;
let game = null;
let keysPressed = [];

const color = [
    "#000000",   //  0 black
    "#1D2B53",   //  1 dark-blue
    "#7E2553",   //  2 dark-purple
    "#008751",   //  3 dark-green
    "#AB5236",   //  4 brown
    "#5F574F",   //  5 dark-grey
    "#C2C3C7",   //  6 light-grey
    "#FFF1E8",   //  7 white
    "#FF004D",   //  8 red
    "#FFA300",   //  9 orange
    "#FFEC27",   // 10 yellow
    "#00E436",   // 11 green
    "#29ADFF",   // 12 blue
    "#83769C",   // 13 lavender
    "#FF77A8",   // 14 pink
    "#FFCCAA"    // 15 light-peach
];

window.addEventListener('keydown', function (event) {
    if (!keysPressed.includes(event.code)) {
        keysPressed.push(event.code);
    }
});


function run(g) {
    game = g;
    game.init();
    requestAnimationFrame(gameLoop);
}

function gameLoop(time) {
    const deltaTime = time - lastTime;
    if (deltaTime >= interval) {
        tick++;
        game.update();
        keysPressed = [];
        game.render();
        lastTime = time;
    }
    requestAnimationFrame(gameLoop);
}

export { run, tick, ctx, canvas, color, keysPressed};