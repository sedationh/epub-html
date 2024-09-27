import "zx/globals";
import fs from "fs/promises";
import path from "path";

// ebook-convert fixtures/holes.epub public/outputs/holes.zip
// 1. diff fixtures 里的文件 如 holes.epub ... 在 public/outputs 里是否存在对应的文件夹 如 public/outputs/holes 注意 [holes].epub 和 public/outputs/[holes] [x] 是匹配的

/**
 * fixtures 下 有
 *  A
 *  B
 * 那么 public/outputs 下也要有
 *  A
 *  B
 *
 * 如果没有，记录要生产的文件
 * 如果有，记录要删除的文件
 */

// 2. 执行 ebook-convert fixtures/holes.epub public/outputs/holes.zip 生成对应的 zip 文件并解压成同名的文件夹 然后删除 holes.zip 保留生成的文件夹

// Directories
const fixturesDir = path.resolve("fixtures");
const outputsDir = path.resolve("public/outputs");

// Function to list all EPUB files in the fixtures directory
const getEpubFiles = async (dir) => {
  const files = await fs.readdir(dir);
  return files.filter((file) => file.endsWith(".epub"));
};

// Function to check and sync directories between fixtures and outputs
const syncDirectories = async () => {
  const epubFiles = await getEpubFiles(fixturesDir);

  const missingFiles = [];
  const extraFolders = [];

  for (const file of epubFiles) {
    const baseName = path.basename(file, ".epub");
    const outputFolder = path.join(outputsDir, baseName);

    try {
      await fs.access(outputFolder);
    } catch (error) {
      missingFiles.push(file);
    }
  }

  // Check for extra folders in public/outputs
  const outputDirs = await fs.readdir(outputsDir);
  for (const folder of outputDirs) {
    const folderPath = path.join(outputsDir, folder);
    const folderStats = await fs.stat(folderPath);

    if (!epubFiles.includes(`${folder}.epub`) && folderStats.isDirectory()) {
      extraFolders.push(folderPath);
    }
  }

  // Process missing files: Convert epub to zip and unzip
  for (const file of missingFiles) {
    const baseName = path.basename(file, ".epub");
    const epubPath = path.join(fixturesDir, file);
    const outputZip = path.join(outputsDir, `${baseName}.zip`);

    // Run ebook-convert command using zx's $ syntax
    
    await $`ebook-convert ${epubPath} ${outputZip}`;

    // Unzip the file
    await $`unzip -o ${outputZip} -d ${path.join(outputsDir, baseName)}`;

    // Remove the zip file
    await fs.unlink(outputZip);

    console.log(`Processed ${file}: created ${baseName} folder.`);
  }

  // Process extra folders: Delete them
  for (const folder of extraFolders) {
    await fs.rm(folder, { recursive: true, force: true });
    console.log(`Deleted extra folder: ${folder}`);
  }

  console.log("Sync complete.");
};

// Execute the sync function
await syncDirectories();
