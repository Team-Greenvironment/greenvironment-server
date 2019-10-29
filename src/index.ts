import App from "./app";

/**
 * async main function wrapper.
 */
(async () => {
    const app = new App();
    await app.init();
    app.start();
})();

