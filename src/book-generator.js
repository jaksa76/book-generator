#!/usr/bin/env node

const readline = require('readline');
const fs = require('fs/promises');
const path = require('path');
const OpenAI = require('openai');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper function to get user input
function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// Generate book structure using OpenAI
async function generateBookStructure(theme, count, language, itemType) {
  console.log(`Generating ${count} ${theme} ${itemType} in ${language}...`);
  
  const prompt = `Create a list of ${count} ${itemType} about "${theme}" in ${language}. 
  Organize them into 3-5 logical categories.
  Format the response as a JSON object with this structure:
  {
    "title": "The book title",
    "categories": [
      {
        "name": "Category Name",
        "items": [
          {
            "number": 1,
            "title": "Title of the ${itemType.slice(0, -1)}",
            "summary": "One sentence summary of what this ${itemType.slice(0, -1)} is about"
          }
        ]
      }
    ]
  }`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-0125",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "You are a helpful assistant that generates book outlines in JSON format." },
        { role: "user", content: prompt }
      ],
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error("Error generating book structure:", error);
    throw error;
  }
}

// Generate a chapter for a specific item using OpenAI
async function generateChapter(tip, language, chapterLength, itemType) {
  console.log(`Generating chapter for: ${tip.title}...`);
  
  const lengthDescription = chapterLength === 'short' ? '300-500 words' : 
                           chapterLength === 'medium' ? '800-1200 words' : 
                           '1500-2000 words';
  
  const singularItemType = itemType.slice(0, -1);
                           
  const prompt = `Write a ${lengthDescription} chapter in ${language} about the following ${singularItemType}:
  
  "${tip.title}: ${tip.summary}"
  
  Format the chapter with a title, introduction, main content with examples, and a conclusion.
  Use markdown formatting.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-0125",
      messages: [
        { role: "system", content: "You are a helpful assistant that writes detailed book chapters." },
        { role: "user", content: prompt }
      ],
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error(`Error generating chapter for ${tip.title}:`, error);
    throw error;
  }
}

// Save book to files
async function saveBook(bookData, chapters) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const bookDir = path.join(process.cwd(), `book-${timestamp}`);
  
  await fs.mkdir(bookDir, { recursive: true });
  
  // Create table of contents
  let toc = `# ${bookData.title}\n\n## Table of Contents\n\n`;
  
  bookData.categories.forEach(category => {
    toc += `### ${category.name}\n\n`;
    category.items.forEach(item => {
      toc += `${item.number}. [${item.title}](chapter-${item.number}.md)\n`;
    });
    toc += '\n';
  });
  
  // Save table of contents
  await fs.writeFile(path.join(bookDir, 'README.md'), toc);
  
  // Save each chapter
  for (let i = 0; i < chapters.length; i++) {
    const tipNumber = i + 1;
    await fs.writeFile(
      path.join(bookDir, `chapter-${tipNumber}.md`),
      chapters[i]
    );
  }
  
  return bookDir;
}

// Main function
async function main() {
  try {
    console.log("Welcome to the Book Generator!");
    console.log("This program will help you create a book using OpenAI's GPT model.\n");
    
    const language = await ask("What language should the book be written in? (e.g., English, Spanish): ");
    const theme = await ask("What theme or topic should the book cover?: ");
    const itemType = await ask("What type of items should the book contain? (tips/advice/patterns/recipes/strategies/...): ");
    const count = parseInt(await ask(`How many ${itemType} should the book contain? (10-100): `), 10);
    const chapterLength = await ask("How long should each chapter be? (short/medium/long): ");
    
    if (isNaN(count) || count < 1 || count > 100) {
      console.error("Invalid count. Please enter a number between 1 and 100.");
      rl.close();
      return;
    }
    
    if (!['short', 'medium', 'long'].includes(chapterLength.toLowerCase())) {
      console.error("Invalid chapter length. Please enter 'short', 'medium', or 'long'.");
      rl.close();
      return;
    }
    
    // Check if OpenAI API key is set
    if (!process.env.OPENAI_API_KEY) {
      console.error("Error: OPENAI_API_KEY environment variable is not set.");
      console.log("Please set your OpenAI API key using:");
      console.log("export OPENAI_API_KEY='your-api-key'");
      rl.close();
      return;
    }
    
    // Generate book structure
    const bookData = await generateBookStructure(theme, count, language, itemType);
    
    // Flatten all tips into a single array
    const allTips = bookData.categories.flatMap(category => category.items);
    
    // Sort tips by number
    allTips.sort((a, b) => a.number - b.number);
    
    // Generate chapters
    const chapters = [];
    for (const tip of allTips) {
      const chapter = await generateChapter(tip, language, chapterLength.toLowerCase(), itemType);
      chapters.push(chapter);
    }
    
    // Save book to files
    const bookDir = await saveBook(bookData, chapters);
    
    console.log(`\nBook generated successfully! Files saved to: ${bookDir}`);
    
  } catch (error) {
    console.error("An error occurred:", error);
  } finally {
    rl.close();
  }
}

// Run the program
main();