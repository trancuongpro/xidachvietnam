const suits = [{ symbol: '♥', color: 'red' }, { symbol: '♦', color: 'red' }, { symbol: '♠', color: 'black' }, { symbol: '♣', color: 'black' }];
const ranks = [{ name: 'A', value: 11 }, { name: '2', value: 2 }, { name: '3', value: 3 }, { name: '4', value: 4 }, { name: '5', value: 5 }, { name: '6', value: 6 }, { name: '7', value: 7 }, { name: '8', value: 8 }, { name: '9', value: 9 }, { name: '10', value: 10 }, { name: 'J', value: 10 }, { name: 'Q', value: 10 }, { name: 'K', value: 10 }];

let deck = [];
let players = [];
const FIXED_BET = 5; 
let totalRefills = parseInt(localStorage.getItem('totalRefills')) || 0;
let isMusicPlaying = false;

function saveGameData() {
    localStorage.setItem('totalRefills', totalRefills);
    const moneyData = players.map(p => ({ id: p.id, money: p.money }));
    localStorage.setItem('playersMoney', JSON.stringify(moneyData));
}

function toggleMusic() {
    const audio = document.getElementById('bgMusic');
    const icon = document.getElementById('music-toggle');
    if (isMusicPlaying) {
        audio.pause();
        icon.textContent = '🔇';
        isMusicPlaying = false;
    } else {
        audio.play().catch(e => console.log("Yêu cầu tương tác người dùng"));
        icon.textContent = '🔊';
        isMusicPlaying = true;
    }
}

function createDeck() {
    deck = [];
    for (let s of suits) {
        for (let r of ranks) { deck.push({ rank: r.name, suit: s.symbol, value: r.value, color: s.color }); }
    }
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
}

function calculateScore(cards) {
    let score = 0, aces = 0;
    cards.forEach(c => { score += c.value; if (c.rank === 'A') aces++; });
    while (score > 21 && aces > 0) { score -= 10; aces--; }
    return score;
}

function checkHandType(cards) {
    const score = calculateScore(cards);
    const count = cards.length;
    if (count === 2) {
        const aceCount = cards.filter(c => c.rank === 'A').length;
        const hasFace = cards.some(c => ['10', 'J', 'Q', 'K'].includes(c.rank));
        if (aceCount === 2) return { type: "Xì Bàn", power: 100, score };
        if (aceCount === 1 && hasFace) return { type: "Xì Dách", power: 90, score };
    }
    if (count === 5 && score <= 21) return { type: "Ngũ Linh", power: 80, score };
    if (score > 21) return { type: "Quắc", power: 0, score };
    if (score < 16) return { type: "Chưa Đủ Tuổi", power: 10, score };
    return { type: score + " Điểm", power: 20, score };
}

function renderCard(card) {
    const el = document.createElement('div');
    el.className = `card ${card.color}`;
    el.innerHTML = `<div class="card-corner">${card.rank}<br>${card.suit}</div><div class="card-center">${card.suit}</div><div class="card-corner-bottom">${card.rank}<br>${card.suit}</div>`;
    return el;
}

function renderPlayer(player) {
    const cardsEl = document.getElementById(player.elementCards);
    if (!cardsEl) return;
    cardsEl.innerHTML = '';
    player.cards.forEach(card => cardsEl.appendChild(renderCard(card)));
    
    const scoreEl = document.getElementById(player.elementScore);
    const hand = checkHandType(player.cards);
    if (scoreEl) {
        scoreEl.innerHTML = `<div>${hand.type}</div><div style="color:gold;">$${player.money}</div>`;
    }
}

function createPositions() {
    const table = document.getElementById('table');
    table.innerHTML = `<div class="deck-center" id="deck-center"><div class="card back">🃏</div></div>`;
    const savedMoney = JSON.parse(localStorage.getItem('playersMoney')) || [];
    players = [];

    const dealerMoney = savedMoney.find(m => m.id === 0)?.money ?? 5000;
    const myPos = document.createElement('div');
    myPos.className = 'player-position is-dealer';
    myPos.style.bottom = '150px'; 
    myPos.style.left = '50%'; myPos.style.transform = 'translateX(-50%)';
    myPos.innerHTML = `<div class="name">NHÀ CÁI (BẠN)</div><div class="result" id="score-0"></div><div class="cards" id="cards-0"></div>`;
    table.appendChild(myPos);
    players.push({ id: 0, type: 'human', cards: [], score: 0, money: dealerMoney, elementCards: 'cards-0', elementScore: 'score-0' });
    document.getElementById('dealer-money').textContent = dealerMoney;

    const positions = [
        { top: '45px', left: '5%' }, { top: '35px', left: '50%', transform: 'translateX(-50%)' },
        { top: '45px', right: '5%' }, { top: '220px', left: '10%' }, { top: '220px', right: '10%' }
    ];

    for (let i = 1; i <= 5; i++) {
        const selEl = document.getElementById(`pos${i}`).querySelector('select');
        const select = selEl ? selEl.value : 'empty';
        if (select === 'empty') continue;
        const pMoney = savedMoney.find(m => m.id === i)?.money ?? 200;
        const pos = document.createElement('div');
        pos.className = 'player-position';
        Object.assign(pos.style, positions[i - 1]);
        pos.innerHTML = `<div class="name">${select === 'bot' ? 'Bot ' + i : 'Người ' + i}</div><div class="cards" id="cards-${i}"></div><div class="result" id="score-${i}"></div>`;
        table.appendChild(pos);
        players.push({ id: i, type: select, cards: [], score: 0, money: pMoney, elementCards: `cards-${i}`, elementScore: `score-${i}` });
    }
}

function dealCards() {
    createDeck();
    document.getElementById('info').classList.add('hidden');
    players.forEach(p => { p.cards = [deck.pop(), deck.pop()]; renderPlayer(p); });
    document.getElementById('dealBtn').disabled = true;
    document.getElementById('hitBtn').disabled = false;
    document.getElementById('checkBtn').disabled = false;
    // Đảm bảo nút Kết Quả luôn tắt khi bắt đầu chia bài
    document.getElementById('resultBtn').disabled = true; 
}

function hit() {
    const me = players[0];
    if (me.cards.length < 5) {
        me.cards.push(deck.pop());
        renderPlayer(me);
        if (calculateScore(me.cards) > 21) document.getElementById('hitBtn').disabled = true;
    }
}

function checkCards() {
    for (let i = 1; i < players.length; i++) {
        const p = players[i];
        if (p.type === 'bot') {
            while (calculateScore(p.cards) < 16 && p.cards.length < 5) { p.cards.push(deck.pop()); }
        }
        renderPlayer(p);
    }
    document.getElementById('checkBtn').disabled = true;
    // MỞ KHÓA nút Kết Quả sau khi đã kiểm bài xong
    document.getElementById('resultBtn').disabled = false; 
}

function showFinalResult() {
    const dealer = players[0];
    const dHand = checkHandType(dealer.cards);
    const oldDealerMoney = dealer.money;
    
    let html = `<h3 style="color:gold; margin-bottom:10px; border-bottom: 2px solid gold;">KẾT QUẢ CHI TIẾT</h3>`;
    html += `<div style="margin-bottom:8px;">Nhà Cái: <span style="color:gold;">${dHand.type}</span></div>`;

    players.forEach(p => {
        if (p.id === 0) return;
        const pHand = checkHandType(p.cards);
        const oldPMoney = p.money;
        let status = "", moneyChange = 0, classRes = "", sign = "";

        if (pHand.power > dHand.power) { status = "Thắng"; moneyChange = FIXED_BET; classRes = "res-win"; sign = "+"; }
        else if (pHand.power < dHand.power) { status = "Thua"; moneyChange = -FIXED_BET; classRes = "res-lose"; sign = "-"; }
        else {
            if (pHand.power === 20) {
                if (pHand.score > dHand.score) { status = "Thắng"; moneyChange = FIXED_BET; classRes = "res-win"; sign = "+"; }
                else if (pHand.score < dHand.score) { status = "Thua"; moneyChange = -FIXED_BET; classRes = "res-lose"; sign = "-"; }
                else { status = "Hòa"; moneyChange = 0; }
            } else { status = "Hòa"; moneyChange = 0; }
        }

        p.money += moneyChange;
        dealer.money -= moneyChange;

        const mathText = moneyChange !== 0 ? `${oldPMoney} ${sign} ${Math.abs(moneyChange)} = ${p.money}` : `${p.money}`;

        html += `<div style="display:flex; flex-direction:column; padding:6px 0; border-bottom:1px solid #444; text-align:left;">
                    <div style="display:flex; justify-content:space-between; font-weight:bold;">
                        <span>${p.type==='bot'?'Bot':'Người'} ${p.id} (${pHand.type})</span>
                        <span class="${classRes}">${status}</span>
                    </div>
                    <div style="font-size:0.8rem; color:#aaa;">Ví: ${mathText} $</div>
                </div>`;
    });

    const dSign = dealer.money >= oldDealerMoney ? "+" : "-";
    const dDiff = Math.abs(dealer.money - oldDealerMoney);
    html += `<div style="margin-top:12px; font-weight:bold; color:gold;">
                Quỹ Cái: ${oldDealerMoney} ${dealer.money !== oldDealerMoney ? dSign + ' ' + dDiff : ''} = ${dealer.money} $
            </div>`;
    html += `<button onclick="resetRound()" class="btn-newgame">VÁN MỚI</button>`;

    const infoBox = document.getElementById('info');
    infoBox.innerHTML = html;
    infoBox.classList.remove('hidden');
    document.getElementById('dealer-money').textContent = dealer.money;
    saveGameData();
}

function resetRound() {
    document.getElementById('info').classList.add('hidden');
    document.getElementById('dealBtn').disabled = false;
    document.getElementById('hitBtn').disabled = true;
    document.getElementById('checkBtn').disabled = true;
    document.getElementById('resultBtn').disabled = true;
    players.forEach(p => { p.cards = []; renderPlayer(p); });
}

function showGuide() {
    const guideText = `
        - Nhấn Chia Bài để chơi.<br>
		-Nhấn Kiểm Bài để xét bài .<br>
		-Nhấn Rút Bài để kéo bài cho mình.<br>
		-Nhấn Kết Quả để tính thắng thua và tính tiền.<br>
		-Mổi bàn tự đặt là 5$.<br>
		- Đạt điểm cao nhất có thể nhưng không quá 21.<br>
        - Nhà cái và người chơi phải đủ ít nhất 16 điểm.<br>
        - Xì Bàn (2 lá A) và Xì Dách (A + lá 10,J,Q,K) là cao nhất.<br>
        - Ngũ Linh: 5 lá bài có tổng điểm không quá 21.<br>
		-Chúc Bạn Giải Trí Vui Vẻ Với Trò Chơi Của Trần Cường Zalo 0907860662.
    `;
    document.getElementById('guide-text').innerHTML = guideText;
    document.getElementById('guide-overlay').classList.remove('hidden');
}

function closeGuide() {
    document.getElementById('guide-overlay').classList.add('hidden');
}

function showSetup() { 
    document.getElementById('welcome-screen').classList.add('hidden'); 
    document.getElementById('setup-screen').classList.remove('hidden'); 
    if(!isMusicPlaying) toggleMusic();
}

function enterTable() { createPositions(); document.getElementById('setup-screen').classList.add('hidden'); document.getElementById('game-screen').classList.remove('hidden'); }
function backToSetup() { if (confirm('Thoát Ván?')) location.reload(); }

window.onload = () => {
    const setup = document.getElementById('seat-setup');
    if(setup) {
        for (let i = 1; i <= 5; i++) {
            const div = document.createElement('div');
            div.className = 'seat-option'; div.id = `pos${i}`;
            div.innerHTML = `<div>Vị Trí ${i}</div><select><option value="empty">Trống</option><option value="bot" selected>Bot</option><option value="human">Người</option></select>`;
            setup.appendChild(div);
        }
    }
};