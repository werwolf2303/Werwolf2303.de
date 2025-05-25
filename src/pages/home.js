import {Page} from "./page";
import {COLOR_5} from "../colors";
import {makeRequest} from "../utils";

export class Home extends Page {
    internal_component;
    cards;
    meCard;
    meCardContainer;
    repoLanguagesCardContainer;
    repoLanguagesCard;
    commitLanguagesCardContainer;
    commitLanguagesCard;
    meReadme;
    script;


    constructor() {
        super();
        this.internal_component = document.createElement("div");
        this.internal_component.id = "homecontainer";
        this.internal_component.style.backgroundColor = COLOR_5;

        this.meReadme = document.createElement("div");
        this.meReadme.className = "me-readme";
        makeRequest("GET", "https://raw.githubusercontent.com/werwolf2303/werwolf2303/refs/heads/main/README.md").then(content => {
            this.meReadme.innerHTML = marked.parse(content);
        })
        this.internal_component.appendChild(this.meReadme);

        this.cards = document.createElement("div");
        this.cards.id = "homeCards";
        this.internal_component.appendChild(this.cards);

        this.meCardContainer = document.createElement("div");
        this.meCardContainer.id = "meCardContainer";
        this.cards.appendChild(this.meCardContainer);

        this.meCard = document.createElement("img");
        this.meCard.className = "homeCard";
        this.meCard.id = "meCard";
        this.meCard.alt = "Vercel app didn't respond";
        this.meCard.src = "https://github-profile-summary-cards.vercel.app/api/cards/profile-details?username=werwolf2303&theme=transparent";
        this.meCardContainer.appendChild(this.meCard);

        this.repoLanguagesCardContainer = document.createElement("div");
        this.cards.appendChild(this.repoLanguagesCardContainer);

        this.repoLanguagesCard = document.createElement("img");
        this.repoLanguagesCard.className = "homeCard";
        this.repoLanguagesCard.alt = "Vercel app didn't respond";
        this.repoLanguagesCard.src = "https://github-profile-summary-cards.vercel.app/api/cards/repos-per-language?username=werwolf2303&theme=transparent";
        this.repoLanguagesCardContainer.appendChild(this.repoLanguagesCard);

        this.commitLanguagesCardContainer = document.createElement("div");
        this.cards.appendChild(this.commitLanguagesCardContainer);

        this.commitLanguagesCard = document.createElement("img");
        this.commitLanguagesCard.alt = "Vercel app didn't respond";
        this.commitLanguagesCard.src = "https://github-profile-summary-cards.vercel.app/api/cards/most-commit-language?username=werwolf2303&theme=transparent";
        this.commitLanguagesCard.className = "homeCard";
        this.commitLanguagesCardContainer.appendChild(this.commitLanguagesCard);
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
        return "Home"
    }
}