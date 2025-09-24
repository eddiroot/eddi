# Timetable Generation - Quick Overview

## How It Works

The EDDI timetable generation system uses **FET (Free Timetabling Software)** running in a Docker container to create optimized school timetables.

## Key Components

1. **Frontend**: Admin interface for triggering generation
2. **API**: REST endpoints for managing requests
3. **Queue System**: Asynchronous processing of timetable jobs
4. **Docker Container**: Isolated FET execution environment
5. **Database Integration**: Stores input data and results

## Process Summary

```
User Request → Data Collection → FET XML Creation → Queue Processing → Docker FET Execution → Results Storage
```

## File Locations

| Component       | File Path                                                    |
| --------------- | ------------------------------------------------------------ |
| Frontend Page   | `/src/routes/admin/timetables/[id]/generate/+page.svelte`    |
| Server Actions  | `/src/routes/admin/timetables/[id]/generate/+page.server.ts` |
| API Endpoint    | `/src/routes/api/timetables/generate/+server.ts`             |
| Queue Processor | `/src/scripts/processTimetable.ts`                           |
| FET Service     | `/src/lib/server/services/fet-docker.ts`                     |
| Utils/Helpers   | `/src/routes/admin/timetables/[id]/generate/utils.ts`        |

## Docker Setup

```yaml
# In docker-compose.yml
fet:
  build:
    context: ./fet
    dockerfile: Dockerfile
  restart: unless-stopped
  command: tail -f /dev/null # Keep running
```

## Execution Flow

### 1. User Action

- Admin clicks "Generate Timetable"
- Frontend calls API endpoint

### 2. Data Preparation

- Collect timetable data from database
- Convert to FET XML format
- Upload to object storage

### 3. Queue Processing

- Create queue entry
- Process asynchronously via Docker
- Update status throughout

### 4. FET Execution

```bash
# Copy input to container
docker cp input.fet eddi-fet-1:/tmp/

# Run FET
docker exec eddi-fet-1 fet-cl --inputfile=/tmp/input.fet --outputdir=/tmp/output/

# Copy results back
docker cp eddi-fet-1:/tmp/output/ ./local-output/
```

### 5. Result Processing

- Parse FET output files
- Store timetable data in database
- Clean up temporary files
- Update queue status to "completed"

## Status Flow

```
queued → inProgress → completed/failed
```

## Error Handling

- **Container Not Running**: Returns 503 service unavailable
- **Processing Failure**: Queue marked as failed, cleanup performed
- **Invalid Data**: Validation errors with detailed messages

## Monitoring Commands

```bash
# Check FET container
docker exec eddi-fet-1 fet-cl --version

# View container logs
docker logs eddi-fet-1

# Check queue status
# (via database queries in application)
```

## Security Notes

- Only school admins can generate timetables
- Files are school-specific and isolated
- Containerized execution prevents host access
- Automatic cleanup of temporary data

## For More Details

See the complete documentation in `generation-system.md`
