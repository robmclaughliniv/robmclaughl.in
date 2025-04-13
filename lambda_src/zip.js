const fs = require('fs');
const archiver = require('archiver');
const path = require('path');

// Define the paths
const outputDir = path.join(__dirname, '..', 'build');
const outputFile = path.join(outputDir, 'lambda_function.zip');
const sourceDir = path.join(__dirname, 'dist');

// Create the build directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// Create a file to stream archive data to.
const output = fs.createWriteStream(outputFile);
const archive = archiver('zip', {
    zlib: { level: 9 } // Sets the compression level.
});

// Listen for all archive data to be written
output.on('close', function () {
    console.log(archive.pointer() + ' total bytes');
    console.log('Archiver has been finalized and the output file descriptor has closed.');
    console.log(`Lambda package created at: ${outputFile}`);
});

// Listen for errors
archive.on('error', function (err) {
    throw err;
});

// Pipe archive data to the file
archive.pipe(output);

// Append files from the source directory
archive.directory(sourceDir, false);

// Finalize the archive (i.e., we are done appending files but streams have to finish yet)
archive.finalize(); 