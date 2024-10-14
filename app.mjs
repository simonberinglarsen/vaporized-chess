const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.style.width = '900px';
canvas.style.height = '600px';
canvas.width = 600;
canvas.height = 400;

let lastTime = 0;
const fps = 30;
const interval = 1000 / fps;

// -------
// library 
// -------
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
let keysPressed = [];
let tick = 0;
window.addEventListener('keydown', function (event) {
    if (!keysPressed.includes(event.code)) {
        keysPressed.push(event.code);
    }
});


// ---------
// game vars
// ---------
let entities = []
let state = {
    selectedDial: 0,
    selectionText: '',
    questionText: '',
    answerText: '',
    solution: [],
    shake: 0,
    solved: false
}

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
        this.color = color[8];
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

// -------------
// Scene helpers
// -------------
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
    let question = entities.find(e => e.group === 'question');
    question.text = state.questionText;
    question.setTarget(300 - state.questionText.length * 10, 40, 0.1);
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

function addDial(str, radius, groupName) {
    entities.push(...str
        .split('')
        .map((letter, i) => new Entity(
            Math.cos(Math.PI * 2 / 8 * i - Math.PI / 2) * radius + 300,
            Math.sin(Math.PI * 2 / 8 * i - Math.PI / 2) * radius + 200,
            { type: 'DialNode', size: 20 },
            groupName,
            letter
        )));
    entities.filter(e => e.group === groupName).forEach(e => {
        e.setTarget(e.x, e.y, 0.1);
        e.x = 300;
        e.y = 200;
    });
}

function addLabel(str, group, x, y, color) {
    entities.push(new Entity(x, y, { type: 'Label' }, group, str));
    lastEntity().color = color;
}

function init() {
    addDial('ABCDEFGH', 100, 'letters');
    addDial('12345678', 60, 'digits');
    addDial('^', 20, 'ok');

    addLabel('...', 'question', 20, -40, color[7]);
    addLabel('', 'answer', 0, 380, color[11]);
    addLabel('WELL DONE!', 'welldone', 650, 200, color[2]);

    setupQuestionAndSolution();
}

function moveGroupToFont(name) {
    let theRest = [];
    let theGroup = [];
    for (let e of entities) {
        e.group === name ? theGroup.push(e) : theRest.push(e);
    }
    entities = [...theRest, ...theGroup];
}

function updateArrowUpDown(allDialNodes) {
    if (keysPressed.includes('ArrowDown')) {
        state.selectedDial = (state.selectedDial + 1) % 3;
    }
    if (keysPressed.includes('ArrowUp')) {
        state.selectedDial = (state.selectedDial + 2) % 3;
    }
}

function updateArrowLeftRight(allDialNodes) {
    let selectedDial = state.selectedDial;
    let activeGroupName = ['letters', 'digits', 'ok'][selectedDial];
    let activeGroup = entities.filter(e => e.group === activeGroupName);
    allDialNodes.forEach(e => { e.ext.size = 20; e.color = color[8] });
    activeGroup.forEach(e => { e.ext.size = 22; e.color = color[10] });
    moveGroupToFont(activeGroupName);

    let rotateDial = null;
    if (keysPressed.includes('ArrowRight')) {
        rotateDial = 'clockwise';
    }
    if (keysPressed.includes('ArrowLeft')) {
        rotateDial = 'counter-clockwise';
    }
    if (rotateDial && selectedDial < 2) {
        let isDigit = selectedDial === 1;
        let letterOrDigit = activeGroup;
        if (letterOrDigit[0].dt === 0) {
            let from = (isDigit ? '12345678' : 'ABCDEFGH').split('');
            let to = (isDigit ? '23456781' : 'BCDEFGHA').split('');
            if (rotateDial === 'counter-clockwise') {
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
}

function updateEnterKey(allDialNodes) {
    let selection = allDialNodes.filter(e => e.x > 280 && e.x < 320 && e.y > 80 && e.y < 160);
    if (state.selectedDial === 2) {
        selection.forEach(e => e.color = color[11]);
    }
    if (keysPressed.includes('Enter') && state.selectedDial === 2) {
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
            for (let i = 0; i < 250; i++) {
                let randomAngle = Math.PI * 2 * Math.random();
                let angle = {
                    x: Math.cos(randomAngle),
                    y: Math.sin(randomAngle)
                };
                let r = Math.random() * 600;
                let e = new Entity(300, 200, { type: 'Circle', size: (r / 600) * 10 });
                e.color = color[Math.floor(Math.random() * 16)];
                e.setTarget(angle.x * r + 300, angle.y * r + 200, Math.random() * 0.1 + 0.01);
                e.life = r / 600 * 50;
                entities.push(e);
            }
        }
        let completeAnswer = solution.every(square => state.answerText.includes(square));
        if (completeAnswer && !state.solved) {
            state.solved = true;
            // animate things out...
            entities.find(e => e.group === 'welldone').setTarget(200, 200, 0.1);
            entities.filter(e => e.group === 'letters').forEach(e => e.setTarget(e.x - 600, e.y, 0.005));
            entities.filter(e => e.group === 'digits').forEach(e => e.setTarget(e.x - 600, e.y, 0.005));
            entities.filter(e => e.group === 'ok').forEach(e => e.setTarget(e.x - 600, e.y, 0.005));
            entities.filter(e => e.group === 'question').forEach(e => e.setTarget(e.x, -40, 0.005));
        }
    }
}

function update() {
    tick++;

    let allDialNodes = entities.filter(e => e.ext.type === "DialNode")

    if(!state.solved){
        updateArrowUpDown(allDialNodes);
        updateArrowLeftRight(allDialNodes);
        updateEnterKey(allDialNodes)
    }


    entities.forEach(e => { e.update(); })
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
    ctx.fillStyle = color[0];
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (state.shake > 0) {
        ctx.save();
        ctx.translate((Math.random() - 0.5) * 20, (Math.random() - 0.5) * 20);
    }
    entities.forEach((e, i) => {
        if (!e.visible) return;
        if (e.ext.type === 'DialNode' || e.ext.type === 'Circle') {
            const entitySize = e.ext.size;
            let ofsx = 0;
            let ofsy = 0;
            let inSelectedDial = state.selectedDial === 0 && e.group === 'letters' ||
                state.selectedDial === 1 && e.group === 'digits' ||
                state.selectedDial === 2 && e.group === 'ok';
            if (inSelectedDial) {
                let t = (((tick + e.text.charCodeAt(0)) % 60) / 60) * 2 * Math.PI;
                ofsx = Math.cos(t * 5) * 2;
                ofsy = Math.sin(t * 3) * 2;
            }
            let x = Math.floor(e.x + ofsx);
            let y = Math.floor(e.y + ofsy);
            ctx.beginPath();
            ctx.arc(x, y, entitySize, 0, Math.PI * 2);
            ctx.fillStyle = e.color;
            ctx.fill();
            ctx.closePath();
            if (e.text) {
                ctx.font = "20px 'Press Start 2P', monospace";
                ctx.fillStyle = "black";
                ctx.fillText(e.text, x - 10, y + 10);
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

    ctx.font = "20px 'Press Start 2P', monospace";
    ctx.fillStyle = "black";
    ctx.fillText(`#e = ${entities.length}`, 0, 20);
}

function gameLoop(time) {
    const deltaTime = time - lastTime;
    if (deltaTime >= interval) {
        update();
        render();
        lastTime = time;
    }
    requestAnimationFrame(gameLoop);
}

// game loop is kicked off here
init();
requestAnimationFrame(gameLoop);
