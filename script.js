'use strict';

// Selecting DOM elements
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
const showAboutPage = document.getElementById('a-about');
const resetButton = document.getElementById("reset-button");
const loginNameInput = document.getElementById("login-name");
const loginPictureInput = document.getElementById("login-picture");
const loginButton = document.getElementById("login-button");
const exitButton = document.getElementById("exit-button");
const aboutPage = document.getElementById('about-page');

const GAME_TIME = 60; // Total game time in seconds

// Function to fetch random words from API or fallback to a local file
async function loadRandomWords() {
    try {
        const response = await fetch("https://random-word-api.vercel.app/api?words=333");
        return await response.json();
    } catch (error) {
        console.error("Error fetching words from API:", error);
        try {
            const localResponse = await fetch("words.json");
            return await localResponse.json();
        } catch (localError) {
            console.error("Error fetching local words:", localError);
            return ["error", "error", "error"];
        }
    }
}

// TypingGame class encapsulates all game logic
class TypingGame {
    constructor(wordDisplay, gameInput, timerDisplay) {
        this.wordDisplay = wordDisplay;
        this.gameInput = gameInput;
        this.timerDisplay = timerDisplay;
        this.words = [];
        this.currentIndex = 0;
        this.totalChars = 0;
        this.timeLimit = GAME_TIME;
        this.timerId = null;
        this.overallStartTime = null;
        this.pausedTimeLeft = null;
        this.isRunning = false;
        this.isPaused = false;
        this.isErrorPlaying = false;

        // Sound effects
        this.correctSound = new Audio("sounds/correct.mp3");
        this.incorrectSound = new Audio("sounds/incorrect.mp3");
        this.clockSound = new Audio("sounds/clock.mp3");
        this.ringSound = new Audio("sounds/ring.mp3");
    }

    // Load words from API or fallback file
    async loadWords() {
        this.words = await loadRandomWords();
    }

    // Render the current word and the next two words with visual highlighting
    renderWords() {
        const currentWord = this.words[this.currentIndex] || "";
        let renderedCurrent = "";

        // Loop through current word letters and apply highlighting for correct letters
        for (let i = 0; i < currentWord.length; i++) {
            const letter = currentWord[i];
            const typedLetter = this.gameInput.value[i] || "";
            renderedCurrent += (typedLetter === letter)
                ? `<span class="correct-letter">${letter}</span>`
                : `<span>${letter}</span>`;
        }

        // Combine current word and next two future words
        let html = `<span class="current-word">${renderedCurrent}</span>`;
        for (let j = 1; j < 3; j++) {
            const nextWord = this.words[this.currentIndex + j];
            if (nextWord) {
                html += ` <span class="future-word">${nextWord}</span>`;
            }
        }
        this.wordDisplay.innerHTML = html;
    }

    // Start the countdown timer and update the display each second
    startTimer() {
        this.timerDisplay.textContent = this.timeLimit;
        this.timerId = setInterval(() => {
            this.timeLimit--;
            this.timerDisplay.textContent = this.timeLimit;

            // Play clock sound and add visual effect when time is low
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

    // Start a new game session
    async startGame() {
        this.isRunning = true;
        this.isPaused = false;
        exitButton.hidden = true;
        playButton.hidden = true;
        this.currentIndex = 0;
        this.totalChars = 0;
        this.timeLimit = GAME_TIME;
        this.overallStartTime = Date.now();

        await this.loadWords();
        this.startTimer();
        this.nextWord();

        // Unhide input elements if they were hidden
        if (this.gameInput.hidden || gameInputLabel.hidden) {
            this.gameInput.hidden = false;
            gameInputLabel.hidden = false;
        }
    }

    // Proceed to the next word or finish the game if finished
    nextWord() {
        if (!this.isRunning) return;

        if (this.currentIndex < this.words.length) {
            this.gameInput.value = "";
            this.gameInput.style.borderColor = "#ccc";
            this.gameInput.focus();
            this.renderWords();
        } else {
            this.finishGame();
        }
    }

    // Save the user's score in localStorage
    saveScore(score) {
        const scoreboard = JSON.parse(localStorage.getItem("scoreboard")) || [];
        const nickname = localStorage.getItem("nickname") || "Anonymous";
        const avatar = localStorage.getItem("avatar") || "img/default_avatar.png";

        // Get formatted current date and time
        const currentDate = new Date().toLocaleString("en-GB", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false
        });

        scoreboard.push({ avatar, nickname, score, date: currentDate });
        scoreboard.sort((a, b) => b.score - a.score);
        localStorage.setItem("scoreboard", JSON.stringify(scoreboard));
    }

    // Finish the game, calculate the score, and update the UI
    finishGame() {
        if (this.timerId) clearInterval(this.timerId);
        this.clockSound.pause();
        this.ringSound.play();
        this.timerDisplay.classList.remove("low-time");

        this.isRunning = false;
        this.isPaused = false;

        const elapsedTime = (Date.now() - this.overallStartTime) / 1000;
        const cpm = (this.totalChars / elapsedTime) * GAME_TIME;
        const roundedScore = Math.round(cpm);

        this.wordDisplay.textContent = `Your result is: ${roundedScore} symbols per minute!`;
        localStorage.setItem("result", roundedScore.toString());
        this.saveScore(roundedScore);

        playButton.innerText = "Play again";
        playButton.hidden = false;
        this.gameInput.hidden = true;
        gameInputLabel.hidden = true;
        exitButton.hidden = false;
    }

    // Pause the game and timer
    pauseGame() {
        if (this.timerId) {
            clearInterval(this.timerId);
            this.pausedTimeLeft = this.timeLimit;
            this.timerId = null;
            this.isPaused = true;
            this.clockSound.pause();
        }
    }

    // Resume the game from paused state
    resumeGame() {
        if (this.isPaused) {
            this.timeLimit = this.pausedTimeLeft;
            this.startTimer();
            this.isPaused = false;
        }
    }

    // Check user input against the current word
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

        // If the word is completely typed correctly, move to next word
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

    // Check if the game is currently active (running and not paused)
    isActive() {
        return this.isRunning && !this.isPaused;
    }
}

// Create a new game instance
const game = new TypingGame(wordDisplay, gameInput, timerDisplay);

// Event listeners for game actions
playButton.addEventListener("click", () => {
    gameArea.hidden = false;
    gameHeader.hidden = true;
    game.startGame();
});

gameInput.addEventListener("input", () => game.checkInput());

// Handle page switch with confirmation if game is active
function handlePageSwitch(callback) {
    if (game.isActive()) {
        const confirmSwitch = confirm("Are you sure you want to leave the game?");
        if (!confirmSwitch) return;
        game.pauseGame();
    }
    callback();
}

// Display the scoreboard results
function showResult() {
    document.getElementById("login-page").hidden = true;
    playPage.hidden = true;
    scoreboardPage.hidden = false;
    aboutPage.hidden = true;

    const scoreboard = JSON.parse(localStorage.getItem("scoreboard")) || [];
    const tableBody = document.querySelector("#scoreboard-table tbody");
    tableBody.innerHTML = "";

    if (scoreboard.length > 0) {
        scoreboard.forEach(entry => {
            const tr = document.createElement("tr");

            // Avatar cell
            const tdAvatar = document.createElement("td");
            const img = document.createElement("img");
            img.src = entry.avatar;
            img.alt = "Avatar";
            img.width = 50;
            img.height = 50;
            tdAvatar.appendChild(img);
            tr.appendChild(tdAvatar);

            // Nickname cell
            const tdNickname = document.createElement("td");
            tdNickname.textContent = entry.nickname;
            tr.appendChild(tdNickname);

            // Score cell
            const tdScore = document.createElement("td");
            tdScore.textContent = `${entry.score} spm`;
            tr.appendChild(tdScore);

            // Date cell
            const tdDate = document.createElement("td");
            tdDate.textContent = entry.date;
            tr.appendChild(tdDate);

            tableBody.appendChild(tr);
        });
    } else {
        const tr = document.createElement("tr");
        const td = document.createElement("td");
        td.colSpan = 4;
        td.textContent = "No scores yet!";
        tr.appendChild(td);
        tableBody.appendChild(tr);
    }
}

// Check if the user is logged in before navigating
function requireLogin(callback) {
    if (!localStorage.getItem("nickname")) {
        alert("Please log in to continue!");
        document.getElementById("login-page").hidden = false;
        document.getElementById("play-page").hidden = true;
        document.getElementById("scoreboard-page").hidden = true;
        return;
    }
    callback();
}

// Navigation event listeners
showScoreboardPage.addEventListener("click", () => {
    requireLogin(() => {
        handlePageSwitch(() => {
            document.getElementById("login-page").hidden = true;
            showResult();
        });
    });
});

showPlayPage.addEventListener("click", () => {
    requireLogin(() => {
        handlePageSwitch(() => {
            document.getElementById("login-page").hidden = true;
            playPage.hidden = false;
            aboutPage.hidden = true;
            scoreboardPage.hidden = true;


            // If the game is paused, ask the user to resume or restart
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
});

// About page

showAboutPage.addEventListener('click', () => {
    handlePageSwitch(() => {
        document.getElementById("login-page").hidden = true;
        playPage.hidden = true;
        scoreboardPage.hidden = true;
        aboutPage.hidden = false;

    });
});

// Reset scoreboard data
resetButton.addEventListener("click", () => {
    localStorage.removeItem("scoreboard");
    showResult();
});

// Warn user before leaving the page if the game is active
window.addEventListener("beforeunload", (e) => {
    if (game.isActive()) {
        e.preventDefault();
        e.returnValue = "";
    }
});

// Initialize page state on DOMContentLoaded
document.addEventListener("DOMContentLoaded", () => {
    if (localStorage.getItem("nickname")) {
        document.getElementById("login-page").hidden = true;
        document.getElementById("play-page").hidden = false;
        document.getElementById("scoreboard-page").hidden = true;
        exitButton.hidden = false;
    } else {
        document.getElementById("login-page").hidden = false;
        document.getElementById("play-page").hidden = true;
        document.getElementById("scoreboard-page").hidden = true;
        exitButton.hidden = true;
    }
});

// Login logic with avatar image handling
loginButton.addEventListener("click", () => {
    const nickname = loginNameInput.value.trim();
    if (nickname.length < 3 || nickname.length > 20) {
        alert("Please enter a nickname between 3 and 20 characters.");
        return;
    }

    const file = loginPictureInput.files[0];
    if (file) {
        if (!file.type.startsWith("image/")) {
            loginPictureInput.value = "";
            alert("Please upload an image file.");
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            localStorage.setItem("nickname", nickname);
            localStorage.setItem("avatar", e.target.result);
            document.getElementById("login-page").hidden = true;
            document.getElementById("play-page").hidden = false;
            exitButton.hidden = false;
        };
        reader.readAsDataURL(file);
    } else {
        localStorage.setItem("nickname", nickname);
        localStorage.setItem("avatar", "img/default_avatar.png");
        document.getElementById("login-page").hidden = true;
        document.getElementById("play-page").hidden = false;
        exitButton.hidden = false;
    }
});

// Logout logic
exitButton.addEventListener("click", () => {
    localStorage.removeItem("nickname");
    localStorage.removeItem("avatar");
    document.getElementById("login-page").hidden = false;
    document.getElementById("play-page").hidden = true;
    document.getElementById("scoreboard-page").hidden = true;
    exitButton.hidden = true;
    location.reload();
});
