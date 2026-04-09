export default async(context) => {
    function saveNavigationState(viewName) {
        if (viewName === "Impressum") return;

        localStorage.setItem("navigationState", viewName);
    }

    function setActiveLink(viewName, controllerContext) {
        const allLinks = controllerContext.view.querySelectorAll(".nav-link");
        for (const link of allLinks) {
            link.classList.remove("nav-active");
        }

        const idMap = {
            "Home": "homeNavigation",
            "Projects": "projectsNavigation",
            "Tools": "toolsNavigation",
        };

        const desktopId = idMap[viewName];
        if (desktopId) {
            const el = controllerContext.view.getElementById(desktopId);
            if (el) el.classList.add("nav-active");
        }

        const mobileIdMap = {
            "Home": "homeNavigationMobile",
            "Projects": "projectsNavigationMobile",
            "Tools": "toolsNavigationMobile",
        };

        const hamburger = controllerContext.view.getElementById("navHamburger");
        const mobileId = mobileIdMap[viewName];
        if (hamburger && mobileId) {
            hamburger.setActive(controllerContext.view.getElementById(mobileId));
        }
    }

    async function navigateTo(viewName, controllerContext) {
        controllerContext.view.getElementById("header").style.userSelect = "none";
        await controllerContext.view.querySelector("ui-navigator").navigateTo(viewName);
        saveNavigationState(viewName);
        setActiveLink(viewName, controllerContext);

        const hamburger = controllerContext.view.getElementById("navHamburger");
        if (hamburger.open.get()) hamburger.open.set(false);

        controllerContext.view.getElementById("header").style.userSelect = "auto";
    }

    return {
        initController: (controllerContext) => {
            // Desktop nav links
            controllerContext.view.getElementById("homeNavigation").addEventListener("click", () => {
                navigateTo("Home", controllerContext);
            });

            controllerContext.view.getElementById("projectsNavigation").addEventListener("click", () => {
                navigateTo("Projects", controllerContext);
            });

            controllerContext.view.getElementById("toolsNavigation").addEventListener("click", () => {
                navigateTo("Tools", controllerContext);
            });

            // Mobile nav links (inside hamburger dropdown)
            controllerContext.view.getElementById("homeNavigationMobile").addEventListener("click", () => {
                navigateTo("Home", controllerContext);
            });

            controllerContext.view.getElementById("projectsNavigationMobile").addEventListener("click", () => {
                navigateTo("Projects", controllerContext);
            });

            controllerContext.view.getElementById("toolsNavigationMobile").addEventListener("click", () => {
                navigateTo("Tools", controllerContext);
            });

            controllerContext.view.getElementById("impressumNavigation").addEventListener("click", () => {
                navigateTo("Impressum", controllerContext);
            });

            // Set initial active state
            const saved = localStorage.getItem("navigationState") || "Home";
            setActiveLink(saved, controllerContext);
            controllerContext.view.querySelector("ui-navigator").navigateTo(saved);
        }
    }
}
