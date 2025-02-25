/* TODO: add nickname,
    date and time to the scoreboard,
    sound for background,
    different languages.
    ADD ERROR COUNT
*/

const wordDisplay = document.getElementById("word-display");
const gameInput = document.getElementById("game-input");
const gameInputLabel = document.getElementById("game-input-label");
const timerDisplay = document.getElementById("timer");
const gameArea = document.getElementById("game-area");
const gameHeader = document.getElementById("game-header");
const playButton = document.getElementById("play-button");
const playPage = document.getElementById("play-page");
const scoreboardPage = document.getElementById("scoreboard-page");
const showScoreboardPage = document.getElementById("a-scoreboard");
const showPlayPage = document.getElementById("a-play");
const resetButton = document.getElementById("reset-button");
const GAME_TIME = 60;

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
        this.wordDisplay = wordDisplay;
        this.gameInput = gameInput;
        this.timerDisplay = timerDisplay;
        this.words = [];
        this.currentIndex = 0;
        this.currentWord = "";
        this.totalChars = 0;
        this.timeLimit = GAME_TIME;
        this.timerId = null;
        this.overallStartTime = null;
        this.pausedTimeLeft = null;
        this.isRunning = false;
        this.isPaused = false;
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
            renderedCurrent += (typedLetter === letter)
                ? `<span class="correct-letter">${letter}</span>`
                : `<span>${letter}</span>`;
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
        this.isRunning = true;
        this.isPaused = false;
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
        if (!this.isRunning) return;
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
        this.isRunning = false;
        this.isPaused = false;
        const overallEndTime = Date.now();
        const elapsedTime = (overallEndTime - this.overallStartTime) / 1000;
        const cpm = (this.totalChars / elapsedTime) * GAME_TIME;
        this.wordDisplay.textContent = `Your result is: ${Math.round(cpm)} symbols per minute!`;
        localStorage.setItem("result", cpm.toString());
        playButton.innerText = "Play again";
        playButton.hidden = false;
        gameInput.hidden = true;
        gameInputLabel.hidden = true;
    }

    pauseGame() {
        if (this.timerId) {
            clearInterval(this.timerId);
            this.pausedTimeLeft = this.timeLimit;
            this.timerId = null;
            this.isPaused = true;
            this.clockSound.pause();
        }
    }

    resumeGame() {
        if (this.isPaused) {
            this.timeLimit = this.pausedTimeLeft;
            this.startTimer();
            this.isPaused = false;
        }
    }

    isActive() {
        return this.isRunning && !this.isPaused;
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
            }, 50);
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

function handlePageSwitch(callback) {
    if (game.isActive()) {
        const confirmSwitch = confirm("Are you sure you want to leave the game?");
        if (!confirmSwitch) return;
        game.pauseGame();
    }
    callback();
}

function showResult() {
    playPage.hidden = true;
    scoreboardPage.hidden = false;
    let result = Number(Math.round(localStorage.getItem("result"))) || 0;
    let resultArea = document.getElementById("result-area");
    if (result > 0) {
        resultArea.style.color = "#4ffa62";
        resultArea.textContent = `Your last result is: ${result} symbols per minute!`;
        resetButton.hidden = false;
    } else {
        resetButton.hidden = true;
        resultArea.style.color = "red";
        resultArea.textContent = "You haven't played yet!";
    }
}

showScoreboardPage.addEventListener("click", () => {
    handlePageSwitch(showResult);
});

resetButton.addEventListener("click", () => {
    localStorage.setItem("result", "0");
    showResult();
});

showPlayPage.addEventListener("click", () => {
    handlePageSwitch(() => {
        playPage.hidden = false;
        scoreboardPage.hidden = true;
        if (game.isPaused) {
            const resume = confirm("Do you want to resume the game? \nPress OK to resume or Cancel to start a new game.");
            if (resume) {
                game.resumeGame();
            } else {
                game.startGame();
            }
        }
    });
});

window.addEventListener('beforeunload', (e) => {
    if (game.isActive()) {
        e.preventDefault();
        e.returnValue = '';
    }
});
