const fs = require('fs').promises;
const path = require('path');

function cleanText(text) {
  return text.replace(/\s+/g, ' ').trim();
}

function extractQA(text) {
  const questions = text.split(/\n(\d+)\./);
  questions.shift(); // Remove the first empty element
  const results = [];

  for (let i = 0; i < questions.length; i += 2) {
    const number = questions[i];
    const q = questions[i + 1] || "";

    // Check for the new format
    const newFormatMatch = q.match(/(.*?)\s*a\.\s*(.*?)\s*b\.\s*(.*?)\s*c\.\s*(.*?)\s*d\.\s*(.*?)\s*Answer:\s*\(([a-d])\)/is);
    if (newFormatMatch) {
      const questionText = cleanText(newFormatMatch[1]);
      const options = [
        { text: cleanText(newFormatMatch[2]), value: 'A' },
        { text: cleanText(newFormatMatch[3]), value: 'B' },
        { text: cleanText(newFormatMatch[4]), value: 'C' },
        { text: cleanText(newFormatMatch[5]), value: 'D' }
      ];
      const answer = newFormatMatch[6].toUpperCase();
      results.push({ question_id: parseInt(number), question_text: questionText, options, correct_answer: answer });
    } else {
      // Check for the other new format
      const newFormat2Match = q.match(/(.*?)\n([A-Z])\..*?\n([A-Z])\..*?\n([B-D])\..*?\n\*\*Answer:\s*([A-Z])\b/is);
      if (newFormat2Match) {
        const questionText = cleanText(newFormat2Match[1]);
        const options = [
          { text: cleanText(newFormat2Match[2] + "."), value: newFormat2Match[2] },
          { text: cleanText(newFormat2Match[3] + "."), value: newFormat2Match[3] },
          { text: cleanText(newFormat2Match[4] + "."), value: newFormat2Match[4] }
        ];
        const answer = newFormat2Match[5].toUpperCase();
        results.push({ question_id: parseInt(number), question_text: questionText, options, correct_answer: answer });
      } else {
        // Use the previous method for other formats
        const answerMatch = q.match(/Answer:\s*\(([a-d])\)/i);
        const answer = answerMatch ? answerMatch[1].toUpperCase() : null;

        const qWithoutAnswer = q.replace(/Answer:.*/, '');
        const optionsMatches = qWithoutAnswer.matchAll(/([a-d])\.(.*?)(?=\n[a-d]\.|\Z)/gis);
        const options = Array.from(optionsMatches).map(match => ({
          text: cleanText(match[2]),
          value: match[1].toUpperCase()
        }));

        let questionText = q.replace(/([a-d])\..*/, '');
        questionText = cleanText(questionText);

        results.push({ question_id: parseInt(number), question_text: questionText, options, correct_answer: answer });
      }
    }
  }

  return results;
}

async function main() {
  const inputFilename = 'input_ocr.txt';
  const outputFilename = 'output_extracted.json';

  try {
    // Read from input file
    const text = await fs.readFile(inputFilename, 'utf-8');

    // Extract and format data
    const extracted = extractQA(text);

    // Write to JSON file
    await fs.writeFile(outputFilename, JSON.stringify({ questions: extracted }, null, 2));

    console.log(`Extraction complete. Results saved to ${outputFilename}`);
  } catch (error) {
    console.error('An error occurred:', error);
  }
}

main();