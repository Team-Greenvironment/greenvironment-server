# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- settings field to own user data to store frontend settings
- Jenkinsfile
- Mocha Tests
- worker initialization error handling
- bearer token authentication for testing purposes
- Added `deletable' field on post
- Admin field that for admin users
- ability for admins to delete posts
- ability to upload file at `/upload` with the name profilePicture
- publicPath to config file to configure the directory for public files
- profilePicture property to User model which is an url to the users profile picture
- activities to posts
- getActivities field to receive all activities
- createActivity mutation
- activities table
- event and eventCount to UserData gql interface
- joined field to Event gql type
- joined field to Group gql type
- rate limits with defaults of 10/min for `/upload` and 30/min for `/graphql`
- complexity limits for graphql queries that can be configured with the `api.maxQueryComplexity` option
- complexity headers `X-Query-Complexity` and `X-Max-Query-Complexity`
- Media model to store information about media (videos and images)
- Media association to users, groups and posts
- Upload handling for media entries (via /upload)
- routine to cleanup orphaned media entries (not referenced by post, user, group)
- delete handler for media to delete the corresponding file
- type for create post to know if it is a media or text post (media posts are invisible until a media file is uploaded)
- reports and mutations to report posts and create reasons to report
- level entity

### Removed

- special worker logging
- public directory which only contained a stylesheet for the error pages

### Changed

- changed the running behaviour to run in cluster threads via node.js cluster api
- gql field userVote requires a userId
- default findUser param limit to 20
- only group admins can create group events
- config behaviour to use all files that reside in the ./config directory with the .toml format
- default response timeout from 2 minutes to 30 seconds
- cluster api to start workers with a 2 second delay each to avoid race conditions
- levels to be configured in the backend

### Fixed

- sequelize initialization being logged without winston
- userVote is always null (#47)
- findUser not being implemented
- style issues
- graphql schema for denyRequest using the wrong parameters
- sendRequest allowing duplicates
- upload throwing an error when the old picture doesn't exist


## [0.9] - 2019-10-29

### Added

- Graphql Schema
- default-config file and generation of config file on startup
- DTOs
- Home Route
- session management
- Sequelize models and integration
- Sequelize-typescript integration
- error pages
- pagination for most list types
- angular integration by redirecting to `index.html` on not found
