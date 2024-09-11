const fs = require('fs').promises;
const path = require('path');

function cleanText(text) {
  return text.replace(/\s+/g, ' ').trim();
}

function extractQA(text) {
  // ... (keep the existing extractQA function)
}

module.exports = { extractQA };