// Keep your existing Question Bank configuration at the top...
// [NOTE: Paste your exact 90 questions here just like before]

const firebaseConfig = {
    apiKey: "AIzaSyB2XbI5lvr_QS_Fy6U22PXnCmlk1BvS330",
    authDomain: "coding-test-cc943.firebaseapp.com",
    databaseURL: "https://coding-test-cc943-default-rtdb.firebaseio.com",
    projectId: "coding-test-cc943",
    storageBucket: "coding-test-cc943.firebasestorage.app",
    messagingSenderId: "636572625071",
    appId: "1:636572625071:web:f018dd091ab7d34cd18c5a",
    measurementId: "G-SC3TPGYZKP"
};

firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// State Drivers
let targetQuestions = []; 
let currentQuestionIndex = 0;
let userAnswers = [];
let timerInterval = null;
let totalTimeInSeconds = 30 * 60; 
let candidateData = {};
let cachedAdminData = {}; 

// DOM Object Map
const d = {
    loginBox: document.getElementById('login-container'),
    adminLoginBox: document.getElementById('admin-login-container'),
    examBox: document.getElementById('exam-container'),
    resultBox: document.getElementById('result-container'),
    adminDashBox: document.getElementById('admin-dashboard-container'),
    loginForm: document.getElementById('login-form'),
    adminLoginForm: document.getElementById('admin-login-form'),
    qCategory: document.getElementById('question-category'),
    qText: document.getElementById('question-text'),
    optionsWrap: document.getElementById('options-container'),
    prevBtn: document.getElementById('prev-btn'),
    nextBtn: document.getElementById('next-btn'),
    clearBtn: document.getElementById('clear-btn'),
    submitBtn: document.getElementById('final-submit-btn'),
    paletteGrid: document.getElementById('palette-grid'),
    timerText: document.getElementById('timer'),
    dispUser: document.getElementById('display-user'),
    dispCode: document.getElementById('display-empcode'),
    dispDept: document.getElementById('display-dept'),
    resName: document.getElementById('res-name'),
    resCode: document.getElementById('res-code'),
    resDept: document.getElementById('res-dept'),
    resScore: document.getElementById('res-score'),
    resPercent: document.getElementById('res-percent'),
    resTbody: document.getElementById('result-tbody'),
    adminTbody: document.getElementById('admin-tbody'),
    switchAdminBtn: document.getElementById('admin-switch-btn'),
    backLoginBtn: document.getElementById('back-to-login'),
    logoutAdminBtn: document.getElementById('admin-logout-btn'),
    resetDbBtn: document.getElementById('admin-reset-db-btn'),
    adminModal: document.getElementById('admin-modal'),
    closeModalBtn: document.getElementById('close-modal-btn'),
    modalMeta: document.getElementById('modal-meta-info'),
    modalTbody: document.getElementById('modal-tbody')
};

// ==========================================
// TEST ENGINE RUNTIME CORE
// ==========================================
d.loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const selectedLevel = document.getElementById('test-level').value;

    candidateData = {
        name: document.getElementById('username').value.trim(),
        empcode: document.getElementById('empcode').value.trim().toUpperCase(),
        department: document.getElementById('department').value,
        testLevel: selectedLevel
    };

    if (selectedLevel === "All") {
        targetQuestions = [...questionBank];
    } else {
        targetQuestions = questionBank.filter(q => q.category === selectedLevel);
    }

    userAnswers = new Array(targetQuestions.length).fill(null);

    d.dispUser.textContent = candidateData.name;
    d.dispCode.textContent = candidateData.empcode;
    d.dispDept.textContent = `${candidateData.department} (${selectedLevel})`;

    d.loginBox.classList.add('hidden');
    d.examBox.classList.remove('hidden');

    initMatrixPalette();
    renderActiveQuestion();
    startExamCountdown();
});

function initMatrixPalette() {
    d.paletteGrid.innerHTML = '';
    targetQuestions.forEach((q, idx) => {
        const item = document.createElement('div');
        item.className = 'palette-no pending';
        item.textContent = idx + 1;
        item.id = `palette-node-${idx}`;
        item.addEventListener('click', () => {
            currentQuestionIndex = idx;
            renderActiveQuestion();
        });
        d.paletteGrid.appendChild(item);
    });
}

function renderActiveQuestion() {
    if(targetQuestions.length === 0) return;
    
    const q = targetQuestions[currentQuestionIndex];
    d.qCategory.textContent = q.category;
    d.qText.textContent = `${currentQuestionIndex + 1}. ${q.question}`;
    d.optionsWrap.innerHTML = '';

    q.options.forEach((opt, optIdx) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        if (userAnswers[currentQuestionIndex] === optIdx) {
            btn.classList.add('selected');
        }
        btn.textContent = opt; 
        btn.addEventListener('click', () => {
            userAnswers[currentQuestionIndex] = optIdx;
            renderActiveQuestion();
            updatePaletteStatus();
        });
        d.optionsWrap.appendChild(btn);
    });

    d.prevBtn.disabled = (currentQuestionIndex === 0);
    d.nextBtn.textContent = (currentQuestionIndex === targetQuestions.length - 1) ? "Finish 🏁" : "Next ➡️";
    
    document.querySelectorAll('.palette-no').forEach(n => n.classList.remove('current'));
    const currNode = document.getElementById(`palette-node-${currentQuestionIndex}`);
    if(currNode) currNode.classList.add('current');
}

function updatePaletteStatus() {
    userAnswers.forEach((ans, idx) => {
        const node = document.getElementById(`palette-node-${idx}`);
        if(node) {
            if(ans !== null) {
                node.classList.remove('pending');
                node.classList.add('attempted');
            } else {
                node.classList.remove('attempted');
                node.classList.add('pending');
            }
        }
    });
}

d.prevBtn.addEventListener('click', () => {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        renderActiveQuestion();
    }
});

d.nextBtn.addEventListener('click', () => {
    if (currentQuestionIndex < targetQuestions.length - 1) {
        currentQuestionIndex++;
        renderActiveQuestion();
    } else {
        processFinalSubmission();
    }
});

d.clearBtn.addEventListener('click', () => {
    userAnswers[currentQuestionIndex] = null;
    renderActiveQuestion();
    updatePaletteStatus();
});

d.submitBtn.addEventListener('click', () => {
    if(confirm("Are you absolutely sure you want to end this python assessment test?")) {
        processFinalSubmission();
    }
});

function startExamCountdown() {
    timerInterval = setInterval(() => {
        if (totalTimeInSeconds <= 0) {
            clearInterval(timerInterval);
            processFinalSubmission();
        } else {
            totalTimeInSeconds--;
            let mins = Math.floor(totalTimeInSeconds / 60);
            let secs = totalTimeInSeconds % 60;
            d.timerText.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
    }, 1000);
}

function processFinalSubmission() {
    clearInterval(timerInterval);
    let correctCount = 0;

    targetQuestions.forEach((q, idx) => {
        if(userAnswers[idx] === q.answer) {
            correctCount++;
        }
    });

    let finalPercentage = ((correctCount / targetQuestions.length) * 100).toFixed(2);
    let timeStampStr = new Date().toLocaleString();

    const payload = {
        meta: candidateData,
        score: `${correctCount} / ${targetQuestions.length}`,
        percentage: `${finalPercentage}%`,
        timestamp: timeStampStr,
        responses: userAnswers
    };

    database.ref('python_test_submissions/' + candidateData.empcode).set(payload);

    d.examBox.classList.add('hidden');
    d.resultBox.classList.remove('hidden');

    d.resName.textContent = candidateData.name;
    d.resCode.textContent = candidateData.empcode;
    d.resDept.textContent = `${candidateData.department} [${candidateData.testLevel}]`;
    d.resScore.textContent = `${correctCount} / ${targetQuestions.length}`;
    d.resPercent.textContent = finalPercentage;

    generateAuditTable();
}

function generateAuditTable() {
    d.resTbody.innerHTML = '';
    targetQuestions.forEach((q, idx) => {
        const tr = document.createElement('tr');
        let userSelection = userAnswers[idx] !== null ? q.options[userAnswers[idx]] : "Not Answered";
        let actualSolution = q.options[q.answer];
        let statusHtml = userAnswers[idx] === q.answer ? 
            `<span class="text-success">✔ Correct</span>` : 
            `<span class="text-danger">✘ Incorrect</span>`;

        tr.innerHTML = `
            <td>${idx + 1}</td>
            <td><small>${q.category}</small></td>
            <td><b>${q.question}</b></td>
            <td>${userSelection}</td>
            <td class="text-success">${actualSolution}</td>
            <td>${statusHtml}</td>
        `;
        d.resTbody.appendChild(tr);
    });
}

// ==========================================
// ADMIN WORKSPACE CONSOLE CONTROL LOGIC
// ==========================================
d.switchAdminBtn.addEventListener('click', () => {
    d.loginBox.classList.add('hidden');
    d.adminLoginBox.classList.remove('hidden');
});

d.backLoginBtn.addEventListener('click', () => {
    d.adminLoginBox.classList.add('hidden');
    d.loginBox.classList.remove('hidden');
});

d.adminLoginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const password = document.getElementById('admin-pass').value;
    if(password === "Admin@90Python") { 
        d.adminLoginBox.classList.add('hidden');
        d.adminDashBox.classList.remove('hidden');
        fetchLiveReports();
    } else {
        alert("Validation failure: Incorrect admin token.");
    }
});

function fetchLiveReports() {
    database.ref('python_test_submissions').on('value', (snapshot) => {
        d.adminTbody.innerHTML = '';
        cachedAdminData = snapshot.val() || {};
        
        let recordKeys = Object.keys(cachedAdminData);
        let totalRecords = recordKeys.length;
        
        let highestPct = 0;
        let highestScoreStr = "0 / 0";
        let totalPctSum = 0;

        if(totalRecords > 0) {
            recordKeys.forEach((key, index) => {
                const record = cachedAdminData[key];
                
                // Analytics Parsing
                let currentPct = parseFloat(record.percentage) || 0;
                totalPctSum += currentPct;
                if(currentPct >= highestPct) {
                    highestPct = currentPct;
                    highestScoreStr = record.score;
                }

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><small>${record.timestamp}</small></td>
                    <td><b>${record.meta.empcode}</b></td>
                    <td>${record.meta.name}</td>
                    <td>${record.meta.department} <br><small class="text-muted">(${record.meta.testLevel})</small></td>
                    <td class="text-danger"><b>${record.score}</b></td>
                    <td class="text-success"><b>${record.percentage}</b></td>
                    <td style="text-align: center;">
                        <button class="btn-table-view" onclick="openCandidateSheet('${key}')">View Sheet</button>
                        <button class="btn-table-del" onclick="deleteCandidateRecord('${key}')">Delete</button>
                    </td>
                `;
                d.adminTbody.appendChild(tr);
            });

            // Updating Top Analytics Cards Real-time
            document.getElementById('total-tests-count').textContent = totalRecords;
            document.getElementById('highest-score-value').textContent = highestScoreStr;
            document.getElementById('avg-percentage-value').textContent = `${(totalPctSum / totalRecords).toFixed(2)}%`;

        } else {
            d.adminTbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 30px; color: var(--text-muted);">No active logs in node tree database.</td></tr>`;
            document.getElementById('total-tests-count').textContent = "0";
            document.getElementById('highest-score-value').textContent = "0 / 0";
            document.getElementById('avg-percentage-value').textContent = "0.00%";
        }
    });
}

window.openCandidateSheet = function(empcode) {
    const record = cachedAdminData[empcode];
    if(!record) return;

    d.modalMeta.innerHTML = `
        <div><b>Candidate:</b> ${record.meta.name}</div>
        <div><b>ID:</b> ${record.meta.empcode}</div>
        <div><b>Dept:</b> ${record.meta.department}</div>
        <div><b>Score:</b> <span class="text-success">${record.score} (${record.percentage})</span></div>
    `;

    d.modalTbody.innerHTML = '';
    
    let scopedQs = record.meta.testLevel === "All" ? [...questionBank] : questionBank.filter(q => q.category === record.meta.testLevel);

    scopedQs.forEach((q, idx) => {
        const tr = document.createElement('tr');
        let givenAnsIdx = record.responses ? record.responses[idx] : null;
        let userSelection = givenAnsIdx !== null && givenAnsIdx !== undefined ? q.options[givenAnsIdx] : "Not Answered";
        let actualSolution = q.options[q.answer];
        let status = givenAnsIdx === q.answer ? '<b class="text-success">✔</b>' : '<b class="text-danger">✘</b>';

        tr.innerHTML = `
            <td>${idx + 1}</td>
            <td><b>${q.question}</b></td>
            <td>${userSelection}</td>
            <td class="text-success">${actualSolution}</td>
            <td>${status}</td>
        `;
        d.modalTbody.appendChild(tr);
    });

    d.adminModal.classList.remove('hidden');
};

window.deleteCandidateRecord = function(empcode) {
    if(confirm(`⚠️ Dangerous Action:\nAre you sure you want to permanently delete Employee code [ ${empcode} ] from cloud storage?`)) {
        database.ref('python_test_submissions/' + empcode).remove()
        .then(() => alert("Record removed successfully."))
        .catch(err => alert("Error: " + err));
    }
};

d.resetDbBtn.addEventListener('click', () => {
    if(confirm("🚨 CRITICAL ALERT!\nYou are about to wipe out the ENTIRE Python Test submissions database node.\nThis action is irreversible. Proceed?")) {
        database.ref('python_test_submissions').remove()
        .then(() => alert("Database flushed completely."))
        .catch(err => alert("Error: " + err));
    }
});

d.closeModalBtn.addEventListener('click', () => d.adminModal.classList.add('hidden'));
d.logoutAdminBtn.addEventListener('click', () => {
    d.adminDashBox.classList.add('hidden');
    d.loginBox.classList.remove('hidden');
    d.adminLoginForm.reset();
});