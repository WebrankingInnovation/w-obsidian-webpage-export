// scripts/zip-plugin.js
const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');

// --- Configuration ---
const pluginId = 'w-obsidian-webpage-export'; // Your plugin's ID
const filesToInclude = ['main.js', 'manifest.json'];
const optionalFiles = ['styles.css']; // Will be included if it exists
const outputDirectory = './releases'; // Zip files will be saved here
// --- End Configuration ---

try {
    console.log('Starting plugin packaging process...');

    // 1. Read version from manifest.json
    const manifestPath = path.join(process.cwd(), 'manifest.json');
    if (!fs.existsSync(manifestPath)) {
        console.error(`Error: manifest.json not found at ${manifestPath}`);
        process.exit(1);
    }
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const version = manifest.version;
    if (!version) {
        console.error('Error: "version" field not found in manifest.json.');
        process.exit(1);
    }
    console.log(`Plugin version: ${version}`);

    // 2. Get current date in YYYYMMDD format
    // Current date is May 6, 2025
    const today = new Date(); // This will use the actual current date when run
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
    const day = String(today.getDate()).padStart(2, '0');
    const dateStr = `${year}${month}${day}`;
    console.log(`Current date: ${dateStr}`);

    // 3. Construct the zip filename
    const zipFileName = `${pluginId}-${version}-${dateStr}.zip`;
    console.log(`Output zip filename: ${zipFileName}`);

    // 4. Prepare output directory
    const absoluteOutputDirectory = path.resolve(process.cwd(), outputDirectory);
    if (!fs.existsSync(absoluteOutputDirectory)) {
        fs.mkdirSync(absoluteOutputDirectory, { recursive: true });
        console.log(`Created output directory: ${absoluteOutputDirectory}`);
    }
    const zipFilePath = path.join(absoluteOutputDirectory, zipFileName);

    // 5. Collect files to add to the zip
    // Assumes these files are in the project root when the script is run.
    // Your 'esbuild.config.mjs' outputs main.js to the project root.
    // Your manifest.json and styles.css are also in the project root.
    let filesToAddCmdString = "";

    for (const file of filesToInclude) {
        const filePath = path.join(process.cwd(), file);
        if (fs.existsSync(filePath)) {
            filesToAddCmdString += ` "${file}"`; // Add relative path for zip command
        } else {
            console.error(`Error: Required file "${file}" not found in project root. Aborting.`);
            process.exit(1);
        }
    }

    for (const file of optionalFiles) {
        const filePath = path.join(process.cwd(), file);
        if (fs.existsSync(filePath)) {
            filesToAddCmdString += ` "${file}"`;
        } else {
            console.log(`Info: Optional file "${file}" not found in project root. Skipping.`);
        }
    }

    if (filesToAddCmdString.trim() === "") {
        console.error("No files found to zip. Aborting.");
        process.exit(1);
    }

    // 6. Create the zip file using system's zip command
    // This command assumes you are on macOS or Linux where 'zip' is available.
    // The files are added from the current working directory (project root).
    // Using -j to junk paths (store files at the root of the zip)
    const command = `zip -j "${zipFilePath}" ${filesToAddCmdString.trim()}`;
    console.log(`Executing: ${command}`);

    execSync(command, { stdio: 'inherit' }); // stdio: 'inherit' will show zip's output

    console.log(`Successfully created zip file: ${zipFilePath}`);

} catch (error) {
    console.error('Error creating zip file:');
    console.error(error.message); // Log the error message
    if (error.stderr) {
      console.error("STDERR:", error.stderr.toString());
    }
    if (error.stdout) { // Though for execSync with inherit, this might not capture output separately here
        console.error("STDOUT:", error.stdout.toString());
    }
    process.exit(1);
}