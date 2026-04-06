window.openWebAmp = (mainContext) => {
    document.body.style.overflow = "hidden";

    const container = document.createElement("div");
    document.body.append(container);

    const webAmpScript = document.createElement("script");
    webAmpScript.type = "module";
    webAmpScript.src = window.WebAmpPath;
    webAmpScript.addEventListener("load", () => {
        const webAmpInstance = new window.Webamp(window.WebAmpOptions);
        webAmpInstance.renderWhenReady(container).then(() => {
            window.afterWebAmpOpen();
        });

        if (window.WebAmpSkin) {
            webAmpInstance.setSkinFromUrl(window.WebAmpSkin);
        }

        mainContext.logger.debug(webAmpInstance)
    });
    document.head.append(webAmpScript);
}
