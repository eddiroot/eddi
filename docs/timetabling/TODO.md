# TODO list for implementing the timetabling for a given school

## roadmap

- [ ] ensure that all rooms, teachers and students that are in the timetable actually exist in the database and havent been deleted
  - [ ] NOTE: FET will give an error message on return so this can be used and passed back to the user whilst the timetable is being generated
- [ ] Create seeding data for a timetable and the timetables constraints
  - [ ] maybe add more students, subjects and activities for the school
  - [ ] maybe find a fake dataset that has all of the classrooms, their capacities, then the number of students for each year and their respective subjects etc
- [ ] Add ALL of the constraints to the seed data
- [ ] Create forms for all of the constraints
- [ ] Create an information page for the constraints
- [ ] fix the mandatory attribute on all the constraints, not right atm
- [ ] Understand how the api call works with the command line and dockerization
  - [ ] handle the retrieval of the output for the results page
  - [ ] clean up what currently isnt being used.
  - [ ] I want a full day of updating the code to be clean and efficient
- [ ] Create the documentation page for the timetabling process and understandings of how fet works.
- [ ] Make the days option only multiples of 5
- [ ] make other genres of activities to be created
- [ ] fix the deletion of temp generation files
- [x] fix the results page to handle to handle appropriate statistics page
- [x] Showcase the error message to the user if the fet generation fails
  - [ ] should probably showcasae all fet responses (constraints broken etc)
- [x] Fix the results page to now source the data from the timetable draft fet activities rather than passing the html files
- [x] create a way to determine which subjects a teacher can teach, consider this in admin/user
- [ ] create a way for the timetable to roll out to all the actual users (actually populating timetables)
  - [ ] You will need to map the tables correctly
    - [ ] Groups with the same activity tag are the same userClass and then all the sub hours/days/rooms are the different allocations for this class - remember that
- [x] get a way of calling fet-cl through code
- [x] Allow the created constraints to be checked or not if they want to include them in the timetable generation
- [x] Create backend operations to ensure that constraints can be stored in the database against the timetable
- [x] Enable a way to decode the constraints in the timetable to then allow them to be included into the fet file generation
- [x] For certain constraints for example: Teacher Max Hours Daily, there should be a search function that enables the user to search for all teachers in the school. ensure that this teacher isnt already used in one of these constraints.
- [x] Find a way to enable type safety in the forms for each constraint
- [x] implement handling for whether a constraint can be set as active or not (mandatory)
- [x] handle the repeatablity of certain constraints
- [x] what is the constraint to ensure that activities must be assigned to rooms?
  - [x] add fk constraint to the fetActivity table
- [x] Timetable generation id?
  - [x] can a timetable have multiple generations?
  - [x] I think yes but how do we showcase this.......
- [x] fix the fet activity table to handle years, groups (already done) and then subgroups.
- [x] Fix the groups/students page of the timetabling
  - [x] then depending on the student grouping, ensure that every student is assigned a fetactivity for that grouping
  - [x] add prefixed to the id's to determine the type of Student Group in the tt

## UI Uplifts

- [ ] show the semester that the timetable is for in the timetables page
- [ ] showcase when timetable cannot be created due to unique constraint
- [ ]

## BUGS

- [ ] deleting one constraint of the same type deletes them all
- [ ] Updating activities does something weird to the teachers
  - [ ] only teachers that teach that subject should be allowed to be assigned to that subject
