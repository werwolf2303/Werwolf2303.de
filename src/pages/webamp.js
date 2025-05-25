import {Page} from "./page";
import {SkinMuseum} from "../elements/skinMuseum";

export class WebAmp extends Page {
    internal_component;
    webampContainer;
    webamp;
    webampInitialized;
    webampOpen;
    skinMuseum;
    skinMuseumIcon;
    skinMuseumIconImage;
    skinMuseumIconText;
    popoutButton;
    onLoadSkinFunc;
    popoutWindowRef;
    webampIcon;
    webampIconImage;
    webampIconText;


    constructor() {
        super();

        this.internal_component = document.createElement("div");
        this.internal_component.className = "desktop-container";

        this.skinMuseumIcon = document.createElement("div");
        this.skinMuseumIcon.className = "desktop-icon";
        this.skinMuseumIcon.onclick = () => {
            this.skinMuseum.show();
        }
        this.internal_component.appendChild(this.skinMuseumIcon);

        this.skinMuseumIconImage = document.createElement("img");
        this.skinMuseumIconImage.src = "InternetArchiveLogo.png";
        this.skinMuseumIconImage.style.backgroundColor = "black";
        this.skinMuseumIconImage.className = "desktop-icon-image";
        this.skinMuseumIcon.appendChild(this.skinMuseumIconImage);

        this.skinMuseumIconText = document.createElement("a");
        this.skinMuseumIconText.className = "desktop-icon-text";
        this.skinMuseumIconText.textContent = "WinAmp Skins";
        this.skinMuseumIcon.appendChild(this.skinMuseumIconText);

        this.webampIcon = document.createElement("div");
        this.webampIcon.className = "desktop-icon";
        this.webampIcon.style.marginLeft = "-30px";
        this.webampIcon.onclick = () => {
            if(this.popoutWindowRef) {
                if(!this.popoutWindowRef.closed) {
                    return;
                }
            }
            this.webamp.reopen();
            this.webampOpen = true;
        }
        this.internal_component.appendChild(this.webampIcon);

        this.webampIconImage = document.createElement("img");
        this.webampIconImage.className = "desktop-icon";
        this.webampIconImage.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgBAMAAACBVGfHAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAAGFBMVEUAAAAAAAC2trb/VQD////y8vL//7H/qgC61DvZAAAAAXRSTlMAQObYZgAAAAFiS0dEBI9o2VEAAAAHdElNRQfiAwcADiWYqKuJAAAA3klEQVQoz13RQY7DIAwFUHMDaJOw5ghVpGHdxRyASj4BUlmjSP3XH8BAJvUikcnLl+MQSSm5GRp1061/jF79unqNeRws/NKkNp8nYHbKRugJmF82XgCbj7+AgIj/INgvYCvQJzAoYHUTGNTKRncgPfBwAgLwfidgz2XcCgKO/Qc4kNm1hCKQcPhyUL+oCnwAD6wsJBiTsAOGuYfwVgLKCw00kmrAKqCS7ZAA7qOa5FtAB0TbLgEDqIgWcAIJvIC6kQnuHqYttQOydZXLCchmGXcAsu3JMkH/4epJXzXAHxFEV862nV0ZAAAAJXRFWHRkYXRlOmNyZWF0ZQAyMDE4LTAzLTA3VDAwOjE0OjM3LTA1OjAw/19S6wAAACV0RVh0ZGF0ZTptb2RpZnkAMjAxOC0wMy0wN1QwMDoxNDozNy0wNTowMI4C6lcAAAAASUVORK5CYII=";
        this.webampIconImage.style.marginTop = "-1px";
        this.webampIconImage.style.marginLeft = "-2px";
        this.webampIcon.appendChild(this.webampIconImage);

        this.webampIconText = document.createElement("a");
        this.webampIconText.className = "desktop-icon-text";
        this.webampIconText.textContent = "WinAmp";
        this.webampIcon.appendChild(this.webampIconText);

        this.webampContainer = document.createElement("div");
        this.webampContainer.id = "webAmp";
        this.internal_component.appendChild(this.webampContainer);

        this.popoutButton = document.createElement("button");
        this.popoutButton.id = "webAmpPopoutButton";
        this.popoutButton.textContent = "Popout WebAmp";
        this.popoutButton.onclick = () => {
            const newWindow = window.open('', 'Webamp', "popup=true,resizable=no,menubar=no,toolbar=no");
            this.popoutWindowRef = newWindow;
            if (newWindow) {
                this.webamp.close();
                newWindow.document.body.style.overflow = "hidden";
                if(localStorage.getItem("webampSkin")) {
                    newWindow.window.skin = localStorage.getItem("webampSkin");
                }
                let indexScript = document.createElement("script");
                indexScript.type = "text/javascript";
                indexScript.src = window.location.origin + window.location.pathname.replace(window.location.pathname.split("/")[window.location.pathname.split("/").length - 1], "") + "index.js";
                newWindow.document.body.appendChild(indexScript);
                let webampScript = document.createElement("script");
                webampScript.type = "text/javascript";
                webampScript.src = window.location.origin + window.location.pathname.replace(window.location.pathname.split("/")[window.location.pathname.split("/").length - 1], "") + "webamppopout.js";
                newWindow.document.head.append(webampScript);
                const intervalId = setInterval(() => {
                    if (newWindow.closed) {
                        clearInterval(intervalId);
                        this.webamp.reopen();
                    }
                }, 500);
            } else {
                alert('Popup blocked! Please allow popups for this site.');
            }
        }
        this.internal_component.appendChild(this.popoutButton);

        this.webamp = new Webamp();
        this.webamp.checkedReopen = () => {
            if(!this.popoutWindowRef) {
                this.webamp.reopen();
                return;
            }
            if(this.popoutWindowRef.closed) {
                this.webamp.reopen();
            }
        }
        this.webamp.onClose(() => {
            this.webampOpen = false;
        })

        this.webampInitialized = false;

        this.onLoadSkinFunc = () => {
            if(this.popoutWindowRef) {
                if(!this.popoutWindowRef.closed) {
                    this.popoutWindowRef.window.webamp.setSkinFromUrl(localStorage.getItem("webampSkin"));
                }
            }
        }

        this.skinMuseum = new SkinMuseum(this.webamp, this.onLoadSkinFunc);
        this.skinMuseum.render(this.internal_component);
    }

    render(div) {
        div.appendChild(this.internal_component);
    }

    onClose() {
    }

    onOpen() {
        if(!this.webampInitialized && !this.webampOpen) {
            this.webamp.renderWhenReady(document.getElementById("webAmp"));
            if(localStorage.getItem("webampSkin")) {
                this.webamp.setSkinFromUrl(localStorage.getItem("webampSkin"));
            }
            this.webampInitialized = true;
            this.webampOpen = true;
        }else if(!this.webampOpen) {
            if(this.popoutWindowRef) {
                if(!this.popoutWindowRef.closed) {
                    return;
                }
            }
            this.webamp.reopen();
            this.webampOpen = true;
        }
    }

    getComponent() {
        return this.internal_component;
    }

    getName() {
        return "WebAmp";
    }

    isMobileSupported() {
        return false;
    }
}