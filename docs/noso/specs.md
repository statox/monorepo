NoSo - A NOt SOcial network for my family

# Project

## Goal
Create a webapp accessible by my family reusing the existing web auth mechanism of this repo.
Keep the code as minimal as possible we aim for a "small web" approach we want to keep things as simple as possible.

## Interface

- One page with the chronological feed of everybody's posts
- One page to create a post
- One page for a single user feed

- A post is associated to one user and timestamped
- A post must contain some text. Max 300 characters
- A post may contain one or more images.

## Data model

- We will create new users in the `User` table which will be used for authentication
    - We don't want to evolve the `User` table. If the NoSo app needs to store additional user data we will create a dedicated
    `NOSO_User` table referencing `User` id.

- New table `NOSO_Post`
    - Represent a post created by a user
    - Can be associated to one or several media in `NOSO_Media` through the `id` column
    - Columns:
        - id: autoincrement number. index
        - userId: Reference to `User` and potential `NOSO_User` tables. index
        - creationDateUnix: Timestamp created by the server
        - updateDateUnix: Timestamp created by the server
        - archiveDateUnix: Null by default, will be set by a `deletePost` endpoint.
            - Used to allow the user to soft delete a post.
            - Soft deleted posts are not visible by any user anymore
            - They are never deleted and their associated media are not changed
        - content: A simple string. We will limit the text to 300 char but we want to occasionally allow larger text. SQL Type TBD
    - Index:
        - We all query the post on `(creationDateUnix, id)` where close (select the 

- New table `NOSO_Media`
    - The images will be stored on R2 using the existing client `back/src/libs/databases/s3.ts`
    - Columns:
        - id: autoincrement number. index
        - postId: The post this media is associated with
        - userId: Reference to `User` and potential `NOSO_User` tables. index
        - creationDateUnix: Timestamp created by the server
        - `s3link`: A link to the S3 bucket similar to what is done in `S3Files` currently
`NOSO_Media` items can be associated with 0 or 1 `NOSO_Post`
`NOSO_Media` items can get orphaned if the client uploaded a media but failed to create a post.
`NOSO_Media` items can be associated with archived `NOSO_Posts`
For now we do not clean up any entry for this table. In a next version we'll create a periodic task for that.
There is no order of the media in the post, for now the client will order them following their id


R2 for file storage
    - Very similar to how its used in clipboard and reactor
    - When the front end needs to get a picture we create a pre-signed link to allow the browser to download directly from S3
    - I will have to create the new bucket in my infra via my terraform repo


## Backend

No routes to register or change the password. I will create the users manually and transmit the login information securely, no password reset feature I'll handle that manually.
No caching, no CDN.

### Endpoints

- New endpoints will live in the new `back/src/libs/routes/noso`
- One new API scope "noso"

- `noso/addMedia` - Let the user upload a media they want to attach to a post and return an id to add to the post
    - Logic is:
        - Get the media, upload it to S3 and create an entry in `NOSO_Media`
        - Return its SQL id in `NOSO_Media` to the client
        - similar to `back/src/libs/routes/clipboard/addEntry.ts` and `back/src/libs/routes/reactor/addEntry.ts`

- `noso/addPost` - Let a user create a new post
    - Accept some text (we want to support utf8 properly with emojis)
    - Accept one or several `NOSO_Media` id. We'll reject the post creation if the media are not owned by the user creating the post
    - Reject if any of the attached media already has a `postId` in `NOSO_Media`
    - Store the post
    - Update the `postId` of the relevant `NOSO_Media` with the new postId

- `noso/deletePost` - Let a user soft delete a post
    - Reject if the post to delete is not owned by the user
    - Set the `archiveDateUnix` to now in `NOSO_Post`

- `noso/getFeed` - Return the posts to display to the user
    - input:
        - `feed: { "feedType": "all" } | { feedType: "user", feedUserId: number }`
        - `since: { "sinceType": "now" } | { sinceType: "beforePost", postId: number }`
    - Pagination logic
        - If `sinceType === "now"` use the max `NOSO_Post` id for `postId`
        - If `sinceType === "now"` include the latest post to the results
        - Retrieve the 9 posts created before `postId`
            - Order posts by `id` desc
            - Always exclude the soft deleted posts (non null `archiveDateUnix`)
            - If `feedType == "user"` exclude posts not created by `feedUserId`

        - To get the next chunk of feed the client send the id of the oldest post it knows
        - If there are less than 9 posts created before `postId` only return the remaining ones
        - If the client sends the id of the first post return an empty array
        - If there is no posts in the db return an empty array
    - Posts retrieval:
        - Select in `NOSO_Media` the ids of the media associated with each post
            - we'll pass all the posts as parameters and return grouped (postId, mediaId) then turned into a map
        - Add a `mediaIds` property to the posts retrieved in db with the ids from `NOSO_Media`

- `noso/getMedia` - Returns a pre-signed link for a give `NOSO_Media`
    - Similar to the `clipboard`/`reactor` endpoint
    - For now, no user ownership check

### Tests

All the tests helpers (db, s3, auth) should be available.
As for the other routes we'll create complete tests for the endpoints.

Test cases TBD.

## Front end

We already have a barebone `front/src/routes/(noso)/` route.
It has an independent style for the other apps so that we can taylor the UI exactly how we want for this app.

We want to implement the base features with a UI as simple as possible, we'll handle the style in a second phase.

We do want to reuse the existing auth component from apps as much as possible.

### Data storage

### Service

The API calls should live in a `api.ts` file like the other front modules
The following services should wrap around `api.ts` to provide the logic around the endpoints

**`MediaService`**

- `getMedia(id)` - Return the media associated to an id
    - Get the `NOSO_Media` id as argument
    - Call `noso/getMedia()` to retrieve the pre-signed link
    - Call the presigned link to get the data
    - Return the image to the call which is a Svelte component which will need to display the media

### Components

- `NOSOHeader` - App header
    - NoSo `<h1>` title and auth button similar to `<Header />` in `front/src/routes/(apps)/+layout.svelte`

- One post creation page with a simple form like @front/src/routes/(apps)/clipboard/components/ClipboardForm.svelte

- `FilesSelector`
    - Allow to select one or several files from the device
    - Only allow to select image filetypes
    - Display a miniature of the selected pictures
    - Allow to delete some of the pictures
    - Allow the parent component to access the list of pictures so that they can be send in an API call

- `Feed`
    - Holds the mechanism to get and display a feed (`/noso/getFeed` with/without `feedUserId` argument)
    - Prop `feedUserId: number` used to pass to the API call
    - Initially call API with the current timestamp to get the 10 latest posts
    - Display the posts in a single column feed with a "load more" button at the bottom
    - When the "load more button is clicked" call the API with the timestamp of the oldest post,
      get the 10 next posts and display them at the end of the column
    - Use the `Post` component to display the posts

- `Post`
    - Displays a post in the feed with:
        - `UserIcon` for the author of the post
        - The creation date (or update date instead)
        - The text content
        - A gallery of media using the `Media` component ordered by ascending media id
        - A button to delete the post (Reuse the `ButtonDelete` component) calling `/noso/deletePost`)

- `Media`
    - Takes a SQL `NOSO_Media` id as argument.
    - Is responsible for calling the service which calls the API call to `getMedia` and the subsequent call to the returned URL
    - Displays a media (only images for now)
    - Used in other component in a grid. The parent component layout will be reponsible for defining the shape of this component, so it should work well in with flex styling in the parent component. This component should always display as a square and have left/right margin to fill the gap if the parent requires a rectangular form
    - When clicked will display the image in full screen as a screenoverlay (We removed SvelteModal recently, the goal is to have a self contained component without dependencies if possible)

- `UserIcon`
    - Will be the icon of a user
    - Very similar to `AuthNavItem` (For now don't show a picture, just the initials of the user)

### Pages

- One home page with an auth guard displaying the feed if the user is logged in and one button to go to the post creation page

- `/` - The user home
    - Display the complete feed (Component `Feed` without `feedUserId` argument)

- `/createPost` - Create a post and submit it
    - Uses the `FilesSelector` component
    - Input for the text content of the post
    - When the user submits the post:
        - Call `addMedia` with each selected file
            - If one call fails abort the whole post creation
        - Call `addPost` with the ids returned by the `addMedia` calls
    - If the call succeed we go to the user home feed with a success message (See `front/src/lib/components/Toast`)
    - If the call fails show an error message but make sure the selected files and inputs are conserved

- `/user/[id]` - A user's feed
    - A first section with `UserIcon` and the username
    - A `Feed` component with the `feedUserId` argument set to the current id in path.

## Open question
- **Image speed load** We want the front end to download several posts at once and display them in the smoothest way possible, we'll need to define the svelte code to do that smartly.
- **Image transfer format** We need to plan specifically around the `addMedia` endpoint which will be multi-part. The clipboard and reactor already do so we'll reuse as much as possible but before starting we want to define the image formats and lifecycle from frontend to backend and back.
- **Client side data storage** To keep things simple in the first version we want to avoid storing data client side but need to double check if can really do it.
- **Client side test** This could be a good opportunity to add client side testing. We need to define which tests would be convenient to create (e.g. no in-browser UI tests, playwrigth, etc...) and what could be the approach

## For later

Ideas we will not implement in this phase but keep for later

- **Posts notification** Each user has a unique uuid attach to them, the uuid is used as the name of a ntfy.sh topic that we'll push to with the `notify` method of @back/src/libs/modules/notifier/push.ts . When a user creates a new post, we push a message on all other users topic
- **Post visibility** Allow a post to be "private" and shown only in the user's feed
- **Post timestamp selection: Allow the user to choose a user facing timestamp of the post (while keeping a server generated timestamp as source of truth)
- **Post edition** Change text, image or timestamp of an existing post. At first we will keep things simple and don't store the modification history, just a modification timestamp
- **SDK pagination helpers** That might require adding data to the endpoint declaraction like a `pagination: true` toggle and maybe a way to declare that the timestamp is the pagination variable and automatically extract it from the response to craft the next query.
- **Media cleanup** It is possible that some `NOSO_Media` are created without a post, we'll have a periodicTask to identify and remove them.

# How we will work

We are working on a dedicated branch where we will do all the work
We will use the superpowers skills to do the job.
We will first use the skills on the backend (complete brainstorming, specs, plan, plan execution, code review) then we will do that same on the frontend

For the backend we want to make sure we create appropriate tests for all of our changes. Using TDD.
