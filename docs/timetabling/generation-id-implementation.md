# Timetable Processing Updates - Generation ID Support and Database Integration

## Summary

Successfully implemented unique generation identification and database processing features for the timetable processing system.

## ✨ Key Features Implemented

### 1. **Unique Generation Identification**
- **API Integration**: Generation ID is created when API endpoint is called
- **File Structure**: Object storage now uses `{schoolId}/{timetableId}/{generationId}/input|output/` hierarchy

### 2. **Enhanced File Storage Structure**
```
schools/
├── {schoolId}/
│   ├── {timetableId}/
│   │   │   ├── input/
│   │   │   │   └── sch_id{schoolId}_tt_id{timetableId}_gen_{generationId}.fet
│   │   │   └── output/
│   │   │       ├── data_and_timetable.fet
│   │   │       ├── activities.xml
│   │   │       ├── *.html
│   │   │       ├── *.csv
│   │   │       └── ... (all FET outputs)
│   │   │   ├── input/
│   │   │   └── output/
│   │   └── ...
```

### 3. **Automated Database Processing**
- **File Detection**: Automatically identifies `data_and_timetable.fet` and `activities.xml` files during upload
- **XML Processing**: Uses `FETActivityParser` from `utils.ts` to parse and validate XML content
- **Database Population**: Automatically populates `fetActivity` table with parsed data
- **Error Handling**: Database processing failures don't fail the entire timetable generation
- **Comprehensive Logging**: Detailed logging for database processing steps

### 4. **Enhanced Logging System**
- **Structured Prefixes**: Clear categorization with emoji indicators
- **Detailed Tracking**: Generation ID, school ID, and timetable ID logged at each step
- **Database Processing**: Separate logging category for database operations
- **Error Details**: Comprehensive error reporting with context information

## 📋 Files Modified

### Core Processing File
**`src/scripts/processTimetable.ts`**
- Added generation ID extraction from queue entry
- Updated file download to use generation ID structure
- Enhanced file upload loop with database file tracking
- Integrated `FETActivityParser` for automatic database population
- Comprehensive error handling and logging

### Database Schema
**`src/lib/server/db/schema/timetables.ts`**
- Added `generationId` field to `timetableQueue` table
- Updated queue entry creation functions

### Database Services
**`src/lib/server/db/service/timetables.ts`**
- Updated `createTimetableQueueEntry()` to accept generation ID
- Modified `getOldestQueuedTimetable()` to return generation ID
- Enhanced queue management with generation tracking

### API Endpoint
**`src/routes/api/timetables/generate/+server.ts`**
- Generation ID creation using `Date.now()`
- Updated object storage path to use generation ID structure
- Enhanced response to include generation ID information

### Object Storage Functions
**`src/lib/server/obj.ts`**
- Enhanced `getFileFromStorage()` to support generation ID parameter
- Backward compatibility with old structure
- Generation ID integration in file operations

### XML Processing Utilities
**`src/scripts/utils.ts`**
- `FETActivityParser` class for XML parsing and database insertion
- Support for `activities.xml` and `data_and_timetable.fet` files
- Validation and batch insertion capabilities
- Error handling and detailed logging

## 🚀 Processing Workflow

### Phase 1: Generation Request
1. User initiates timetable generation
2. System creates unique generation ID (`Date.now()`)
3. FET XML content uploaded to `{schoolId}/{timetableId}/{generationId}/input/`
4. Queue entry created with generation ID
5. Processing queue triggered

### Phase 2: FET Processing
1. Queue processor extracts generation ID from queue entry
2. Downloads input file using generation ID structure
3. Processes timetable with FET Docker container
4. Uploads ALL output files to `{schoolId}/{timetableId}/{generationId}/output/`

### Phase 3: Database Processing (NEW)
1. Tracks `data_and_timetable.fet` and `activities.xml` during file upload
2. When both files are found, triggers database processing
3. Uses `FETActivityParser` to parse XML content
4. Validates parsed data and inserts into `fetActivity` table
5. Continues even if database processing fails

### Phase 4: Completion
1. Marks queue entry as completed
2. Performs cleanup of temporary files
3. Comprehensive logging of entire process

## 🔧 Technical Details

### Generation ID Implementation
```typescript
// API Endpoint - Generation ID Creation
const generationTimestamp = Date.now();
const generationId = `${generationTimestamp}`;

// Queue Entry
await createTimetableQueueEntry(timetableId, user.id, uniqueFileName, generationId);

// Processing - Extract from Queue
const generationId = queueEntry.generationId;

// File Operations
const fileBuffer = await getFileFromStorage(schoolId, timetableId, fileName, true, generationId);
const outputObjectKey = `${schoolId}/${timetableId}/${generationId}/output/${fileName}`;
```

### Database Processing Implementation
```typescript
// Track specific files during upload loop
let dataAndTimetableFetContent = '';
let activitiesXmlContent = '';

if (fileName === 'data_and_timetable.fet') {
    dataAndTimetableFetContent = fileContent.stdout;
} else if (fileName === 'activities.xml') {
    activitiesXmlContent = fileContent.stdout;
}

// Process files if both are available
if (dataAndTimetableFetContent && activitiesXmlContent) {
    const { FETActivityParser } = await import('./utils.js');
    const parser = new FETActivityParser();
    await parser.parseAndPopulateWithValidation(
        activitiesXmlContent,
        dataAndTimetableFetContent,
        parseInt(timetableId)
    );
}
```

## ✅ Benefits

### Organization
- **Unique Identification**: Every generation attempt has a unique, trackable identifier
- **Clear Separation**: Input and output files are organized by generation
- **Historical Tracking**: Multiple generation attempts are preserved
- **Easy Debugging**: Generation-specific logs and file organization

### Automation
- **Zero Manual Intervention**: Database processing happens automatically
- **Error Resilience**: Database failures don't break file storage
- **Comprehensive Coverage**: All FET output files are preserved
- **Flexible Processing**: Can process database files later if needed

### Scalability
- **Multiple Generations**: Supports unlimited generation attempts per timetable
- **Concurrent Processing**: Generation ID ensures no conflicts
- **Resource Management**: Proper cleanup and error handling
- **Future Extensibility**: Structure supports additional processing phases

## 🎯 Usage Examples

### Accessing Generation-Specific Files
```typescript
// Get all files for a specific generation
const files = await getTimetableFiles(schoolId, timetableId);

// Download specific file
const fetFile = await getFileFromStorage(
    schoolId, 
    timetableId, 
    'data_and_timetable.fet', 
    false,  // output file
);
```

### Database Query Examples
```typescript
// Get all generations for a timetable
const generations = await getGenerationsForTimetable(timetableId);

// Get FET activities for specific generation
const activities = await getFETActivitiesByGeneration(timetableId);
```

## 🔮 Future Enhancements

### API Endpoints
- `GET /api/timetables/{id}/generations` - List all generations
- `GET /api/timetables/{id}/generations/{genId}/files` - List files for generation
- `GET /api/timetables/{id}/generations/{genId}/activities` - Get database activities

### Generation Management
- **Cleanup Policies**: Automatic removal of old generations
- **Comparison Tools**: Compare different generations
- **Version Control**: Git-like versioning for timetables
- **Performance Analytics**: Track generation success rates and times

### Enhanced Processing
- **Validation Pipeline**: Multi-stage validation of generated timetables
- **Quality Metrics**: Automatic calculation of timetable quality scores
- **Conflict Detection**: Advanced conflict analysis and reporting
- **Optimization Suggestions**: AI-powered timetable improvement suggestions

## ✅ Testing Recommendations

### Unit Testing
- Test generation ID creation and uniqueness
- Verify file storage structure with generation ID
- Test database processing with various XML formats
- Validate error handling for missing files

### Integration Testing
- Complete end-to-end timetable generation flow
- Multiple concurrent generation requests
- File storage and retrieval operations
- Database consistency after processing

### Load Testing
- Multiple schools generating timetables simultaneously
- Large FET output file processing
- Database insertion performance with many activities
- Object storage performance under load

---

The system now provides complete traceability for timetable generation attempts with automatic database processing, making it a robust and scalable solution for educational timetabling needs.