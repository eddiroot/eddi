# TODO list for implementing the timetabling for a given school

## Checks

- [ ] ensure that all rooms, teachers and students that are in the timetable actually exist in the database and havent been deleted
- [ ] Allow the created constraints to be checked or not if they want to include them in the timetable generation
- [x] Create backend operations to ensure that constraints can be stored in the database against the timetable
- [ ] Enable a way to decode the constraints in the timetable to then allow them to be included into the fet file generation
- [ ] For certain constraints for example: Teacher Max Hours Daily, there should be a search function that enables the user to search for all teachers in the school. ensure that this teacher isnt already used in one of these constraints.
- [x] Find a way to enable type safety in the forms for each constraint
- [x] Create seeding data for a timetable and the timetables constraints
  - [ ] maybe add more students, subjects and activities for the school
- [x] implement handling for whether a constraint can be set as active or not (mandatory)
- [x] handle the repeatablity of certain constraints
