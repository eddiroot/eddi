# TODO list for implementing the timetabling for a given school

## Checks

- [ ] ensure that all rooms, teachers and students that are in the timetable actually exist in the database and havent been deleted
  - [ ] NOTE: FET will give an error message on return so this can be used and passed back to the user whilst the timetable is being generated
- [x] Allow the created constraints to be checked or not if they want to include them in the timetable generation
- [x] Create backend operations to ensure that constraints can be stored in the database against the timetable
- [x] Enable a way to decode the constraints in the timetable to then allow them to be included into the fet file generation
- [x] For certain constraints for example: Teacher Max Hours Daily, there should be a search function that enables the user to search for all teachers in the school. ensure that this teacher isnt already used in one of these constraints.
- [x] Find a way to enable type safety in the forms for each constraint
- [x] Create seeding data for a timetable and the timetables constraints
  - [ ] maybe add more students, subjects and activities for the school
  - [ ] maybe find a fake dataset that has all of the classrooms, their capacities, then the number of students for each year and their respective subjects etc
- [x] implement handling for whether a constraint can be set as active or not (mandatory)
- [x] handle the repeatablity of certain constraints
- [ ] Add ALL of the constraints to the seed data
- [ ] Create forms for all of the constraints
- [ ] Create an information page for the constraints
- [ ] fix the mandatory attribute on all the constraints, not right atm
- [ ] deleting one deletes all fix that
- [x] get a way of calling fet-cl through code
- [ ] Understand how the api call works with the command line and dockerization
  - [ ] handle the retrieval of the output for the results page
  - [ ] clean up what currently isnt being used.
  - [ ] I want a full day of updating the code to be clean and efficient
- [x] Fix the groups/students page of the timetabling
- [ ] Create the documentation page for the timetabling process and understandings of how fet works.
- [x] what is the constraint to ensure that activities must be assigned to rooms?
  - [x] add fk constraint to the fetActivity table
- [ ] fix the results page to handle to handle appropriate statistics page
- [ ] Timetable generation id?
  - [ ] can a timetable have multiple generations?
  - [ ] I think yes but how do we showcase this.......
- [ ] fix the fet activity table to handle years, groups (already done) and then subgroups.
  - [ ] then depending on the student grouping, ensure that every student is assigned a fetactivity for that grouping
