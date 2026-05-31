import { useState } from 'react';

// Simple rule-based chatbot for test-related questions.
// It looks for keywords and returns an explanation plus a small example.
function ChatBot({ testQuestions = [], currentIdx = 0 }) {
  const [messages, setMessages] = useState([
    { from: 'bot', text: 'Hi! I can help with test questions. Ask me to "explain", "give an example", or ask for a "hint".' }
  ]);
  const [input, setInput] = useState('');

  const push = (from, text) => setMessages((m) => [...m, { from, text }]);

  const handleQuery = (q) => {
    const lower = q.toLowerCase();

    // direct question about current question
    if (lower.includes('current') || lower.includes('this question') || lower.includes('this')) {
      const qData = testQuestions[currentIdx];
      if (qData) {
        push('bot', `Question: ${qData.question}`);
        push('bot', `Explanation: ${explainText(qData)}`);
        return;
      }
    }

    if (lower.includes('explain') || lower.includes('why')) {
      // find keyword appearing in any question
      const best = findRelatedQuestion(lower, testQuestions);
      if (best) {
        push('bot', `Explanation for: ${best.question}`);
        push('bot', explainText(best));
        return;
      }
      push('bot', 'Please mention which question or topic you want explained (e.g., "explain question 3" or "explain arrays").');
      return;
    }

    if (lower.includes('example')) {
      const topic = extractTopic(lower);
      push('bot', `Example${topic ? ` (${topic})` : ''}: ` + exampleFor(topic || 'problem solving'));
      return;
    }

    if (lower.includes('hint')) {
      const best = findRelatedQuestion(lower, testQuestions) || testQuestions[currentIdx];
      if (best) {
        push('bot', `Hint: ${hintFor(best)}`);
      } else {
        push('bot', 'Give me the question number or paste the question text for a hint.');
      }
      return;
    }

    // fallback small-talk
    push('bot', `I can help explain questions, give hints, or show examples. Try: "explain question 2" or "hint for arrays".`);
  };

  const onSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    push('user', input.trim());
    handleQuery(input.trim());
    setInput('');
  };

  return (
    <div className="mt-6 rounded-xl border p-3 bg-white">
      <h4 className="font-bold mb-2">Tutor Chat</h4>
      <div className="space-y-2 max-h-48 overflow-auto pb-2">
        {messages.map((m, i) => (
          <div key={i} className={m.from === 'bot' ? 'text-sm text-gray-800' : 'text-sm text-right text-slate-700'}>
            <div className={m.from === 'bot' ? 'inline-block bg-gray-100 p-2 rounded' : 'inline-block bg-slate-50 p-2 rounded'}>{m.text}</div>
          </div>
        ))}
      </div>
      <form onSubmit={onSubmit} className="mt-2 flex gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about this test..." className="flex-1 rounded px-3 py-2 border" />
        <button className="bg-emerald-600 text-white px-3 py-2 rounded">Ask</button>
      </form>
    </div>
  );
}

// Helpers: basic heuristics to return explanations/examples
function explainText(q) {
  // if question has answer field, attempt a short explanation
  if (q.explanation) return q.explanation;
  if (q.answer) {
    return `The correct answer is ${q.answer}. Usually you check each option against the question conditions and pick the matching one.`;
  }
  return 'This question requires reading the problem statement carefully. Break it into smaller parts and solve step-by-step.';
}

function hintFor(q) {
  if (q.hint) return q.hint;
  if (q.options && q.options.length) return `Try eliminating obviously wrong options first, then compare the remaining choices.`;
  return 'Try identifying what the question asks, list knowns and unknowns, and try a simple example.';
}

function exampleFor(topic) {
  if (!topic) return 'Work through a small example input and compute results step-by-step.';
  if (topic.includes('array')) return 'Example: For array [1,2,3], to find sum iterate and add: 1+2+3 = 6.';
  if (topic.includes('loop')) return 'Example: A for-loop from i=0 to 2 runs 3 iterations: i=0,1,2.';
  if (topic.includes('probability')) return 'Example: For a fair coin, probability of heads = 1/2.';
  return `Example for ${topic}: try a simple concrete value and solve manually.`;
}

function extractTopic(text) {
  // very naive topic picker
  if (text.includes('array')) return 'array';
  if (text.includes('loop')) return 'loop';
  if (text.includes('probability')) return 'probability';
  return null;
}

function findRelatedQuestion(text, questions) {
  if (!questions || questions.length === 0) return null;
  // check for "question N"
  const qMatch = text.match(/question\s*(\d+)/);
  if (qMatch) {
    const idx = parseInt(qMatch[1], 10) - 1;
    if (questions[idx]) return questions[idx];
  }
  // fallback: find question containing a keyword
  for (const q of questions) {
    if (text.includes(q.id) || text.includes((q.question || '').toLowerCase())) return q;
  }
  return null;
}

export default ChatBot;
