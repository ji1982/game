// 移除 export，直接定义为全局变量
const POKEMON_DATA = {
    CHARIZARD: {
        id: 6,
        name: "喷火龙",
        maxHp: 200,
        type: "fire",
        level: 1,
        currentXp: 0,
        maxXp: 100,
        stats: { atk: 15, def: 10, spd: 10 },
        attrPoints: 0,
        gold: 100,
        // 玩家视角：使用背面动态图
        sprite: "https://play.pokemonshowdown.com/sprites/xyani-back/charizard.gif",
        color: "#ff5252",
        moves: [
            { name: "喷射火焰", type: "fire", power: 40, accuracy: 0.95 },
            { name: "龙爪", type: "dragon", power: 30, accuracy: 1.0 },
            { name: "空气斩", type: "flying", power: 35, accuracy: 0.9 },
            { name: "大字爆炎", type: "fire", power: 60, accuracy: 0.7 }
        ]
    },
    BLASTOISE: {
        id: 9,
        name: "水箭龟",
        maxHp: 220,
        type: "water",
        // 对手视角：使用正面动态图
        sprite: "https://play.pokemonshowdown.com/sprites/xyani/blastoise.gif",
        color: "#448aff",
        moves: [
            { name: "水炮", type: "water", power: 50, accuracy: 0.8 },
            { name: "火箭头槌", type: "normal", power: 45, accuracy: 1.0 },
            { name: "咬碎", type: "dark", power: 35, accuracy: 1.0 },
            { name: "急冻光线", type: "ice", power: 40, accuracy: 1.0 }
        ]
    }
};

const TYPE_COLORS = {
    fire: "#f44336",
    water: "#2196f3",
    grass: "#4caf50",
    electric: "#ffeb3b",
    ice: "#00bcd4",
    fighting: "#ff9800",
    poison: "#9c27b0",
    ground: "#795548",
    flying: "#03a9f4",
    psychic: "#e91e63",
    bug: "#8bc34a",
    rock: "#607d8b",
    ghost: "#673ab7",
    dragon: "#3f51b5",
    steel: "#9e9e9e",
    fairy: "#e040fb",
    normal: "#9e9e9e"
};
