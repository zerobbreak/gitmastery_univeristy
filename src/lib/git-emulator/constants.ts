/** Constants for the Git simulator. */

/** CHAL202 lost commit — must match challenge-validation recovery checks. */
export const RECOVER_LOST_COMMIT_MESSAGE = "Important feature work";

export const DEFAULT_FILE_CONTENTS: Record<string, string> = {
  "style.css": `/* Main styles */
body {
  font-family: system-ui, sans-serif;
  margin: 0;
  padding: 20px;
}

.container {
  max-width: 800px;
  margin: 0 auto;
}
`,
  "index.html": `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Project</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="container">
    <h1>Welcome to My Project</h1>
    <p>This is a sample project.</p>
  </div>
</body>
</html>
`,
  "package.json": `{
  "name": "my-project",
  "version": "1.0.0",
  "description": "A sample project",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "test": "echo \\"Error: no test specified\\" && exit 1"
  },
  "author": "",
  "license": "MIT"
}
`,
  "README.md": `# My Project

A sample project for learning Git.

## Getting Started

1. Clone this repository
2. Run \`npm install\`
3. Run \`npm start\`
`,
};
