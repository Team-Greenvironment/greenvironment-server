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
- bearer token authentification for testing purposes
- Added `deletable' field on post
- Admin field that for admin users
- ability for admins to delete posts
- ability to upload file at `/upload` with the name profilePicture
- publicPath to config file to configure the directory for public files
- profilePicture property to User model which is an url to the users profile picture

### Removed

- special worker logging

### Changed

- changed the running behaviour to run in cluster threads via node.js cluster api
- gql field userVote requires a userId
- default findUser param limit to 20
- only group admins can create group events

### Fixed

- sequelize initialization being logged without winston
- userVote is always null (#47)
- findUser not being implemented
- style issues
- graphql schema for denyRequest using the wrong parameters
- sendRequest allowing duplicates


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
