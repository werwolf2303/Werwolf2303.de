import {Page} from "./page";
import {COLOR_8_SEMI_TRANSPARENT} from "../colors";
import {displaySpinner, makeRequest, useState} from "../utils";

export class Project extends Page {
    internal_component;
    repository;
    readme;
    readmeContent;
    repoInfoContainer;
    repoInfoContent;
    repoInfoTitle;
    repoInfoDescription;
    content;
    spinner;
    releasesContainer;
    releasesContent;
    reloadButton;

    loadStarted = false;
    loaded = useState(0);
    toLoad = 2;

    githubReadmeURL = "https://raw.githubusercontent.com/AUTHOR/REPONAME/refs/heads/master/README.md";
    githubReleaseDownloadURL = "https://github.com/AUTHOR/REPONAME/releases/download/TAGNAME/FILENAME";
    githubReleasesURL = "https://api.github.com/repos/AUTHOR/REPONAME/releases";
    githubContentsURL = "https://api.github.com/repos/AUTHOR/REPONAME/contents";

    constructor(repository) {
        super();

        this.repository = repository;

        this.internal_component = document.createElement("div");
        this.internal_component.style.backgroundColor = COLOR_8_SEMI_TRANSPARENT;
        this.internal_component.style.overflowX = "hidden";
        this.internal_component.style.overflowY = "scroll";

        this.reloadButton = document.createElement("button");
        this.reloadButton.style.padding = "5px";
        this.reloadButton.innerText = "Reload";
        this.reloadButton.style.position = "absolute";
        this.reloadButton.style.top = "0";
        this.reloadButton.style.backgroundColor = "rgba(0, 0, 0, 0.2)";
        this.reloadButton.style.border = "0";
        this.reloadButton.style.borderRadius = "0";
        this.reloadButton.className = "reload-button";
        this.reloadButton.style.width = "70px";
        this.reloadButton.style.height = "35px";
        this.reloadButton.onclick = () => {
            this.readme.innerHTML = "";
            this.releasesContent.innerHTML = "";
            this.loaded.set(0);
            this.#reloadData();
        }
        this.internal_component.appendChild(this.reloadButton);

        this.content = document.createElement("div");
        this.content.style.padding = "10px";
        this.content.style.display = "flex";
        this.content.style.flexDirection = "column";
        this.content.style.justifyContent = "center";
        this.content.style.gap = "10px";
        this.internal_component.appendChild(this.content);

        this.repoInfoContainer = document.createElement("div");
        this.repoInfoContainer.style.border = "1px solid black";
        this.repoInfoContainer.style.minWidth = "100%";
        this.repoInfoContainer.style.display = "flex";
        this.repoInfoContainer.style.flexDirection = "column";
        this.content.appendChild(this.repoInfoContainer);

        this.repoInfoContent = document.createElement("div");
        this.repoInfoContent.style.padding = "2px";
        this.repoInfoContainer.appendChild(this.repoInfoContent);

        this.repoInfoTitle = document.createElement("h2");
        this.repoInfoTitle.style.minWidth = "100%";
        this.repoInfoTitle.innerText = repository.name;
        this.repoInfoContent.appendChild(this.repoInfoTitle);

        this.repoInfoDescription = document.createElement("a");
        this.repoInfoDescription.style.minWidth = "100%";
        this.repoInfoDescription.innerText = repository.description;
        this.repoInfoContent.appendChild(this.repoInfoDescription);

        this.releasesContainer = document.createElement("div");
        this.releasesContainer.id = "projectReleasesContainer";
        this.releasesContainer.style.minWidth = "100%";
        this.releasesContainer.style.border = "1px solid black";
        this.content.appendChild(this.releasesContainer);

        this.releasesContent = document.createElement("div");
        this.releasesContent.style.padding = "2px";
        this.releasesContainer.appendChild(this.releasesContent);

        this.readme = document.createElement("div");
        this.readme.style.border = "1px solid black";
        this.readme.style.minWidth = "100%";
        this.readme.style.padding = "2px";
        this.content.appendChild(this.readme);

        this.readmeContent = document.createElement("div");
        this.readmeContent.style.padding = "2px";
        this.readme.appendChild(this.readmeContent);

        this.spinner = document.createElement("div");
        this.spinner.style.position = "absolute";
        this.spinner.style.left = "calc(50% - 20px)";
        this.spinner.style.top = "50%";
        this.spinner.style.transform = "translate(-50%, -50%)";
        this.spinner.style.visibility = "hidden";
        displaySpinner(this.spinner, 40, 40);
        this.content.appendChild(this.spinner);

        this.loaded.addListener("spinnerControl", (newValue) => {
            if(newValue === this.toLoad) {
                this.spinner.style.visibility = "hidden";
            }
        });
    }

    parseReleases(releasesData) {
        const parsed = JSON.parse(releasesData);
        const collapsibleContainer = document.createElement("div");
        collapsibleContainer.className = "wrap-collapsible";
        this.releasesContent.appendChild(collapsibleContainer);

        const collapsibleCheckbox = document.createElement("input");
        collapsibleCheckbox.className = "collapsible-toggle";
        collapsibleCheckbox.id = "releases-collapsible-" + this.repository.author + "-" + this.repository.name;
        collapsibleCheckbox.type = "checkbox";
        collapsibleContainer.appendChild(collapsibleCheckbox);

        const collapsibleLabel = document.createElement("label");
        collapsibleLabel.className = "collapsible-label";
        collapsibleLabel.innerText = "Releases";
        collapsibleLabel.setAttribute("for", collapsibleCheckbox.id);
        collapsibleContainer.appendChild(collapsibleLabel);

        const collapsibleContentContainer = document.createElement("div");
        collapsibleContentContainer.className = "collapsible-content-container";
        collapsibleContainer.appendChild(collapsibleContentContainer);

        const collapsibleContent = document.createElement("div");
        collapsibleContent.className = "collapsible-content";
        collapsibleContent.style.display = "flex";
        collapsibleContent.style.flexDirection = "column";
        collapsibleContent.style.gap = "3px";
        collapsibleContentContainer.appendChild(collapsibleContent);

        for(const release of parsed) {
            if(release["draft"] === true) continue;
            const releaseContainer = document.createElement("div");
            releaseContainer.style.display = "flex";
            releaseContainer.style.flexDirection = "row";
            releaseContainer.style.gap = "3px";
            collapsibleContent.appendChild(releaseContainer);

            const releaseName = document.createElement("a");
            releaseName.innerText = release["name"];
            releaseContainer.appendChild(releaseName);

            for(const asset of release["assets"]) {
                const releaseButton = document.createElement("button");
                releaseButton.innerText = "Download " + asset["name"];
                releaseButton.style.borderRadius = "0";
                releaseButton.onclick = () => {
                    window.open(this.githubReleaseDownloadURL.replace("AUTHOR", this.repository.author).replace("REPONAME", this.repository.name).replace("TAGNAME", release["tag_name"]).replace("FILENAME", asset["name"]), "_blank");
                };
                releaseContainer.appendChild(releaseButton);
            }
        }
    }

    onOpen() {
        if(this.loaded.get() === this.toLoad) return;
        let cachedReadme = false;
        let cachedReleases = false;
        if(window.CACHE.hasKey("projects", this.repository.author + "/" + this.repository.name + "README")) {
            cachedReadme = true;
            this.readme.innerHTML = marked.parse(window.CACHE.get("projects", this.repository.author + "/" + this.repository.name + "README"));
            this.loaded.set(this.loaded.get() + 1);
        }
        if(window.CACHE.hasKey("projects", this.repository.author + "/" + this.repository.name + "RELEASES")) {
            this.parseReleases(window.CACHE.get("projects", this.repository.author + "/" + this.repository.name + "RELEASES"));
            cachedReleases = true;
            this.loaded.set(this.loaded.get() + 1);
        }
        if(cachedReleases || cachedReadme) return;
        if(!this.loadStarted) {
            this.#reloadData();
        }
        if(this.loaded.get() !== this.toLoad) {
            this.spinner.style.visibility = "visible";
        }
    }

    #reloadData() {
        this.spinner.style.visibility = "visible";

        this.loadStarted = true;

        makeRequest("GET", this.githubReadmeURL.replace("AUTHOR", this.repository.author).replace("REPONAME", this.repository.name)).then((data) => {
            this.readme.innerHTML = marked.parse(data);
            window.CACHE.set("projects", this.repository.author + "/" + this.repository.name + "README", data);
            this.loaded.set(this.loaded.get() + 1);
        }).catch((err) => {
            console.log("[Project] Fetching README.MD failed! Trying to find it differently")
            // Readme not found trying to load via api
            makeRequest("GET", this.githubContentsURL.replace("AUTHOR", this.repository.author).replace("REPONAME", this.repository.name)).then((data) => {
                for(let file in JSON.parse(data)) {
                    file = JSON.parse(data)[file];
                    if(file["name"].toLowerCase().includes("readme") && file["name"].toLowerCase().includes(".md")) {
                        makeRequest("GET", file["download_url"]).then((data) => {
                            this.readme.innerHTML = marked.parse(data);
                            window.CACHE.set("projects", this.repository.author + "/" + this.repository.name + "README", data);
                            this.loaded.set(this.loaded.get() + 1);
                        }).catch((err) => {
                            this.readme.innerHTML = "Error while fetching data: " + err.message;
                            this.loaded.set(this.loaded.get() + 1);
                        });
                        return;
                    }
                }
                this.readme.innerHTML = "No Readme in repository";
            }).catch((err) => {
                console.log(err);
                this.readme.innerHTML = "Error while fetching data: " + err.message;
                this.loaded.set(this.loaded.get() + 1);
            });
        });

        makeRequest("GET", this.githubReleasesURL.replace("AUTHOR", this.repository.author).replace("REPONAME", this.repository.name)).then((data) => {
            this.parseReleases(data);
            window.CACHE.set("projects", this.repository.author + "/" + this.repository.name + "RELEASES", data);
            this.loaded.set(this.loaded.get() + 1);
        }).catch((err) => {
            console.log(err);
            this.loaded.set(this.loaded.get() + 1);
        });
    }

    onClose() {
        if(this.loaded.get() !== this.toLoad) {
            this.spinner.style.visibility = "hidden";
        }
    }

    render(div) {
        div.appendChild(this.internal_component);
    }

    getComponent() {
        return this.internal_component;
    }

    getName() {
        return this.repository.name;
    }
}