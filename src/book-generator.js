#!/usr/bin/env node

const fs = require('fs/promises');
const path = require('path');
const OpenAI = require('openai');

// OpenAI model constants
const STRUCTURE_MODEL = "gpt-4o-mini-2024-07-18";
const CHAPTER_MODEL = "gpt-3.5-turbo-0125";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
      model: STRUCTURE_MODEL,
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
      model: CHAPTER_MODEL,
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

// Save items to a JSON file
async function saveItemsToFile(bookData) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const itemsFilePath = path.join(process.cwd(), `book-items-${timestamp}.json`);
  
  await fs.writeFile(itemsFilePath, JSON.stringify(bookData, null, 2));
  
  return itemsFilePath;
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
  
  // Save book structure as JSON
  await fs.writeFile(
    path.join(bookDir, 'book-structure.json'),
    JSON.stringify(bookData, null, 2)
  );
  
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

// Load book structure from JSON file
async function loadBookStructure(filePath) {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error loading book structure from ${filePath}:`, error);
    throw error;
  }
}

// Generate a book using the book structure
async function generateBook(bookData, language, chapterLength, itemType) {
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

    return bookDir;
}

export { generateBookStructure, generateChapter, saveItemsToFile, saveBook, loadBookStructure, generateBook };