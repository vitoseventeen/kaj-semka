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
        this.timeLimit = 60;
        this.timerId = null;

        this.correctSound = new Audio("correct.mp3");
        this.incorrectSound = new Audio("incorrect.mp3");
    }

    async loadWords() {
        this.words = await loadRandomWords();
    }

    startTimer() {
        this.timerDisplay.textContent = this.timeLimit;
        this.timerId = setInterval(() => {
            this.timeLimit--;
            this.timerDisplay.textContent = this.timeLimit;
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
        this.timeLimit = 60;
        this.overallStartTime = Date.now();
        await this.loadWords();
        this.startTimer();
        this.nextWord();

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
        const overallEndTime = Date.now();
        const elapsedTime = (overallEndTime - this.overallStartTime) / 1000;
        const cpm = (this.totalChars / elapsedTime) * 60;
        alert(`Game over! Your result is: ${Math.round(cpm)} symbols per minute!`);
        playButton.innerText = "Play again";
        playButton.hidden = false;
    }

    checkInput() {
        const inputValue = this.gameInput.value;

        if (this.currentWord.startsWith(inputValue)) {
            this.gameInput.style.borderColor = "green";
        } else {
            this.gameInput.style.borderColor = "red";
            this.incorrectSound.play();
        }

        if (inputValue === this.currentWord) {
            this.correctSound.play();
            this.totalChars += this.currentWord.length;
            this.currentIndex++;
            setTimeout(() => this.nextWord(), 300);
        }
    }
}

const wordDisplay = document.getElementById("word-display");
const gameInput = document.getElementById("game-input");
const timerDisplay = document.getElementById("timer");
const gameArea = document.getElementById("game-area");
const gameHeader = document.getElementById("game-header");
const playButton = document.getElementById("play-button");

const game = new TypingGame(wordDisplay, gameInput, timerDisplay);

playButton.addEventListener("click", () => {
    gameArea.hidden = false;
    gameHeader.hidden = true;
    game.startGame();
});

gameInput.addEventListener("input", () => {
    game.checkInput();
});