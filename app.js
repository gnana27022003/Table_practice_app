/*
Project Structure:
- public/
  - css/
    - styles.css
  - js/
    - script.js
- views/
  - index.ejs
  - quiz.ejs
  - result.ejs
- app.js
*/

// ================= app.js =================
const express = require('express');
const a = require('os');
const path = require('path');
const app = express();
const PORT = 3004;

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');

let questions = [];
let answers = [];
let currentIndex = 0;
let totalQuestions = 15;

app.get('/', (req, res) => {
  res.render('index');
});

app.post('/start', (req, res) => {
    const { tables, timer, total } = req.body;
    const selectedTables = tables.split(',').map(Number);
    const totalQuestions = parseInt(total);
    const timeLimit = parseInt(timer);
  
    questions = [];
    answers = [];
    currentIndex = 0;
  
    // Define multipliers to use: always 2 to 9 (exclude 1 and 10)
    const baseMultipliers = [8];
    // More frequent multipliers: 4 to 9
    const frequentMultipliers = [8];
  
    // Step 1: Ensure each selected table covers all multipliers at least once (2 to 9)
    selectedTables.forEach(table => {
      baseMultipliers.forEach(multiplier => {
        questions.push({ table, multiplier, timeLimit });
      });
    });
  
    // Step 2: If we haven't reached totalQuestions, add more with frequent multipliers randomly
    while (questions.length < totalQuestions) {
      const table = selectedTables[Math.floor(Math.random() * selectedTables.length)];
      const multiplier = frequentMultipliers[Math.floor(Math.random() * frequentMultipliers.length)];
      questions.push({ table, multiplier, timeLimit });
    }
  
    // Step 3: Shuffle the questions so order is random but we avoid consecutive repeats
    // Simple shuffle function (Fisher-Yates)
    function shuffle(array) {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
    }
  
    shuffle(questions);
  
    // Step 4: Ensure no two consecutive questions are exactly the same (same table and multiplier)
    for (let i = 1; i < questions.length; i++) {
      if (questions[i].table === questions[i-1].table && questions[i].multiplier === questions[i-1].multiplier) {
        // Find next question to swap with that is different
        let swapIndex = i + 1;
        while (
          swapIndex < questions.length &&
          questions[swapIndex].table === questions[i].table &&
          questions[swapIndex].multiplier === questions[i].multiplier
        ) {
          swapIndex++;
        }
        if (swapIndex < questions.length) {
          [questions[i], questions[swapIndex]] = [questions[swapIndex], questions[i]];
        }
      }
    }
  
    res.redirect('/quiz');
  });
  

app.get('/quiz', (req, res) => {
  if (currentIndex >= questions.length) return res.redirect('/result');
  res.render('quiz', { q: questions[currentIndex], index: currentIndex + 1 });
});

app.post('/quiz', (req, res) => {
  const userAnswer = parseInt(req.body.answer);
  const { table, multiplier } = questions[currentIndex];
  const correctAnswer = table * multiplier;
  answers.push({ ...questions[currentIndex], userAnswer, correctAnswer });
  currentIndex++;
  res.redirect('/quiz');
});

app.get('/result', (req, res) => {
  res.render('result', { answers });
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
