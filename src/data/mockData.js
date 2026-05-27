// src/data/mockData.js

export const initialQuestions = [
  {
    id: 1,
    subject: "HTML",
    level: "Beginner",
    question: "What does HTML stand for?",
    options: [
      "Hyper Text Markup Language",
      "High Text Markup Language",
      "Hyper Tabular Markup Language",
      "Hyperlink and Text Markup Language"
    ],
    correctAnswer: "Hyper Text Markup Language"
  },
  {
    id: 2,
    subject: "HTML",
    level: "Beginner",
    question: "Which HTML element is used for the largest heading?",
    options: ["<heading>", "<h6>", "<h1>", "<head>"],
    correctAnswer: "<h1>"
  },
  {
    id: 3,
    subject: "CSS",
    level: "Beginner",
    question: "What does CSS stand for?",
    options: [
      "Creative Style Sheets",
      "Cascading Style Sheets",
      "Computer Style Sheets",
      "Colorful Style Sheets"
    ],
    correctAnswer: "Cascading Style Sheets"
  },
  {
    id: 4,
    subject: "JavaScript",
    level: "Mid",
    question: "Which keyword is used to declare a block-scoped variable in JS?",
    options: ["var", "let", "constant", "local"],
    correctAnswer: "let"
  }
];

export const initialUsers = [
  {
    empId: "EMP101",
    name: "Ankit Saklani",
    dept: "Production",
    role: "user",
    performance: {
      overall: 75,
      Beginner: 90,
      Mid: 60,
      Advanced: 40
    },
    attempts: [
      { testId: "T1", subject: "HTML", level: "Beginner", score: 100, total: 100, date: "2026-05-25" }
    ]
  },
  {
    empId: "ADMIN01",
    name: "Admin Sir",
    dept: "HR",
    role: "admin"
  }
];

export const initialTests = [
  {
    id: "T1",
    title: "HTML Basics Assessment",
    subject: "HTML",
    level: "Beginner",
    duration: 30, // minutes
    questionIds: [1, 2]
  }
];