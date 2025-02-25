const wordDisplay = document.getElementById("word-display");
const gameInput = document.getElementById("game-input");
const gameInputLabel = document.getElementById("game-input-label");
const timerDisplay = document.getElementById("timer");
const gameArea = document.getElementById("game-area");
const gameHeader = document.getElementById("game-header");
const playButton = document.getElementById("play-button");
const GAME_TIME = 60;
const playPage = document.getElementById("play-page");
const scoreboardPage = document.getElementById("scoreboard-page");
const showScoreboardPage = document.getElementById("a-scoreboard");
const showPlayPage = document.getElementById("a-play");

/// scoreboard



async function loadRandomWords() {
    try {
        const response = await fetch('https://random-word-api.vercel.app/api?words=120');
        return await response.json();
    } catch (error) {
        console.error('Error fetching words:', error);
        try {
            const localResponse = await fetch('words.json');
            return await localResponse.json();
        } catch (localError) {
            console.error('Error fetching local words:', localError);
            return ['error', 'error', 'error'];
        }
    }
}

class TypingGame {
    constructor(wordDisplay, gameInput, timerDisplay) {
        this.words = [];
        this.wordDisplay = wordDisplay;
        this.gameInput = gameInput;
        this.timerDisplay = timerDisplay;
        this.currentIndex = 0;
        this.currentWord = "";
        this.overallStartTime = null;
        this.totalChars = 0;
        this.timeLimit = GAME_TIME;
        this.timerId = null;
        this.isErrorPlaying = false;

        this.correctSound = new Audio("sounds/correct.mp3");
        this.incorrectSound = new Audio("sounds/incorrect.mp3");
        this.clockSound = new Audio("sounds/clock.mp3");
        this.ringSound = new Audio("sounds/ring.mp3");
    }

    async loadWords() {
        this.words = await loadRandomWords();
    }

    renderWords() {
        let html = "";
        const currentWord = this.words[this.currentIndex] || "";
        let renderedCurrent = "";
        for (let i = 0; i < currentWord.length; i++) {
            const letter = currentWord[i];
            const typedLetter = this.gameInput.value[i] || "";
            if (typedLetter === letter) {
                renderedCurrent += `<span class="correct-letter">${letter}</span>`;
            } else {
                renderedCurrent += `<span>${letter}</span>`;
            }
        }
        html += `<span class="current-word">${renderedCurrent}</span>`;

        for (let j = 1; j < 3; j++) {
            const nextWord = this.words[this.currentIndex + j];
            if (nextWord) {
                html += ` <span class="future-word">${nextWord}</span>`;
            }
        }
        this.wordDisplay.innerHTML = html;
    }

    startTimer() {
        this.timerDisplay.textContent = this.timeLimit;
        this.timerId = setInterval(() => {
            this.timeLimit--;
            this.timerDisplay.textContent = this.timeLimit;

            if (this.timeLimit <= 10) {
                this.clockSound.play();
                this.timerDisplay.classList.add("low-time");
            } else {
                this.timerDisplay.classList.remove("low-time");
            }

            if (this.timeLimit <= 0) {
                clearInterval(this.timerId);
                this.finishGame();
            }
        }, 1000);
    }

    async startGame() {
        playButton.hidden = true;
        this.currentIndex = 0;
        this.totalChars = 0;
        this.timeLimit = GAME_TIME;
        this.overallStartTime = Date.now();
        await this.loadWords();
        this.startTimer();
        this.nextWord();
        if (gameInput.hidden || gameInputLabel.hidden) {
            gameInput.hidden = false;
            gameInputLabel.hidden = false;
        }
    }

    nextWord() {
        if (this.currentIndex < this.words.length) {
            this.currentWord = this.words[this.currentIndex];
            this.gameInput.value = "";
            this.gameInput.style.borderColor = "#ccc";
            this.gameInput.focus();
            this.renderWords();
        } else {
            this.finishGame();
        }
    }

    finishGame() {
        if (this.timerId) clearInterval(this.timerId);
        this.clockSound.pause();
        this.ringSound.play();
        this.timerDisplay.classList.remove("low-time");

        const overallEndTime = Date.now();
        const elapsedTime = (overallEndTime - this.overallStartTime) / 1000;
        const cpm = (this.totalChars / elapsedTime) * GAME_TIME;
        this.wordDisplay.textContent = `Your result is: ${Math.round(cpm)} symbols per minute!`;

        localStorage.setItem("result",cpm.toString());

        playButton.innerText = "Play again";
        playButton.hidden = false;
        gameInput.hidden = true;
        gameInputLabel.hidden = true;
    }

    checkInput() {
        const inputValue = this.gameInput.value;
        const currentWord = this.words[this.currentIndex] || "";

        if (currentWord.startsWith(inputValue)) {
            this.gameInput.style.borderColor = "green";
            this.gameInput.classList.remove("shake");
        } else {
            this.gameInput.style.borderColor = "red";
            if (!this.isErrorPlaying) {
                this.incorrectSound.play();
                this.isErrorPlaying = true;
                setTimeout(() => { this.isErrorPlaying = false; }, 300);
            }
            this.gameInput.classList.add("shake");
            setTimeout(() => {
                this.gameInput.classList.remove("shake");
            }, 300);
        }

        this.renderWords();

        if (inputValue === currentWord) {
            this.correctSound.play();
            this.wordDisplay.classList.add("fade-out");
            this.totalChars += currentWord.length;
            this.currentIndex++;
            setTimeout(() => {
                this.wordDisplay.classList.remove("fade-out");
                this.nextWord();
            }, 300);
        }
    }
}

let game = new TypingGame(wordDisplay, gameInput, timerDisplay);

playButton.addEventListener("click", () => {
    gameArea.hidden = false;
    gameHeader.hidden = true;
    game.startGame();
});

gameInput.addEventListener("input", () => {
    game.checkInput();
});

showScoreboardPage.addEventListener("click", () => {
    playPage.hidden = true;
    scoreboardPage.hidden = false;
    // stop game
    game.finishGame();
});

showPlayPage.addEventListener("click", () => {
    playPage.hidden = false;
    scoreboardPage.hidden = true;
});