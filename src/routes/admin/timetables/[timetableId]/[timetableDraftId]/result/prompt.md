# PROMPT

Can you please use the svelte 5 mcp tools when creating the UI for this page.

For the following statistics, please refer to some of the pre-existing functions that are present in the server side page but feel free to add function that you believe you need. When refering to the statistics, this should be sourced using the fetactivities for a chosen timetable draft. Please ensure that the user has the ability to choose which draft it wishes to look at and from this, the page should automatically propagate the new data for the newly selected draft.

I want the following statistics:

- A page showing all the Student information using the statistic reports in the server page
  - list the students max hours per day, min hours per day, avg hours per week, avg activities per week, num of days per week
- A page showing all the Teacher information using the statistic reports in the server page
  - list the students max hours per day, min hours per day, avg hours per week, avg activities per week, num of days per week
- A Page showing all the broken constraints in the page (mock data for now)
- A Page where the user can select to see a timetable for a given user and it will show them all of the fet activities that the user has in that week in a simple list
  - Should have an autocomplete component asking for a users first name, last name or email. This should drop down options for the user to select from
- A Page where the user can select to see a timetable for a given Space and it will show them all of the fet activities that the space has in that week in a simple list
  - Should have an autocomplete component asking for a space name. This should drop down options for the user to select from

The user should be able to swap between each of these different pages with ease and it should be obvious what each page does.

Also create an overall statistics page which has a overall metrics about all teachers, all students, all spaces, number of broken constraints etc

Please ensure that you follow consistent styling when creating this page and use proper svelte 5 syntax and best practices.
