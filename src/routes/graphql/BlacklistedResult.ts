/**
 * A result of a query to check if a phrase contains blacklisted phrases
 */
export class BlacklistedResult {
    constructor(
        public blacklisted: boolean,
        public phrases: string[],
    ) {
    }
}
