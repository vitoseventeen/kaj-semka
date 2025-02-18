// Класс для управления игрой
class TypingGame {
    constructor(words, wordDisplay, gameInput) {
        this.words = words;
        this.wordDisplay = wordDisplay;
        this.gameInput = gameInput;
        this.currentIndex = 0;
        this.currentWord = "";
        this.overallStartTime = null;
        this.totalChars = 0;

        this.correctSound = new Audio("correct.mp3");
        this.incorrectSound = new Audio("incorrect.mp3")
    }

    startGame() {
        this.currentIndex = 0;
        this.totalChars = 0;
        this.overallStartTime = Date.now();
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

    finishGame() {
        const overallEndTime = Date.now();
        const elapsedTime = (overallEndTime - this.overallStartTime) / 1000;
        const cpm = (this.totalChars / elapsedTime) * 60;
        alert(`Game over! Your result is: ${Math.round(cpm)} symbols per minute!`);
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

const words = [
    "apple",
    "banana",
    "cherry",
    "dragonfruit",
    "elderberry",
    "fig",
    "grape",
    "honeydew"
];

const wordDisplay = document.getElementById("word-display");
const gameInput = document.getElementById("game-input");
const gameArea = document.getElementById("game-area");
const gameHeader = document.getElementById("game-header");
const playButton = document.getElementById("play-button");

const game = new TypingGame(words, wordDisplay, gameInput);

playButton.addEventListener("click", () => {
    gameArea.hidden = false;
    gameHeader.hidden = true;
    game.startGame();
});

gameInput.addEventListener("input", () => {
    game.checkInput();
});
