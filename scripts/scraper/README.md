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

# Scrape specific subjects
npm run scrape:english
npm run scrape:science

# Scrape all subjects
npm run scrape:all
```

### 2. View Results
```bash
# View scraped data summary
npm run scrape:view
```

### 3. Clear Data (if needed)
```bash
# Clear all scraped data
npm run scrape:clear
```

## Command Reference

| Command | Description |
|---------|-------------|
| `npm run scrape:math` | Scrape Mathematics curriculum |
| `npm run scrape:english` | Scrape English curriculum |
| `npm run scrape:science` | Scrape Science curriculum |
| `npm run scrape:all` | Scrape all available subjects |
| `npm run scrape:view` | View summary of scraped data |
| `npm run scrape:clear` | Clear all scraped data |

## 🏗️ Architecture

### Files Structure
```
scripts/scraper/
├── final-nextjs-scraper.ts    # Main scraper implementation
├── run-scraper.ts             # CLI runner script
├── view-data.ts               # Data summary viewer
├── clear-data.ts              # Data cleanup script
├── db.ts                      # Database connection
└── README.md                  # This documentation
```

## How It Works

### 1. Next.js Data Extraction
The scraper is specifically designed for the VCAA website's Next.js architecture:
- Fetches curriculum pages and extracts JSON data from `__NEXT_DATA__` scripts
- Parses the curriculum data from `pageProps.additionalContent.curriculum.curriculum`
- Extracts VCAA codes, content descriptions, and elaborations for each year level

### 2. Data Processing & Normalization
- Maps VCAA level IDs to readable year levels (F, 1-10, FLA-FLD)
- Organizes content by learning areas and strands
- Validates and cleans content descriptions and elaborations
- Handles both `description` and `contentDescription` fields for compatibility

### 3. Database Population
The scraper populates a normalized schema:
- **curriculum**: Top-level curriculum record (VCAA F-10 v2.0)
- **curriculumSubject**: Subject records (Mathematics, English, Science)
- **learningArea**: Learning area records (Number, Algebra, etc.)
- **learningAreaContent**: Individual content descriptions with VCAA codes
- **contentElaboration**: Detailed elaborations for each content description

## Example Output

After running the scraper, your database contains structured curriculum data:

```
VCAA F-10 Curriculum (v2.0)
├── Mathematics (654 content descriptions)
│   ├── Number (200 content descriptions, 780 elaborations)
│   ├── Algebra (130 content descriptions, 432 elaborations)
│   ├── Measurement (116 content descriptions, 466 elaborations)
│   ├── Space (90 content descriptions, 360 elaborations)
│   ├── Statistics (78 content descriptions, 332 elaborations)
│   └── Probability (40 content descriptions, 150 elaborations)
├── English (293 content descriptions)
│   ├── Language - Language for interacting with others
│   ├── Language - Text structure and organisation
│   ├── Literature - Literature and contexts
│   ├── Literacy - Interacting with others
│   └── ... (14 learning areas total)
└── Science (113 content descriptions)
    ├── Science Understanding - Biological sciences
    ├── Science Inquiry - Questioning and predicting
    └── ... (11 learning areas total)
```

Each content description includes:
- VCAA code (e.g., VC2MFAN01)
- Full description text
- Year level information
- Associated elaborations (detailed examples and explanations)

## Configuration

### Rate Limiting
The scraper includes respectful rate limiting:
- 2 second delay between requests
- Proper User-Agent header
- Handles network errors gracefully

### Extending to New Subjects
To add new subjects, modify `final-nextjs-scraper.ts`:
1. Add the subject to the `subjects` array in `scrapeAll()`
2. Update the URL mapping in `scrapeSubject()` if needed
3. Add the subject mapping in `mapSubjectToLearningArea()`

## Troubleshooting

### Common Issues

**Database connection errors:**
- Ensure your database is running: `npm run db:start`
- Check your `.env` file has correct database credentials

**No data extracted:**
- The VCAA website structure may have changed
- Check console output for specific error messages
- Verify the subject URLs are still valid

**Duplicate data warnings:**
- The scraper safely handles existing data
- Use `npm run scrape:clear` to reset if needed

### Getting Help
Run `npm run scrape:view` to see current database state and verify data extraction.

## Future Enhancements

Potential improvements for additional subjects:
- History, Geography, Civics & Citizenship
- Health & Physical Education
- The Arts, Technologies, Languages
- Enhanced year level detection for specialized subjects
- Incremental updates (only scrape changed content)
- Export/import functionality for curriculum data

## Legal & Ethical Use

This scraper respects the VCAA website:
- Appropriate delays between requests (2 seconds)
- Descriptive User-Agent header
- Only extracts publicly available curriculum content
- Designed for educational purposes

Please ensure your use complies with VCAA's terms of service and copyright requirements.
