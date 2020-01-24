import * as config from "config";
import {Router} from "express";
import * as graphqlHTTP from "express-graphql";
import {buildSchema, GraphQLError} from "graphql";
import {importSchema} from "graphql-import";
import queryComplexity, {directiveEstimator, simpleEstimator} from "graphql-query-complexity";
import {graphqlUploadExpress} from "graphql-upload";
import * as path from "path";
import globals from "../lib/globals";
import Route from "../lib/Route";
import {resolver} from "./graphql/resolvers";

const logger = globals.logger;

/**
 * A class for the /grpahql route
 */
export class GraphqlRoute extends Route {
    /**
     * Constructor, creates new router.
     */
    constructor() {
        super();
        this.router = Router();
    }


    /**
     * Initializes the route
     * @param params
     */
    public async init(...params: any): Promise<any> {
        this.router.use(graphqlUploadExpress({
            maxFileSize: config.get<number>("api.maxFileSize"),
            maxFiles: 10,
        }));
        // @ts-ignore
        this.router.use(graphqlHTTP(async (request: any, response: any, {variables}) => {
            response.setHeader("X-Max-Query-Complexity", config.get("api.maxQueryComplexity"));
            return {
                // @ts-ignore all
                context: {session: request.session},
                formatError: (err: GraphQLError | any) => {
                    if (err.statusCode) {
                        response.status(err.statusCode);
                    } else {
                        response.status(400);
                    }
                    logger.verbose(err.message);
                    logger.debug(err.stack);
                    return err.graphqlError ?? err;
                },
                graphiql: config.get<boolean>("api.graphiql"),
                rootValue: resolver(request, response),
                schema: buildSchema(importSchema(path.join(__dirname, "./graphql/schema.graphql"))),
                validationRules: [
                    queryComplexity({
                        estimators: [
                            directiveEstimator(),
                            simpleEstimator(),
                        ],
                        maximumComplexity: config.get<number>("api.maxQueryComplexity"),
                        onComplete: (complexity: number) => {
                            logger.debug(`QueryComplexity: ${complexity}`);
                            response.setHeader("X-Query-Complexity", complexity);
                        },
                        variables,
                    }),
                ],
            };
        }));
    }

    /**
     * Destroys the route
     * @param params
     */
    public async destroy(...params: any): Promise<any> {
        return undefined;
    }
}
