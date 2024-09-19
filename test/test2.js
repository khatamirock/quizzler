const Groq = require('groq-sdk');
const fs = require('fs');

// Use an environment variable for the API key
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

async function generateMCQ(question) {
  const chatCompletion = await groq.chat.completions.create({
    messages: [
      {
        role: "system",
        content: "You are an expert in creating multiple-choice questions in Bengali. Your task is to generate 4 best matching options with an answer for a given question, following a specific format."
      },
      {
        role: "user",
        content: `Please create a multiple-choice question in Bengali for the following question, with 4 options and an answer. Use this format:

প্রশ্ন ১: [Question]

ক) [Option A]
খ) [Option B]
গ) [Option C]
ঘ) [Option D]
Answer: [Correct option letter]

The question is: ${question}`
      }
    ],
    // model: "llama3-groq-70b-8192-tool-use-preview",
    model:"llama3-8b-8192",
    temperature: 0.5,
    max_tokens: 1024,
    top_p: 0.65,
    stream: false,
    stop: null
  });

  return chatCompletion.choices[0]?.message?.content || '';
}

async function processQuestions() {
  // Read questions from ques.txt
  const questions = fs.readFileSync('ques.txt', 'utf8').split('\n\n');

  let mcqOutput = '';

  for (let i = 0; i < questions.length; i++) {
    const question = questions[i].trim();
    if (question) {
      console.log(`Processing question ${i + 1}...`);
      const mcq = await generateMCQ(question);
      mcqOutput += mcq + '\n\n';
    }
  }

  // Write MCQs to mcq_output.txt
  fs.writeFileSync('mcq_output.txt', mcqOutput, 'utf8');
  console.log('MCQs have been saved to mcq_output.txt');
}

processQuestions().catch(console.error);