# Roadmap

This list is ordered by priority, with the highest priority at the top and the lowest priority at the bottom.

## MVP

- [x] Create lessons with drag'n'drop blocks
- [x] Create lessons based on textbooks, slides, PDFs, images, etc
- [x] Discussions (subject level)
- [x] View your timetable
- [x] Live whiteboards
- [x] AI Tutor "eddi" (teaching focus, not giving answers)
- [x] Class announcements

## Post MVP

Lachie

- [x] Order topics and lessons within them
- [x] Better rich text editor
- [x] Setup object storage
- [x] Admin dashboard
- [ ] Class tests / quizzes

Max

- [ ] Handling of multiple campuses
- [ ] Exam timetabling
- [ ] Timetabling
- [ ] News feed

Jack

- [x] Add draggable interactive components such as matching
- [ ] AI feedback / assisted marking
- [ ] View students work

Raph

- [ ] Add/refine current components
  - Fix whiteboard component issues and mc alerts and text overflow in question and explanation
  - Expanding the whiteboard
  - Fix whiteboard vertical panning
- [ ] Student/lesson analytics
- [ ] Student reports live throughout semester
- [ ] Associate chatbot chats with the lesson/subject they were created in

Beej + Blake

- [ ] Onboarding flow
- [ ] Onboarding experience (school theming, roles, staff)

Bella

- [ ] Roll call / attendance
- [ ] Sick/not coming to school/absence/late notifications
- [ ] Behavioural reporting
- [ ] Teachers can see attendance
- [ ] Parents can see some/all of the above

## Future Functionality

- [ ] Add per-school theming [with this](https://github.com/huntabyte/shadcn-svelte/discussions/1124)
- [ ] Export all data for a given school
- [ ] Premade math symbols to insert in rich text editor
  - Option in RTE toolbar brings up a modal
  - Clicking on a formula in the modal inserts it into the editor
- [ ] Admin dashboard allocations page
- [ ] Home page
- [ ] A what to do button to generate study ideas
- [ ] Complete LLM access to discussions + lessons
- [ ] Security review e.g. prompt injection
- [ ] Fees / breakdowns
- [ ] Check-in check-out software (compass does this)
- [ ] Workspaces (like VMs but for coding)
- [ ] App-wide search
- [ ] Subject selection (example lessons)
- [ ] Club pages / discussions
- [ ] Excursions (permission forms)
- [ ] Whole school metrics
- [ ] Class chat
- [ ] AI tutor audit trails
- [ ] AI presentations
- [ ] Parent/teacher interviews
- [ ] Create news
- [ ] Notifications for high interaction with discussion (eg 10 upvotes)
- [ ] School map / directions
- [ ] Plagiarism detection
- [ ] Keyboard shortcuts
- [ ] Class location shifts
- [ ] See teacher's feedback
- [ ] Teacher to parent comms (one way)
- [ ] Events appearing in everyone's timetables
- [ ] Lesson / class plan marketplace
- [ ] Auto generated summaries of discussions
- [ ] Contractors signing in with working with childrens checks (eg school photographers)
- [ ] Interactive map of locations in the school

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
