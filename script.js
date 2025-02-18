const startButton = document.getElementById('play-button');
const gameArea = document.getElementById('game-area');
let gameHeader = document.getElementById('game-header')

startButton.addEventListener("click",() => {
        gameArea.hidden = false;
        gameHeader.hidden = true;

    }
)