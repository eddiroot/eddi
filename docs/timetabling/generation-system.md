# Timetable Generation System Documentation

## Overview

The timetable generation system in EDDI integrates with FET (Free Timetabling Software) to automatically generate optimized school timetables. The system uses a containerized approach with Docker to run FET in an isolated environment, providing a queue-based processing system for handling multiple timetable generation requests.

## Architecture

The timetable generation system consists of several key components:

### 1. Frontend Interface

- **Location**: `/src/routes/admin/timetables/[timetableId]/generate/+page.svelte`
- **Purpose**: Provides the user interface for initiating timetable generation
- **Functionality**:
  - Displays timetable configuration options
  - Triggers the generation process via API call
  - Shows generation status and results

### 2. Server Actions

- **Location**: `/src/routes/admin/timetables/[timetableId]/generate/+page.server.ts`
- **Purpose**: Handles form submissions and server-side timetable generation logic
- **Process**:
  1. Validates user permissions (school admin only)
  2. Collects timetable data from database
  3. Builds FET XML input using `buildFETInput()`
  4. Uploads XML to object storage
  5. Calls the FET API to initiate processing

### 3. API Endpoint

- **Location**: `/src/routes/api/timetables/generate/+server.ts`
- **Methods**: `POST`, `GET`
- **POST Functionality**:
  - Receives timetable generation requests
  - Validates FET Docker service availability
  - Creates queue entries for processing
  - Triggers asynchronous processing
- **GET Functionality**:
  - Returns FET service status

### 4. Queue Processing System

- **Location**: `/src/scripts/processTimetable.ts`
- **Purpose**: Processes timetable generation requests asynchronously
- **Features**:
  - Prevents concurrent processing
  - Handles Docker container interaction
  - Manages temporary file operations
  - Updates queue status throughout the process

### 5. FET Docker Service

- **Location**: `/src/lib/server/services/fet-docker.ts`
- **Purpose**: Provides Docker container management for FET operations
- **Container**: `eddi-fet-1` (defined in docker-compose.yml)

### 6. Utility Functions

- **Location**: `/src/routes/admin/timetables/[timetableId]/generate/utils.ts`
- **Key Functions**:
  - `buildFETInput()`: Converts database data to FET XML format
  - `processFETOutput()`: Parses FET results back to database format

## Process Flow

### Step 1: User Initiation

1. School admin navigates to the timetable generation page
2. Clicks "Generate Timetable" button
3. Frontend makes API call to `/api/timetables/generate`

### Step 2: Data Collection and Validation

```typescript
// Collect all required timetable data
const [
  timetableDays,
  timetablePeriods,
  studentGroups,
  activities,
  buildings,
  spaces,
  teachers,
  subjects,
  school,
  activeConstraints
] = await Promise.all([...]);
```

### Step 3: FET XML Generation

The system converts database timetable data into FET-compatible XML format:

```typescript
const xmlContent = buildFETInput({
	timetableDays,
	timetablePeriods,
	studentGroups,
	activities,
	buildings,
	spaces,
	teachers,
	subjects,
	school,
	activeConstraints
});
```

### Step 4: Queue Management

1. XML content is uploaded to object storage
2. Queue entry is created in database
3. Queue processing is triggered asynchronously

### Step 5: Docker Container Processing

```bash
# Copy input file to container
docker cp "${tempFilePath}" eddi-fet-1:/tmp/input_file.fet

# Create output directory in container
docker exec eddi-fet-1 mkdir -p /tmp/output_dir

# Execute FET processing
docker exec eddi-fet-1 fet-cl --inputfile="/tmp/input_file.fet" --outputdir="/tmp/output_dir" --htmllevel=7

# Copy results back to host
docker cp eddi-fet-1:/tmp/output_dir/. "${localOutputDir}/"
```

### Step 6: Result Processing

1. FET output files are copied back from container
2. Generated timetable data is parsed using `processFETOutput()`
3. Results are stored in database via `createTimetableFETActivitiesFromFETExport()`
4. Queue status is updated to "completed"
5. Temporary files are cleaned up

## Database Schema

### Queue Table Structure

The system uses a queue-based approach with the following status flow:

- `queued` → `inProgress` → `completed`/`failed`

### Key Tables Involved

- **Timetables**: Core timetable definitions
- **TimetableDays**: Day definitions (Monday, Tuesday, etc.)
- **TimetablePeriods**: Period definitions (Period 1, Period 2, etc.)
- **Activities**: Teaching activities (Subject + Teacher + Students)
- **Buildings & Spaces**: Physical location constraints
- **Constraints**: Timetabling rules and preferences

## Docker Integration

### Container Setup

```yaml
# docker-compose.yml
fet:
  build:
    context: ./fet
    dockerfile: Dockerfile
  restart: unless-stopped
  volumes:
    - fet_temp:/timetables
    - fet_output:/output
  command: tail -f /dev/null # Keep container running
```

### FET Installation

The container includes:

- Ubuntu base image
- FET command-line tool (`fet-cl`)
- Required dependencies for timetable generation

## Error Handling

### Common Error Scenarios

1. **FET Container Not Running**: Service returns 503 status
2. **Invalid Timetable Data**: Validation errors during XML generation
3. **Processing Failures**: FET unable to generate valid timetable
4. **File System Issues**: Temporary file creation/cleanup problems

### Error Recovery

- Automatic fallback to manual queue entry creation
- Comprehensive logging for debugging
- Proper cleanup of temporary files
- Queue status updates for failed operations

## Configuration Options

### FET Parameters

- `--htmllevel=7`: Maximum detail level for HTML output
- `--inputfile`: Path to input FET XML file
- `--outputdir`: Directory for generated output files

### Timeouts

- FET Processing: 20 minutes maximum
- File Operations: 5 minutes maximum
- Container Operations: 1 minute maximum

## Monitoring and Debugging

### Logging Points

1. Queue entry creation
2. Docker container status checks
3. File transfer operations
4. FET execution progress
5. Result processing steps

### Debug Information

- XML structure validation
- Generated file listings
- Processing time measurements
- Error stack traces with context

## Security Considerations

### Access Control

- Only school administrators can generate timetables
- User authentication required for all operations
- School-specific data isolation

### File Security

- Temporary files use unique identifiers
- Automatic cleanup after processing
- Containerized execution prevents host system access

## Performance Considerations

### Optimization Features

- Single queue processing (prevents resource conflicts)
- Asynchronous processing (non-blocking user interface)
- Temporary file cleanup (prevents disk space issues)
- Container reuse (faster execution)

### Scalability Notes

- Queue system supports multiple schools
- Docker container can be scaled horizontally
- Object storage supports large file handling

## Maintenance

### Regular Tasks

1. Monitor queue processing performance
2. Check Docker container health
3. Clean up old temporary files
4. Review error logs for patterns

### Troubleshooting Steps

1. Verify Docker container is running: `docker exec eddi-fet-1 fet-cl --version`
2. Check queue status in database
3. Review application logs for errors
4. Validate input data completeness

## Future Enhancements

### Potential Improvements

1. Real-time progress updates via WebSockets
2. Parallel processing for multiple schools
3. Advanced constraint configuration interface
4. Timetable comparison and versioning
5. Export to various formats (PDF, CSV, ICS)
