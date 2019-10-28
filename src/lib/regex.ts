export namespace is {
    const emailRegex = /\S+?@\S+?(\.\S+?)?\.\w{2,3}(.\w{2-3})?/g;

    /**
     * Tests if a string is a valid email.
     * @param testString
     */
    export function email(testString: string) {
        return emailRegex.test(testString);
    }
}
