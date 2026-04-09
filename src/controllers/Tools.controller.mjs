import webamp from "../scripts/webamp.bundle.min.mjs";

export default async(context) => {
    let webAmpInstance;
    let webAmpContainer;
    let isWebAmpOpen = false;
    let webAmpOptions = {
        enableMediaSession: true
    }

    function makeWebAmpInstance() {
        webAmpContainer = document.createElement("div");
        document.body.append(webAmpContainer);

        webAmpInstance = new webamp(webAmpOptions);

        webAmpInstance.onClose(() => {
            isWebAmpOpen = false;
        });
    }

    return {
        initController: (controllerContext) => {
            controllerContext.view.getElementById("webAmpShortcut").addEventListener("click", () => {
                if (!webamp.browserIsSupported()) {
                    alert("Your browser doesn't support features needed for WebAmp");
                    return;
                }

                if (webAmpInstance) {
                    webAmpInstance.reopen();
                    return;
                }

                makeWebAmpInstance();

                webAmpInstance.renderWhenReady(webAmpContainer).then(() => {
                    isWebAmpOpen = true;
                });

                if (localStorage.getItem("WebAmpSkin")) {
                    webAmpInstance.setSkinFromUrl(localStorage.getItem("WebAmpSkin"));
                }

                context.WebAmp = webAmpInstance;
            });

            controllerContext.view.getElementById("webAmpPopup").addEventListener("click", () => {
                if (!webamp.browserIsSupported()) {
                    alert("Your browser doesn't support features needed for WebAmp");
                    return;
                }

                let scriptPath = location.protocol + "//" + location.host + location.pathname;
                scriptPath += location.pathname.endsWith("/") ? "scripts/WebAmpPopup.js" : "/scripts/WebAmpPopup.js";

                const newWindow = window.open("about:blank", "WebAmp", "popup=true,resizable=yes,menubar=no,toolbar=no");
                newWindow.afterWebAmpOpen = () => {
                    const mainWindow = newWindow.document.getElementById("main-window");
                    newWindow.resizeTo(mainWindow.clientWidth, mainWindow.clientHeight * 3 + 30);
                };

                const newScript = document.createElement("script");
                newScript.type = "text/javascript";
                newScript.src = scriptPath;
                newScript.addEventListener("load", () => {
                    newWindow.WebAmpOptions = webAmpOptions;
                    newWindow.WebAmpSkin = localStorage.getItem("WebAmpSkin");
                    newWindow.WebAmpPath = newScript.src.replace("/scripts/WebAmpPopup.js", "/scripts/webamp.bundle.min.mjs");
                    newWindow.openWebAmp(context);
                });

                newWindow.document.head.append(newScript);
            });

            controllerContext.view.getElementById("webAmpSkinMuseum").addEventListener("click", () => {
                controllerContext.view.getElementById("toolsDesktop").style.display = "none";
                controllerContext.view.querySelector(".skinMuseumNavigator").style.display = "block";
                controllerContext.view.querySelector(".skinMuseumNavigator").navigateTo("SkinMuseum");

                document.getElementById("footer").style.display = "none";
            });
        }
    }
}
