# Node.js File System (fs) Module Guide

## Overview

The Node.js File System (`fs`) module provides an API for interacting with the file system. It offers both synchronous and asynchronous methods for file operations. In modern Node.js applications, it's recommended to use the Promise-based API (`fs.promises`) for better async/await support.

## Import Patterns

### Promise-based API (Recommended)
```typescript
import { promises as fs } from 'fs';
// or
import fs from 'fs/promises';
```

### Callback-based API (Legacy)
```typescript
import fs from 'fs';
```

### Synchronous API (Use with caution)
```typescript
import fs from 'fs';
```

## Core Operations

### Reading Files

#### Read entire file content
```typescript
// Promise-based (async/await)
try {
  const data = await fs.readFile('/path/to/file.txt', 'utf-8');
  console.log(data);
} catch (error) {
  console.error('Error reading file:', error);
}

// Callback-based
fs.readFile('/path/to/file.txt', 'utf-8', (err, data) => {
  if (err) {
    console.error('Error reading file:', err);
    return;
  }
  console.log(data);
});

// Synchronous (blocks event loop)
try {
  const data = fs.readFileSync('/path/to/file.txt', 'utf-8');
  console.log(data);
} catch (error) {
  console.error('Error reading file:', error);
}
```

#### Read file as buffer
```typescript
const buffer = await fs.readFile('/path/to/file.dat');
console.log('File size:', buffer.length);
```

### Writing Files

#### Write string or buffer to file
```typescript
// Write string
await fs.writeFile('/path/to/file.txt', 'Hello, World!', 'utf-8');

// Write buffer
const buffer = Buffer.from('Hello, World!');
await fs.writeFile('/path/to/file.dat', buffer);

// Append to file
await fs.appendFile('/path/to/file.txt', '\nAdditional content');
```

### File and Directory Information

#### Check if file/directory exists
```typescript
// Modern approach using access()
try {
  await fs.access('/path/to/file');
  console.log('File exists');
} catch {
  console.log('File does not exist');
}

// Get detailed file stats
try {
  const stats = await fs.stat('/path/to/file');
  console.log('Is file:', stats.isFile());
  console.log('Is directory:', stats.isDirectory());
  console.log('Size:', stats.size);
  console.log('Modified:', stats.mtime);
} catch (error) {
  console.error('File not found:', error);
}
```

### Directory Operations

#### Create directories
```typescript
// Create single directory
await fs.mkdir('/path/to/directory');

// Create directory tree (recursive)
await fs.mkdir('/path/to/nested/directories', { recursive: true });
```

#### List directory contents
```typescript
// Simple list
const files = await fs.readdir('/path/to/directory');
console.log('Files:', files);

// List with file types
const entries = await fs.readdir('/path/to/directory', { withFileTypes: true });
entries.forEach(entry => {
  console.log(`${entry.name} - ${entry.isFile() ? 'file' : 'directory'}`);
});
```

#### Remove directories
```typescript
// Remove empty directory
await fs.rmdir('/path/to/empty-directory');

// Remove directory and all contents (Node.js 14.14.0+)
await fs.rm('/path/to/directory', { recursive: true, force: true });
```

### File Operations

#### Delete files
```typescript
// Delete single file
await fs.unlink('/path/to/file.txt');

// Delete multiple files
const filesToDelete = ['file1.txt', 'file2.txt', 'file3.txt'];
await Promise.all(filesToDelete.map(file => fs.unlink(file)));
```

#### Copy and move files
```typescript
// Copy file
await fs.copyFile('/source/file.txt', '/destination/file.txt');

// Move/rename file
await fs.rename('/old/path/file.txt', '/new/path/file.txt');
```

## Advanced Usage

### Streaming Large Files
For large files, use streams to avoid loading entire content into memory:

```typescript
import { createReadStream, createWriteStream } from 'fs';

// Reading large file as stream
const readStream = createReadStream('/path/to/large-file.txt');
readStream.on('data', (chunk) => {
  console.log('Received chunk:', chunk.length);
});

// Writing to file as stream
const writeStream = createWriteStream('/path/to/output.txt');
writeStream.write('Hello, ');
writeStream.write('World!');
writeStream.end();
```

### File Permissions
```typescript
// Change file permissions (Unix-like systems)
await fs.chmod('/path/to/file.txt', 0o755);

// Change file ownership (Unix-like systems, requires appropriate permissions)
await fs.chown('/path/to/file.txt', uid, gid);
```

### Temporary Files
```typescript
import { join } from 'path';
import { tmpdir } from 'os';

// Create temporary file
const tempDir = tmpdir();
const tempFile = join(tempDir, 'temp-file.txt');
await fs.writeFile(tempFile, 'Temporary content');

// Always clean up temporary files
try {
  // ... use temporary file
} finally {
  await fs.unlink(tempFile);
}
```

## Best Practices

### 1. Always Handle Errors
```typescript
// Good: Proper error handling
try {
  const data = await fs.readFile('/path/to/file.txt', 'utf-8');
  return data;
} catch (error) {
  console.error('Failed to read file:', error);
  throw error;
}

// Bad: No error handling
const data = await fs.readFile('/path/to/file.txt', 'utf-8');
```

### 2. Use Absolute Paths
```typescript
import { join } from 'path';

// Good: Absolute path
const filePath = join(process.cwd(), 'data', 'file.txt');
await fs.readFile(filePath, 'utf-8');

// Bad: Relative path (can cause issues with working directory)
await fs.readFile('./data/file.txt', 'utf-8');
```

### 3. Ensure Directories Exist
```typescript
async function ensureDirectoryExists(dirPath: string) {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

// Use before writing files
const filePath = '/path/to/nested/file.txt';
await ensureDirectoryExists(path.dirname(filePath));
await fs.writeFile(filePath, 'content');
```

### 4. Clean Up Resources
```typescript
async function processFile(filePath: string) {
  let tempFile: string | null = null;
  
  try {
    tempFile = join(tmpdir(), `temp-${Date.now()}.txt`);
    
    // Process file operations
    await fs.copyFile(filePath, tempFile);
    // ... more operations
    
  } catch (error) {
    console.error('Processing failed:', error);
    throw error;
  } finally {
    // Always clean up
    if (tempFile) {
      try {
        await fs.unlink(tempFile);
      } catch {
        // Ignore cleanup errors
      }
    }
  }
}
```

### 5. Use Appropriate Encoding
```typescript
// For text files, always specify encoding
const textContent = await fs.readFile('/path/to/text.txt', 'utf-8');

// For binary files, omit encoding to get Buffer
const binaryData = await fs.readFile('/path/to/image.jpg');
```

## Common Patterns in the Codebase

### Temporary File Processing
```typescript
const TEMP_DIR = join(process.cwd(), 'temp');

async function ensureTempDir() {
  try {
    await fs.access(TEMP_DIR);
  } catch {
    await fs.mkdir(TEMP_DIR, { recursive: true });
  }
}

// Usage in processTimetable.ts
await ensureTempDir();
const tempFilePath = join(TEMP_DIR, `${id}_${filename}`);
await fs.writeFile(tempFilePath, buffer);
```

### Directory Cleanup
```typescript
// Remove directory and all contents
await fs.rm(outputDir, { recursive: true, force: true });
```

### File Existence Check
```typescript
// Modern way to check if file exists
try {
  await fs.access(filePath);
  // File exists
} catch {
  // File doesn't exist
}
```

## Performance Considerations

1. **Use Streams for Large Files**: Avoid loading large files entirely into memory
2. **Batch Operations**: Use `Promise.all()` for parallel file operations
3. **Avoid Sync Methods**: Never use synchronous methods in production server code
4. **Clean Up**: Always remove temporary files and close streams
5. **Use Appropriate Buffer Sizes**: For streaming, consider optimal chunk sizes

## Security Considerations

1. **Validate Paths**: Always validate and sanitize file paths from user input
2. **Check Permissions**: Ensure your application has necessary file permissions
3. **Limit File Sizes**: Implement file size limits to prevent abuse
4. **Use Temporary Directories**: Store temporary files in secure temporary directories
5. **Clean Up**: Always remove temporary files, especially those containing sensitive data

## Error Handling

Common fs errors and how to handle them:

```typescript
async function safeFileOperation(filePath: string) {
  try {
    return await fs.readFile(filePath, 'utf-8');
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('File not found');
      return null;
    } else if (error.code === 'EACCES') {
      console.log('Permission denied');
      throw new Error('Insufficient permissions to read file');
    } else if (error.code === 'EISDIR') {
      console.log('Path is a directory, not a file');
      throw new Error('Expected file, got directory');
    } else {
      console.error('Unexpected file system error:', error);
      throw error;
    }
  }
}
```

This comprehensive guide covers the essential aspects of working with the Node.js fs module, following the patterns used in your timetable processing implementation.