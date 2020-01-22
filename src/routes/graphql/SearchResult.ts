import {Event, Group, Post, User} from "../../lib/models";

/**
 * A class to wrap search results returned by the search resolver
 */
export class SearchResult {
    constructor(
        public users: User[],
        public groups: Group[],
        public posts: Post[],
        public events: Event[],
    ) {
    }
}
