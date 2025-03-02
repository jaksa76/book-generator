const { generateBookStructure, generateBook } = require('../src/book-generator');
const fs = require('fs/promises');


describe('Book Generator - Montenegrin Book Test', () => {
  jest.setTimeout(300000); // 5 minutes timeout

  test('should generate a book structure in Montenegrin', async () => {
    // Generate book structure
    const bookStructure = await generateBookStructure("izbjegavanje uroka", 18, "Montenegrin", "načina");

    // Generate full book
    const bookDir = await generateBook(bookStructure, "Montenegrin", "medium", "načina");

    // Verify book directory was created
    const dirExists = await fs.access(bookDir).then(() => true).catch(() => false);
    expect(dirExists).toBeTruthy();

    // Verify that there are 18 chapters
    const chapters = await fs.readdir(bookDir);
    const chapterFiles = chapters.filter(file => /^chapter-[0-9]+\.md$/.test(file));
    expect(chapterFiles).toHaveLength(18);
  });
});
