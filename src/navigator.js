import {WElement} from "./element"
import {COLOR_2, COLOR_3, COLOR_4, COLOR_6} from "./colors"
import {useState} from "./utils";

export class Navigator extends WElement {
    currentView = null;
    internal_element;
    available_views;
    navigator;
    navigatorBrand;
    navigatorItemsContainer;
    navigatorTime;
    time;
    interactiveRect;
    navigatorMobileButton;
    navigatorMobileContent;
    navigatorMobileContainer;
    navigatorMobileContentRect;
    navigatorRightContainer;
    isNativeMobile;
    mobileDetect;

    Rectangle = class {
        x;
        y;
        width;
        height;

        constructor(x, y, width, height) {
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
        }

        static fromDomRect(domRect) {
            return new this(domRect.x, domRect.y, domRect.width, domRect.height);
        }

        contains(x, y) {
            const isWithinX = x >= this.x && x <= this.x + this.width;
            const isWithinY = y >= this.y && y <= this.y + this.height;
            return isWithinX && isWithinY;
        }
    }

    constructor(views) {
        super();
        this.available_views = views;

        this.mobileDetect = new MobileDetect(window.navigator.userAgent);

        this.isNativeMobile = !!this.mobileDetect.mobile();

        this.internal_element = document.createElement("div");
        this.internal_element.className = "navigator-element";

        document.body.addEventListener("mousedown", (evt) => {
            if (this.navigatorMobileContentRect.contains(evt.clientX, evt.clientY)) {
                return;
            }
            if (this.navigatorMobileContent.style.visibility === "visible") {
                this.navigatorMobileContent.style.visibility = "hidden";
                this.navigatorMobileButton.style.rotate = "0deg";
            }
        })

        this.navigator = document.createElement("div");
        this.navigator.className = "navigator";
        this.navigator.style.backgroundColor = COLOR_4;
        this.internal_element.appendChild(this.navigator);

        this.navigatorMobileContainer = document.createElement("div");
        this.navigatorMobileContainer.id = "navigatorMobileContainer";
        this.navigatorMobileContainer.style.height = "50px";
        this.navigator.appendChild(this.navigatorMobileContainer);

        this.navigatorMobileButton = document.createElement("img");
        this.navigatorMobileButton.src = "bars.svg";
        this.navigatorMobileButton.id = "navigatorMobileButton";
        this.navigatorMobileButton.style.height = "40px";
        this.navigatorMobileButton.addEventListener("mousedown", (evt) => {
            if (this.navigatorMobileContent.style.visibility === "hidden") {
                this.navigatorMobileContent.style.visibility = "visible";
                this.navigatorMobileButton.style.rotate = "90deg";
            } else {
                this.navigatorMobileContent.style.visibility = "hidden";
                this.navigatorMobileButton.style.rotate = "0deg";
            }
            evt.stopPropagation();
        });
        this.navigatorMobileContainer.appendChild(this.navigatorMobileButton);

        this.navigatorMobileContent = document.createElement("div");
        this.navigatorMobileContent.id = "navigatorMobileContent";
        this.navigatorMobileContent.style.visibility = "visible";
        this.navigatorMobileContent.style.fontSize = "19px";
        this.navigatorMobileContent.style.backgroundColor = COLOR_6;
        this.navigatorMobileContainer.appendChild(this.navigatorMobileContent);

        this.navigatorBrand = document.createElement("a");
        this.navigatorBrand.text = "Werwolf2303.de";
        this.navigatorBrand.href = "https://werwolf2303.de";
        this.navigatorBrand.style.color = COLOR_2;
        this.navigatorBrand.className = "navigator-branding";
        this.navigator.appendChild(this.navigatorBrand);

        this.navigatorItemsContainer = document.createElement("div");
        this.navigatorItemsContainer.className = "navigator-items-container";
        this.navigator.appendChild(this.navigatorItemsContainer);

        this.navigatorRightContainer = document.createElement("div");
        this.navigatorRightContainer.className = "navigator-right-container";
        this.navigator.appendChild(this.navigatorRightContainer);

        this.navigatorTime = document.createElement("a");
        this.navigatorTime.className = "navigator-time";
        this.navigatorTime.style.color = COLOR_3;
        this.navigatorRightContainer.appendChild(this.navigatorTime);
        window.NAVIGATOR_TIME = this.navigatorTime;

        this.updateTime()
        window.TIMER_FUNCS.push({
            "func": this.updateTime,
            "name": "navigatorUpdateTime"
        });

        window.addEventListener("resize", () => {
            this.recalculateInternalSize();
        });

        let asyncFuncs = useState(0);
        asyncFuncs.addListener("waitAsync", newValue => {
            if(newValue === 0) {
                this.recalculateInternalSize();
            }
        });

        for (let view in this.available_views) {
            if(this.available_views[view].isAsync()) asyncFuncs.set(asyncFuncs.get() + 1);
        }

        let mobilePosition = this.navigatorMobileContent.children.length;

        for (let view in this.available_views) {
            if(!this.available_views[view].isMobileSupported() && this.isNativeMobile) continue;
            this.createNormal(view, this.navigatorItemsContainer.children.length).then(() => {
                this.createMobile(view, mobilePosition-1);
                if(this.available_views[view].isAsync()) {
                    asyncFuncs.set(asyncFuncs.get() - 1);
                }
                mobilePosition++;
            });
        }

        window.addEventListener("popstate", (event) => {
            if(!event.state) return;
            this.switchView(event.state["page"]);
        });
    }

    addView(view) {
        this.available_views.push(view);
        view.getComponent().style.visibility = "hidden";
        view.getComponent().style.position = "absolute";
        view.getComponent().style.height = "inherit";
        view.getComponent().style.width = "inherit";
        view.render(this.internal_element);
    }

    async createNormal(view, position) {
        const navigatorItem = document.createElement("a");
        navigatorItem.style.color = COLOR_2;
        navigatorItem.className = "navigator-item";
        const name = this.available_views[view].getName();
        navigatorItem.onmousedown = () => {
            this.switchView(this.available_views[view].getName());
        }
        navigatorItem.text = name;
        this.available_views[view].getNavigator = () => {
            return this;
        }
        if(this.available_views[view].isAsync()) await this.available_views[view].asyncInit();
        if(this.navigatorItemsContainer.children[position]) {
            this.navigatorItemsContainer.insertBefore(navigatorItem, this.navigatorItemsContainer.children[position]);
        }else {
            this.navigatorItemsContainer.appendChild(navigatorItem);
        }
    }

    createMobile(view, position) {
        const navigatorItem = document.createElement("a");
        navigatorItem.style.color = COLOR_2;
        navigatorItem.className = "navigator-item-mobile";
        const name = this.available_views[view].getName();
        navigatorItem.onmousedown = () => {
            this.switchView(this.available_views[view].getName());
        }
        navigatorItem.text = name;
        if(this.navigatorMobileContent.children[position]) {
            this.navigatorMobileContent.insertBefore(navigatorItem, this.navigatorMobileContent.children[position]);
        }else {
            this.navigatorMobileContent.appendChild(navigatorItem);
        }
    }

    updateTime() {
        const now = new Date();
        const newTime = String(now.getHours()).padStart(2, "0") + ":" + String(now.getMinutes()).padStart(2, "0");
        if (this.time && this.time === newTime) {
            return;
        }
        window.NAVIGATOR_TIME.text = newTime;
        this.time = newTime;
    }

    switchView(name, saveState = true) {
        if (this.currentView != null) {
            this.currentView.onClose();
            this.currentView.getComponent().style.visibility = "hidden";
        }
        let foundView;
        for (let view in this.available_views) {
            if (this.available_views[view].getName() === name) {
                foundView = this.available_views[view];
                if(saveState) localStorage.setItem("currentView", name);
                break;
            }
        }
        this.navigatorMobileContent.style.visibility = "hidden";
        this.navigatorMobileButton.style.rotate = "0deg";
        this.currentView = foundView;
        foundView.getComponent().style.visibility = "visible";
        foundView.onOpen();
        if(saveState) history.pushState({page: foundView.getName()}, "", "");
    }

    recalculateInternalSize() {
        const brandingRect = this.navigatorBrand.getBoundingClientRect();
        const itemsRect = this.navigatorItemsContainer.getBoundingClientRect();
        const timeX = this.navigatorTime.getBoundingClientRect().x;
        const timeY = this.navigatorTime.getBoundingClientRect().y;
        this.interactiveRect = new this.Rectangle(
            brandingRect.x,
            brandingRect.y,
            brandingRect.width + itemsRect.width,
            brandingRect.height + itemsRect.height
        )
        if(!this.isNativeMobile) {
            if (this.interactiveRect.contains(timeX - 20, timeY)) {
                window.isMobileStyle.set(true);
                this.makeMobile();
            } else {
                window.isMobileStyle.set(false);
                this.makeDesktop();
            }
        }else {
            if(!window.isMobileStyle.get()) {
                window.isMobileStyle.set(true);
                this.makeMobile();
            }
        }
        this.internal_element.style.width = window.innerWidth + "px";
        this.internal_element.style.height = window.innerHeight - this.navigator.clientHeight + 2 + "px";
        this.navigatorMobileContentRect = this.Rectangle.fromDomRect(this.navigatorMobileContent.getBoundingClientRect());
    }

    makeMobile() {
        this.navigatorMobileContainer.style.position = "";
        this.navigatorMobileContainer.style.visibility = "visible";
        this.navigatorItemsContainer.style.position = "absolute";
        this.navigatorItemsContainer.style.visibility = "hidden";
        this.navigator.style.height = "50px";
        this.navigatorMobileContainer.style.height = "50px";
        this.navigatorMobileButton.style.height = "40px";
    }

    makeDesktop() {
        this.navigatorMobileContainer.style.position = "absolute";
        this.navigatorMobileContainer.style.visibility = "hidden";
        this.navigatorMobileContent.style.visibility = "hidden";
        this.navigatorItemsContainer.style.position = "relative";
        this.navigatorItemsContainer.style.visibility = "visible";
        this.navigatorMobileButton.style.rotate = "0deg";
        this.navigator.style.height = "";
        this.navigatorMobileContainer.style.height = "10px";
        this.navigatorMobileButton.style.height = "10px";
    }

    render(div) {
        for (let view in this.available_views) {
            if(!this.available_views[view].isMobileSupported() && this.isNativeMobile) continue;
            this.available_views[view].getComponent().style.visibility = "hidden";
            this.available_views[view].getComponent().style.position = "absolute";
            this.available_views[view].getComponent().style.height = "inherit";
            this.available_views[view].getComponent().style.width = "inherit";
            this.available_views[view].render(this.internal_element);
        }
        div.appendChild(this.internal_element);
        div.appendChild(this.navigator);
    }
}