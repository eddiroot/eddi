# Roadmap

## eddi

### Done

- [x] Create lessons with drag'n'drop blocks
- [x] Create lessons based on textbooks, slides, PDFs, images, etc
- [x] Discussions (subject level)
- [x] View your timetable
- [x] Live whiteboards
- [x] AI Tutor "eddi" (teaching focus, not giving answers)
- [x] Class announcements
- [x] Order topics and lessons within them
- [x] Proper rich text editor
- [x] Setup object storage
- [x] Admin dashboard
- [x] Add draggable interactive components such as matching
- [x] Move home above discussion in sidebar if only 1 class
- [x] Roll call / attendance
- [x] Sick/not coming to school/absence
- [x] Absence notifications
- [x] Behavioural reporting (visible to parents)
- [x] Auto generated summaries of discussions
- [x] Option for teachers to disable eddi AI on a task
- [x] Onboarding flow (14/07)
- [x] Switch locations to buildings and rooms
- [x] Basic timetabling (Frontend/Backend)
- [x] Basic timetabling (Generation)
- [x] Basic timetabling (Processing)
  - [x] Learn how to use fet-cl to automate it [see arch package here](https://aur.archlinux.org/packages/fet-timetabling)
  - [x] Add a constraint to disable multiple activities of same subject on same day
- [x] Coursemap flow
- [x] Fix lesson generation with learning areas and content
- [x] Admin dashboard allocations page

### Doing

All

- [ ] Security review e.g. prompt injection (Late October)
- [ ] Content security policy in `svelte.config.js`
- [ ] Check uniqueness rules on tables (Late October)
- [ ] Home pages and feature pages

Lachie

- [ ] Teachers can see past attendance (21/08)
- [ ] Google/Okta Auth (28/08)

Max

- [ ] Basic timetabling (Import) (07/08)
  - [x] Convert the data-and-timetable file to an activities object with all required fields
  - [ ] Generate page shows loading state while generating
  - [ ] Result screen blocked until a timetable is generated
  - [x] Result screen shows you stats and a preview of the generated timetable
    - [ ] See html files for the specific fields to include
- [ ] Events appearing in everyone's timetables (14/08)
  - [ ] enable week by week viewing of the timetable
- [ ] Class space shifts (21/08)
  - [ ] changing spaces and handling of this
- [ ] Excursions (permission forms)
  - [ ] potential AI generation of form
  - [ ] maybe change color of event in calendar once form is signed

Jack

- [ ] Class tests / quizzes (23/07)
- [ ] AI feedback / assisted marking
- [ ] View students work

Raph

- [x] Class resources (14/07)
  - Improve (remove upload route?)
  - Title and description truncation issue
- [x] Class home page (20/07)
  - Improve look and functionality
  - Fix ordering and resource tag
- [ ] Better whiteboard (20/07)
  - undo/redo
  - Fix colour options/view + tooltip, colour options popout instead of in menu?
  - shape boarder width change issues
  - add shape roundness option
  - layering options?
- [ ] Student reports live throughout semester (10/08)
  - [ ] creating a profile page for the students
- [ ] Student/lesson analytics (20/08) (use mock data for now - waiting for eddi study)
- [ ] Associate chatbot chats with the lesson/subject they were created in (31/08)

Beej

- [ ] Parent/teacher interviews (21/07)
- [ ] Teacher to parent comms (one way) (28/07)
- [ ] Security research and compliance documentation (28/08)

Blake

- [ ] Handling of multiple campuses
- [ ] A what to do button to generate study ideas (04/08)
- [ ] Create school news
- [ ] News feed
- [ ] Queue for email sending so it doesn't block requests
- [ ] Subject selection (see example lessons, choose your subjects as a student)
- [ ] Fleshed out behavioural reporting (see toddle)

Bella

- [ ] Move websocket code for presentations closer to where it's needed in file structure
- [ ] Add/refine current task components (new question and answer type component)
- [ ] Fees / breakdowns
- [ ] See teacher's feedback

Pending eddi study completion

- [ ] Student note writing (30/08)
- [ ] Complete LLM access to discussions + lessons
- [ ] Lesson plans / teacher notes based on generated lesson
- [ ] Advanced timetabling (30/08)
  - [ ] Timetable constraint handling (e.g. preferred lab space for science subject)
  - [ ] When transitioning from grouped by classes to grouped by preferences, we need to create groups for all of the students with the same preferences for efficiency and to ensure their classes are scheduled at the same time.

### Future

- [ ] Interactive map of locations in the school with directions
- [ ] Exam timetabling
- [ ] Subtype for Assessments (SAC?)
- [ ] Export all data for a given school
- [ ] Premade math symbols to insert in rich text editor
  - Option in RTE toolbar brings up a modal
  - Clicking on a formula in the modal inserts it into the editor
- [ ] Check-in check-out software (compass does this)
- [ ] Workspaces (like VMs but for coding)
- [ ] App-wide search
- [ ] Club pages / discussions
- [ ] Whole school metrics
- [ ] Class chat
- [ ] Video meetings
- [ ] AI presentations
- [ ] Notifications for high interaction with discussion (eg 10 upvotes)
- [ ] Plagiarism detection
- [ ] Lesson / class plan marketplace
- [ ] Contractors signing in with working with childrens checks (eg school photographers)
- [ ] Keyboard shortcuts
- [ ] Parent forum / teacher forum
- [ ] Mark absence for select periods of the day rather than whole day
- [ ] Add per-school theming [with this](https://github.com/huntabyte/shadcn-svelte/discussions/1124)

## eddi study

### Done

### Doing

Shippable by 31/08!

Jack and Bella and Lachie

- [ ] Teach me (skills/lessons)
  - [ ] task blocks
    - Maths
      - [ ] Graph/plot
      - [ ] table
      - [ ] arithmotic/formula (handling maths in a friendly way)
    - Science
      - [ ] image
      - [ ] diagram? (with movable or input box)
    - Written/English
      - [ ] highlight what is wrong
      - [ ] text, highlight the quotes that match themes
      - [ ] fill in the sentance (middle of the paragraph)
      - [ ] integrate correct quote
      - ... open to more.
- [ ] Train me
  - [ ] Cue card generation
  - [ ] Feedback
  - [ ] Sample questions
- [ ] Test me
  - [ ] Improvement assessment generation
  - [ ] Marking/grading/feedback
- [ ] Improved chatbot
- [ ] Tiers
  - [ ] Free tiers for the free models
  - [ ] Pay for the better models
