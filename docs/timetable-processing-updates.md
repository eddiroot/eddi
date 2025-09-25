# Timetable Processing System Updates

## Overview
This document outlines the improvements made to the timetable processing system, focusing on enhanced logging, object storage integration, and Docker volume optimization.

## Changes Made

### 1. Enhanced Console Logging (`processTimetable.ts`)

#### Structured Logging Format
- **Prefix System**: All log messages now use `[TIMETABLE PROCESSOR]` or `[CLEANUP]` prefixes for easy identification
- **Emoji Indicators**: Visual indicators for different types of operations:
  - 🚀 Process start
  - 🔍 Information gathering
  - ✅ Success operations
  - ⚠️  Warnings
  - ❌ Errors
  - 🐳 Docker operations
  - ☁️  Object storage operations
  - 🧹 Cleanup operations

#### Detailed Progress Tracking
- **Timestamps**: Process start and completion times with duration calculations
- **File Information**: Detailed logging of file sizes, paths, and processing status
- **Docker Operations**: Step-by-step logging of container interactions
- **Error Context**: Comprehensive error logging with stack traces and operation context

#### Performance Monitoring
```typescript
const startTime = Date.now();
// ... operations
const totalTime = Date.now() - startTime;
console.log(`Process completed in ${(totalTime / 1000).toFixed(2)} seconds`);
```

### 2. Object Storage Integration

#### Output File Storage
- **FET Output Files**: All generated `.fet` files are now stored in object storage under `schools/{schoolId}/outputs/`
- **HTML Output Files**: Generated HTML timetable files are also uploaded to object storage
- **Unique Naming**: Generated files use timestamped unique names to prevent conflicts

#### Storage Structure
```
schools/
├── {schoolId}/
│   ├── {input-files}.fet          # Input files for processing
│   └── outputs/
│       ├── timetable_{id}_output_{timestamp}_{random}.fet
│       └── {id}_{filename}.html
```

#### Implementation Details
```typescript
// Upload FET output to object storage
const outputFileName = generateUniqueFileName(`timetable_${queueEntry.id}_output.fet`);
const outputObjectKey = `${schoolId}/outputs/${outputFileName}`;

await uploadBufferHelper(
    Buffer.from(fetFileContent, 'utf-8'),
    'schools',
    outputObjectKey,
    'application/xml'
);
```

### 3. Docker Volume Optimization

#### Removed Persistent Volumes
- **Before**: Used persistent Docker volumes (`fet_temp`, `fet_output`) for file storage
- **After**: Removed these volumes from `docker-compose.yml` as they're no longer needed

#### Container-Only Processing
- Files are now processed entirely within the container's temporary filesystem
- Output files are extracted via Docker commands and stored in object storage
- No persistent storage needed on the host system

#### Updated Docker Compose
```yaml
fet:
  build:
    context: ./fet
    dockerfile: Dockerfile
  restart: unless-stopped
  command: tail -f /dev/null  # Keep container running
  networks:
    - default
  # Removed: volumes section
```

### 4. Improved Error Handling

#### Granular Error Tracking
- **Operation-Specific Errors**: Different error handling for each processing stage
- **Context Preservation**: Error messages include relevant context (queue ID, school ID, file names)
- **Cleanup on Failure**: Automatic cleanup of temporary files even when operations fail

#### Error Logging Example
```typescript
console.error('📊 [TIMETABLE PROCESSOR] Error details:', {
    message: processingError instanceof Error ? processingError.message : 'Unknown error',
    stack: processingError instanceof Error ? processingError.stack : undefined,
    queueEntryId: queueEntry.id,
    schoolId: queueEntry.school.id,
    fileName: queueEntry.fileName
});
```

### 5. Cleanup System Enhancement

#### Dedicated Cleanup Function
- **Centralized**: Single `performCleanup()` function handles all cleanup operations
- **Robust**: Continues cleanup even if individual operations fail
- **Comprehensive**: Cleans both local and container temporary files

#### Cleanup Operations
1. Remove local temporary files
2. Remove container input files
3. Remove container output directories
4. Log cleanup progress and failures

## Benefits

### 1. Debugging and Monitoring
- **Visibility**: Complete visibility into processing pipeline
- **Performance**: Easy identification of bottlenecks
- **Troubleshooting**: Detailed error context for quick problem resolution

### 2. Storage Efficiency
- **Scalability**: Object storage scales automatically
- **Persistence**: Output files persist beyond container lifecycle
- **Accessibility**: Files accessible via web URLs for download/viewing

### 3. System Reliability
- **Resource Management**: No disk space issues from accumulated temporary files
- **Container Independence**: Processing not dependent on persistent volumes
- **Failure Recovery**: Robust cleanup prevents resource leaks

### 4. Maintainability
- **Structured Code**: Clear separation of concerns with dedicated functions
- **Error Handling**: Comprehensive error handling prevents silent failures
- **Documentation**: Detailed logging serves as runtime documentation

## File Structure Changes

### Modified Files
- `src/scripts/processTimetable.ts` - Enhanced with logging and object storage
- `docker-compose.yml` - Removed unnecessary volumes

### New Files
- `docs/fs-module-guide.md` - Comprehensive guide to Node.js fs module usage

## Future Considerations

### Monitoring Integration
The detailed logging system is ready for integration with monitoring tools:
- **Log Aggregation**: Logs can be parsed by tools like ELK stack
- **Alerting**: Error patterns can trigger alerts
- **Metrics**: Processing times can be tracked for performance monitoring

### Storage Management
Consider implementing:
- **Retention Policies**: Automatic cleanup of old output files
- **Compression**: Compress stored files to save space
- **Access Logging**: Track file access for usage analytics

### Performance Optimization
Future improvements could include:
- **Parallel Processing**: Process multiple queued items simultaneously
- **Streaming**: Stream large files instead of loading into memory
- **Caching**: Cache frequently used configuration data