const wordDisplay = document.getElementById("word-display");
const gameInput = document.getElementById("game-input");
const gameInputLabel = document.getElementById("game-input-label");
const timerDisplay = document.getElementById("timer");
const gameArea = document.getElementById("game-area");
const gameHeader = document.getElementById("game-header");
const playButton = document.getElementById("play-button");
const GAME_TIME = 60; // 60 seconds for default game

async function loadRandomWords() {
    try {
        const response = await fetch('https://random-word-api.vercel.app/api?words=120');
        return await response.json();
    } catch (error) {
        console.error('Error fetching words:', error);
        try {
            const localResponse = await fetch('words.json')
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

        this.correctSound = new Audio("sounds/correct.mp3");
        this.incorrectSound = new Audio("sounds/incorrect.mp3");
        this.clockSound = new Audio("sounds/clock.mp3");
        this.ringSound = new Audio("sounds/ring.mp3");
    }


    async loadWords() {
        this.words = await loadRandomWords();
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
            this.wordDisplay.textContent = this.currentWord;
            this.gameInput.value = "";
            this.gameInput.style.borderColor = "#ccc";
            this.gameInput.focus();
        } else {
            this.finishGame();
        }
    }

    // TODO: add user to scoreboard
    finishGame() {
        if (this.timerId) clearInterval(this.timerId);

        this.clockSound.pause();
        this.ringSound.play();
        this.timerDisplay.classList.remove("low-time");

        const overallEndTime = Date.now();
        const elapsedTime = (overallEndTime - this.overallStartTime) / 1000;
        const cpm = (this.totalChars / elapsedTime) * GAME_TIME;
        this.wordDisplay.textContent = `Your result is: ${Math.round(cpm)} symbols per minute!`;

        playButton.innerText = "Play again";
        playButton.hidden = false;
        gameInput.hidden = true;
        gameInputLabel.hidden = true;
    }

    checkInput() {
        const inputValue = this.gameInput.value;

        if (this.currentWord.startsWith(inputValue)) {
            this.gameInput.style.borderColor = "green";
            this.gameInput.classList.remove("shake");
        } else {
            this.gameInput.style.borderColor = "red";
            this.incorrectSound.play();

            this.gameInput.classList.add("shake");
            setTimeout(() => {
                this.gameInput.classList.remove("shake");
            }, 500);
        }

        if (inputValue === this.currentWord) {
            this.correctSound.play();
            this.totalChars += this.currentWord.length;
            this.currentIndex++;
            setTimeout(() => this.nextWord(), 300);
        }
    }
}

const game = new TypingGame(wordDisplay, gameInput, timerDisplay);

playButton.addEventListener("click", () => {
    gameArea.hidden = false;
    gameHeader.hidden = true;
    game.startGame();
});

gameInput.addEventListener("input", () => {
    game.checkInput();
});