import {NotLoggedInGqlError} from "../lib/errors/graphqlErrors";

/**
 * Base resolver class to provide common methods to all resolver classes
 */
export abstract class BaseResolver {

    /**
     * Checks if the user is logged in and throws an exception if not
     * @param request
     */
    protected ensureLoggedIn(request: any) {
        if (!request.session.userId) {
            throw new NotLoggedInGqlError();
        }
    }
}
