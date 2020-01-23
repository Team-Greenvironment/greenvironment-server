import {QueryResolver} from "./QueryResolver";

/**
 * Returns the resolvers for the graphql api.
 * @param req - the request object
 * @param res - the response object
 */
export function resolver(req: any, res: any): any {
    return new QueryResolver();
}
