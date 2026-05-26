# Context
I want to rework the time window parameter I used in my HomeTracker app.

This parameter allows the frontend to request the history of my environmental sensors to the backend.
Today we have a fixed list of allowed time windows ('3h', '1d', '6m', ...) which is repeated in the backend and the front end.
We used a fixed list for caching reasons because the data used to be accessible from a public endpoint. This endpoint doesn't exist anymore so we don't have caching anymore.

Removing caching allows us to improve the time window parameter by giving the user more flexibility.
What we want now is:

- Have the backend accept a real time window with 2 timestamps `{ startDate: number; endDate: number}`  and retrieve the data accordingly
- Have the front end offer a clean interface to the user to choose these dates.

For now all the code considers that the end of the time window is "now", with the new system that will change.

# Code references

```
/* Backend */
// Service layer fetching the data in ELK
// TODO: Automatic bucketing
// TODO: Remove fixed type for `window`
back/src/libs/modules/homeTracker/services/getHistogramData.ts

// Types for the service layer
// TODO: Create new TimeWindow type here
back/src/libs/modules/homeTracker/types.ts

// API endpoint to get the data
// TODO: Update the input schema for the TimeWindow parameter
back/src/libs/routes/homeTracker/histogramData.ts

// API endpoint tests
// TODO Update to the new time window format
// TODO Might need more validation tests
back/tests/routes/homeTracker/histogramData/histogramData.test.ts

/* Frontend */
// The API layer which shouldn't change (the type update will bubble up to upper layer)
front/src/lib/HomeTracker/api.ts

// Svelte component calling the API (through `refreshData`) and displaying the results
// The handling of the timewindow is done by child components
front/src/routes/(apps)/home-tracker/components/SensorsHistogram.svelte

// The component allowing the user to pick a window
// The time window is written in a store that SensorsHistogram.svelte reads
// TODO Update the UI from a select list to a number input + a select input for the unit (hour, day...)
front/src/routes/(apps)/home-tracker/components/TimeWindowSelection.svelte

//update  The store containing the time window, persited to local storage so that user finds
// their config back between sessions
// TODO: Update to new type, keep the same default 1 day
// TODO: Add a test for old values (plain strings), if one is found replace with the default new format value
front/src/routes/(apps)/home-tracker/store.ts
```

## Design points

Not all of these points are final we need to validate them first

## Automatic bucketing

In the backend service layer we need to choose how many buckets ELK will use to retrieve the data.
For now we have a fix number defined for each possible time window.

Ideally we can use an ELK "autobucket" feature if it exists. We need to check how it would work.

If this feature doesn't exists or can't be used we need to define how the bucket will be chosen.

This change must happen first, implemented with the current fixed time window parameter but the new logic. And we must check the tests and make sure they are 1. correct 2. exhaustive


## Front end progressive update

To allow us to test the changes progressively the front will start by keeping the `select` list in  `TimeWindowSelection` and implement a temporary logic to generate the new time window based on this value.

Then once the change is validated we will implement a better interface but this is for another session.


## API logging

The API code uses our custom logger `slog` which has typed logged properties. We should make sure we add sufficient logging for monitoring but not create noise.

# Identified tasks
## Backend
- Create a single `TimeWindow` type and make sure it is used everywhere it's needed.
- Update `getHistogramData` in the services layer
    - Accept the new type
    - Add the `endDate` to the ELK query params. This will require:
        - A new API error
        - At least 2 new tests: ok and endDate before startDate
- Update the endpoint handler and its input schema
- Review all tests involved and identify potentially missing but meaningful tests.

## Front end

- Clean up unused `TimeWindowPublic` type in  @front/src/lib/HomeTracker/types.ts and rework `TimeWindow`
- Update the store `front/src/routes/(apps)/home-tracker/store.ts` and it's stored value. We will need to handle users who already have a localstorage with this param: If the stored value is a string we ignore it
- @front/src/routes/(apps)/home-tracker/components/TimeWindowSelection.svelte will need to change: Here we will keep the existing list of preset values and we will dynamically compute the timestamps to be forwarded to the parent component
- @front/src/routes/(apps)/home-tracker/components/SensorsHistogram.svelte and @front/src/routes/(apps)/home-tracker/components/SensorsSummary.svelte use the timewindow we'll need to adapt them to the new type

