// 移除 imports，直接使用全局变量

// Start the game
// window.game = new Game(); // Moved to init call inside class or manual start

class Game {
    constructor() {
        this.ui = new UI();
        this.playerPokemon = null;
        this.opponentPokemon = null;
        this.isPlayerTurn = true;
        this.isBattleActive = false;
        this.shopEquipment = []; // 初始化商店商品列表

        // Save Key
        this.SAVE_KEY = 'pokeduel_save_data_v1';

        this.init();
    }

    init() {
        // Setup Event Listeners
        document.getElementById('start-btn').addEventListener('click', () => this.enterGame());
        document.getElementById('start-settings-btn').addEventListener('click', () => {
            // Load current save data for display
            this.loadGame();
            this.settingsOpenedFromStart = true; // Track origin
            this.ui.showSettingsScreen(this.playerPokemon || this.savedPokemon);
        });

        // Action Menu Listeners
        document.querySelector('.fight-btn').addEventListener('click', () => {
            this.ui.showMoveMenu(this.playerPokemon.moves, this.playerPokemon, this.opponentPokemon);
        });

        document.querySelector('.bag-btn').addEventListener('click', async () => {
            await this.ui.typeDialog("开发中: 背包是空的!");
            this.ui.showActionMenu();
        });

        document.querySelector('.pokemon-btn').addEventListener('click', async () => {
            await this.ui.typeDialog("开发中: 你只有这一只宝可梦!");
            this.ui.showActionMenu();
        });

        document.querySelector('.run-btn').addEventListener('click', async () => {
            if (this.isPlayerTurn && this.isBattleActive) {
                this.attemptRun();
            }
        });

        document.getElementById('move-back-btn').addEventListener('click', () => {
            this.ui.showActionMenu();
        });

        // Move Menu Listeners
        document.querySelectorAll('.move-btn').forEach((btn, index) => {
            btn.addEventListener('click', () => {
                if (this.isPlayerTurn && this.isBattleActive) {
                    this.executeTurn(index);
                }
            });
        });

        // Initialize New UI Buttons
        this.setupCampUI();

        // Load initial data 
        this.loadGame();
    }

    setupCampUI() {
        // Camp Battle Card - Now opens stage selection
        document.getElementById('camp-battle-card').addEventListener('click', () => {
            this.ui.showStageScreen();
            this.updateStageAvailability();
        });

        document.getElementById('camp-status-card').addEventListener('click', () => this.ui.showStatusScreen(this.playerPokemon));
        document.getElementById('camp-shop-card').addEventListener('click', () => {
            this.ui.showShopScreen(this.playerPokemon.gold);
            // 只有在商店商品列表为空时才生成初始商品
            if (!this.shopEquipment || this.shopEquipment.length === 0) {
                this.refreshShopEquipment(); // Generate initial shop items
            }
        });
        document.getElementById('camp-gear-card').addEventListener('click', () => this.ui.showGearScreen(this.playerPokemon));
        document.getElementById('camp-save-card').addEventListener('click', () => {
            this.saveGame();
            this.showNotification('游戏已保存！', 'success');
        });

        document.getElementById('status-back-btn').addEventListener('click', () => this.ui.showCampScreen());
        document.getElementById('shop-back-btn').addEventListener('click', () => this.ui.showCampScreen());
        document.getElementById('gear-back-btn').addEventListener('click', () => this.ui.showCampScreen());
        document.getElementById('stage-back-btn').addEventListener('click', () => this.ui.showCampScreen());
        document.getElementById('settings-back-btn').addEventListener('click', () => {
            // Always return to start screen from settings
            this.settingsOpenedFromStart = false; // Reset flag
            this.ui.showHomeScreen();
        });

        // Settings Buttons
        document.getElementById('save-game-btn').addEventListener('click', () => {
            this.saveGame();
            this.showNotification('游戏已保存！', 'success');
        });

        document.getElementById('new-game-btn').addEventListener('click', () => {
            this.showConfirmModal(
                '重新开始',
                '确定要重新开始游戏吗？当前进度将会丢失！',
                () => this.resetGame()
            );
        });

        document.getElementById('export-save-btn').addEventListener('click', () => {
            this.exportSave();
        });

        document.getElementById('import-save-btn').addEventListener('click', () => {
            document.getElementById('import-file-input').click();
        });

        document.getElementById('import-file-input').addEventListener('change', (e) => {
            this.importSave(e.target.files[0]);
        });

        // Modal buttons
        document.getElementById('modal-cancel').addEventListener('click', () => {
            this.hideConfirmModal();
        });

        // Stat Buttons
        document.querySelectorAll('.stat-plus-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.increaseStat(e.target.dataset.stat));
        });

        // Minus Stat Buttons
        document.querySelectorAll('.stat-minus-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.decreaseStat(e.target.dataset.stat));
        });

        // Shop Item Buttons (Consumables)
        document.querySelectorAll('.buy-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const item = e.target.dataset.item;
                const price = parseInt(e.target.dataset.price);
                this.buyItem(item, price);
            });
        });

        // Shop Tabs
        document.getElementById('tab-items').addEventListener('click', () => {
            document.getElementById('tab-items').classList.add('active');
            document.getElementById('tab-equipment').classList.remove('active');
            document.getElementById('shop-items-content').classList.remove('hidden');
            document.getElementById('shop-equipment-content').classList.add('hidden');
        });

        document.getElementById('tab-equipment').addEventListener('click', () => {
            document.getElementById('tab-equipment').classList.add('active');
            document.getElementById('tab-items').classList.remove('active');
            document.getElementById('shop-equipment-content').classList.remove('hidden');
            document.getElementById('shop-items-content').classList.add('hidden');
        });

        // Refresh Shop Equipment
        document.getElementById('refresh-shop-btn').addEventListener('click', () => {
            if (this.playerPokemon.gold >= 10) {
                this.playerPokemon.gold -= 10;
                this.ui.updateGold(this.playerPokemon.gold);
                this.refreshShopEquipment();
                this.saveGame();
            } else {
                alert("金币不足！需要 10 金币刷新商品。");
            }
        });

        // Stage Selection
        document.querySelectorAll('.stage-card').forEach(card => {
            card.addEventListener('click', () => {
                if (!card.classList.contains('locked')) {
                    const stageId = parseInt(card.dataset.stage);
                    this.selectedStage = stageId;
                    this.startBattle();
                }
            });
        });

        // Gear Screen Event Delegation (simpler than attaching to every re-render)
        document.getElementById('gear-screen').addEventListener('click', (e) => {
            // Inventory Item Click
            const invSlot = e.target.closest('.item-slot');
            if (invSlot && invSlot.parentElement.id === 'inventory-list-container') {
                const index = invSlot.dataset.index;
                this.equipItem(parseInt(index));
            }

            // Unequip Button Click
            if (e.target.classList.contains('unequip-btn')) {
                const slotDiv = e.target.closest('.item-slot');
                if (slotDiv && slotDiv.dataset.slot) {
                    this.unequipItem(slotDiv.dataset.slot);
                }
            }

            // Sell Button Click
            if (e.target.classList.contains('sell-btn')) {
                const index = parseInt(e.target.dataset.index);
                this.sellItem(index);
            }
        });

        // Shop Equipment Purchase (Event Delegation)
        document.getElementById('shop-equipment-grid').addEventListener('click', (e) => {
            if (e.target.classList.contains('buy-equipment-btn')) {
                const index = parseInt(e.target.dataset.index);
                this.buyShopEquipment(index);
            }
        });
    }

    updateStageAvailability() {
        const stages = document.querySelectorAll('.stage-card');

        stages.forEach((card, index) => {
            // 判断关卡是否已解锁
            const isUnlocked = this.playerPokemon.unlockedStages.includes(index);
            if (isUnlocked) {
                card.classList.remove('locked');
                card.style.pointerEvents = 'auto';
            } else {
                card.classList.add('locked');
                card.style.pointerEvents = 'none';
            }
        });
    }

    loadGame() {
        const savedData = localStorage.getItem(this.SAVE_KEY);
        if (savedData) {
            try {
                const parsed = JSON.parse(savedData);
                // Validate basic structure
                if (parsed.name && parsed.level) {
                    console.log("Save loaded:", parsed);
                    this.savedPokemon = parsed;
                    // Ensure stats exist if loading old save
                    if (!this.savedPokemon.stats) this.savedPokemon.stats = { atk: 15, def: 10, spd: 10 };
                    if (this.savedPokemon.gold === undefined) this.savedPokemon.gold = 100;
                    if (this.savedPokemon.attrPoints === undefined) this.savedPokemon.attrPoints = 0;
                    if (!this.savedPokemon.inventory) this.savedPokemon.inventory = [];
                    if (!this.savedPokemon.equipment) this.savedPokemon.equipment = { weapon: null, armor: null, accessory: null };
                    // 确保关卡进度和已解锁关卡数据存在
                    if (!this.savedPokemon.stageProgress) {
                        this.savedPokemon.stageProgress = {
                            0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0
                        };
                    }
                    if (!this.savedPokemon.unlockedStages) {
                        // 对于旧存档，根据玩家等级解锁相应关卡
                        const playerLevel = this.savedPokemon.level;
                        const unlockedStages = [0]; // 至少解锁第1关
                        
                        if (playerLevel >= 5) unlockedStages.push(1);
                        if (playerLevel >= 9) unlockedStages.push(2);
                        if (playerLevel >= 13) unlockedStages.push(3);
                        if (playerLevel >= 17) unlockedStages.push(4);
                        if (playerLevel >= 21) unlockedStages.push(5);
                        
                        this.savedPokemon.unlockedStages = unlockedStages;
                    }

                    // We need to set playerPokemon here to display camp correct
                    this.playerPokemon = this.savedPokemon; // Temp load
                }
            } catch (e) {
                console.error(e);
            }
        }
    }

    saveGame() {
        if (this.playerPokemon) {
            const dataToSave = {
                name: this.playerPokemon.name,
                level: this.playerPokemon.level,
                currentHp: this.playerPokemon.currentHp,
                maxHp: this.playerPokemon.maxHp,
                currentXp: this.playerPokemon.currentXp,
                maxXp: this.playerPokemon.maxXp,
                moves: this.playerPokemon.moves,
                stats: this.playerPokemon.stats,
                attrPoints: this.playerPokemon.attrPoints,
                gold: this.playerPokemon.gold,
                inventory: this.playerPokemon.inventory,
                equipment: this.playerPokemon.equipment
                // In a full game, we'd save ID and reconstruct from DB, but here we save stats directly
            };
            localStorage.setItem(this.SAVE_KEY, JSON.stringify(dataToSave));
            // console.log("Game saved!"); // Removed for cleaner console
        }
    }

    increaseStat(stat) {
        if (this.playerPokemon.attrPoints > 0) {
            if (stat === 'hp') {
                // HP属性特殊处理，直接影响maxHp
                this.playerPokemon.maxHp += 10;
                this.playerPokemon.currentHp += 10; // 同时恢复等量HP
            } else {
                // 普通属性处理
                this.playerPokemon.stats[stat]++;
            }
            this.playerPokemon.attrPoints--;
            this.ui.showStatusScreen(this.playerPokemon);
            this.saveGame();
        }
    }

    // 减少属性点
    decreaseStat(stat) {
        if (stat === 'hp') {
            // HP属性特殊处理，设置基础HP最小值为初始值的80%
            const baseMaxHp = 200; // 初始HP值
            const minHp = Math.floor(baseMaxHp * 0.8); // 最小值为初始值的80%
            if (this.playerPokemon.maxHp > minHp) {
                this.playerPokemon.maxHp -= 10;
                // 确保当前HP不超过新的maxHp
                this.playerPokemon.currentHp = Math.min(this.playerPokemon.currentHp, this.playerPokemon.maxHp);
                this.playerPokemon.attrPoints++;
                this.ui.showStatusScreen(this.playerPokemon);
                this.saveGame();
            }
        } else {
            // 普通属性处理
            const minStat = 10; // 设置属性最小值为10（基础属性）
            if (this.playerPokemon.stats[stat] > minStat) {
                this.playerPokemon.stats[stat]--;
                this.playerPokemon.attrPoints++;
                this.ui.showStatusScreen(this.playerPokemon);
                this.saveGame();
            }
        }
    }

    // Save Management Methods
    resetGame() {
        localStorage.removeItem(this.SAVE_KEY);
        this.hideConfirmModal();
        this.showNotification('游戏已重置！刷新页面开始新游戏。', 'success');
        setTimeout(() => {
            location.reload();
        }, 1500);
    }

    exportSave() {
        const saveData = localStorage.getItem(this.SAVE_KEY);
        if (!saveData) {
            this.showNotification('没有存档可以导出！', 'error');
            return;
        }

        const blob = new Blob([saveData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pokemon_save_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);

        this.showNotification('存档已导出！', 'success');
    }

    importSave(file) {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                // Validate data structure
                if (data.name && data.level !== undefined) {
                    localStorage.setItem(this.SAVE_KEY, e.target.result);
                    this.showNotification('存档导入成功！刷新页面加载存档。', 'success');
                    setTimeout(() => {
                        location.reload();
                    }, 1500);
                } else {
                    this.showNotification('无效的存档文件！', 'error');
                }
            } catch (err) {
                this.showNotification('存档文件格式错误！', 'error');
            }
        };
        reader.readAsText(file);

        // Reset file input
        document.getElementById('import-file-input').value = '';
    }

    showConfirmModal(title, message, onConfirm) {
        document.getElementById('modal-title').textContent = title;
        document.getElementById('modal-message').textContent = message;
        document.getElementById('confirm-modal').classList.add('active');

        // Remove old listener and add new one
        const confirmBtn = document.getElementById('modal-confirm');
        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

        newConfirmBtn.addEventListener('click', () => {
            onConfirm();
            this.hideConfirmModal();
        });
    }

    hideConfirmModal() {
        document.getElementById('confirm-modal').classList.remove('active');
    }

    showNotification(message, type = 'info') {
        // Simple alert for now, can be enhanced with custom notification UI
        alert(message);
    }

    buyItem(item, price) {
        if (this.playerPokemon.gold >= price) {
            this.playerPokemon.gold -= price;

            if (item === 'potion') {
                this.playerPokemon.currentHp = Math.min(this.playerPokemon.maxHp, this.playerPokemon.currentHp + 50);
                alert("使用了回复药! HP +50");
            } else if (item === 'full_restore') {
                this.playerPokemon.currentHp = this.playerPokemon.maxHp;
                alert("使用了全满药! HP 完全恢复");
            }

            this.ui.updateGold(this.playerPokemon.gold);
            this.ui.showShopScreen(this.playerPokemon.gold); // Refresh
            this.saveGame();
        } else {
            alert("金币不足!");
        }
    }

    refreshShopEquipment() {
        // Generate 4 random equipment items for the shop
        this.shopEquipment = [];
        const playerLevel = this.playerPokemon.level || 5;

        for (let i = 0; i < 4; i++) {
            const equipment = this.generateLoot(playerLevel);
            if (equipment) {
                // Calculate price based on rarity and stats
                let basePrice = 50;
                const rarityMultiplier = {
                    'common': 1,
                    'uncommon': 2,
                    'rare': 4,
                    'epic': 8,
                    'legendary': 20,
                    'set': 10
                };

                // 计算装备总属性值，处理属性为对象的情况（取平均值）
                const getStatValue = (stat) => {
                    if (typeof stat === 'object' && stat !== null) {
                        return (stat.min + stat.max) / 2;
                    }
                    return stat || 0;
                };
                
                const totalStats = getStatValue(equipment.stats.atk) + 
                                  getStatValue(equipment.stats.def) +
                                  getStatValue(equipment.stats.spd) + 
                                  (getStatValue(equipment.stats.hp) / 10);

                equipment.price = Math.floor(basePrice * rarityMultiplier[equipment.rarity] + totalStats * 5);
                this.shopEquipment.push(equipment);
            }
        }

        // Render shop equipment
        this.renderShopEquipment();
    }

    renderShopEquipment() {
        const container = document.getElementById('shop-equipment-grid');
        container.innerHTML = '';

        this.shopEquipment.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = `shop-item equipment-shop-item glass-shards rarity-${item.rarity}`;
            div.innerHTML = `
                <span class="item-type-badge">${item.type}</span>
                <div class="item-name">${item.name}</div>
                <div class="item-stats">${this.ui.formatItemStats(item)}</div>
                <div class="price-tag">${item.price} G</div>
                <button class="buy-equipment-btn buy-btn" data-index="${index}">购买</button>
            `;
            container.appendChild(div);
        });
    }

    buyShopEquipment(index) {
        const item = this.shopEquipment[index];
        if (!item) return;

        if (this.playerPokemon.gold >= item.price) {
            this.playerPokemon.gold -= item.price;

            // Add to inventory
            const purchasedItem = { ...item };
            delete purchasedItem.price; // Remove price property
            this.playerPokemon.inventory.push(purchasedItem);

            // Remove from shop
            this.shopEquipment.splice(index, 1);

            this.ui.updateGold(this.playerPokemon.gold);
            this.renderShopEquipment();
            this.saveGame();

            alert(`购买成功！${purchasedItem.name} 已加入背包。`);
        } else {
            alert("金币不足!");
        }
    }

    equipItem(inventoryIndex) {
        const item = this.playerPokemon.inventory[inventoryIndex];
        const slot = item.type; // weapon, armor, accessory

        // Remove from inventory
        this.playerPokemon.inventory.splice(inventoryIndex, 1);

        // If slot has item, unequip it first (swapping)
        if (this.playerPokemon.equipment[slot]) {
            this.playerPokemon.inventory.push(this.playerPokemon.equipment[slot]);
        }

        // Equip new item
        this.playerPokemon.equipment[slot] = item;

        this.ui.updateGearUI(this.playerPokemon);
        this.saveGame();
    }

    unequipItem(slot) {
        if (this.playerPokemon.equipment[slot]) {
            this.playerPokemon.inventory.push(this.playerPokemon.equipment[slot]);
            this.playerPokemon.equipment[slot] = null;
            this.ui.updateGearUI(this.playerPokemon);
            this.saveGame();
        }
    }

    sellItem(inventoryIndex) {
        // Get the item to sell
        const item = this.playerPokemon.inventory[inventoryIndex];
        if (!item) return;

        // Calculate half price based on rarity and stats
        let basePrice = 50;
        const rarityMultiplier = {
            'common': 1,
            'uncommon': 2,
            'rare': 4,
            'epic': 8,
            'legendary': 20,
            'set': 10
        };

        // Get stat value helper function
        const getStatValue = (stat) => {
            if (typeof stat === 'object' && stat !== null) {
                return (stat.min + stat.max) / 2;
            }
            return stat || 0;
        };

        // Calculate total stats
        const totalStats = getStatValue(item.stats.atk) + 
                          getStatValue(item.stats.def) +
                          getStatValue(item.stats.spd) + 
                          (getStatValue(item.stats.hp) / 10);

        // Calculate full price, then halve it for sell price
        const fullPrice = Math.floor(basePrice * rarityMultiplier[item.rarity] + totalStats * 5);
        const sellPrice = Math.floor(fullPrice / 2);

        // Add gold to player
        this.playerPokemon.gold += sellPrice;
        // Remove item from inventory
        this.playerPokemon.inventory.splice(inventoryIndex, 1);

        // Update UI
        this.ui.updateGold(this.playerPokemon.gold);
        this.ui.updateGearUI(this.playerPokemon);
        this.saveGame();
    }

    generateLoot(level) {
        const roll = Math.random();
        // Drop Rates: 100% chance for some loot for demo purposes? Let's say 50%
        if (roll > 0.5) return null;

        // Check Rarity
        let rarity = 'common';
        const rRoll = Math.random();
        if (rRoll > 0.98) rarity = 'legendary'; // 2%
        else if (rRoll > 0.90) rarity = 'epic'; // 8%
        else if (rRoll > 0.75) rarity = 'rare'; // 15%
        else if (rRoll > 0.50) rarity = 'uncommon'; // 25%
        else if (rRoll > 0.45 && level > 10) rarity = 'set'; // Set items rare

        // Type
        const types = ['weapon', 'armor', 'accessory'];
        const type = types[Math.floor(Math.random() * types.length)];

        // 装备等级 = 关卡等级 (level) ± 1
        const equipmentLevel = Math.max(1, level + Math.floor(Math.random() * 3) - 1);

        // Names & Stats
        let namePrefix = "";
        let baseStat = 0;

        // Stat Multipliers based on rarity
        let multi = 1;
        if (rarity === 'uncommon') multi = 1.5;
        if (rarity === 'rare') multi = 2;
        if (rarity === 'epic') multi = 3;
        if (rarity === 'legendary') multi = 5;
        if (rarity === 'set') multi = 2.5;

        // 等级系数：装备等级越高，属性值越高
        const levelFactor = 1 + (equipmentLevel - 1) * 0.1;

        const stats = {};

        // 生成固定属性值的辅助函数
        const generateFixedStat = (baseValue) => {
            return Math.floor(baseValue);
        };
        
        // 生成浮动范围属性值的辅助函数
        const generateStatRange = (baseValue, range = 0.2) => {
            // range为浮动范围，默认为20%
            const minValue = Math.floor(baseValue * (1 - range));
            const maxValue = Math.floor(baseValue * (1 + range));
            return { min: minValue, max: maxValue };
        };

        if (type === 'weapon') {
            namePrefix = this.getRandomItemName(['古旧剑', '铁爪', '火焰牙', '龙骨棒', '能量光束']);
            const baseAtk = (2 + equipmentLevel) * multi * levelFactor;
            stats.atk = generateStatRange(baseAtk, 0.25); // ATK属性25%浮动范围
        } else if (type === 'armor') {
            namePrefix = this.getRandomItemName(['布甲', '铁甲', '龙鳞甲', '护身符', '斗篷']);
            const baseDef = (1 + equipmentLevel * 0.8) * multi * levelFactor;
            const baseHp = (10 + equipmentLevel * 5) * multi * levelFactor;
            stats.def = generateStatRange(baseDef, 0.2); // DEF属性20%浮动范围
            stats.hp = generateFixedStat(baseHp); // HP属性固定值，无浮动
        } else {
            namePrefix = this.getRandomItemName(['戒指', '项链', '护腕', '幸运珠']);
            const baseSpd = (1 + equipmentLevel * 0.5) * multi * levelFactor;
            const baseAtk = (equipmentLevel * 0.5) * multi * levelFactor;
            stats.spd = generateFixedStat(baseSpd); // SPD属性固定值，无浮动
            stats.atk = generateStatRange(baseAtk, 0.3); // ATK属性30%浮动范围
        }

        // Rarity Prefixes
        const rNames = {
            common: '破旧的', uncommon: '精良的', rare: '稀有的', epic: '史诗级', legendary: '传说中', set: '套装:'
        };

        return {
            id: Date.now() + Math.random(), // Simple ID
            name: `${rNames[rarity]}${namePrefix}`,
            type: type,
            rarity: rarity,
            level: equipmentLevel, // 装备等级
            stats: stats
        };
    }

    getRandomItemName(list) {
        return list[Math.floor(Math.random() * list.length)];
    }

    // Initialize Player Data and Enter Camp
    enterGame() {
        // Init Player Pokemon
        if (this.savedPokemon) {
            const staticData = POKEMON_DATA.CHARIZARD;
            // Merge defaults in case of missing fields in old saves
            const defaults = {
                stats: { atk: 15, def: 10, spd: 10 },
                attrPoints: 0,
                gold: 100,
                inventory: [],
                equipment: { weapon: null, armor: null, accessory: null },
                stageProgress: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
                unlockedStages: [0]
            };

            this.playerPokemon = {
                ...staticData,
                ...defaults,
                ...this.savedPokemon,
                sprite: staticData.sprite,
                color: staticData.color
            };

            // Failsafe if hp is 0
            if (this.playerPokemon.currentHp <= 0) {
                this.playerPokemon.currentHp = Math.floor(this.playerPokemon.maxHp / 2); // Revive with half HP
            }
        } else {
            // New Game
            this.playerPokemon = JSON.parse(JSON.stringify(POKEMON_DATA.CHARIZARD));
            this.playerPokemon.currentHp = this.playerPokemon.maxHp;
            // Add defaults for new game explicitly if not in data.js (it is now, but safe to be sure)
            if (!this.playerPokemon.stats) this.playerPokemon.stats = { atk: 15, def: 10, spd: 10 };
            if (this.playerPokemon.gold === undefined) this.playerPokemon.gold = 100;
            if (this.playerPokemon.attrPoints === undefined) this.playerPokemon.attrPoints = 0;
            this.playerPokemon.inventory = [];
            this.playerPokemon.equipment = { weapon: null, armor: null, accessory: null };
        }

        // Enter Camp
        this.ui.showCampScreen();
    }

    startBattle() {
        // Restore player HP to full before battle
        this.playerPokemon.currentHp = this.playerPokemon.maxHp;

        // Get stage info
        const stageId = this.selectedStage || 0;
        const stageData = this.getStageData(stageId);

        // Init Opponent based on stage
        this.opponentPokemon = JSON.parse(JSON.stringify(POKEMON_DATA.BLASTOISE));
        this.opponentPokemon.name = stageData.opponentName;
        this.opponentPokemon.type = stageData.type;

        // Calculate opponent level based on stage progress
        // 只能遇到已击败最高等级+1的怪物，或者当前关卡的最小等级（如果还没有击败任何怪物）
        const currentStageProgress = this.playerPokemon.stageProgress[stageId] || 0;
        let opponentLevel;
        
        if (currentStageProgress < stageData.maxLevel) {
            // 生成下一个等级的怪物
            opponentLevel = Math.max(currentStageProgress + 1, stageData.minLevel);
        } else {
            // 已经击败了当前关卡的最高等级怪物，只能继续挑战最高等级
            opponentLevel = stageData.maxLevel;
        }
        
        this.opponentPokemon.level = opponentLevel;

        // Scale Opponent Stats based on stage difficulty
        const difficultyMultiplier = 1 + (stageId * 0.2); // Each stage is 20% harder
        this.opponentPokemon.maxHp = Math.floor(220 * difficultyMultiplier * (this.opponentPokemon.level / 5));
        this.opponentPokemon.currentHp = this.opponentPokemon.maxHp;

        this.opponentPokemon.stats = {
            atk: Math.floor((10 + this.opponentPokemon.level * 2) * difficultyMultiplier),
            def: Math.floor((10 + this.opponentPokemon.level * 1.5) * difficultyMultiplier),
            spd: Math.floor((10 + this.opponentPokemon.level * 1) * difficultyMultiplier)
        };

        // Setup UI
        this.ui.showBattleScreen();
        this.ui.setSprites(this.playerPokemon.sprite, this.opponentPokemon.sprite);

        this.ui.updateHP(true, this.playerPokemon.currentHp, this.playerPokemon.maxHp);
        this.ui.updateLevel(true, this.playerPokemon.level);
        this.ui.updateXP(this.playerPokemon.currentXp, this.playerPokemon.maxXp);
        this.ui.updateGold(this.playerPokemon.gold);

        this.ui.updateHP(false, this.opponentPokemon.currentHp, this.opponentPokemon.maxHp);
        this.ui.updateLevel(false, this.opponentPokemon.level);

        this.ui.playerName.textContent = this.playerPokemon.name;
        this.ui.opponentName.textContent = this.opponentPokemon.name;

        this.isBattleActive = true;
        this.isPlayerTurn = true;

        this.gameLoop();
    }

    getStageData(stageId) {
        const stages = [
            {
                name: '光影原野',
                minLevel: 1,
                maxLevel: 4,
                opponentName: '比比鸟',
                type: 'flying'
            },
            {
                name: '蘑菇丛林',
                minLevel: 5,
                maxLevel: 8,
                opponentName: '妙蛙花',
                type: 'grass'
            },
            {
                name: '深幽矿山',
                minLevel: 9,
                maxLevel: 12,
                opponentName: '大岩蛇',
                type: 'rock'
            },
            {
                name: '赤热岩坑',
                minLevel: 13,
                maxLevel: 16,
                opponentName: '火焰鸟',
                type: 'fire'
            },
            {
                name: '急冻冰窟',
                minLevel: 17,
                maxLevel: 20,
                opponentName: '急冻鸟',
                type: 'ice'
            },
            {
                name: '恶龙峡谷',
                minLevel: 21,
                maxLevel: 25,
                opponentName: '快龙',
                type: 'dragon'
            }
        ];
        return stages[stageId] || stages[0];
    }

    async gameLoop() {
        await this.ui.typeDialog(`野生 ${this.opponentPokemon.name} (Lv.${this.opponentPokemon.level}) 出现了!`);
        this.ui.showActionMenu();
    }

    async attemptRun() {
        this.isPlayerTurn = false;

        // Calculate Escape Chance based on Speed
        const playerSpd = this.playerPokemon.stats ? this.playerPokemon.stats.spd : 10;
        const enemySpd = this.opponentPokemon.stats ? this.opponentPokemon.stats.spd : 10;

        // Base 70% + 5% per speed difference. Min 30%, Max 100%
        let chance = 70 + (playerSpd - enemySpd) * 5;
        chance = Math.max(30, Math.min(100, chance));

        await this.ui.typeDialog(`正在尝试逃跑... (成功率 ${chance}%)`);

        const roll = Math.random() * 100;

        if (roll < chance) {
            await this.ui.typeDialog("成功逃脱了!");
            this.isBattleActive = false;
            setTimeout(() => {
                this.ui.showCampScreen();
            }, 1000);
        } else {
            await this.ui.typeDialog("逃跑失败! 被拦住了!");
            await this.enemyTurn();
        }
    }

    async executeTurn(moveIndex) {
        if (!this.isBattleActive) return;

        // --- PLAYER TURN ---
        this.isPlayerTurn = false;
        const playerMove = this.playerPokemon.moves[moveIndex];

        await this.ui.typeDialog(`${this.playerPokemon.name} 使用了 ${playerMove.name}!`);
        await this.ui.playAttackAnimation(true, playerMove.type); // Player attacks with Type

        // Check if move hits based on accuracy
        if (Math.random() < playerMove.accuracy) {
            // Calculate Damage
            const damage = this.calculateDamage(playerMove, this.playerPokemon, this.opponentPokemon);
            
            // 减少HP并确保不低于0
            this.opponentPokemon.currentHp = Math.max(0, this.opponentPokemon.currentHp - damage);
            
            await this.ui.playDamageAnimation(false); // Opponent hit
            this.ui.showDamageNumber(damage, false); // Show damage on opponent
            this.ui.updateHP(false, this.opponentPokemon.currentHp, this.opponentPokemon.maxHp);

            await this.ui.typeDialog(`命中! 对手受到了 ${damage} 点伤害。`);

            // Check Win Condition
            if (this.opponentPokemon.currentHp <= 0) {
                // 确保HP为0，不显示负值
                this.opponentPokemon.currentHp = 0;
                this.ui.updateHP(false, this.opponentPokemon.currentHp, this.opponentPokemon.maxHp);
                this.endBattle(true);
                return;
            }
        } else {
            // Move missed
            await this.ui.typeDialog(`${this.playerPokemon.name} 的招式没有命中!`);
        }

        await this.enemyTurn();
    }

    async enemyTurn() {
        // --- OPPONENT TURN ---
        await this.ui.typeDialog(`轮到 ${this.opponentPokemon.name} 了!`);

        // Simple AI: Random Move
        const aiMoveIndex = Math.floor(Math.random() * this.opponentPokemon.moves.length);
        const aiMove = this.opponentPokemon.moves[aiMoveIndex];

        await this.ui.typeDialog(`${this.opponentPokemon.name} 使用了 ${aiMove.name}!`);
        await this.ui.playAttackAnimation(false, aiMove.type); // Opponent attacks

        // Check if enemy move hits based on accuracy
        if (Math.random() < aiMove.accuracy) {
            // Calculate Damage
            const aiDamage = this.calculateDamage(aiMove, this.opponentPokemon, this.playerPokemon);
            
            // 减少HP并确保不低于0
            this.playerPokemon.currentHp = Math.max(0, this.playerPokemon.currentHp - aiDamage);
            
            await this.ui.playDamageAnimation(true); // Player hit
            this.ui.showDamageNumber(aiDamage, true); // Show damage on player
            this.ui.updateHP(true, this.playerPokemon.currentHp, this.playerPokemon.maxHp);

            await this.ui.typeDialog(`痛! 你受到了 ${aiDamage} 点伤害。`);

            // Check Lose Condition
            if (this.playerPokemon.currentHp <= 0) {
                // 确保HP为0，不显示负值
                this.playerPokemon.currentHp = 0;
                this.ui.updateHP(true, this.playerPokemon.currentHp, this.playerPokemon.maxHp);
                this.endBattle(false);
                return;
            }
        } else {
            // Enemy move missed
            await this.ui.typeDialog(`${this.opponentPokemon.name} 的招式没有命中!`);
        }

        // Save state after every turn (optional, but safe)
        this.saveGame();

        // Reset for next turn
        this.isPlayerTurn = true;
        this.ui.showActionMenu();
    }

    calculateDamage(move, attacker, defender) {
        const level = attacker.level || 5;

        // Get Total Stats - Support stat ranges
        const getStat = (mon, statName) => {
            let val = mon.stats ? mon.stats[statName] : 10;
            // Add equipment stats if it is player and has equipment
            if (mon === this.playerPokemon && mon.equipment) {
                Object.values(mon.equipment).forEach(item => {
                    if (item && item.stats[statName]) {
                        if (typeof item.stats[statName] === 'object' && item.stats[statName].min && item.stats[statName].max) {
                            // 随机选择一个在min和max之间的值
                            const itemStat = Math.floor(Math.random() * (item.stats[statName].max - item.stats[statName].min + 1) + item.stats[statName].min);
                            val += itemStat;
                        } else {
                            val += item.stats[statName];
                        }
                    }
                });
            }
            // For enemy, we simulate gear by just scaling stats in startBattle (already done)
            return val;
        };

        const atk = getStat(attacker, 'atk');
        const def = getStat(defender, 'def');

        // 伤害浮动范围：85%-115%
        const random = (Math.floor(Math.random() * 31) + 85) / 100;

        let effectiveness = 1.0;
        if (move.type === 'fire' && defender.type === 'water') effectiveness = 0.5;
        if (move.type === 'water' && defender.type === 'fire') effectiveness = 2.0;
        if (move.type === 'grass' && defender.type === 'fire') effectiveness = 0.5;
        if (move.type === 'fire' && defender.type === 'grass') effectiveness = 2.0;

        const basePower = move.power;

        // Damage = (((2*Lv/5 + 2) * Power * A/D) / 50 + 2) * Mod
        const rawDamage = (((2 * level / 5 + 2) * basePower * (atk / def)) / 50) + 2;

        return Math.max(1, Math.floor(rawDamage * effectiveness * random * 5));
        // 返回至少1点伤害，确保攻击不会完全无效
    }

    async endBattle(playerWon) {
        this.isBattleActive = false;
        if (playerWon) {
            this.ui.opponentSprite.style.opacity = '0';
            await this.ui.typeDialog(`${this.opponentPokemon.name} 倒下了!`);
            await this.ui.typeDialog(`你赢了!`);

            // Rewards
            const xpGain = 40 + Math.floor(Math.random() * 20);
            const goldGain = 20 + (this.opponentPokemon.level * 5);

            await this.ui.typeDialog(`获得了 ${xpGain} 点经验值 和 ${goldGain} 金币!`);

            this.playerPokemon.gold += goldGain;
            this.ui.updateGold(this.playerPokemon.gold);

            await this.gainXp(xpGain);

            // LOOT DROP - 生成多个战利品
            const lootItems = [];
            const maxLoot = 3; // 最大战利品数量
            
            for (let i = 0; i < maxLoot; i++) {
                const loot = this.generateLoot(this.opponentPokemon.level);
                if (loot) {
                    lootItems.push(loot);
                    this.playerPokemon.inventory.push(loot);
                }
            }
            
            // 一起显示所有获得的战利品
            if (lootItems.length > 0) {
                let lootText = `获得装备: `;
                for (let i = 0; i < lootItems.length; i++) {
                    lootText += `[${lootItems[i].name}]`;
                    if (i < lootItems.length - 1) {
                        lootText += `, `;
                    }
                }
                lootText += `!`;
                
                await this.ui.typeDialog(lootText);
            }

            // 更新关卡进度和解锁逻辑
            const stageId = this.selectedStage || 0;
            const stageData = this.getStageData(stageId);
            const opponentLevel = this.opponentPokemon.level;
            
            // 更新当前关卡已击败的最高等级
            if (opponentLevel > (this.playerPokemon.stageProgress[stageId] || 0)) {
                this.playerPokemon.stageProgress[stageId] = opponentLevel;
                
                // 检查是否击败了当前关卡的最高等级怪物
                if (opponentLevel >= stageData.maxLevel) {
                    // 解锁下一关
                    const nextStageId = stageId + 1;
                    if (nextStageId <= 5 && !this.playerPokemon.unlockedStages.includes(nextStageId)) {
                        this.playerPokemon.unlockedStages.push(nextStageId);
                        await this.ui.typeDialog(`恭喜! 已解锁第 ${nextStageId + 1} 关!`);
                    }
                }
            }

            // 战斗结束后恢复HP到满值
            this.playerPokemon.currentHp = this.playerPokemon.maxHp;
            
            this.saveGame();

            setTimeout(() => {
                this.ui.showCampScreen();
            }, 1000);

        } else {
            this.ui.playerSprite.style.opacity = '0';
            await this.ui.typeDialog(`${this.playerPokemon.name} 倒下了!`);
            await this.ui.typeDialog(`你眼前一黑... (损失部分金币)`);

            const goldLoss = Math.floor(this.playerPokemon.gold * 0.1);
            this.playerPokemon.gold = Math.max(0, this.playerPokemon.gold - goldLoss);

            // 战斗结束后恢复HP到满值
            this.playerPokemon.currentHp = this.playerPokemon.maxHp;

            this.saveGame();
            setTimeout(() => {
                this.ui.showCampScreen();
            }, 1000);
        }
    }

    async gainXp(amount) {
        // Add XP
        this.playerPokemon.currentXp += amount;

        // Check for Level Up
        // While loop in case multiple levels gained
        let leveledUp = false;
        while (this.playerPokemon.currentXp >= this.playerPokemon.maxXp) {
            this.playerPokemon.currentXp -= this.playerPokemon.maxXp;
            this.playerPokemon.level++;
            // Increase requirements
            this.playerPokemon.maxXp = Math.floor(this.playerPokemon.maxXp * 1.2);
            // Increase Stats
            this.playerPokemon.maxHp += 10;
            this.playerPokemon.currentHp += 10; // Heal the amount gained

            // Attribute Point Gain
            this.playerPokemon.attrPoints += 3;

            leveledUp = true;
        }

        // Update UI Bars
        this.ui.updateXP(this.playerPokemon.currentXp, this.playerPokemon.maxXp);

        if (leveledUp) {
            this.ui.updateLevel(true, this.playerPokemon.level);
            this.ui.updateHP(true, this.playerPokemon.currentHp, this.playerPokemon.maxHp);
            // Play sound or effect?
            await this.ui.typeDialog(`升级了! Lv.${this.playerPokemon.level}!`);
            await this.ui.typeDialog(`获得了 3 点属性点! (请在营地分配)`);
        }
    }
}

// Start the game by creating instance
window.game = new Game();
