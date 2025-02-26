/* TODO:
    sound for background,
    different languages.
    ADD ERROR COUNT

    FIXME: when user visit other page the login window is shown or doesn't shown
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



const loginNameInput = document.getElementById("login-name");
const loginPictureInput = document.getElementById("login-picture");
const loginPictureLabel = document.getElementById("login-picture-label");
const loginButton = document.getElementById("login-button");

// TODO: set back to 60 sec
const GAME_TIME = 15;

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
    saveScore(score) {
        // Retrieve existing scoreboard or initialize an empty array
        let scoreboard = JSON.parse(localStorage.getItem("scoreboard")) || [];
        const nickname = localStorage.getItem("nickname") || "Anonymous";
        const avatar = localStorage.getItem("avatar") || "default_avatar.png";
        // Get the current date in a readable English format
        const currentDate = new Date().toLocaleString('en-GB', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });

        // Add the new record
        scoreboard.push({
            avatar: avatar,
            nickname: nickname,
            score: score,
            date: currentDate
        });
        // Sort by highest score first
        scoreboard.sort((a, b) => b.score - a.score);
        localStorage.setItem("scoreboard", JSON.stringify(scoreboard));
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
        const roundedScore = Math.round(cpm);
        this.wordDisplay.textContent = `Your result is: ${roundedScore} symbols per minute!`;
        localStorage.setItem("result", roundedScore.toString());

        // Save the score into the scoreboard
        this.saveScore(roundedScore);

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

    const scoreboard = JSON.parse(localStorage.getItem("scoreboard")) || [];
    const tableBody = document.querySelector("#scoreboard-table tbody");
    tableBody.innerHTML = "";

    if (scoreboard.length > 0) {
        scoreboard.forEach(entry => {
            const tr = document.createElement("tr");

            // Avatar
            const tdAvatar = document.createElement("td");
            const img = document.createElement("img");
            img.src = entry.avatar;
            img.alt = "Avatar";
            img.width = 50;
            img.height = 50;
            tdAvatar.appendChild(img);
            tr.appendChild(tdAvatar);

            // Nickname
            const tdNickname = document.createElement("td");
            tdNickname.textContent = entry.nickname;
            tr.appendChild(tdNickname);

            // Typing Speed (score)
            const tdScore = document.createElement("td");
            tdScore.textContent = entry.score + " spm";
            tr.appendChild(tdScore);

            // Date
            const tdDate = document.createElement("td");
            tdDate.textContent = entry.date;
            tr.appendChild(tdDate);

            tableBody.appendChild(tr);
        });
    } else {
        // Message when there are no scores yet
        const tr = document.createElement("tr");
        const td = document.createElement("td");
        td.colSpan = 4;
        td.textContent = "No scores yet!";
        tr.appendChild(td);
        tableBody.appendChild(tr);
    }
}


showScoreboardPage.addEventListener("click", () => {
    handlePageSwitch(showResult);
});

resetButton.addEventListener("click", () => {
    localStorage.removeItem("scoreboard");
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

// login page


// Drag and drop
loginPictureLabel.addEventListener("dragover", (e) => {
    e.preventDefault();
    loginPictureLabel.classList.add("dragover");
});

loginPictureLabel.addEventListener("dragleave", () => {
    loginPictureLabel.classList.remove("dragover");
});

loginPictureLabel.addEventListener("drop", (e) => {
    e.preventDefault();
    loginPictureLabel.classList.remove("dragover");
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        loginPictureInput.files = e.dataTransfer.files;
        e.dataTransfer.clearData();
    }
});

loginButton.addEventListener("click", () => {
    const nickname = loginNameInput.value.trim();
    if (nickname.length < 3 || nickname.length > 20) {
        alert("Please enter a nickname between 3 and 20 characters.");
        return;
    }
    let file = loginPictureInput.files[0];
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
        };
        reader.readAsDataURL(file);
    } else {
        // Use a default avatar if none is provided
        localStorage.setItem("nickname", nickname);
        localStorage.setItem("avatar", "default_avatar.png");
        document.getElementById("login-page").hidden = true;
        document.getElementById("play-page").hidden = false;
    }
});

