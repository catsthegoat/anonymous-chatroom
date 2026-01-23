// games.js - Place this file in the same directory as index.html

// Word categories for Impostor game
const WORD_CATEGORIES = {
  animals: ['Dog', 'Cat', 'Elephant', 'Lion', 'Tiger', 'Bear', 'Monkey', 'Giraffe', 'Zebra', 'Penguin'],
  food: ['Pizza', 'Burger', 'Sushi', 'Pasta', 'Tacos', 'Salad', 'Steak', 'Sandwich', 'Ramen', 'Ice Cream'],
  places: ['Beach', 'Mountain', 'City', 'Forest', 'Desert', 'Park', 'Museum', 'School', 'Hospital', 'Airport'],
  sports: ['Soccer', 'Basketball', 'Tennis', 'Baseball', 'Football', 'Hockey', 'Golf', 'Swimming', 'Volleyball', 'Boxing'],
  movies: ['Action', 'Comedy', 'Horror', 'Romance', 'Thriller', 'Sci-Fi', 'Drama', 'Fantasy', 'Mystery', 'Adventure'],
  professions: ['Doctor', 'Teacher', 'Engineer', 'Chef', 'Pilot', 'Artist', 'Musician', 'Lawyer', 'Scientist', 'Firefighter']
};

// Drawing words
const DRAWING_WORDS = [
  'House', 'Tree', 'Car', 'Sun', 'Moon', 'Star', 'Flower', 'Cat', 'Dog', 'Fish',
  'Bird', 'Apple', 'Banana', 'Pizza', 'Guitar', 'Phone', 'Computer', 'Book', 'Clock', 'Umbrella'
];

// Trivia questions
const TRIVIA_QUESTIONS = [
  { question: 'What is the capital of France?', options: ['London', 'Berlin', 'Paris', 'Madrid'], correct: 'Paris' },
  { question: 'Which planet is known as the Red Planet?', options: ['Venus', 'Mars', 'Jupiter', 'Saturn'], correct: 'Mars' },
  { question: 'Who painted the Mona Lisa?', options: ['Van Gogh', 'Picasso', 'Da Vinci', 'Monet'], correct: 'Da Vinci' },
  { question: 'What is the largest ocean on Earth?', options: ['Atlantic', 'Indian', 'Arctic', 'Pacific'], correct: 'Pacific' },
  { question: 'How many continents are there?', options: ['5', '6', '7', '8'], correct: '7' },
  { question: 'What is the smallest country in the world?', options: ['Monaco', 'Vatican City', 'San Marino', 'Liechtenstein'], correct: 'Vatican City' },
  { question: 'Which element has the chemical symbol "O"?', options: ['Gold', 'Oxygen', 'Silver', 'Iron'], correct: 'Oxygen' },
  { question: 'What year did World War II end?', options: ['1943', '1944', '1945', '1946'], correct: '1945' }
];

// Export game data and functions
window.GameData = {
  WORD_CATEGORIES,
  DRAWING_WORDS,
  TRIVIA_QUESTIONS
};

// Game utility functions
window.GameUtils = {
  startImpostorGame: async (db, currentRoom, username, roomUsers, addDebugLog) => {
    if (roomUsers.length < 3) {
      alert('❌ Need at least 3 players to start!');
      return;
    }

    const categories = Object.keys(WORD_CATEGORIES);
    const category = categories[Math.floor(Math.random() * categories.length)];
    const words = WORD_CATEGORIES[category];
    const word = words[Math.floor(Math.random() * words.length)];
    const impostor = roomUsers[Math.floor(Math.random() * roomUsers.length)];

    const gameData = {
      type: 'impostor',
      category,
      word,
      impostor,
      players: roomUsers,
      votes: {},
      revealed: false,
      startedBy: username,
      timestamp: Date.now()
    };

    try {
      await db.ref(`games/${currentRoom}`).set(gameData);
      addDebugLog('Impostor game started', 'success');
      
      const msgId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      await db.ref(`messages/${currentRoom}/${msgId}`).set({
        id: msgId,
        type: 'system',
        text: `🎮 ${username} started an Impostor game! Check your word!`,
        timestamp: Date.now()
      });
    } catch (err) {
      addDebugLog(`Game start error: ${err.message}`, 'error');
    }
  },

  startDrawingGame: async (db, currentRoom, username, roomUsers, addDebugLog) => {
    if (roomUsers.length < 2) {
      alert('❌ Need at least 2 players to start!');
      return;
    }

    const word = DRAWING_WORDS[Math.floor(Math.random() * DRAWING_WORDS.length)];
    const drawer = roomUsers[Math.floor(Math.random() * roomUsers.length)];

    const gameData = {
      type: 'drawing',
      word,
      drawer,
      players: roomUsers,
      guesses: {},
      canvas: null,
      startedBy: username,
      timestamp: Date.now()
    };

    try {
      await db.ref(`games/${currentRoom}`).set(gameData);
      addDebugLog('Drawing game started', 'success');
      
      const msgId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      await db.ref(`messages/${currentRoom}/${msgId}`).set({
        id: msgId,
        type: 'system',
        text: `🎨 ${username} started a Drawing game! ${drawer} is drawing!`,
        timestamp: Date.now()
      });
    } catch (err) {
      addDebugLog(`Game start error: ${err.message}`, 'error');
    }
  },

  startTriviaGame: async (db, currentRoom, username, roomUsers, addDebugLog) => {
    if (roomUsers.length < 2) {
      alert('❌ Need at least 2 players to start!');
      return;
    }

    const question = TRIVIA_QUESTIONS[Math.floor(Math.random() * TRIVIA_QUESTIONS.length)];

    const gameData = {
      type: 'trivia',
      question: question.question,
      options: question.options,
      correctAnswer: question.correct,
      answers: {},
      revealed: false,
      questionStarted: Date.now(),
      startedBy: username,
      timestamp: Date.now()
    };

    try {
      await db.ref(`games/${currentRoom}`).set(gameData);
      addDebugLog('Trivia game started', 'success');
      
      const msgId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      await db.ref(`messages/${currentRoom}/${msgId}`).set({
        id: msgId,
        type: 'system',
        text: `🧠 ${username} started a Trivia Battle!`,
        timestamp: Date.now()
      });
    } catch (err) {
      addDebugLog(`Game start error: ${err.message}`, 'error');
    }
  },

  sendGameInvite: async (db, currentRoom, username, gameType, addDebugLog) => {
    const inviteData = {
      sender: username,
      gameType,
      timestamp: Date.now()
    };
    try {
      await db.ref(`gameInvites/${currentRoom}`).set(inviteData);
      addDebugLog(`Sent ${gameType} invite`, 'success');
    } catch (err) {
      addDebugLog(`Invite error: ${err.message}`, 'error');
    }
  },

  voteImpostor: async (db, currentRoom, username, votedPlayer, addDebugLog) => {
    try {
      await db.ref(`games/${currentRoom}/votes/${username}`).set(votedPlayer);
      addDebugLog(`Voted for ${votedPlayer}`, 'info');
    } catch (err) {
      addDebugLog(`Vote error: ${err.message}`, 'error');
    }
  },

  revealImpostor: async (db, currentRoom, gameState, addDebugLog) => {
    try {
      await db.ref(`games/${currentRoom}/revealed`).set(true);
      
      const votes = gameState.votes || {};
      const voteCounts = {};
      Object.values(votes).forEach(player => {
        voteCounts[player] = (voteCounts[player] || 0) + 1;
      });
      
      const mostVoted = Object.entries(voteCounts).sort((a, b) => b[1] - a[1])[0];
      const winner = mostVoted && mostVoted[0] === gameState.impostor ? 'Players' : 'Impostor';
      
      const msgId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      await db.ref(`messages/${currentRoom}/${msgId}`).set({
        id: msgId,
        type: 'system',
        text: `🎮 Game Over! The impostor was ${gameState.impostor}! ${winner} win!`,
        timestamp: Date.now()
      });

      addDebugLog('Game revealed', 'success');
    } catch (err) {
      addDebugLog(`Reveal error: ${err.message}`, 'error');
    }
  },

  submitGuess: async (db, currentRoom, username, guess, gameState, addDebugLog) => {
    if (!guess.trim() || gameState.drawer === username) return;
    try {
      await db.ref(`games/${currentRoom}/guesses/${username}`).set(guess.trim());
      
      if (guess.toLowerCase() === gameState.word.toLowerCase()) {
        const msgId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
        await db.ref(`messages/${currentRoom}/${msgId}`).set({
          id: msgId,
          type: 'system',
          text: `🎨 ${username} guessed correctly!`,
          timestamp: Date.now()
        });
      }
      
      addDebugLog('Guess submitted', 'success');
    } catch (err) {
      addDebugLog(`Guess error: ${err.message}`, 'error');
    }
  },

  updateCanvas: async (db, currentRoom, canvasDataUrl, addDebugLog) => {
    try {
      await db.ref(`games/${currentRoom}/canvas`).set(canvasDataUrl);
    } catch (err) {
      addDebugLog(`Drawing error: ${err.message}`, 'error');
    }
  },

  submitTriviaAnswer: async (db, currentRoom, username, answer, addDebugLog) => {
    try {
      await db.ref(`games/${currentRoom}/answers/${username}`).set(answer);
      addDebugLog('Answer submitted', 'success');
    } catch (err) {
      addDebugLog(`Answer error: ${err.message}`, 'error');
    }
  },

  revealTriviaAnswer: async (db, currentRoom, gameState, addDebugLog) => {
    try {
      await db.ref(`games/${currentRoom}/revealed`).set(true);
      
      const answers = gameState.answers || {};
      const correct = Object.entries(answers).filter(([_, a]) => a === gameState.correctAnswer);
      
      const msgId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      await db.ref(`messages/${currentRoom}/${msgId}`).set({
        id: msgId,
        type: 'system',
        text: `🧠 Correct answer: ${gameState.correctAnswer}. Winners: ${correct.map(([u]) => u).join(', ') || 'None'}`,
        timestamp: Date.now()
      });
      
      addDebugLog('Answer revealed', 'success');
    } catch (err) {
      addDebugLog(`Reveal error: ${err.message}`, 'error');
    }
  },

  endGame: async (db, currentRoom, addDebugLog) => {
    try {
      await db.ref(`games/${currentRoom}`).remove();
      addDebugLog('Game ended', 'info');
    } catch (err) {
      addDebugLog(`End game error: ${err.message}`, 'error');
    }
  }
};
