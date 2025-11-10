## Welcome to Max's Guide on timetabling

Firsts things first i just wanted to create this document to ensure that all the findings I find out about timetabling with fet and the intricacies of the software do not go under the rug to accumulate dust.

# Users

In the software, teachers must have qualified subjects to enable them to teach certain activities

The main hierachy of users is as follows:

- Year Levels
  - Groups: Any form of grouped students (usually subjects or even classes)
    - Subgroups: The individual students

Note that in the fet file you will have the following structure:

<Year>
    <Group>
        <Subgroup>
        </Subgroup>  
    </Group>
</Year>

If the student is not in any subgroup then it cannot be referenced inside the file at all. Therefore all students need to be apart of at least one subgroup to then be referenced in any activity. Therefore, it is imperitive to create the one group that contains all the students in it as subgroups.

## Timetable

At the highest level there is a Timetable. This is simply responsible for:

- The school Year its being taught in
- The school Semester its being taught in
  (Basically just the date for when the timetable will run over)

## Timetable Drafts

- Each timetable can have numerous drafts
- Drafts have the following attirbutes that make them unique from each other
  - Days (I think this should be removed to the higher level)
  - Periods
  - Groups
  - Activites
  - Constraints

## Activities

In fet you should think of activities as individual classes. By individual, I mean INDIVIDUAL. To eloborate, if you have 3b Maths that is taught for 1 period by Mr Smith and runs 3 times a week. Then you must specify 3 DIFFERENT ACTIVITES.

Activites are responsible for the following:

- The teacher who teaches the activity
  - There can be more than 1
- The subject that is being taught
- The student set that belongs to this activity
  - This can be any 3 of the substructures:
    - Years
    - Groups
    - Subgroups
- The Duration
  - the number of periods that it takes up at a time
- Total Duration
  - this is the total number of hours that this activity should be taught in a week
  - For the example class above (there would then be a duration of 1 and a total duration of 3)
  - NOTE the following syntax of what this should look like in the final FET file

```xml
<Activity>
    <Teacher>19b8ac86-96a8-4626-bff7-8e407467b43d</Teacher>
    <Teacher>4ecbc191-7c24-476d-adf9-beb5901d9f69</Teacher>
    <Subject>1020</Subject>
    <Students>S86e1631e-875d-41f1-93a7-74ebe5bf1177</Students>
    <Students>S7b3bcfb4-477a-4301-bad5-f9ac28db4cc9</Students>
    <Duration>1</Duration>
    <Total_Duration>3</Total_Duration>
    <Activity_Group_Id>1016</Activity_Group_Id>
    <Active>true</Active>
    <Id>1</Id>
</Activity>
<Activity>
    <Teacher>19b8ac86-96a8-4626-bff7-8e407467b43d</Teacher>
    <Teacher>4ecbc191-7c24-476d-adf9-beb5901d9f69</Teacher>
    <Subject>1020</Subject>
    <Students>S86e1631e-875d-41f1-93a7-74ebe5bf1177</Students>
    <Students>S7b3bcfb4-477a-4301-bad5-f9ac28db4cc9</Students>
    <Duration>1</Duration>
    <Total_Duration>3</Total_Duration>
    <Activity_Group_Id>1016</Activity_Group_Id>
    <Active>true</Active>
    <Id>2</Id>
</Activity>
<Activity>
    <Teacher>19b8ac86-96a8-4626-bff7-8e407467b43d</Teacher>
    <Teacher>4ecbc191-7c24-476d-adf9-beb5901d9f69</Teacher>
    <Subject>1020</Subject>
    <Students>S86e1631e-875d-41f1-93a7-74ebe5bf1177</Students>
    <Students>S7b3bcfb4-477a-4301-bad5-f9ac28db4cc9</Students>
    <Duration>1</Duration>
    <Total_Duration>3</Total_Duration>
    <Activity_Group_Id>1016</Activity_Group_Id>
    <Active>true</Active>
    <Id>3</Id>
</Activity>
```

## Constraints

Firstly I just wanted to note off the back of the activities train of thought that in order to have a location assigned to an activity there must be a constraint for the activities preferred room:

```xml
<ConstraintActivityPreferredRooms>
    <Weight_Percentage>95</Weight_Percentage>
    <Activity_Id>3</Activity_Id>
    <Number_of_Preferred_Rooms>2</Number_of_Preferred_Rooms>
    <Preferred_Room>1003</Preferred_Room>
    <Preferred_Room>1002</Preferred_Room>
    <Active>true</Active>
    <Comments>Preferred rooms for activity 1015</Comments>
</ConstraintActivityPreferredRooms>
```

If they do not have this - THEY DO NOT GET ALLOCATED BY DEFAULT

# How is FET implemented in CODE?????

## What we have:

Once the user has progressed through the entire form of the project we should have the following information:

- The Days which this timetable should be running
- The Times and Periods when this timetable should be running
  - Please note that if the school requires there to be different periods on different days (non-uniform periods throughout the week) then they will need to create 2 separate timetables and combine the results (this can be done but will need some work)
- All the different groups for all the different years
- All the activities (classes) that should be taught throughout the semester
- All the Constraints for the specific timetable

## Making the FET input file:

After all this information is collected, we need to create the FET file (which has an xml like format)

All of this is done after the "Generate Timetable File for Processing" Button is pressed in `/Users/Max/Documents/personal/projects/eddi/src/routes/admin/timetables/[timetableId]/[timetableDraftId]/generate/+page.svelte`:

1. This submits the generateTimetable Formaction
2. Here we gather all the information described above:

```ts
const [
	timetableDays,
	timetablePeriods,
	studentGroups,
	activities,
	buildings,
	spaces,
	teachers,
	subjects,
	school,
	activeConstraints
] = await Promise.all([
	getTimetableDraftDaysByTimetableDraftId(draft.id),
	getTimetableDraftPeriodsByTimetableDraftId(draft.id),
	getAllStudentGroupsByTimetableDraftId(draft.id),
	getEnhancedTimetableDraftActivitiesByTimetableDraftId(draft.id),
	getBuildingsBySchoolId(user.schoolId),
	getSpacesBySchoolId(user.schoolId),
	getUsersBySchoolIdAndType(user.schoolId, userTypeEnum.teacher),
	getSubjectsBySchoolId(user.schoolId),
	getSchoolById(user.schoolId),
	getActiveTimetableDraftConstraintsByTimetableDraftId(draft.id)
]);
```

3. Then we pass it to the buildFETInput function:

```ts
const xmlContent = await buildFETInput({
	timetableDays,
	timetablePeriods,
	studentGroups,
	activities,
	buildings,
	spaces,
	teachers,
	subjects,
	school,
	activeConstraints
});
```

- This function is response for building the entire FET file and must be correct to ensure that the input file that we pass to the fet software is accurate and consistent with what the user wants
- A few important things to note:
  - All the names in the FET file are the id's of the specific object:
    - For example, we see

```xml
<Teacher>
    <Name>87189689-bf01-4754-aef6-41ad190dd841</Name>
    <Target_Number_of_Hours/>
    <Qualified_Subjects>
    <Qualified_Subject>1011</Qualified_Subject>
    </Qualified_Subjects>
</Teacher>
```

AND NOT

```xml
<Teacher>
    <Name>John Smith</Name>
    <Target_Number_of_Hours/>
    <Qualified_Subjects>
    <Qualified_Subject>Maths</Qualified_Subject>
    </Qualified_Subjects>
</Teacher>
```

- It's important to note that for this implementation we run into difficulties with the activites object

## buildFETInput

1. Firstly map all the days into the db with their respective ids
2. Then do the same with the periods and subjects
3. Next, get all the teachers and add them to the Teachers list
   - Again, id's as the names
   - For this you also have to iterate over all the teachers specialisations and add those respective subjects to their "Qualified_Subjects" as seen above
4. Build the Students List with proper hierarchy (Year → Group → Subgroup)
   - The function `buildStudentsList` organizes students by year level
   - Each year level contains groups (identified as `G{groupId}`)
   - Each group contains subgroups for individual students (identified as `S{userId}`)
   - **IMPORTANT**: Students MUST be in subgroups to be referenced in activities
   - The function uses a Map to track unique students across groups within a year level
   - Empty groups (with no students) are still included in the output
5. Build the Activities List with proper splitting
   - Activities are processed through `buildActivitiesList`
   - **CRITICAL**: If a class runs multiple times per week, FET requires SEPARATE activity entries for each instance
   - Example: A class that runs 3 times a week with 1 period each time needs 3 separate `<Activity>` entries
   - The function calculates splits using: `Math.ceil(totalPeriods / periodsPerInstance)`
   - All split activities share the same `Activity_Group_Id` to link them together
   - Each activity gets a unique sequential `Id` starting from 1
   - Activities collect student identifiers from three sources:
     - Groups: `G{groupId}`
     - Year levels: `Y{yearLevel}`
     - Individual students: `S{userId}`
   - **IMPORTANT**: Activities with no teachers OR no students are skipped with a warning
6. Build the Rooms List
   - Maps spaces to FET room format using `buildRoomsList`
   - Each room includes its building reference
   - Default capacity is set to 30 if not specified
   - Rooms are identified by their space ID
7. Build Constraints (Time and Space)
   - Uses `buildConstraintsXML` to process both constraint types
   - Constraints are filtered by type ('time' or 'space')
   - Parameters are parsed from JSON strings if needed
   - Each constraint is added to the appropriate XML object using its FET name
   - **IMPORTANT**: Errors in parsing are caught and logged but don't fail the build
8. Build Preferred Rooms Constraints
   - Uses `buildPreferredRoomsConstraints` to handle activity location preferences
   - **CRITICAL**: Without this constraint, activities DO NOT get rooms assigned by default
   - For each activity with location preferences:
     - Find all split instances of that activity in the activities list
     - Create a `ConstraintActivityPreferredRooms` entry for each instance
     - Include all preferred room IDs for that activity
   - Weight percentage is set to 95% (soft constraint but highly preferred)
   - These constraints are added to the `Space_Constraints_List`
9. Build the final XML structure
   - Assembles all components into the FET XML format
   - Includes metadata: version (7.3.0), institution name, and credits
   - Uses `XMLBuilder` with specific options:
     - `ignoreAttributes: false` - preserves XML attributes
     - `format: true` - creates readable formatted XML
     - `suppressEmptyNode: true` - removes empty nodes
     - `attributeNamePrefix: '@_'` - prefixes attributes with @\_
   - Returns the complete XML string ready for FET processing

### Important Gotchas

1. **All names in FET are IDs, not human-readable names**
   - Teacher names are UUIDs, not "John Smith"
   - Subject names are numeric IDs, not "Mathematics"
   - This is critical for data integrity and lookup
2. **Activity splitting is automatic but specific**
   - The function calculates splits based on total periods vs periods per instance
   - All splits share the same `Activity_Group_Id`
   - Each split gets a unique `Id` that must be sequential
3. **Student hierarchy is strict**
   - Students in no subgroup = cannot be used in activities
   - The hierarchy must be Year → Group → Subgroup
   - Even individual students must be wrapped in this structure
4. **Room constraints are NOT automatic**
   - FET will not assign rooms unless explicitly constrained
   - The `ConstraintActivityPreferredRooms` must be generated separately
   - This applies to EVERY activity instance (including splits)
5. **Constraint parameters are stored as JSON**
   - Must be parsed from strings when building XML
   - Errors are caught and logged but don't break the build
   - Each constraint type has its own XML section

Once this xml file has been build, it then gets passed into the api/timetables/generate endpoint with:

- The timetable id
- The draft object itself
- the generated xml content

## API Endpoint generation

This post request does the following.

1. Firstly, the user must be authenticated as an admin in order to run it
2. Unpack the json package
3. Create a new DockerService
   - Creates a container called 'eddi-fet-1'
   -
