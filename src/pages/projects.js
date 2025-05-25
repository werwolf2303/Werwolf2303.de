import {Page} from "./page";
import {makeRequest} from "../utils";
import {COLOR_1, COLOR_6, COLOR_8} from "../colors";
import {Project} from "./project";

export class Projects extends Page {
    internal_component;
    repositoriesContainer;
    header;
    repositories = [];

    Repository = class {
        author;
        name;
        description;
        language;
        stars;
        forks;

        constructor(author, name, description, language, stars, forks) {
            this.author = author;
            this.name = name;
            this.description = description;
            this.language = language;
            this.stars = stars;
            this.forks = forks;
        }
    }

    constructor() {
        super();

        if(!window.CACHE.hasEntry("projects")) {
            window.CACHE.addEntry("projects");
        }

        this.internal_component = document.createElement("div");
        this.internal_component.id = "projectsContainer";
        this.internal_component.style.backgroundColor = COLOR_8;

        this.header = document.createElement("a");
        this.header.id = "projectsHeader";
        this.header.textContent = "Favourite projects";
        this.internal_component.appendChild(this.header);

        this.repositoriesContainer = document.createElement("div");
        this.repositoriesContainer.id = "repositoriesContainer";
        this.internal_component.appendChild(this.repositoriesContainer);
    }

    async asyncInit() {
        await this.loadFavourites();

        for (let repository in this.repositories) {
            repository = this.repositories[repository];

            const repositoryContainer = document.createElement("div");
            repositoryContainer.id = "repositoryContainer";
            repositoryContainer.addEventListener("mouseenter", () => {
                if(!window.isMobileStyle.get()) {
                    repositoryContainer.style.backgroundColor = "rgba(245, 245, 245, 0.2)";
                    repositoryContainer.style.border = "1px solid rgba(245, 245, 245, 0.2)";
                }
            });
            repositoryContainer.addEventListener("mouseleave", () => {
                repositoryContainer.style.backgroundColor = "";
                repositoryContainer.style.border = "";
            });
            repositoryContainer.onclick = () => {
                this.getNavigator().switchView(repository.name, false);
            };

            const repositoryName = document.createElement("a");
            repositoryName.text = repository.name;
            repositoryContainer.append(repositoryName);

            const repositoryDescription = document.createElement("p");
            repositoryDescription.textContent = repository.description;
            repositoryContainer.append(repositoryDescription);

            const repositoryButtonsContainer = document.createElement("div");
            repositoryContainer.append(repositoryButtonsContainer);

            const repositoryButtonDetails = document.createElement("button");
            repositoryButtonDetails.textContent = "Details";
            repositoryButtonDetails.onclick = (evt) => {
                this.getNavigator().switchView(repository.name);
                evt.stopPropagation();
            }
            repositoryButtonsContainer.append(repositoryButtonDetails);

            const repositoryButtonOpenRepo = document.createElement("button");
            repositoryButtonOpenRepo.textContent = "View on GitHub";
            repositoryButtonOpenRepo.onclick = (evt) => {
                window.open("https://github.com/" + repository.author + "/" + repository.name, "about:blank");
                evt.stopPropagation();
            }
            repositoryButtonsContainer.append(repositoryButtonOpenRepo);

            this.repositoriesContainer.appendChild(repositoryContainer);

            this.getNavigator().addView(new Project(repository));
        }
    }

    isAsync() {
        return true;
    }

    async loadFavourites() {
        console.log("[Projects] Loading projects");
        let response = await makeRequest("GET", "https://pinned.berrysauce.dev/get/werwolf2303");
        const responseJSON = JSON.parse(response);
        for (let repo in responseJSON) {
            repo = responseJSON[repo];
            this.repositories.push(new this.Repository(
                repo["author"],
                repo["name"],
                repo["description"],
                repo["language"],
                repo["stars"],
                repo["forks"]
            ));
        }
        console.log("[Projects] Loaded " + responseJSON.length + " projects");
    }

    render(div) {
        div.appendChild(this.internal_component);
    }

    onClose() {

    }

    onOpen() {

    }

    getComponent() {
        return this.internal_component;
    }

    getName() {
        return "Projects";
    }
}