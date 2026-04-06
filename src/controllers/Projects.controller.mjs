export default async(context) => {
    const { getHttpClient } = await context.require("Requests.mjs");
    const { initializeComponent } = await context.require("components/Components.mjs")
    const logger = context.logger.newLogger("Projects");

    let init = true;
    const repositories = [];

    class Repository {
        author;
        name;
        description;
        language;
        languageColor;
        stars;
        forks;
    }

    function createBadge(html) {
        const span = document.createElement("span");
        span.className = "ui-card-badge";
        span.innerHTML = html;
        return span;
    }

    function createLangBadge(language, color) {
        const span = document.createElement("span");
        span.className = "ui-card-badge";
        const dot = document.createElement("span");
        dot.className = "ui-card-badge-dot";
        dot.style.backgroundColor = color || "currentColor";
        span.append(dot);
        span.append(` ${language}`);
        return span;
    }

    async function loadRepositories() {
        logger.debug("Loading repositories");

        const response = await getHttpClient().execute("https://pinned.berrysauce.dev/get/werwolf2303");
        for (let repo of await response.json()) {
            repositories.push(Object.assign(new Repository(), repo));
        }
        repositories.sort((a, b) => a.stars < b.stars);

        logger.debug("Loaded", repositories.length, "repositories");
    }

    return {
        initController: async(controllerContext) => {
            if (!init) return;
            init = false;

            await loadRepositories();

            await initializeComponent("ui-card");

            const repoGrid = controllerContext.view.getElementById("repositoriesGrid");
            for (const repo of repositories) {
                const card = document.createElement("ui-card");
                card.title.set(repo.name);
                card.subtitle.set(repo.description);
                card.classList.add("ui-card-clickable");

                if (repo.language) {
                    card.addBadge(createLangBadge(repo.language, repo.languageColor));
                }

                card.addBadge(createBadge(
                    `<svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor"><path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.75.75 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25z"/></svg> ${repo.stars}`
                ));

                card.addBadge(createBadge(
                    `<svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor"><path d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-.878a2.25 2.25 0 1 0-1.5 0v.878H6.75v-.878a2.25 2.25 0 1 0-1.5 0ZM8 1.25a.75.75 0 1 1 0 1.5.75.75 0 0 1 0-1.5Zm-2.25.75a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm6 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM8 14a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm0-8.5A.75.75 0 0 1 8.75 6v5a.75.75 0 0 1-1.5 0V6A.75.75 0 0 1 8 5.5Z"/></svg> ${repo.forks}`
                ));

                card.addEventListener("click", () => {
                    window.open(`https://github.com/${repo.author}/${repo.name}`, "_blank");
                });

                repoGrid.append(card);
            }
        }
    }
}
