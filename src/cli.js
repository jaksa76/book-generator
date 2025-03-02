#!/usr/bin/env node

const readline = require('readline');
const fs = require('fs/promises');
const path = require('path');
const bookGenerator = require('./book-generator');

// Command line arguments parsing
const args = process.argv.slice(2);
const generateItemsOnly = args.includes('--items-only');
const inputFile = args.find((arg, index) => arg === '--input-file' && args[index + 1])
  ? args[args.findIndex((arg) => arg === '--input-file') + 1]
  : null;

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


// Main function
async function main() {
  try {
    console.log("Welcome to the Book Generator!");
    console.log("This program will help you create a book using OpenAI's GPT model.\n");
    
    // Check if OpenAI API key is set
    if (!process.env.OPENAI_API_KEY) {
      console.error("Error: OPENAI_API_KEY environment variable is not set.");
      console.log("Please set your OpenAI API key using:");
      console.log("export OPENAI_API_KEY='your-api-key'");
      rl.close();
      return;
    }
    
    let bookData;
    let language;
    let itemType;
    let chapterLength;
    
    // If input file is provided, load book structure from it
    if (inputFile) {
      console.log(`Loading book structure from ${inputFile}...`);
      bookData = await bookGenerator.loadBookStructure(inputFile);
      language = await ask("What language should the chapters be written in? (e.g., English, Spanish): ");
      itemType = await ask("What type of items does the book contain? (tips/advice/patterns/recipes/strategies/...): ");
      chapterLength = await ask("How long should each chapter be? (short/medium/long): ");
      
      if (!['short', 'medium', 'long'].includes(chapterLength.toLowerCase())) {
        console.error("Invalid chapter length. Please enter 'short', 'medium', or 'long'.");
        rl.close();
        return;
      }
    } else {
      // Generate new book structure
      language = await ask("What language should the book be written in? (e.g., English, Spanish): ");
      const theme = await ask("What theme or topic should the book cover?: ");
      itemType = await ask("What type of items should the book contain? (tips/advice/patterns/recipes/strategies/...): ");
      const count = parseInt(await ask(`How many ${itemType} should the book contain? (10-100): `), 10);
      
      if (isNaN(count) || count < 1 || count > 100) {
        console.error("Invalid count. Please enter a number between 1 and 100.");
        rl.close();
        return;
      }
      
      // Generate book structure
      bookData = await bookGenerator.generateBookStructure(theme, count, language, itemType);
      
      // If --items-only flag is used, save only the items list and exit
      if (generateItemsOnly) {
        const itemsFilePath = await bookGenerator.saveItemsToFile(bookData);
        console.log(`\nItems list generated successfully! Saved to: ${itemsFilePath}`);
        console.log("You can now review and modify this JSON file.");
        console.log("To generate the book content based on this file, run:");
        console.log(`book-generator --input-file ${itemsFilePath}`);
        rl.close();
        return;
      }
      
      chapterLength = await ask("How long should each chapter be? (short/medium/long): ");
      
      if (!['short', 'medium', 'long'].includes(chapterLength.toLowerCase())) {
        console.error("Invalid chapter length. Please enter 'short', 'medium', or 'long'.");
        rl.close();
        return;
      }
    }
    
    const bookDir = bookGenerator.generateBook(bookData, language, chapterLength, itemType);
    
    console.log(`\nBook generated successfully! Files saved to: ${bookDir}`);
    
  } catch (error) {
    console.error("An error occurred:", error);
  } finally {
    rl.close();
  }
}

// Run the program
main();