# AI Book Generator

This command-line tool uses OpenAI's GPT to generate books in a "tips" or "patterns" format.

## Features

- Generate a book with any number of tips/patterns/techniques
- Specify the theme and language of the book
- Choose chapter length (short, medium, long)
- Output is saved as markdown files in a directory

## Requirements

- Node.js installed
- OpenAI API key

## Installation

1. Clone this repository
2. Install dependencies: `bun install`
3. Set your OpenAI API key:
   ```
   export OPENAI_API_KEY='your-api-key'
   ```

## Usage

Run the tool with:

```
bun dev
```

Follow the prompts to specify:
- Language for the book
- Theme or topic
- Number of tips/patterns to include (10-100)
- Chapter length (short, medium, long)

The program will:
1. Generate a structured outline with categories
2. Create individual chapters for each tip
3. Save the book as markdown files in a new directory

## Output

The generated book will be saved in a directory named `book-[timestamp]` containing:
- `README.md` - Table of contents
- `chapter-1.md`, `chapter-2.md`, etc. - Individual chapters