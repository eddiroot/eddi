# Roadmap

This list is ordered by priority, with the highest priority at the top and the lowest priority at the bottom.

## Done

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
- [x] Move home above discussion in sidebar if only 1 class (13/07)
- [x] Roll call / attendance (20/07)

## Doing

All

- [ ] Security review e.g. prompt injection (Late October)

Lachie

- [ ] Teachers can see attendance (23/07)
- [ ] Class tests / quizzes (27/07)
- [ ] Sick/not coming to school/absence/late notifications (27/07)
- [ ] Behavioural reporting (07/08)
- [ ] Parents can see some/all of the above (15/08)
- [ ] Admin dashboard allocations page (20/08)
- [ ] Home page (20/10)

Jack

- [ ] Coursemap flow
- [ ] Fix lesson generation with learning areas and content
- [ ] AI feedback / assisted marking
- [ ] View students work
- [ ] Student note writing

Raph

- [x] Class resources (14/07)
  - Improve (remove upload route?)
- [ ] Class home page (20/07)
- [ ] Better whiteboard (20/07)
  - Fix mc alerts and text overflow in question and explanation
  - Expanding the whiteboard
  - Fix whiteboard vertical panning
- [ ] Student reports live throughout semester (10/08)
- [ ] Student/lesson analytics (20/08)
- [ ] Associate chatbot chats with the lesson/subject they were created in (31/08)

Beej

- [ ] Onboarding flow (14/07)
- [ ] Parent/teacher interviews (21/07)
- [ ] Teacher to parent comms (one way) (28/07)
- [ ] Add per-school theming [with this](https://github.com/huntabyte/shadcn-svelte/discussions/1124) (04/08)

Blake

- [ ] Auto generated summaries of discussions (21/07)
- [ ] Disable eddi AI on lesson/task (28/07)
- [ ] A what to do button to generate study ideas (04/08)

Bella

- [ ] Add/refine current task components (new question and answer type component)
- [ ] Handling of multiple campuses
- [ ] Create school news
- [ ] News feed
- [ ] Fees / breakdowns
- [ ] Complete LLM access to discussions + lessons

Max

- [ ] Timetabling
- [ ] Exam timetabling
- [ ] Events appearing in everyone's timetables
- [ ] Class location shifts
- [ ] See teacher's feedback

## Future

- [ ] Export all data for a given school
- [ ] Premade math symbols to insert in rich text editor
  - Option in RTE toolbar brings up a modal
  - Clicking on a formula in the modal inserts it into the editor
- [ ] Subject selection (see example lessons, choose your subjects as a student)
- [ ] Check-in check-out software (compass does this)
- [ ] Workspaces (like VMs but for coding)
- [ ] App-wide search
- [ ] Club pages / discussions
- [ ] Excursions (permission forms)
- [ ] Whole school metrics
- [ ] Class chat
- [ ] AI presentations
- [ ] Notifications for high interaction with discussion (eg 10 upvotes)
- [ ] Plagiarism detection
- [ ] Lesson / class plan marketplace
- [ ] Contractors signing in with working with childrens checks (eg school photographers)
- [ ] Interactive map of locations in the school with directions
- [ ] Keyboard shortcuts
- [ ] Parent forum / teacher forum

# UI Feedback

## Onboard Screen

- [ ] Hero image should be larger, probably make it the background to section the page and make it look scrollable
- [ ] Key features should come first, e.g. interactive lessons before discussions
- [ ] Add an intro before the feature section
- [ ] Include the name eddi earlier and make it clear.

## Dashboard

- [ ] Consider hierarchy for section i.e timetable should be much clearer and larger than school news, assessments > school news

## Timetable

- [ ] Be able to see future days on timetable
- [ ] Split when events intersect e.g. split classes and school fair to see they are both on at the same time

## Subject Home

- [ ] Again consider hierarchy, dont need contacts to be as large as classes or assessments, remove contacts and move email next to teacher's name at the top

## Discussion

- [ ] If we split announcements with other make it so only teacher can write announcements and rename other to something else
- [ ] Maybe post announcement on class home page

## Lessons

- [ ] Generate image as background for lesson, make sure its of the same styling
- [ ] Stack lessons vertically rather than scroll horizontally as its easier to see

## Lesson Building

- [ ] Title too big
- [ ] Image block shouldn't say edit image when in edit mode
- [ ] Move switch mode button out of the lesson section
- [ ] When in preview mode, hide blocks section and expend lesson section
- [ ] Add tool tip with block name when hovering over it
- [ ] Space that is above the contents, lesson and blocks section should be the same below them

## Lesson Generation

- [ ] Need equal margin at the top and bottom of the page
- [ ] Confusing, thought description was for the prompt
- [ ] Maybe add a prompt section to make specific requests
- [ ] Lesson generation is a bit scuffed, make a fake youtube link and didn't create a lesson for the topic specific in the the title and description when no pdf was uploaded
