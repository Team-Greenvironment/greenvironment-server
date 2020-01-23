export namespace is {
    const emailRegex = /\S+?@\S+?(\.\S+?)?\.\w{2,3}(.\w{2-3})?/g;
    const videoRegex = /video\/.*/g;
    const imageRegex = /image\/.*/g;

    /**
     * Tests if a string is a valid email.
     * @param testString
     */
    export function email(testString: string) {
        return emailRegex.test(testString);
    }

    /**
     * Returns if the mimetype is a video
     * @param mimetype
     */
    export function video(mimetype: string) {
        return videoRegex.test(mimetype);
    }

    /**
     * Returns if the mimetype is an image
     * @param mimetype
     */
    export function image(mimetype: string) {
        return imageRegex.test(mimetype);
    }
}
