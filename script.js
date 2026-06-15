const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const ui = document.getElementById('ui');

// ---------- RESIZE CANVAS ----------
function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

// ---------- SKINS ----------
const skins = [
    { name: "Classic DVD", src: null },
    { name: "Dancing Toothless 67", src: "https://media.tenor.com/your-toothless-gif.gif" }
];

skins.forEach(s => {
    if (s.src) {
        s.img = new Image();
        s.img.src = s.src;
    }
});

// ---------- SAVE SYSTEM ----------
const SAVE_KEY = "dvd_game_save_v10";

let money = 0;
let income = 1;
let speed = 1;

let incomeCost = 25;
let speedCost = 40;
let dvdCost = 60;

const dvds = [];
const ownedSkins = [0];

function saveGame() {
    localStorage.setItem(SAVE_KEY, JSON.stringify({
        money, income, speed, incomeCost, speedCost, dvdCost, dvds, ownedSkins
    }));
}

function loadGame() {
    const data = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (!data) return;

    money = data.money ?? 0;
    income = data.income ?? 1;
    speed = data.speed ?? 1;
    incomeCost = data.incomeCost ?? 25;
    speedCost = data.speedCost ?? 40;
    dvdCost = data.dvdCost ?? 60;

    if (Array.isArray(data.dvds) && data.dvds.length) {
        dvds.push(...data.dvds);
    }
    if (Array.isArray(data.ownedSkins)) {
        ownedSkins.splice(0, ownedSkins.length, ...data.ownedSkins);
    }
}

function resetGame() {
    localStorage.removeItem(SAVE_KEY);
    location.reload();
}

// ---------- GAME LOGIC ----------
function addDVD() {
    dvds.push({
        x: Math.random() * (canvas.width - 100),
        y: Math.random() * (canvas.height - 100),
        dx: (Math.random() < 0.5 ? -1 : 1) * 3,
        dy: (Math.random() < 0.5 ? -1 : 1) * 3,
        color: `hsl(${Math.random() * 360},100%,60%)`,
        skin: 0
    });
}

loadGame();
if (dvds.length === 0) addDVD();

// ---------- UI MENUS ----------
function mainUI() {
    ui.innerHTML = `
        💰 Money: <span id="money">${money.toFixed(0)}</span><br>
        📈 Income: $${income}/bounce<br>
        🚀 Speed: x${speed.toFixed(2)}<br>
        🧱 DVDs: ${dvds.length}<br><br>

        <button id="shopBtn">🛒 SHOP</button>
        <button id="adminBtn">🔧 ADMIN</button>
        <button id="resetBtn" style="background:red !important;">🟥 RESET</button>
    `;

    document.getElementById("shopBtn").onclick = shopUI;
    document.getElementById("adminBtn").onclick = loginUI;
    document.getElementById("resetBtn").onclick = resetGame;
}

function shopUI() {
    ui.innerHTML = `
        🛒 SHOP<br><br>
        💰 Money: ${money.toFixed(0)}<br><br>

        <button id="buyIncome">📈 Upgrade Income ($${incomeCost})</button>
        <button id="buySpeed">🚀 Upgrade Speed ($${speedCost})</button>
        <button id="buyDVD">🧱 Buy DVD ($${dvdCost})</button>

        <br><hr><br>
        🎨 SKINS<br><br>

        ${skins.map((s, i) => `
            <button id="skin-${i}">
                ${ownedSkins.includes(i) ? "👕 EQUIP" : "🔒 BUY"} ${s.name}
            </button>
        `).join("")}

        <br><button id="back">⬅ BACK</button>
    `;

    document.getElementById("buyIncome").onclick = () => {
        if (money >= incomeCost) {
            money -= incomeCost;
            income *= 2;
            incomeCost = Math.floor(incomeCost * 2.2);
            shopUI();
        }
    };

    document.getElementById("buySpeed").onclick = () => {
        if (money >= speedCost) {
            money -= speedCost;
            speed += 0.2;
            speedCost = Math.floor(speedCost * 1.8);
            shopUI();
        }
    };

    document.getElementById("buyDVD").onclick = () => {
        if (money >= dvdCost) {
            money -= dvdCost;
            dvdCost = Math.floor(dvdCost * 1.7);
            addDVD();
            shopUI();
        }
    };

    skins.forEach((s, i) => {
        document.getElementById(`skin-${i}`).onclick = () => {
            const price = 100;
            if (!ownedSkins.includes(i)) {
                if (money >= price) {
                    money -= price;
                    ownedSkins.push(i);
                }
            } else {
                dvds.forEach(d => d.skin = i);
            }
            shopUI();
        };
    });

    document.getElementById("back").onclick = mainUI;
}

function loginUI() {
    ui.innerHTML = `
        🔐 ADMIN<br><br>
        <input id="code" placeholder="code"><br><br>
        <button id="enter">UNLOCK</button>
        <button id="back">BACK</button>
    `;

    document.getElementById("back").onclick = mainUI;
    document.getElementById("enter").onclick = () => {
        if (document.getElementById("code").value.trim().toUpperCase() === "ICEANDFIRE") {
            adminUI();
        } else alert("Wrong code");
    };
}

function adminUI() {
    ui.innerHTML = `
        🔧 ADMIN<br><br>
        💰 <input id="m" value="${money}"><br><br>
        📈 <input id="i" value="${income}"><br><br>
        🚀 <input id="s" value="${speed}"><br><br>

        <button id="apply">APPLY</button>
        <button id="back">BACK</button>
    `;

    document.getElementById("apply").onclick = () => {
        money = Number(document.getElementById("m").value);
        income = Number(document.getElementById("i").value);
        speed = Number(document.getElementById("s").value);
        adminUI();
    };

    document.getElementById("back").onclick = mainUI;
}

// Start UI og loops
mainUI();
setInterval(saveGame, 1000);
setInterval(() => {
    const el = document.getElementById("money");
    if (el) el.textContent = money.toFixed(0);
}, 50);

// ---------- GAME LOOP ----------
function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const d of dvds) {
        d.x += d.dx * speed;
        d.y += d.dy * speed;

        let hit = false;

        if (d.x <= 0 || d.x >= canvas.width - 80) {
            d.dx *= -1;
            hit = true;
        }
        if (d.y <= 0 || d.y >= canvas.height - 80) {
            d.dy *= -1;
            hit = true;
        }

        if (hit) money += income;

        const skin = skins[d.skin];

        if (skin && skin.img && skin.src) {
            ctx.drawImage(skin.img, d.x, d.y, 80, 80);
        } else {
            ctx.font = "30px Arial Black";
            ctx.fillStyle = d.color;
            ctx.fillText("DVD", d.x, d.y + 30); // Justeret y-akse en smule for bedre visning
        }
    }

    requestAnimationFrame(loop);
}

loop();
