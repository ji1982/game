/**
 * UI Controller
 * Handles all DOM manipulations and animations
 */
class UI {
    constructor() {
        // Screens
        this.startScreen = document.getElementById('start-screen');
        this.battleScreen = document.getElementById('battle-screen');

        // HUD Elements
        this.playerHpBar = document.getElementById('player-hp-bar');
        this.playerHpText = document.getElementById('player-hp-text');
        this.opponentHpBar = document.getElementById('opponent-hp-bar');
        this.playerName = document.getElementById('player-name');
        this.opponentName = document.getElementById('opponent-name');

        // Interactive Areas
        this.dialogText = document.getElementById('dialog-text');
        this.actionMenu = document.getElementById('action-menu');
        this.moveMenu = document.getElementById('move-menu');

        // Sprites
        this.playerSprite = document.getElementById('player-sprite');
        this.opponentSprite = document.getElementById('opponent-sprite');
    }

    // Update the sprite images
    setSprites(playerSrc, opponentSrc) {
        this.playerSprite.src = playerSrc;
        this.opponentSprite.src = opponentSrc;
    }

    // Switch between Start and Battle screens
    // Switch between Start and Battle screens
    showBattleScreen() {
        this.hideAllScreens();
        this.battleScreen.classList.remove('hidden');
        this.battleScreen.classList.add('active');
    }

    // Update HP bars with smooth animation and color change
    updateHP(isPlayer, current, max) {
        const bar = isPlayer ? this.playerHpBar : this.opponentHpBar;
        const percentage = Math.min(100, Math.max(0, (current / max) * 100));
        bar.style.width = `${percentage}%`;

        // Color based on percentage
        bar.classList.remove('low', 'critical');
        if (percentage <= 20) {
            bar.classList.add('critical');
        } else if (percentage <= 50) {
            bar.classList.add('low');
        }

        // Update numeric HP display - ensure no negative values
        const displayCurrent = Math.max(0, Math.ceil(current));
        if (isPlayer) {
            document.getElementById('player-hp-current').textContent = displayCurrent;
            document.getElementById('player-hp-max').textContent = max;
        } else {
            document.getElementById('opponent-hp-current').textContent = displayCurrent;
            document.getElementById('opponent-hp-max').textContent = max;
        }
    }

    updateLevel(isPlayer, level) {
        const el = isPlayer ? document.getElementById('player-level') : document.getElementById('opponent-level');
        if (el) el.textContent = `Lv.${level}`;
    }

    updateXP(current, max) {
        const bar = document.getElementById('player-xp-bar');
        const percentage = Math.min(100, Math.max(0, (current / max) * 100));
        if (bar) bar.style.width = `${percentage}%`;
    }

    // Typewriter effect for dialog
    async typeDialog(text) {
        // Hide menus during dialog
        this.actionMenu.classList.add('hidden');
        this.moveMenu.classList.add('hidden');

        this.dialogText.textContent = '';
        return new Promise(resolve => {
            let i = 0;
            const speed = 30; // ms per char

            const type = () => {
                if (i < text.length) {
                    this.dialogText.textContent += text.charAt(i);
                    i++;
                    setTimeout(type, speed);
                } else {
                    // Wait a bit after typing is done before user can proceed/resolve
                    setTimeout(resolve, 500);
                }
            };
            type();
        });
    }

    showActionMenu() {
        this.actionMenu.classList.remove('hidden');
        this.moveMenu.classList.add('hidden');
    }

    showMoveMenu(moves, playerPokemon, opponentPokemon) {
        this.actionMenu.classList.add('hidden');
        this.moveMenu.classList.remove('hidden');

        // Update move buttons
        const buttons = this.moveMenu.querySelectorAll('.move-btn');
        buttons.forEach((btn, index) => {
            if (moves[index]) {
                const move = moves[index];

                // Calculate estimated damage (simplified version)
                let estimatedDamage = 0;
                if (playerPokemon && opponentPokemon) {
                    // Simplified damage calculation for preview
                    const attackerAtk = playerPokemon.stats.atk + this.getEquipmentBonus(playerPokemon, 'atk');
                    const defenderDef = opponentPokemon.stats.def;
                    const baseDamage = move.power * (attackerAtk / Math.max(1, defenderDef));
                    estimatedDamage = Math.floor(baseDamage * (0.9 + Math.random() * 0.2));
                }

                // Format button text with move info
                const accuracy = Math.floor(move.accuracy * 100);
                btn.innerHTML = `
                    <div class="move-name">${move.name}</div>
                    <div class="move-info">
                        <span class="move-power">⚔️ ${move.power}</span>
                        <span class="move-accuracy">🎯 ${accuracy}%</span>
                        ${estimatedDamage > 0 ? `<span class="move-damage">~${estimatedDamage} DMG</span>` : ''}
                    </div>
                `;
                btn.style.display = 'block';
                // Reset classes and add new type class
                btn.className = 'move-btn';
                btn.classList.add(`type-${move.type}`);
            } else {
                btn.style.display = 'none';
            }
        });
    }

    getEquipmentBonus(pokemon, stat) {
        let bonusMin = 0, bonusMax = 0;
        if (pokemon.equipment) {
            ['weapon', 'armor', 'accessory'].forEach(slot => {
                const item = pokemon.equipment[slot];
                if (item && item.stats && item.stats[stat]) {
                    if (typeof item.stats[stat] === 'object' && item.stats[stat].min && item.stats[stat].max) {
                        bonusMin += item.stats[stat].min;
                        bonusMax += item.stats[stat].max;
                    } else {
                        bonusMin += item.stats[stat];
                        bonusMax += item.stats[stat];
                    }
                }
            });
        }
        return { min: bonusMin, max: bonusMax };
    }

    showDamageNumber(damage, isPlayer) {
        const container = document.getElementById('effects-container');
        const damageEl = document.createElement('div');
        damageEl.className = 'damage-number';
        damageEl.textContent = `-${damage}`;

        // Position based on target
        if (isPlayer) {
            damageEl.style.bottom = '35%';
            damageEl.style.left = '25%';
        } else {
            damageEl.style.top = '25%';
            damageEl.style.right = '25%';
        }

        container.appendChild(damageEl);

        // Remove after animation
        setTimeout(() => {
            damageEl.remove();
        }, 1500);
    }

    showHomeScreen() {
        this.startScreen.classList.remove('hidden');
        this.startScreen.classList.add('active');
        this.battleScreen.classList.add('hidden');
        this.hideAllScreens();
        this.startScreen.classList.remove('hidden');
        this.startScreen.classList.add('active');
    }

    showCampScreen() {
        this.hideAllScreens();
        document.getElementById('camp-screen').classList.remove('hidden');
        document.getElementById('camp-screen').classList.add('active');
    }

    showStatusScreen(pokemon) {
        this.hideAllScreens();
        document.getElementById('status-screen').classList.remove('hidden');
        document.getElementById('status-screen').classList.add('active');
        this.updateStatusUI(pokemon);
    }

    showShopScreen(gold) {
        this.hideAllScreens();
        document.getElementById('shop-screen').classList.remove('hidden');
        document.getElementById('shop-screen').classList.add('active');
        document.getElementById('shop-gold').textContent = gold;
    }

    showStageScreen() {
        this.hideAllScreens();
        document.getElementById('stage-screen').classList.remove('hidden');
        document.getElementById('stage-screen').classList.add('active');
    }

    showSettingsScreen(playerData) {
        this.hideAllScreens();
        document.getElementById('settings-screen').classList.remove('hidden');
        document.getElementById('settings-screen').classList.add('active');

        // Update save info display
        if (playerData) {
            document.getElementById('save-pokemon-name').textContent = playerData.name || '-';
            document.getElementById('save-level').textContent = playerData.level || '-';
            document.getElementById('save-gold').textContent = (playerData.gold || 0) + ' G';
            const itemCount = (playerData.inventory?.length || 0) +
                (playerData.equipment?.weapon ? 1 : 0) +
                (playerData.equipment?.armor ? 1 : 0) +
                (playerData.equipment?.accessory ? 1 : 0);
            document.getElementById('save-items').textContent = itemCount;
        }
    }

    showGearScreen(playerData) {
        this.hideAllScreens();
        document.getElementById('gear-screen').classList.remove('hidden');
        document.getElementById('gear-screen').classList.add('active');
        this.updateGearUI(playerData);
    }

    updateGearUI(playerData) {
        const inventory = playerData.inventory || [];
        const equipment = playerData.equipment || { weapon: null, armor: null, accessory: null };

        // 1. Update Equipped Slots
        ['weapon', 'armor', 'accessory'].forEach(slot => {
            const el = document.getElementById(`slot-${slot}`);
            const item = equipment[slot];

            el.innerHTML = `<span class="slot-label">${slot.toUpperCase()}</span>`;
            if (item) {
                el.classList.remove('empty');
                el.classList.add(`rarity-${item.rarity}`);
                el.innerHTML += `
                    <div class="item-name">${item.name}</div>
                    <div class="item-stats">${this.formatItemStats(item)}</div>
                    <button class="unequip-btn" style="position:absolute; right:10px; top:10px; background:rgba(0,0,0,0.5); border:none; color:white; border-radius:4px; cursor:pointer;">卸下</button>
                `;
                // Add click event for unequip logic via delegation or direct bind in main class, 
                // but simpler to let main class handle re-render or event bubbling.
                // For simplicity, we'll attach a data-id and let game.js handle clicks.
                el.dataset.itemId = item.id;
            } else {
                el.classList.add('empty');
                el.classList.remove('rarity-common', 'rarity-uncommon', 'rarity-rare', 'rarity-epic', 'rarity-legendary', 'rarity-set'); // Clear classes
                el.innerHTML += `<span class="item-placeholder">无装备</span>`;
                delete el.dataset.itemId;
            }
        });

        // 2. Update Inventory List
        const listContainer = document.getElementById('inventory-list-container');
        listContainer.innerHTML = '';
        document.getElementById('inventory-count').textContent = inventory.length;

        inventory.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = `item-slot rarity-${item.rarity}`;
            div.dataset.index = index; // Store index for easy access
            div.innerHTML = `
                <div class="item-name">${item.name} <span style="float:right; font-size:0.7em; opacity:0.8;">${item.type}</span></div>
                <div class="item-stats">${this.formatItemStats(item)}</div>
                <div style="margin-top:5px; font-size:0.8em; color:yellow;">点击装备 / 丢弃</div>
            `;
            listContainer.appendChild(div);
        });

        // 3. Update Total Gear Stats Preview - Support stat ranges
        let totalAtkMin = 0, totalAtkMax = 0;
        let totalDefMin = 0, totalDefMax = 0;
        let totalSpdMin = 0, totalSpdMax = 0;
        let totalHpMin = 0, totalHpMax = 0;
        
        Object.values(equipment).forEach(item => {
            if (item) {
                // ATK
                if (item.stats.atk) {
                    if (typeof item.stats.atk === 'object' && item.stats.atk.min && item.stats.atk.max) {
                        totalAtkMin += item.stats.atk.min;
                        totalAtkMax += item.stats.atk.max;
                    } else {
                        totalAtkMin += item.stats.atk;
                        totalAtkMax += item.stats.atk;
                    }
                }
                
                // DEF
                if (item.stats.def) {
                    if (typeof item.stats.def === 'object' && item.stats.def.min && item.stats.def.max) {
                        totalDefMin += item.stats.def.min;
                        totalDefMax += item.stats.def.max;
                    } else {
                        totalDefMin += item.stats.def;
                        totalDefMax += item.stats.def;
                    }
                }
                
                // SPD
                if (item.stats.spd) {
                    if (typeof item.stats.spd === 'object' && item.stats.spd.min && item.stats.spd.max) {
                        totalSpdMin += item.stats.spd.min;
                        totalSpdMax += item.stats.spd.max;
                    } else {
                        totalSpdMin += item.stats.spd;
                        totalSpdMax += item.stats.spd;
                    }
                }
                
                // HP
                if (item.stats.hp) {
                    if (typeof item.stats.hp === 'object' && item.stats.hp.min && item.stats.hp.max) {
                        totalHpMin += item.stats.hp.min;
                        totalHpMax += item.stats.hp.max;
                    } else {
                        totalHpMin += item.stats.hp;
                        totalHpMax += item.stats.hp;
                    }
                }
            }
        });
        
        // Update UI with stat ranges
        document.getElementById('gear-stat-hp').textContent = totalHpMin === totalHpMax ? `+${totalHpMin}` : `+${totalHpMin}-${totalHpMax}`;
        document.getElementById('gear-stat-atk').textContent = totalAtkMin === totalAtkMax ? `+${totalAtkMin}` : `+${totalAtkMin}-${totalAtkMax}`;
        document.getElementById('gear-stat-def').textContent = totalDefMin === totalDefMax ? `+${totalDefMin}` : `+${totalDefMin}-${totalDefMax}`;
        document.getElementById('gear-stat-spd').textContent = totalSpdMin === totalSpdMax ? `+${totalSpdMin}` : `+${totalSpdMin}-${totalSpdMax}`;
    }

    formatItemStats(item) {
        let stats = [];
        
        // 添加装备等级
        if (item.level) {
            stats.push(`Lv.${item.level}`);
        }
        
        if (item.stats.hp) {
            if (typeof item.stats.hp === 'object' && item.stats.hp.min && item.stats.hp.max) {
                stats.push(`HP+${item.stats.hp.min}-${item.stats.hp.max}`);
            } else {
                stats.push(`HP+${item.stats.hp}`);
            }
        }
        if (item.stats.atk) {
            if (typeof item.stats.atk === 'object' && item.stats.atk.min && item.stats.atk.max) {
                stats.push(`ATK+${item.stats.atk.min}-${item.stats.atk.max}`);
            } else {
                stats.push(`ATK+${item.stats.atk}`);
            }
        }
        if (item.stats.def) {
            if (typeof item.stats.def === 'object' && item.stats.def.min && item.stats.def.max) {
                stats.push(`DEF+${item.stats.def.min}-${item.stats.def.max}`);
            } else {
                stats.push(`DEF+${item.stats.def}`);
            }
        }
        if (item.stats.spd) {
            if (typeof item.stats.spd === 'object' && item.stats.spd.min && item.stats.spd.max) {
                stats.push(`SPD+${item.stats.spd.min}-${item.stats.spd.max}`);
            } else {
                stats.push(`SPD+${item.stats.spd}`);
            }
        }
        return stats.join(', ');
    }

    hideAllScreens() {
        document.querySelectorAll('.screen').forEach(s => {
            s.classList.add('hidden');
            s.classList.remove('active');
        });
    }

    updateStatusUI(pokemon) {
        // 基本信息
        document.getElementById('stat-level').textContent = pokemon.level;
        document.getElementById('stat-name').textContent = pokemon.name;
        document.getElementById('stat-type').textContent = pokemon.type;
        document.getElementById('stat-type').className = `type-badge type-${pokemon.type}`;
        document.getElementById('stat-gold').textContent = pokemon.gold;

        // 经验值信息
        document.getElementById('stat-xp-current').textContent = pokemon.currentXp;
        document.getElementById('stat-xp-max').textContent = pokemon.maxXp;
        const xpPercentage = Math.min(100, Math.max(0, (pokemon.currentXp / pokemon.maxXp) * 100));
        document.getElementById('stat-xp-bar').style.width = `${xpPercentage}%`;

        // 加点属性
        document.getElementById('attr-points').textContent = pokemon.attrPoints;
        document.getElementById('stat-atk-val').textContent = pokemon.stats.atk;
        document.getElementById('stat-def-val').textContent = pokemon.stats.def;
        document.getElementById('stat-spd-val').textContent = pokemon.stats.spd;
        // 显示HP基础值
        document.getElementById('stat-hp-base').textContent = pokemon.maxHp;

        // 计算装备加成 - Support stat ranges
        const equipBonus = {
            atk: this.getEquipmentBonus(pokemon, 'atk'),
            def: this.getEquipmentBonus(pokemon, 'def'),
            spd: this.getEquipmentBonus(pokemon, 'spd'),
            hp: this.getEquipmentBonus(pokemon, 'hp') // 计算HP装备加成
        };

        // 计算并显示总属性，将装备加成用括号展示 - Support stat ranges
        const totalAtkMin = pokemon.stats.atk + equipBonus.atk.min;
        const totalAtkMax = pokemon.stats.atk + equipBonus.atk.max;
        const totalDefMin = pokemon.stats.def + equipBonus.def.min;
        const totalDefMax = pokemon.stats.def + equipBonus.def.max;
        const totalSpdMin = pokemon.stats.spd + equipBonus.spd.min;
        const totalSpdMax = pokemon.stats.spd + equipBonus.spd.max;
        const totalHpMin = pokemon.maxHp + equipBonus.hp.min; // 总HP = 基础HP + 装备加成最小值
        const totalHpMax = pokemon.maxHp + equipBonus.hp.max; // 总HP = 基础HP + 装备加成最大值

        // 显示总属性，装备加成用括号展示
        const formatStatRange = (min, max, base, bonusMin, bonusMax) => {
            const isSingleValue = min === max;
            const statText = isSingleValue ? `${min}` : `${min}-${max}`;
            
            // 格式化装备加成
            const bonusIsSingleValue = bonusMin === bonusMax;
            let bonusText = '';
            if (bonusMin > 0) {
                bonusText = bonusIsSingleValue ? `(+${bonusMin})` : `(+${bonusMin}-${bonusMax})`;
            }
            
            return `${statText} <small style="color: var(--accent-color); font-weight: normal;">${bonusText}</small>`;
        };
        
        document.getElementById('stat-total-hp').innerHTML = formatStatRange(totalHpMin, totalHpMax, pokemon.maxHp, equipBonus.hp.min, equipBonus.hp.max);
        document.getElementById('stat-total-atk').innerHTML = formatStatRange(totalAtkMin, totalAtkMax, pokemon.stats.atk, equipBonus.atk.min, equipBonus.atk.max);
        document.getElementById('stat-total-def').innerHTML = formatStatRange(totalDefMin, totalDefMax, pokemon.stats.def, equipBonus.def.min, equipBonus.def.max);
        document.getElementById('stat-total-spd').innerHTML = formatStatRange(totalSpdMin, totalSpdMax, pokemon.stats.spd, equipBonus.spd.min, equipBonus.spd.max);

        // Disable buttons based on conditions
        document.querySelectorAll('.stat-plus-btn').forEach(btn => {
            btn.disabled = pokemon.attrPoints <= 0;
        });

        // Disable minus buttons if stat is at minimum
        document.querySelectorAll('.stat-minus-btn').forEach(btn => {
            const stat = btn.dataset.stat;
            if (stat === 'hp') {
                // HP属性特殊处理
                const baseMaxHp = 200; // 初始HP值
                const minHp = Math.floor(baseMaxHp * 0.8); // 最小值为初始值的80%
                btn.disabled = pokemon.maxHp <= minHp;
            } else {
                // 普通属性处理
                const minStat = 10; // Same as in game.js
                btn.disabled = pokemon.stats[stat] <= minStat;
            }
        });
    }

    updateGold(amount) {
        const els = [document.getElementById('hud-gold'), document.getElementById('shop-gold')];
        els.forEach(el => { if (el) el.textContent = amount; });
    }

    // Animations
    async playAttackAnimation(isPlayer, moveType) {
        const sprite = isPlayer ? this.playerSprite : this.opponentSprite;
        const animClass = isPlayer ? 'attack-lunge-right' : 'attack-lunge-left';

        // 1. Lunge Animation
        sprite.classList.remove(animClass);
        void sprite.offsetWidth;
        sprite.classList.add(animClass);

        // 2. Visual Effect
        setTimeout(() => {
            this.playMoveEffect(moveType, !isPlayer);
        }, 200);

        return new Promise(resolve => setTimeout(resolve, 600));
    }

    playMoveEffect(type, isTargetPlayer) {
        const container = document.getElementById('effects-container');
        if (!container) return;

        const effectEl = document.createElement('div');
        effectEl.classList.add('effect-base');

        let effectClass = 'effect-scratch';
        if (['fire', 'dragon', 'electric'].includes(type)) effectClass = 'effect-fire';
        if (type === 'dragon') effectClass = 'effect-dragon';
        if (['water', 'ice'].includes(type)) effectClass = 'effect-water';
        if (type === 'ice') effectClass = 'effect-ice';

        effectEl.classList.add(effectClass);

        // Simplified positioning
        if (isTargetPlayer) {
            effectEl.style.left = '30%';
            effectEl.style.top = '70%';
        } else {
            effectEl.style.left = '70%';
            effectEl.style.top = '30%';
        }

        container.appendChild(effectEl);

        setTimeout(() => {
            effectEl.remove();
        }, 1000);
    }

    playDamageAnimation(isPlayer) {
        const sprite = isPlayer ? this.playerSprite : this.opponentSprite;

        // Reset animation
        sprite.classList.remove('damage-shake');
        void sprite.offsetWidth;
        sprite.classList.add('damage-shake');

        return new Promise(resolve => setTimeout(resolve, 500));
    }
}
