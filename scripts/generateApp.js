import "zx/globals";
import fs from 'fs/promises';
import path from 'path';

// Directories
const outputsDir = path.resolve('public/outputs');
const appFile = path.resolve('src/App.tsx');

// Function to generate the App.tsx content dynamically
const generateAppContent = async () => {
  const outputDirs = await fs.readdir(outputsDir);
  let listItems = '';

  for (const folder of outputDirs) {
    const folderPath = path.join(outputsDir, folder);
    const folderStats = await fs.stat(folderPath);

    // Only include directories (corresponding to unzipped EPUB files)
    if (folderStats.isDirectory()) {
      const htmlPath = path.join(folderPath, `${folder}.html`);

      try {
        await fs.access(htmlPath); // Check if the HTML file exists
        listItems += `<li><a href="/outputs/${folder}/${folder}.html">${folder}</a></li>\n`;
      } catch (error) {
        console.log(`No HTML found for ${folder}`);
      }
    }
  }

  const appContent = `
function App() {
  return (
    <>
      <h1>Epub HTML</h1>
      <ul>
        <li>
          ${listItems}
        </li>
      </ul>
    </>
  );
}

export default App;
`;

  return appContent;
};

// Function to write the App.tsx file
const writeAppFile = async () => {
  const content = await generateAppContent();
  await fs.writeFile(appFile, content, 'utf8');
  console.log('src/App.tsx has been generated.');
};

// Generate and write the App.tsx file
await writeAppFile();
