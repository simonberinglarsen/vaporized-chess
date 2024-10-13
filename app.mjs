const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.style.width = '900px';  // 600 * 1.5
canvas.style.height = '600px'; // 400 * 1.5

// Set the canvas resolution (actual drawing area)
canvas.width = 600;
canvas.height = 400;

let lastTime = 0;
const fps = 30;
const interval = 1000 / fps;

// game vars
let keysPressed = [];
let entities = []
let tick = 0;
let state = {
    selectedDial: 0,
    selectionText: '',
    questionText: '',
    answerText: '',
    solution: [],
    shake: 0,
    solved: false
}

window.addEventListener('keydown', function (event) {
    if (!keysPressed.includes(event.code)) {
        keysPressed.push(event.code);
    }
});

class Entity {
    constructor(x, y, ext, group, text) {
        this.x = x;
        this.y = y;
        this.ext = ext;
        this.tx = x;
        this.ty = y;
        this.t = 0;
        this.dt = 0;
        this.group = group;
        this.text = text;
        this.visible = true;
        this.color = 'red';
    }

    setTarget(x, y, speed) {
        this.tx = x;
        this.ty = y;
        this.t = 0;
        this.dt = speed;
    }

    update() {
        this.t += this.dt;
        if (this.t >= 1) {
            this.x = this.tx;
            this.y = this.ty;
            this.t = 0;
            this.dt = 0;
        }
        else {
            this.x = this.tx * (this.t) + this.x * (1 - this.t);
            this.y = this.ty * (this.t) + this.y * (1 - this.t);
        }
        if (this.life) {
            this.life -= 1;
            if (this.life <= 0) {
                this.dead = true;
            }
        }
    }
}

function squareToText(square) {
    const file = String.fromCharCode(65 + (square % 8)); // 65 is 'A'
    const rank = 8 - Math.floor(square / 8);
    return `${file}${rank}`;
}

function textToSquare(text) {
    const file = text.charCodeAt(0) - 65; // 'A' is 65
    const rank = 8 - parseInt(text[1]);
    return rank * 8 + file;
}

function lastEntity() {
    return entities[entities.length - 1];
}

function setAnswerText(txt) {
    state.answerText = txt;
    let e = entities.find(e => e.group === 'answer');
    e.x = 300 - txt.length * 10;
    e.text = txt;
}

function setupQuestionAndSolution() {
    let square = Math.floor(Math.random() * 64);
    state.questionText = `Bishop on ${squareToText(square)}, edge squares?`;
    entities.find(e => e.group === 'question').text = state.questionText;
    const edges = [];
    const file = square % 8, rank = Math.floor(square / 8);
    for (let i = 1; i < 8; i++) {
        if (file + i < 8 && rank + i < 8) edges[0] = (rank + i) * 8 + (file + i); // ↘
        if (file - i >= 0 && rank - i >= 0) edges[1] = (rank - i) * 8 + (file - i); // ↖
        if (file + i < 8 && rank - i >= 0) edges[2] = (rank - i) * 8 + (file + i); // ↗
        if (file - i >= 0 && rank + i < 8) edges[3] = (rank + i) * 8 + (file - i); // ↙
    }
    state.solution = edges.filter(e => e !== null).map(e => squareToText(e));
}

function init() {
    entities.push(...'ABCDEFGH'
        .split('')
        .map((letter, i) => new Entity(
            Math.cos(Math.PI * 2 / 8 * i) * 100 + 300,
            Math.sin(Math.PI * 2 / 8 * i) * 100 + 200,
            { type: 'DialNode', size: 20 },
            "letters",
            letter
        )));
    entities.filter(e => e.group === 'letters').forEach(e => {
        e.setTarget(e.x, e.y, 0.1);
        e.x = 300;
        e.y = 200;
    });

    entities.push(...'12345678'
        .split('')
        .map((letter, i) => new Entity(
            Math.cos(Math.PI * 2 / 8 * i) * 60 + 300,
            Math.sin(Math.PI * 2 / 8 * i) * 60 + 200,
            { type: 'DialNode', size: 20 },
            "digits",
            letter
        )));
    entities.filter(e => e.group === 'digits').forEach(e => {
        e.setTarget(e.x, e.y, 0.1);
        e.x = 300;
        e.y = 200;
    });

    entities.push(new Entity(
        300, 180,
        { type: 'DialNode', size: 20 },
        'ok',
        '^'
    ));
    entities.filter(e => e.group === 'ok').forEach(e => {
        e.setTarget(e.x, e.y, 0.1);
        e.x = 300;
        e.y = 200;
    });

    entities.push(new Entity(
        20, 40,
        { type: 'Label' },
        'question',
        '...'
    ));
    lastEntity().color = 'white';

    entities.push(new Entity(
        0, 380,
        { type: 'Label' },
        'answer',
        ''
    ));
    lastEntity().color = 'green';

    entities.push(new Entity(
        600, 200,
        { type: 'Label' },
        'welldone',
        'WELL DONE!'
    ));
    lastEntity().color = 'purple';

    setupQuestionAndSolution();
}




function update() {
    tick++;

    let letters = entities.filter(e => e.group === "letters");
    let digits = entities.filter(e => e.group === "digits");
    let ok = entities.find(e => e.group === "ok");
    let selectedDial = state.selectedDial;
    if (keysPressed.includes('ArrowDown')) {
        selectedDial = (selectedDial + 1) % 3;
    }
    if (keysPressed.includes('ArrowUp')) {
        selectedDial = (selectedDial + 2) % 3;
    }
    letters.forEach(e => e.color = selectedDial === 0 ? 'yellow' : 'red');
    digits.forEach(e => e.color = selectedDial === 1 ? 'yellow' : 'red');
    ok.color = selectedDial === 2 ? 'yellow' : 'red';
    state.selectedDial = selectedDial;

    // set color en selection
    let selection = [...letters, ...digits].filter(e => e.x > 280 && e.x < 320 && e.y > 80 && e.y < 160);
    if (selectedDial === 2) {
        selection.forEach(e => e.color = 'green');
    }

    let moveDial = null;
    if (keysPressed.includes('ArrowRight')) {
        moveDial = 'clockwise';
    }
    if (keysPressed.includes('ArrowLeft')) {
        moveDial = 'counter-clockwise';
    }
    if (moveDial && selectedDial < 2) {
        let isDigit = selectedDial === 1;
        let letterOrDigit = isDigit ? digits : letters;
        if (letterOrDigit[0].dt === 0) {
            let from = (isDigit ? '12345678' : 'ABCDEFGH').split('');
            let to = (isDigit ? '23456781' : 'BCDEFGHA').split('');
            if (moveDial === 'counter-clockwise') {
                [from, to] = [to, from];
            }
            let currentPositions = {};
            letterOrDigit.forEach(l => currentPositions[l.text] = { x: l.x, y: l.y });
            letterOrDigit.forEach(l => {
                let indexOfLetter = from.indexOf(l.text);
                let targetLetter = to[indexOfLetter];
                let targetPos = currentPositions[targetLetter];
                l.setTarget(targetPos.x, targetPos.y, 0.3)
            });
        }

    }
    if (keysPressed.includes('Enter') && selectedDial === 2) {
        let letter = selection.find(e => e.group === 'letters').text;
        let digit = selection.find(e => e.group === 'digits').text;
        let selectionText = letter + digit;
        let solution = state.solution;
        let correctSolution = solution.includes(selectionText);
        let newAnswer = !state.answerText.includes(selectionText);

        if (!correctSolution) {
            state.shake = 10;
        }
        else if (newAnswer) {
            setAnswerText((state.answerText + ' ' + selectionText).trim())
            let getRandomVividColor = () => {
                const r = Math.floor(Math.random() * 156) + 100;
                const g = Math.floor(Math.random() * 156) + 100;
                const b = Math.floor(Math.random() * 156) + 100;
                return `rgb(${r}, ${g}, ${b})`;
            }
            for (let i = 0; i < 250; i++) {
                let randomAngle = Math.PI * 2 * Math.random();
                let angle = {
                    x: Math.cos(randomAngle),
                    y: Math.sin(randomAngle)
                };
                let r = Math.random() * 600;
                let e = new Entity(
                    300,
                    200,
                    { type: 'Circle', size: (r / 600) * 10 }
                );
                e.color = getRandomVividColor();
                e.setTarget(angle.x * r + 300, angle.y * r + 200, Math.random() * 0.1 + 0.01);
                e.life = r / 600 * 50;
                entities.push(e);
            }
        }
        let completeAnswer = solution.every(square => state.answerText.includes(square));
        if (completeAnswer && !state.solved) {
            state.solved = true;
            // animate things out...
            entities.find(e => e.group === 'welldone').setTarget(200,200,0.1);
            entities.filter(e => e.group === 'letters').forEach(e => e.setTarget(e.x-600,e.y,0.005));
            entities.filter(e => e.group === 'digits').forEach(e => e.setTarget(e.x-600,e.y,0.005));
            entities.filter(e => e.group === 'ok').forEach(e => e.setTarget(e.x-600,e.y,0.005));
            entities.filter(e => e.group === 'question').forEach(e => e.setTarget(e.x,-40,0.005));
        
        }
    }
    if (keysPressed.includes('KeyT')) {
        entities.find(e => e.group === 'welldone').setTarget(200,200,0.1);
        entities.filter(e => e.group === 'letters').forEach(e => e.setTarget(e.x-600,e.y,0.005));
        entities.filter(e => e.group === 'digits').forEach(e => e.setTarget(e.x-600,e.y,0.005));
        entities.filter(e => e.group === 'ok').forEach(e => e.setTarget(e.x-600,e.y,0.005));
        entities.filter(e => e.group === 'question').forEach(e => e.setTarget(e.x,-40,0.005));
}

    entities.forEach(e => {
        e.update();
    })

    entities = entities.filter(e => !e.dead);

    if (state.shake > 0) {
        state.shake--;
    }
    else {
        state.shake = 0;
    }

    keysPressed = [];
}

function render() {
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (state.shake > 0) {
        ctx.save();
        ctx.translate((Math.random() - 0.5) * 20, (Math.random() - 0.5) * 20);
    }
    entities.forEach((e, i) => {
        if (!e.visible) return;
        if (e.ext.type === 'DialNode' || e.ext.type === 'Circle') {
            const entitySize = e.ext.size;
            let t = (((tick + i) % 60) / 60) * 2 * Math.PI;
            if (e.color !== 'yellow') t = 0;
            let ofsx = Math.cos(t * 5) * 2;
            let ofsy = Math.sin(t * 3) * 2;
            let x = Math.floor(e.x + ofsx);
            let y = Math.floor(e.y + ofsy);
            ctx.beginPath(); // Begin a new path
            ctx.arc(x, y, entitySize, 0, Math.PI * 2); // Draw a circle (x, y, radius, startAngle, endAngle)
            ctx.fillStyle = e.color;
            ctx.fill();
            ctx.closePath();
            if (e.text) {
                ctx.font = "20px 'Press Start 2P', monospace";
                ctx.fillStyle = "black";
                ctx.fillText(e.text, x - entitySize / 2, y - entitySize / 2 + 20);
            }
        }
        else if (e.ext.type === 'Label') {
            ctx.font = "20px 'Press Start 2P', monospace";
            ctx.fillStyle = e.color;
            let ofs = 0;
            if (e.group === 'answer') {
                let t = ((tick % 40) / 40) * 2 * Math.PI;
                ofs = Math.cos(t) * 10;
            }
            ctx.fillText(e.text, e.x + ofs, e.y);
        }
    });

    if (state.shake > 0) {
        ctx.restore();
    }
}

// Main game loop
function gameLoop(time) {
    const deltaTime = time - lastTime;
    if (deltaTime >= interval) {
        update();
        render();
        lastTime = time;
    }
    requestAnimationFrame(gameLoop);
}

// Start the game
init();
requestAnimationFrame(gameLoop);
