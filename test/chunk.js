const Groq = require('groq-sdk');
const fs = require('fs');

// Use an environment variable for the API key
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

async function processQuestionsWithGroq(questions) {
  const prompt = `Format and correct any errors in the following questions. Ensure they are in proper Bengali and follow this format:

প্রশ্ন ১: [Question text]

ক) [Option A]
খ) [Option B]
গ) [Option C]
ঘ) [Option D]
Answer: [Correct option letter]

Here are the questions:

${questions.join('\n\n')}`;

  const chatCompletion = await groq.chat.completions.create({
    messages: [
      {
        role: "user",
        content: prompt
      }
    ],
    model: "llama3-groq-70b-8192-tool-use-preview",
    temperature: 1,
    max_tokens: 2048,
    top_p: 0.9,
    stream: false,
    stop: null
  });

  return chatCompletion.choices[0]?.message?.content || '';
}

async function processQuestions() {
  // Read questions from ques.txt
  const allQuestions = fs.readFileSync('ques.txt', 'utf8').split('\n\n').filter(q => q.trim());

  let formattedOutput = '';

  for (let i = 0; i < allQuestions.length; i += 10) {
    const questionChunk = allQuestions.slice(i, i + 10);
    console.log(`Processing questions ${i + 1} to ${i + questionChunk.length}...`);
    
    const formattedChunk = await processQuestionsWithGroq(questionChunk);
    formattedOutput += formattedChunk + '\n\n';

    // Write the current progress to groq.txt
    fs.writeFileSync('groq.txt', formattedOutput, 'utf8');
    console.log(`Progress saved. Processed ${i + questionChunk.length} questions so far.`);
  }

  console.log('All questions have been processed and saved to groq.txt');
}

processQuestions().catch(console.error);
