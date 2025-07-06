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

- [ ] Class tests / quizzes
- [ ] Order topics and lessons within them
- [ ] Security review e.g. prompt injection
- [ ] Database per school

Max

- [ ] Handling of multiple campuses
- [ ] A what to do button to generate study ideas
- [ ] View news feed
- [ ] Export all data for the organisation

Jack

- [ ] Add draggable interactive components such as matching
- [ ] Student reports live throughout semester
- [ ] View students work
- [ ] Fees / breakdowns

Raph

- [ ] Fix whiteboard component issues and mc alerts and text overflow in question and explanation
- [ ] Complete LLM access to discussions + lessons
- [ ] Home page

Beej

- [ ] Onboarding flow
- [ ] Onboarding experience (theming, roles, staff)
- [ ] Student/lesson analytics
- [ ] School theming (logos, colours)

Blake

- [ ] Roll call / attendance
- [ ] Sick/not coming to school
- [ ] Parents/teachers can see attendance
- [ ] Absence / late notifications
- [ ] Integrate AI feedback / assisted marking
- [ ] Math symbols / formulas

## Future Functionality

- [ ] Lesson / class plan marketplace
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
- [ ] Exam timetabling
- [ ] Timetabling
- [ ] Create news
- [ ] Notifications for high interaction with discussion (eg 10 upvotes)
- [ ] School map / directions
- [ ] Plagiarism detection
- [ ] Keyboard shortcuts
- [ ] Class location shifts
- [ ] See teacher's feedback
- [ ] Teacher to parent comms (one way)
- [ ] Auto generated summaries of discussions
- [ ] Events appearing in everyone's timetables
- [ ] Contractors signing in with working with childrens checks (eg school photographers)

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
