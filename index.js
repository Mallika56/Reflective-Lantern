'use strict';

const fs = require('fs');
const path = require('path');

const PROMPTS_DIR = path.join(__dirname, 'prompts');

/**
 * Read the agent's main system prompt.
 * @returns {string} UTF-8 contents of prompts/system_prompt.md
 */
function getSystemPrompt() {
  return fs.readFileSync(path.join(PROMPTS_DIR, 'system_prompt.md'), 'utf8');
}

/**
 * Read every markdown prompt in prompts/.
 * @returns {Object.<string, string>} map of basename (no extension) -> contents
 */
function getPrompts() {
  return fs
    .readdirSync(PROMPTS_DIR)
    .filter((f) => f.endsWith('.md'))
    .reduce((acc, f) => {
      acc[path.basename(f, '.md')] = fs.readFileSync(path.join(PROMPTS_DIR, f), 'utf8');
      return acc;
    }, {});
}

module.exports = { getSystemPrompt, getPrompts };
