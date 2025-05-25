import {WElement} from "../element";
import {makeRequest} from "../utils";

export class SkinMuseum extends WElement{
    internal_component;
    window;
    title_bar;
    title_bar_text;
    title_bar_controls;
    title_bar_controls_close;
    status_bar;
    status_bar_pages;
    status_bar_skins;
    body;
    searchBarContainer;
    searchBarText;
    searchBar;
    searchBarClearButton;
    itemsContainer;
    webamp;
    itemsPerPage = 40;
    totalPages = -1;
    page = 1;
    blockLoading = false;
    initialized = false;
    skins = [];
    totalSkins;
    searchSkins = [];
    searchActive = false;
    searchTotalPages = -1;
    searchPage = 1;
    searchTotalSkins;
    loadSkinFunc;

    Skin = class {
        identifier;
        title;
        fileURL;
        imageURL;

        constructor(identifier, title, fileURL, imageURL) {
            this.identifier = identifier;
            this.title = title;
            this.fileURL = fileURL;
            this.imageURL = imageURL;
        }
    }

    constructor(webamp, loadskinfunc) {
        super();
        this.loadSkinFunc = loadskinfunc;

        this.webamp = webamp;

        this.internal_component = document.createElement("div");
        this.internal_component.style.visibility = "hidden";
        this.internal_component.className = "win98";

        this.window = document.createElement("div");
        this.window.id = "skinMuseum";
        this.window.className = "window";
        this.internal_component.appendChild(this.window);

        this.title_bar = document.createElement("div");
        this.title_bar.className = "title-bar";
        this.window.appendChild(this.title_bar);

        this.title_bar_text = document.createElement("div");
        this.title_bar_text.innerHTML = "WebAmp Skins";
        this.title_bar_text.className = "title-bar-text";
        this.title_bar.appendChild(this.title_bar_text);

        this.title_bar_controls = document.createElement("div");
        this.title_bar_controls.className = "title-bar-controls";
        this.title_bar.appendChild(this.title_bar_controls);

        this.title_bar_controls_close = document.createElement("button");
        this.title_bar_controls_close.setAttribute("aria-label", "Close");
        this.title_bar_controls_close.onclick = () => {
            this.hide();
        }
        this.title_bar_controls.appendChild(this.title_bar_controls_close);

        this.body = document.createElement("div");
        this.body.className = "window-body";
        this.body.id = "skinMuseumBody";
        this.body.addEventListener("scroll", (evt) => {
            if (
                evt.currentTarget.scrollHeight - evt.currentTarget.scrollTop <=
                evt.currentTarget.clientHeight + 500
            ) {
                if(this.blockLoading) return;
                this.page++;
                this.blockLoading = true;
                this.getContent(this.page).then(r => {
                    this.blockLoading = false;
                });
            }
        });
        this.window.appendChild(this.body);

        this.searchBarContainer = document.createElement("div");
        this.searchBarContainer.id = "skinMuseumSearchBar";
        this.body.appendChild(this.searchBarContainer);

        this.searchBarText = document.createElement("a");
        this.searchBarText.textContent = "Search";
        this.searchBarContainer.appendChild(this.searchBarText);

        this.searchBar = document.createElement("input");
        this.searchBar.onkeyup = (evt) => {
            if (evt.key === "Enter") {
                this.itemsContainer.innerHTML = "";
                this.searchSkins = [];
                this.searchPage = 1;
                this.searchTotalPages = -1;
                this.searchActive = true;
                this.searchContent(this.searchPage, this.searchBar.value).then(r => {
                })
            }
        }
        this.searchBarContainer.appendChild(this.searchBar);

        this.searchBarClearButton = document.createElement("button");
        this.searchBarClearButton.textContent = "Clear";
        this.searchBarClearButton.onclick = () => {
            this.itemsContainer.innerHTML = "";
            this.searchActive = false;
            this.searchBar.value = "";
            this.status_bar_pages.textContent = "Pages: " + this.totalPages;
            this.status_bar_skins.textContent = "Skins: " + this.totalSkins;
            for(const skin in this.skins) {
                this.addSkin(this.skins[skin]);
            }
        }
        this.searchBarContainer.appendChild(this.searchBarClearButton);

        this.itemsContainer = document.createElement("div");
        this.itemsContainer.id = "skinMuseumItemsContainer";
        this.body.appendChild(this.itemsContainer);

        this.status_bar = document.createElement("div");
        this.status_bar.className = "status-bar";
        this.window.appendChild(this.status_bar);

        this.status_bar_pages = document.createElement("p");
        this.status_bar_pages.className = "status-bar-field";
        this.status_bar_pages.textContent = "Loading...";
        this.status_bar.appendChild(this.status_bar_pages);

        this.status_bar_skins = document.createElement("p");
        this.status_bar_skins.className = "status-bar-field";
        this.status_bar_skins.textContent = "Loading...";
        this.status_bar.appendChild(this.status_bar_skins);
    }

    roundUpIfDecimal(num) {
        return num % 1 !== 0 ? Math.ceil(num) : num;
    }

    show() {
        this.webamp.close();
        this.internal_component.style.visibility = "visible";
        document.body.style.pointerEvents = "none";
        if(!this.initialized) {
            this.getContent().then(() => {
                this.initialized = true;
            })
        }
    }

    hide() {
        this.webamp.checkedReopen();
        this.internal_component.style.visibility = "hidden";
        document.body.style.pointerEvents = "auto";
    }

    async getContent(page= 1) {
        console.log("[SkinMuseum] Loading Page " + page);
        try {
            if(this.totalPages !== -1 && this.totalPages === page) return;
            let response = await makeRequest("GET", "https://archive.org/advancedsearch.php?q=collection:winampskins&fl[]=identifier,title,webamp&rows=" + this.itemsPerPage + "&page=" + page + "&output=json");
            let json = JSON.parse(response);
            if (page === 1) {
                const totalSkins = json["response"]["numFound"];
                this.totalSkins = totalSkins;
                this.status_bar_skins.textContent = "Skins: " + totalSkins;
                const totalPages = this.roundUpIfDecimal(totalSkins / this.itemsPerPage);
                this.totalPages = totalPages;
                this.status_bar_pages.textContent = "Pages: " + totalPages;
                console.log("[SkinMuseum] Total Pages: " + totalPages);
                console.log("[SkinMuseum] Total Skins: " + totalSkins);
            }
            for(let skin in json["response"]["docs"]) {
                if(this.searchActive) break;
                skin = json["response"]["docs"][skin];
                if(!skin["webamp"]) {
                    let alternativeResponse = await makeRequest("GET", "https://archive.org/metadata/" + skin["identifier"]);
                    let alernativeJson = JSON.parse(alternativeResponse);
                    for(let file in alernativeJson["files"]) {
                        file = alernativeJson["files"][file];
                        if(file["name"].includes(".wsz")) {
                            this.addSkin(new this.Skin(skin["identifier"], skin["title"], "https://archive.org/download/" + skin["identifier"] + "/" + file["name"], "https://archive.org/services/img/" + skin["identifier"]), this.skins);
                            break;
                        }
                    }
                    continue;
                }
                this.addSkin(new this.Skin(skin["identifier"], skin["title"], decodeURIComponent(skin["webamp"].replace("https://webamp.org/?skinUrl=", "")), "https://archive.org/services/img/" + skin["identifier"]), this.skins);
            }
            console.log("[SkinMuseum] Loaded Page " + page);
            return true;
        }catch(err) {
            console.log("[SkinMuseum] Failed loading page " + page);
            console.error(err);
            alert("Exception in SkinMuseum getContent: " + err.status);
            this.status_bar.style.visibility = "hidden";
            return false;
        }
    }

    async searchContent(page= 1, search="") {
        console.log("[SkinMuseum] Searching for '" + search + "'");
        try {
            if(this.searchTotalPages !== -1 && this.searchTotalPages === page) return;
            let response = await makeRequest("GET", "https://archive.org/advancedsearch.php?q=collection:winampskins%20" + encodeURIComponent(search) + "&fl[]=identifier,title,webamp&rows=" + this.itemsPerPage + "&page=" + page + "&output=json");
            let json = JSON.parse(response);
            if (page === 1) {
                const totalSkins = json["response"]["numFound"];
                this.searchTotalSkins = totalSkins;
                this.status_bar_skins.textContent = "Skins: " + totalSkins;
                const totalPages = this.roundUpIfDecimal(totalSkins / this.itemsPerPage);
                this.searchTotalPages = totalPages;
                this.status_bar_pages.textContent = "Pages: " + totalPages;
                console.log("[SkinMuseum] Found total pages: " + totalPages);
                console.log("[SkinMuseum] Found total skins: " + totalSkins);
            }
            for(let skin in json["response"]["docs"]) {
                if(!this.searchActive) break;
                skin = json["response"]["docs"][skin];
                if(!skin["webamp"]) {
                    let alternativeResponse = await makeRequest("GET", "https://archive.org/metadata/" + skin["identifier"]);
                    let alernativeJson = JSON.parse(alternativeResponse);
                    for(let file in alernativeJson["files"]) {
                        file = alernativeJson["files"][file];
                        if(file["name"].includes(".wsz")) {
                            this.addSkin(new this.Skin(skin["identifier"], skin["title"], "https://archive.org/download/" + skin["identifier"] + "/" + file["name"], "https://archive.org/services/img/" + skin["identifier"]), this.searchSkins);
                            break;
                        }
                    }
                    continue;
                }
                this.addSkin(new this.Skin(skin["identifier"], skin["title"], decodeURIComponent(skin["webamp"].replace("https://webamp.org/?skinUrl=", "")), "https://archive.org/services/img/" + skin["identifier"]), this.searchSkins);
            }
            console.log("[SkinMuseum] Loaded Page " + page);
            return true;
        }catch(err) {
            console.log("[SkinMuseum] Failed loading page " + page);
            console.error(err);
            alert("Exception in SkinMuseum getContent: " + err.status);
            this.status_bar.style.visibility = "hidden";
            return false;
        }
    }

    addSkin(skin, array) {
        if(array) array.push(skin);
        const image = document.createElement("img");
        image.src = skin.imageURL;
        image.alt = skin.identifier + " Preview";
        image.id = "skinMuseumBodyItem";
        image.onclick = () => {
            localStorage.setItem("webampSkin", skin.fileURL);
            this.webamp.setSkinFromUrl(skin.fileURL);
            this.webamp.skinIsLoaded().then(r => {
                this.hide();
            })
            this.loadSkinFunc();
        }
        this.itemsContainer.appendChild(image);
    }

    render(div) {
        div.appendChild(this.internal_component);
    }
}