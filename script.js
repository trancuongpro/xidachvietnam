const suits = [{ symbol: '♥', color: 'red' }, { symbol: '♦', color: 'red' }, { symbol: '♠', color: 'black' }, { symbol: '♣', color: 'black' }];
const ranks = [{ name: 'A', value: 11 }, { name: '2', value: 2 }, { name: '3', value: 3 }, { name: '4', value: 4 }, { name: '5', value: 5 }, { name: '6', value: 6 }, { name: '7', value: 7 }, { name: '8', value: 8 }, { name: '9', value: 9 }, { name: '10', value: 10 }, { name: 'J', value: 10 }, { name: 'Q', value: 10 }, { name: 'K', value: 10 }];

let deck = [];
let players = [];
const FIXED_BET = 5; 
let isMusicPlaying = false;
let isGameOver = false;

function saveGameData() {
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
        audio.play().catch(e => console.log("Cần tương tác"));
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
    let score = 0;
    let aces = 0;
    cards.forEach(c => {
        if (c.rank === 'A') {
            aces++;
        } else {
            score += c.value;
        }
    });

    for (let i = 0; i < aces; i++) {
        if (score + 11 <= 21) {
            score += 11;
        } else {
            score += 1;
        }
    }
    
    if (cards.length < 5 && !isGameOver) {
        let minScore = 0;
        let tempAces = 0;
        cards.forEach(c => {
            if (c.rank === 'A') tempAces++;
            else minScore += c.value;
        });
        minScore += tempAces; 

        if (minScore < 18) return minScore;
    }

    return score;
}

function checkHandType(cards) {
    const score = calculateScore(cards);
    const count = cards.length;
    if (count === 2) {
        const aceCount = cards.filter(c => c.rank === 'A').length;
        const hasFace = cards.some(c => ['10', 'J', 'Q', 'K'].includes(c.rank));
        if (aceCount === 2) return { type: "Xì Bàn", power: 100, score };
        if (aceCount === 1 && hasFace) return { type: "Xì Dách", power: 100, score };
    }
    if (count === 5 && score <= 21) return { type: "Ngũ Linh", power: 100, score };
    if (score > 21) return { type: "Quắc", power: 0, score };
    if (score < 16) return { type: "Chưa Đủ Tuổi", power: 10, score };
    return { type: score + " Điểm", power: 20, score };
}

function renderCard(card, isHidden = false) {
    const el = document.createElement('div');
    if (isHidden) {
        el.className = 'card card-hidden-main';
        el.innerHTML = '';
    } else {
        el.className = `card ${card.color}`;
        el.innerHTML = `<div class="card-corner">${card.rank}<br>${card.suit}</div><div class="card-center">${card.suit}</div><div class="card-corner-bottom">${card.rank}<br>${card.suit}</div>`;
    }
    return el;
}

function renderPlayer(player) {
    const cardsEl = document.getElementById(player.elementCards);
    if (!cardsEl) return;
    cardsEl.innerHTML = '';
    const shouldHide = (player.type === 'bot' && !isGameOver);
    player.cards.forEach(card => cardsEl.appendChild(renderCard(card, shouldHide)));
    const scoreEl = document.getElementById(player.elementScore);
    if (scoreEl) {
        if (shouldHide) {
            scoreEl.innerHTML = `<div style="color:white;">Đang Chờ...</div><div style="color:gold;">$${player.money}</div>`;
        } else {
            const hand = checkHandType(player.cards);
            scoreEl.innerHTML = `<div>${hand.type}</div><div style="color:gold;">$${player.money}</div>`;
        }
    }
}

async function animateDealtCard(playerIndex) {
    const deckCenter = document.getElementById('deck-center');
    const targetCardsEl = document.getElementById(players[playerIndex].elementCards);
    const animCard = document.createElement('div');
    animCard.className = 'card card-hidden-main flying-card';
    document.body.appendChild(animCard);
    const startRect = deckCenter.getBoundingClientRect();
    const targetRect = targetCardsEl.getBoundingClientRect();
    animCard.style.top = `${startRect.top}px`;
    animCard.style.left = `${startRect.left}px`;
    await new Promise(r => setTimeout(r, 20)); // Giảm trễ ban đầu để mượt hơn
    animCard.style.top = `${targetRect.top}px`;
    animCard.style.left = `${targetRect.left + (players[playerIndex].cards.length * 10)}px`;
    animCard.style.opacity = '0';
    await new Promise(r => setTimeout(r, 200)); // GIẢM: Từ 400ms xuống 200ms để lá bài bay nhanh hơn
    animCard.remove();
}

async function dealCards() {
    createDeck();
    isGameOver = false;
    document.getElementById('info').classList.add('hidden');
    document.getElementById('warning-box').classList.add('hidden');
    document.getElementById('dealBtn').disabled = true;

    const dealOrder = [0, 4, 1, 2, 3, 5];

    for (let round = 0; round < 2; round++) {
        for (let i of dealOrder) {
            const card = deck.pop();
            players[i].cards.push(card);
            await animateDealtCard(i);
            renderPlayer(players[i]);
            await new Promise(r => setTimeout(r, 50)); // GIẢM: Từ 100ms xuống 50ms để bài ra liên tục hơn
        }
    }

    const myHand = checkHandType(players[0].cards);
    const myScore = calculateScore(players[0].cards);
    
    if (myHand.power === 100 || myScore >= 18) {
        document.getElementById('hitBtn').disabled = true;
    } else {
        document.getElementById('hitBtn').disabled = false;
    }
    
    document.getElementById('checkBtn').disabled = false;
}

function hit() {
    const me = players[0];
    if (me.cards.length < 5) {
        me.cards.push(deck.pop());
        renderPlayer(me);
        
        const myHand = checkHandType(me.cards);
        const myScore = calculateScore(me.cards);
        
        if (me.cards.length === 5 || myHand.power === 100 || myScore >= 18) {
            document.getElementById('hitBtn').disabled = true;
        }
    }
}

function hitAndCloseWarning() {
    document.getElementById('warning-box').classList.add('hidden');
    hit();
}

function checkCards() {
    for (let i = 1; i < players.length; i++) {
        const p = players[i];
        if (p.type === 'bot') {
            while (checkHandType(p.cards).power < 100 && calculateScore(p.cards) < 16 && p.cards.length < 5) { 
                p.cards.push(deck.pop()); 
            }
        }
        renderPlayer(p);
    }
    document.getElementById('checkBtn').disabled = true;
    document.getElementById('resultBtn').disabled = false; 
}

function validateDealerScore() {
    const dealer = players[0];
    const hand = checkHandType(dealer.cards);
    const isSpecial = hand.power === 100 || hand.power === 0;
    const isFiveCards = dealer.cards.length === 5;
    if (hand.score < 16 && !isSpecial && !isFiveCards) {
        const warnBox = document.getElementById('warning-box');
        const warnMsg = document.getElementById('warning-message');
        warnMsg.innerText = "Vì Bạn Chưa Đủ 16 Điểm Nên Việc Thống Kê Là Không Hợp Lệ Mời Bạn Kéo Bài Thêm Nhé !...";
        warnBox.classList.remove('hidden');
        return;
    }
    isGameOver = true;
    showFinalResult();
}

function showFinalResult() {
    const dealer = players[0];
    const dHand = checkHandType(dealer.cards);
    const oldDealerMoney = dealer.money;
    players.forEach(p => renderPlayer(p));
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
                        <span>Bot ${p.id} (${pHand.type})</span>
                        <span class="${classRes}">${status}</span>
                    </div>
                    <div style="font-size:0.8rem; color:#aaa;">Ví: ${mathText} $</div>
                </div>`;
    });
    const dSign = dealer.money >= oldDealerMoney ? "+" : "-";
    const dDiff = Math.abs(dealer.money - oldDealerMoney);
    html += `<div style="margin-top:12px; font-weight:bold; color:gold;">Quỹ Cái: ${oldDealerMoney} ${dealer.money !== oldDealerMoney ? dSign + ' ' + dDiff : ''} = ${dealer.money} $</div>`;
    html += `<button onclick="resetRound()" class="btn-newgame">VÁN MỚI</button>`;
    const infoBox = document.getElementById('info');
    infoBox.innerHTML = html;
    infoBox.classList.remove('hidden');
    document.getElementById('dealer-money').textContent = dealer.money;
    saveGameData();
}

function resetRound() {
    isGameOver = false;
    document.getElementById('info').classList.add('hidden');
    document.getElementById('warning-box').classList.add('hidden');
    document.getElementById('dealBtn').disabled = false;
    document.getElementById('hitBtn').disabled = true;
    document.getElementById('checkBtn').disabled = true;
    document.getElementById('resultBtn').disabled = true;
    players.forEach(p => { p.cards = []; renderPlayer(p); });
}

function showGuide() {
    const guideText = `- Nhấn Chia Bài để chơi nhé!..<br>
	- Nếu đạt từ 18 điểm trở lên, hoặc có Xì Dách/Xì Bàn, bạn không được rút thêm bài.<br>
	- Nhấn Kiểm Bài để Bot tự kéo bài (dưới 16 sẽ kéo, 18 sẽ không cho kéo bài nữa nhé).<br>
	- Nhấn Kết Quả để tính tiền bài (nhà cái phải đạt ít nhất 16 điểm mới được xem Kết Quả nhé).<br>
	-Chúc bạn giải trí vui vẻ với trò chơi của mình nha.<br>
	- Thiết Kế Trần Cường Zalo 0907860662.`;
    document.getElementById('guide-text').innerHTML = guideText;
    document.getElementById('guide-overlay').classList.remove('hidden');
}

function closeGuide() { document.getElementById('guide-overlay').classList.add('hidden'); }
function backToSetup() { if (confirm('Thoát Ván?')) location.reload(); }

async function enterTable() {
    createPositions();

    document.getElementById('welcome-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');

    if (!isMusicPlaying) toggleMusic();

    // Tự động chia bài sau khi vào bàn
    await dealCards();
}

function createPositions() {
    const table = document.getElementById('table');
    table.innerHTML = `<div class="deck-center" id="deck-center"><div class="card card-hidden-main"></div></div>`;
    const savedMoney = JSON.parse(localStorage.getItem('playersMoney')) || [];
    players = [];
    const dealerMoney = savedMoney.find(m => m.id === 0)?.money ?? 5000;
    const myPos = document.createElement('div');
    myPos.className = 'player-position is-dealer';
    myPos.style.bottom = '150px'; myPos.style.left = '50%'; myPos.style.transform = 'translateX(-50%)';
    myPos.innerHTML = `<div class="name">NHÀ CÁI (BẠN)</div><div class="result" id="score-0"></div><div class="cards" id="cards-0"></div>`;
    table.appendChild(myPos);
    players.push({ id: 0, type: 'human', cards: [], money: dealerMoney, elementCards: 'cards-0', elementScore: 'score-0' });
    document.getElementById('dealer-money').textContent = dealerMoney;
    const positions = [{ top: '45px', left: '5%' }, { top: '35px', left: '50%', transform: 'translateX(-50%)' }, { top: '45px', right: '5%' }, { top: '220px', left: '10%' }, { top: '220px', right: '10%' }];
    for (let i = 1; i <= 5; i++) {
        const pMoney = savedMoney.find(m => m.id === i)?.money ?? 200;
        const pos = document.createElement('div');
        pos.className = 'player-position';
        Object.assign(pos.style, positions[i - 1]);
        pos.innerHTML = `<div class="name">Bot ${i}</div><div class="cards" id="cards-${i}"></div><div class="result" id="score-${i}"></div>`;
        table.appendChild(pos);
        players.push({ id: i, type: 'bot', cards: [], money: pMoney, elementCards: `cards-${i}`, elementScore: `score-${i}` });
    }
}

document.addEventListener('contextmenu', event => event.preventDefault());
document.addEventListener('keydown', function(e) { if (e.ctrlKey && [67, 85, 83, 65].includes(e.keyCode)) e.preventDefault(); }, false);
document.addEventListener('dragstart', event => event.preventDefault());