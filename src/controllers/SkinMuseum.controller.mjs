export default async(context) => {
    const { getHttpClient } = await context.require("Requests.mjs");
    const logger = context.logger.newLogger("SkinMuseum");

    let initSkinMuseum = true;

    /**
     * @type {SkinMuseum}
     */
    let activeSkinMuseum;

    /**
     * @type {Array<SkinMuseum>}
     */
    let skinMuseumInstances = [];

    class SkinMuseum {
        _container = document.createElement("div");
        _skinContainer = document.createElement("div");

        _info_bar = document.createElement("ui-app-bar");
        _info_bar_total_pages = document.createElement("a");
        _info_bar_total_skins = document.createElement("a");
        _info_bar_container = document.createElement("ui-div");

        loadMoreSkinsFunction;
        setSkinFunction;

        itemsPerPage = 40;
        totalPages = -1;
        page = 1;
        totalSkins;

        /**
         *
         * @param loadMoreSkinsFunction Function to load more skins
         * @param setSkinFunction Function to apply the skin to WebAmp
         */
        constructor(loadMoreSkinsFunction, setSkinFunction) {
            this.loadMoreSkinsFunction = loadMoreSkinsFunction;
            this.setSkinFunction = setSkinFunction;

            this.loadMoreSkins();

            this._container.classList.add("skinMuseum");
            this._container.append(this._info_bar);

            this._skinContainer.classList.add("skinMuseumSkinsContainer");
            this._container.append(this._skinContainer);

            this._info_bar_container.setAttribute("layout", "GridLayout");
            this._info_bar_container.setAttribute("rows", "1");
            this._info_bar_container.setAttribute("cols", "2");
            this._info_bar_container.setAttribute("col-gap", "1rem");
            this._info_bar.append(this._info_bar_container);

            this._info_bar_container.append(this._info_bar_total_pages);
            this._info_bar_container.append(this._info_bar_total_skins);

            this._container.style.overflow = "hidden";
            this._skinContainer.style.overflow = "visible";
        }

        /**
         * @param {Skin} skin
         */
        addSkin(skin) {
            const skinContainer = document.createElement("img");
            skinContainer.classList.add("skinMuseumSkin");
            skinContainer.src = skin.imageURL;
            skinContainer.onclick = () => {
                if (!skin.webamp) {
                    (async () => {
                        const alternativeResponse = await getHttpClient().execute("https://archive.org/metadata/" + skin.identifier);
                        const alternativeJSON = await alternativeResponse.json();
                        for (let file in alternativeJSON["files"]) {
                            file = alternativeJSON["files"][file];
                            if (file["name"].includes(".wsz")) {
                                skin.webamp = "https://archive.org/download/" + skin["identifier"] + "/" + file["name"];
                                break;
                            }
                        }
                        if (!skin.webamp) {
                            alert("WebAmp skin url not found, sorry");
                            return;
                        }
                        this.setSkinFunction(skin.webamp);
                        alert("Skin applied");
                    })();
                    return;
                }
                this.setSkinFunction(skin.webamp);
                alert("Skin applied");
            }

            this._skinContainer.append(skinContainer);
        }

        getContainer() {
            return this._container;
        }

        loadMoreSkins() {
            return this.loadMoreSkinsFunction(this.itemsPerPage, this.page, this.totalPages).then((loadSkinsResponse) => {
                if (this.page === 1) {
                    this.totalSkins = loadSkinsResponse.totalSkins;
                    this.totalPages = loadSkinsResponse.totalPages;

                    this._info_bar_total_skins.innerText = "Total Skins: " + this.totalSkins;
                    this._info_bar_total_pages.innerText = "Total Pages: " + this.totalPages;

                    for (const skin of loadSkinsResponse.skins) {
                        this.addSkin(skin);
                    }

                    return;
                }

                for (const skin of loadSkinsResponse) {
                    this.addSkin(skin);
                }
            });
        }
    }

    class Skin {
        identifier;
        title;
        fileURL;
        imageURL;
        webamp;
    }

    async function loadSkins(itemsPerPage, page, totalPages, search) {
        // Check if there are more pages to load
        if (totalPages === page - 1) return;

        let requestUrl;
        if (search) {
            requestUrl = `https://archive.org/advancedsearch.php?q=collection:winampskins%20${search}&fl[]=identifier,title,webamp
            &rows=${itemsPerPage}&page=${page}&output=json`;
        } else requestUrl = `https://archive.org/advancedsearch.php?q=collection:winampskins&fl[]=identifier,title,webamp
            &rows=${itemsPerPage}&page=${page}&output=json`;

        const response = await getHttpClient().execute(requestUrl, {
            cache: "no-cache"
        });
        const responseJSON = await response.json();


        const skins = [];

        for (const doc of responseJSON.response.docs) {
            const skin = Object.assign(new Skin(), doc);
            skin.imageURL = "https://archive.org/services/img/" + skin.identifier;
            if (skin.webamp) skin.webamp = decodeURIComponent(skin.webamp.replace("https://webamp.org/?skinUrl=", ""));
            skins.push(skin);
        }

        logger.debug("Loaded Page", page);

        if (page === 1) {
            const totalSkins = responseJSON.response.numFound;
            return {
                totalSkins: totalSkins,
                totalPages: roundUpIfDecimal(totalSkins / itemsPerPage),
                skins: skins
            };
        }
        return skins;
    }

    function roundUpIfDecimal(num) {
        return num % 1 !== 0 ? Math.ceil(num) : num;
    }

    function applyWebAmpSkin(newSkinUrl) {
        localStorage.setItem("WebAmpSkin", newSkinUrl);

        if (context.hasOwnProperty("WebAmp")) {
            context.WebAmp.setSkinFromUrl(newSkinUrl);
        }
    }

    return {
        initController: (controllerContext) => {
            if (!initSkinMuseum) return;
            initSkinMuseum = false;

            skinMuseumInstances.push(
                new SkinMuseum(loadSkins, (newSkinUrl) => {
                    applyWebAmpSkin(newSkinUrl);
                })
            )
            activeSkinMuseum = skinMuseumInstances[0];

            controllerContext.view.getElementById("skinMuseumsContainer").append(activeSkinMuseum.getContainer());

            controllerContext.view.getElementById("closeSkinMuseum").addEventListener("click", () => {
                document.querySelector(".skinMuseumNavigator").style.display = "none";
                document.getElementById("toolsDesktop").style.display = "flex";
            });

            controllerContext.view.getElementById("skinMuseumSearchButton").addEventListener("click", () => {
                if (skinMuseumInstances.length === 1) {
                    skinMuseumInstances.push(new SkinMuseum(
                        (itemsPerPage, page, totalPages) => {
                            return loadSkins(itemsPerPage, page, totalPages, document.getElementById("skinMuseumSearchText").value);
                        },
                        applyWebAmpSkin
                    ));

                    controllerContext.view.getElementById("skinMuseumsContainer").append(skinMuseumInstances[1].getContainer());
                } else {
                    skinMuseumInstances[1]._skinContainer.innerHTML = "";
                    skinMuseumInstances[1].totalPages = -1;
                    skinMuseumInstances[1].page = 1;
                    skinMuseumInstances[1].loadMoreSkins();
                }

                skinMuseumInstances[0].getContainer().style.display = "none";
                skinMuseumInstances[1].getContainer().style.display = "block";

                activeSkinMuseum = skinMuseumInstances[1];

                document.getElementById("closeSearchSkinMuseum").style.display = "block";
            });

            controllerContext.view.getElementById("closeSearchSkinMuseum").addEventListener("click", () => {
                skinMuseumInstances[0].getContainer().style.display = "block";
                skinMuseumInstances[1].getContainer().style.display = "none";

                activeSkinMuseum = skinMuseumInstances[0];

                document.getElementById("closeSearchSkinMuseum").style.display = "none";
            });

            let loading = false;

            window.addEventListener("scroll", () => {
                if (loading) return;

                const container = document.querySelector("#skinMuseumsContainer");
                if (!container || container.style.display === "none") return;

                const doc = document.documentElement;
                const maxScroll = doc.scrollHeight - doc.clientHeight;
                const nearBottom = doc.scrollHeight - doc.scrollTop <= doc.clientHeight + 500;
                const halfScrolled = maxScroll > 0 && doc.scrollTop / maxScroll >= 0.5;
                if (nearBottom || halfScrolled) {
                    if (activeSkinMuseum.page >= activeSkinMuseum.totalPages) return;

                    loading = true;
                    activeSkinMuseum.page += 1;
                    activeSkinMuseum.loadMoreSkins().then(() => {
                        loading = false;
                    }).catch(() => {
                        loading = false;
                    });
                }
            });
        }
    }
}
