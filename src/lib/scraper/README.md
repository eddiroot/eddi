# VCAA F-10 Curriculum Scraper

A robust system to extract the Victorian Curriculum F-10 from the VCAA website and populate a normalized database schema.

## ✅ Status: Complete & Production Ready

**Fully functional!** The scraper successfully extracts comprehensive curriculum data from the VCAA website.

### Database Population Results
- ✅ **Mathematics**: 654 content descriptions, 2,520 elaborations (6 learning areas)
- ✅ **English**: 293 content descriptions, 745 elaborations (14 learning areas)
- ✅ **Science**: 113 content descriptions, 662 elaborations (11 learning areas)
- ✅ **Total**: 1,060 content descriptions and 3,927 elaborations across 31 learning areas

## 🚀 Quick Start

### 1. Run the Scraper
```bash
# Scrape Mathematics curriculum
npm run scrape:math

# Scrape English curriculum
npm run scrape:english

# Scrape Science curriculum
npm run scrape:science

# Scrape all subjects
npm run scrape:all
```

### 2. View Data Summary
```bash
npm run scrape:view
```

### 3. Clear All Data (if needed)
```bash
npm run scrape:clear
```

## 📚 Available Subjects

### Core Subjects
- **Mathematics**: Foundation to Year 10
- **English**: Foundation to Year 10
- **Science**: Foundation to Year 10

### Technologies
- Design and Technologies
- Digital Technologies

### Humanities
- Civics and Citizenship
- Economics and Business
- Geography
- History

### Health & Physical Education
- Health and Physical Education

### Languages (F-10 & 7-10 sequences)
- Chinese (Second Language Learner)
- French
- German
- Indonesian
- Italian
- Japanese
- Korean
- Modern Greek
- Spanish

### The Arts
- Dance
- Drama
- Media Arts
- Music
- Visual Arts
- Visual Communication Design

## 🎯 Example Usage

```bash
# Scrape specific subject groups
npm run scrape -- --technologies    # Design & Digital Technologies
npm run scrape -- --humanities      # History, Geography, etc.
npm run scrape -- --languages       # All 18 language sequences
npm run scrape -- --arts           # All arts subjects
npm run scrape -- --health         # Health & Physical Education

# Scrape individual subjects
npm run scrape -- --mathematics
npm run scrape -- --english
npm run scrape -- --science

# Scrape everything (40+ curricula)
npm run scrape -- --all
```

## 📊 Database Schema

The scraper populates these tables:
- `curriculum` - The VCAA F-10 Curriculum itself
- `curriculum_subject` - Subjects like English, Mathematics, etc.
- `learning_area` - Strands within subjects (e.g., "Language", "Literature")
- `learning_area_content` - Individual content descriptions with VCAA codes
- `content_elaboration` - Elaborations for each content description

## 🔧 Technical Details

### Architecture
- **Parser**: Uses Cheerio to parse VCAA's Next.js JSON data
- **Rate Limiting**: 2-second delays between requests to be respectful
- **Error Handling**: Comprehensive error handling and logging
- **Database**: Uses Drizzle ORM with PostgreSQL

### Data Extraction
The scraper extracts:
- ✅ **Content Descriptions**: The main curriculum requirements
- ✅ **Elaborations**: Detailed explanations and examples
- ✅ **Year Levels**: Foundation to Year 10 coverage
- ✅ **Strands**: Subject-specific learning areas
- ✅ **VCAA Codes**: Official curriculum codes for tracking

### URL Patterns
The scraper knows how to navigate the VCAA website structure:
```
/learning-areas/mathematics/curriculum
/learning-areas/english/english/curriculum
/learning-areas/science/curriculum
/learning-areas/technologies/design-and-technologies/curriculum
/learning-areas/humanities/history/curriculum
/learning-areas/languages/french/curriculum-f-10-sequence
/learning-areas/the-arts/music/curriculum
```

## ⚡ Performance

- **Speed**: ~2 seconds per request (respectful rate limiting)
- **Efficiency**: Single-pass extraction from Next.js JSON data
- **Reliability**: Handles network errors and malformed data gracefully
- **Memory**: Processes one subject at a time to avoid memory issues

## 🛡️ Error Handling

- Network timeouts and retries
- Malformed HTML/JSON handling
- Database constraint violations
- Graceful degradation when data is missing

## 📝 Output Example

```
🚀 Starting VCAA Curriculum Scraper (Complete F-10 Coverage)
============================================================

🔍 Fetching: https://f10.vcaa.vic.edu.au/learning-areas/english/english/curriculum

🎯 Extracting content from Next.js data...
✅ Found Next.js data script
📊 Found 11 curriculum levels
   🔍 Processing Foundation (F)
      ✅ VCELA001: Students listen to and join in with stories... (3 elaborations)
      ✅ VCELA002: Students engage with a variety of texts... (4 elaborations)
   🔍 Processing Year 1 (1)
      ✅ VCELA017: Students listen to and create simple texts... (2 elaborations)

💾 Inserting curriculum data into database...
   ✅ Inserted: VCELA001 with 3 elaborations
   ✅ Inserted: VCELA002 with 4 elaborations
   ✅ Inserted: VCELA017 with 2 elaborations

✅ Found 293 english items
✅ Scraping completed successfully!
```