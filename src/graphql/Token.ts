/**
 * A class representing a token that can be used with bearer authentication
 */
export class Token {
    constructor(
        public value: string,
        public expires: string,
    ) {}
}
