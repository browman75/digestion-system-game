document.addEventListener('DOMContentLoaded', () => {
    // --- DOM 元素 ---
    const organPieces = document.querySelectorAll('.organ-piece');
    const dropZones = document.querySelectorAll('.drop-zone');
    const instructionText = document.getElementById('instruction');
    const game2Bar = document.getElementById('game2-sequence-bar');
    const seqSlots = document.querySelectorAll('.seq-slot');
    const glandTargets = document.querySelectorAll('.gland-target');
    const nextBtn = document.getElementById('next-btn');
    const resetBtn = document.getElementById('reset-btn');
    const organPiecesContainer = document.getElementById('organ-pieces-container');
    const modal = document.getElementById('info-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalDescription = document.getElementById('modal-description');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const completionMessage = document.getElementById('completion-message');

    // --- 遊戲資料 ---
    const organInfo = {
        'mouth': { name: '口腔', desc: '消化的第一站，牙齒負責切碎食物，唾腺分泌的唾液可以分解澱粉。' },
        'esophagus': { name: '食道', desc: '連接咽喉和胃的肌肉管道，透過蠕動將食物向下推送。' },
        'stomach': { name: '胃', desc: '一個肌肉發達的囊袋，會分泌胃酸和蛋白酶，主要分解蛋白質。' },
        'liver': { name: '肝臟', desc: '人體最大的腺體，會製造膽汁來幫助脂肪乳化，但膽汁不含消化酶。' },
        'pancreas': { name: '胰臟', desc: '分泌胰液，送到小腸分解醣類、蛋白質和脂肪。' },
        'small-intestine': { name: '小腸', desc: '消化和吸收的主要場所，醣類、蛋白質、脂肪都在這裡被徹底分解並吸收。' },
        'large-intestine': { name: '大腸', desc: '不含消化酶，主要吸收剩餘的水分和電解質，形成糞便。' },
        'salivary-glands': { name: '唾腺', desc: '位於口腔周圍，分泌的唾液含有澱粉酶，是分解醣類的第一步。' }
    };
    const digestiveTractOrder = ['mouth', 'esophagus', 'stomach', 'small-intestine', 'large-intestine'];
    const glandMappings = {
        'salivary-glands': 'mouth',
        'liver': 'small-intestine',
        'pancreas': 'small-intestine'
    };

    // --- 遊戲狀態 ---
    let gameState = {
        game1Correct: 0,
        game2Step: 0,
        game3Correct: 0,
        // 修改點：只計算一開始就顯示的器官數量 (不含唾腺)
        game1Total: document.querySelectorAll('.organ-piece:not(.hide)').length,
        game2Total: digestiveTractOrder.length,
        game3Total: Object.keys(glandMappings).length
    };
    let draggedItem = null;

    // --- 遊戲一：器官拼圖 ---
    function initializeGame1() {
        organPieces.forEach(piece => {
            // 只為非隱藏的元素添加事件監聽
            if (!piece.classList.contains('hide')) {
                piece.addEventListener('dragstart', dragStart);
                piece.addEventListener('dragend', dragEnd);
            }
        });

        dropZones.forEach(zone => {
            zone.addEventListener('dragover', dragOver);
            zone.addEventListener('dragenter', dragEnter);
            zone.addEventListener('dragleave', dragLeave);
            zone.addEventListener('drop', drop);
        });
    }

    function dragStart(e) {
        draggedItem = this;
        setTimeout(() => this.classList.add('dragging'), 0);
    }

    function dragEnd() {
        this.classList.remove('dragging');
        draggedItem = null;
    }

    function dragOver(e) { e.preventDefault(); }
    function dragEnter(e) { e.preventDefault(); this.classList.add('drag-over'); }
    function dragLeave() { this.classList.remove('drag-over'); }

    function drop(e) {
        this.classList.remove('drag-over');
        if (this.dataset.organ === draggedItem.dataset.organ) {
            this.appendChild(draggedItem);
            draggedItem.classList.add('placed');
            draggedItem.style.position = 'absolute';
            draggedItem.style.top = '0';
            draggedItem.style.left = '0';
            draggedItem.style.width = '100%';
            draggedItem.style.height = '100%';
            draggedItem.setAttribute('draggable', 'false');
            this.classList.add('dropped');
            
            showModal(draggedItem.dataset.organ);
            gameState.game1Correct++;
            checkGame1Completion();
        } else {
            this.classList.add('error-shake');
            setTimeout(() => this.classList.remove('error-shake'), 500);
        }
    }

    function checkGame1Completion() {
        if (gameState.game1Correct === gameState.game1Total) {
            setTimeout(() => {
                instructionText.textContent = '【消化道順序遊戲】太棒了！現在請按照食物經過的順序，點擊對應的消化道器官。';
                initializeGame2();
            }, 1000);
        }
    }

    // --- 遊戲二：順序點擊 ---
    function initializeGame2() {
        game2Bar.classList.remove('hide');
        organPieces.forEach(piece => {
            if (piece.dataset.organType === 'tract') {
                piece.classList.add('clickable');
                piece.addEventListener('click', handleSequenceClick);
            }
        });
    }

    function handleSequenceClick() {
        const organId = this.dataset.organ;
        if (organId === digestiveTractOrder[gameState.game2Step]) {
            seqSlots[gameState.game2Step].textContent = organInfo[organId].name;
            this.classList.remove('clickable');
            this.removeEventListener('click', handleSequenceClick);
            gameState.game2Step++;
            checkGame2Completion();
        } else {
            this.classList.add('error-shake');
            setTimeout(() => this.classList.remove('error-shake'), 500);
        }
    }
    
    function checkGame2Completion() {
        if (gameState.game2Step === gameState.game2Total) {
            setTimeout(() => {
                instructionText.textContent = '【消化腺作用位置遊戲】最後一關！請將剩下的消化腺拖曳到它們作用的消化道器官上。';
                initializeGame3();
            }, 1000);
        }
    }

    // --- 遊戲三：消化腺配對 ---
    function initializeGame3() {
        game2Bar.classList.add('hide');

        // 修改點：在遊戲三開始時，找到並顯示唾腺，讓它可以參與
        const salivaryGland = document.querySelector('[data-organ="salivary-glands"]');
        if (salivaryGland) {
            salivaryGland.classList.remove('hide');
        }
        
        // 讓所有在旁邊容器的器官 (包含剛顯示的唾腺) 都可以拖曳
        const remainingGlands = organPiecesContainer.querySelectorAll('.organ-piece');
        remainingGlands.forEach(gland => {
            gland.setAttribute('draggable', 'true');
            gland.addEventListener('dragstart', dragStart);
            gland.addEventListener('dragend', dragEnd);
        });

        // 顯示並啟用消化腺的放置目標
        glandTargets.forEach(target => {
            target.style.display = 'block';
            target.addEventListener('dragover', dragOver);
            target.addEventListener('dragenter', dragEnter);
            target.addEventListener('dragleave', dragLeave);
            target.addEventListener('drop', dropGland);
        });
    }

    function dropGland(e) {
        this.classList.remove('drag-over');
        const glandId = draggedItem.dataset.organ;
        const targetOrgan = this.dataset.glandTargetFor;

        if (glandMappings[glandId] === targetOrgan) {
            draggedItem.remove(); // 從旁邊的容器移除
            showModal(glandId);
            gameState.game3Correct++;
            checkGame3Completion();
        } else {
            this.classList.add('error-shake');
            setTimeout(() => this.classList.remove('error-shake'), 500);
        }
    }

    function checkGame3Completion() {
        if (gameState.game3Correct === gameState.game3Total) {
            setTimeout(() => {
                instructionText.textContent = '全部完成！';
                completionMessage.classList.remove('hide');
                nextBtn.disabled = false;
            }, 500);
        }
    }

    // --- Modal 彈出視窗功能 ---
    function showModal(organId) {
        const info = organInfo[organId];
        modalTitle.textContent = info.name;
        modalDescription.textContent = info.desc;
        modal.classList.remove('hide');
    }

    modalCloseBtn.addEventListener('click', () => {
        modal.classList.add('hide');
    });

    // --- 遊戲重置 ---
    resetBtn.addEventListener('click', () => {
        window.location.reload();
    });

    // --- 初始化遊戲 ---
    initializeGame1();
});
