const fs = require('fs');
const { OpenAI } = require('openai');
const dotenv = require('dotenv');
const readline = require('readline');

// Load environment variables from .env file
dotenv.config();

// // Initialize OpenAI client with your API key
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
}); 

async function getUserInput(prompt) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise(resolve => {
        rl.question(prompt, answer => {
            rl.close();
            resolve(answer.trim()); // Trim whitespace from input
        });
    });
}


async function createAssistant() {
    try {
        const assistant = await openai.beta.assistants.create({
            name: "Tilly",
            instructions: "You are a english teacher for spanish kids. your task is to tell the stududent if they translated the sentence from spanish to english correctly in SPANGLISH (MOSTLY ENGLISH WITH A FEW MINOR SPANISH WORDS). if its incorrect, give one minor hint, but it shouldnt be a direct hint. You should point to their mistake but not correct them. if they got it correct, include the word 'correct' in your response and explain shortly why their answer is correct and why their sentence is useful int he real world. The response should be in english with a few minor spanish words here and there",
            tools: [{ type: "code_interpreter" }],
            model: "gpt-4o"
        });
        return assistant;
    } catch (error) {
        console.error("Error creating assistant:", error);
        throw error;
    }
}


async function sendMessageToAssistant(threadId, assistant, userMessage) {
    try {
        // Add user message to the thread
        await openai.beta.threads.messages.create(threadId, {
            role: "user",
            content: userMessage
        });

        let assistantResponse = '';

        // Stream the run to get responses
        const run = openai.beta.threads.runs.stream(threadId, {
            assistant_id: assistant.id
        })
        .on('textDelta', textDelta => {
            assistantResponse += textDelta.value;
        })
        .on('toolCallDelta', toolCallDelta => {
            // Handle specific tools like code_interpreter
            if (toolCallDelta.type === 'code_interpreter' && toolCallDelta.code_interpreter.outputs) {
                toolCallDelta.code_interpreter.outputs.forEach(output => {
                    if (output.type === "logs") {
                        assistantResponse += `\n${output.logs}\n`;
                    }
                });
            }
        })
        .on('end', () => {
            console.log('Assistant Response:', assistantResponse);
        });

    } catch (error) {
        console.error("Error sending message to assistant:", error);
        throw error;
    }
}

async function main() {
    try {
        const assistant = await createAssistant();
        const thread = await openai.beta.threads.create();
        
        // Example interaction loop (replace with your application's logic)
        while (true) {
            const userInput = await getUserInput("You: ");
            if (userInput.toLowerCase() === 'exit') {
                console.log("Goodbye!");
                break; // Exit loop if user types 'exit'
            }
            
            await sendMessageToAssistant(thread.id, assistant, userInput);
        }
    } catch (error) {
        console.error("Main function error:", error);
    }
}

// Example usage
main();





// const run = openai.beta.threads.runs.create(
//   thread.id,
//   { assistant_id: assistant.id }
// );













// const systemPrompt = "You are an AI assistant that generates a scrambled English sentence for the user to unscramble. After the user provides their answer, you will confirm whether it is correct or incorrect. If the answer is correct, provide the next scrambled sentence. If the answer is incorrect, stay with the same sentence until they get it right. Your response format should be EXACTLY: '[Correct/Incorrect], [prompt]'.";

// async function getOpenAIResponse(userInput) {
//     try {
//         const completion = await openai.chat.completions.create({
//             model: "ft:gpt-3.5-turbo-0125:personal:tucanmix:9b8MI7iG",
//             messages: [
//                 { role: "system", content: systemPrompt },
//                 { role: "user", content: userInput }
//             ]
//         });
//         console.log(completion.choices[0].message.content);
//     } catch (error) {
//         console.error('Error fetching response from OpenAI:', error);
//     }
// }

// const rl = readline.createInterface({
//     input: process.stdin,
//     output: process.stdout
// });

// function askQuestion() {
//     rl.question('Your input: ', async (userInput) => {
//         if (userInput.trim().toLowerCase() === 'exit') {
//             console.log('Exiting...');
//             rl.close();
//         } else {
//             await getOpenAIResponse(userInput);
//             askQuestion(); // Continue asking the next question
//         }
//     });
// }

// // Start the conversation loop
// console.log('Welcome to the Tilly the Toucan conversation!');
// askQuestion(); // Kick off the loop
