class Cache {
    #CacheEntry = class {
        /**
         * @type {any[]}
         */
        map = [];
        /**
         * This is optional
         * @type {string}
         */
        validUntil = "";
        /**
         * The identifier of the entry
         * @type {string}
         */
        identifier = "";

        constructor(map, validUntil, identifier) {
            this.map = map;
            this.validUntil = validUntil;
            this.identifier = identifier;
        }

        toJSON() {
            return {
                map: this.map,
                validUntil: this.validUntil,
                identifier: this.identifier,
            }
        }
    }

    #CacheDef = class {
        /**
         * @type {any[]}
         */
        entries = [];
        /**
         * @type {string}
         */
        expirationDate = "";

        constructor(entries, expirationDate) {
            this.entries = entries;
            this.expirationDate = expirationDate;
        }

        toJSON() {
            return {
                entries: this.entries,
                expirationDate: this.expirationDate,
            }
        }
    }

    /**
     * Default lifetime of a cache entry in days
     * @type {string}
     */
    lifeTimeCacheEntry = "3";

    /**
     * Cache lifetime in days
     * @type {string}
     */
    lifeTimeCache = "7";

    #loadedCache = new this.#CacheDef();

    constructor() {
        if(localStorage.getItem('cache')) {
            console.log("[Cache] Loading cache...");
            this.#loadCache();
        }else this.#createCache();
        console.log("[Cache] Cache loaded");
    }

    #createCache() {
        this.#loadedCache = new this.#CacheDef();
        this.#loadedCache.entries = [];
        const date = new Date();
        date.setDate(date.getDate() + parseInt(this.lifeTimeCache));
        this.#loadedCache.expirationDate = date.getTime().toString();
        localStorage.setItem("cache", JSON.stringify(this.#loadedCache));
    }

    #loadCache() {
        this.#loadedCache = JSON.parse(localStorage.getItem("cache"));
        if(Date.parse(this.#loadedCache.expirationDate) < new Date()) {
            console.log("[Cache] Cache is older than 7 days! Clearing...");
            this.clearCache();
        }
        for(const item of this.#loadedCache.entries) {
            if(Date.parse(item.expirationDate) < new Date()) {
                console.log("[Cache] Entry in cache is older than 3 days! Clearing...");
                for(const item2 in this.#loadedCache.entries) {
                    if(item.identifier === this.#loadedCache.entries[item2].identifier) {
                        delete this.#loadedCache.entries[item2];
                    }
                }
            }

        }
    }

    #removeFromArray(array, key) {
        return array.map((item) => {if (item["key"] === key) { return undefined; } else { return item;} }).filter((item) => item !== undefined);
    }

    clearCache() {
        this.#createCache();
        console.log("[Cache] Cache cleared");
    }

    deleteCache() {
        localStorage.removeItem("cache");
        console.log("[Cache] Cache removed");
    }

    set(identifier, key, value) {
        console.log("[Cache] Setting '" + key + "' to '" + value + "' in '" + identifier + "'");
        for(const item of this.#loadedCache.entries) {
            if(item.identifier === identifier) {
                if(this.hasKey(identifier, key)) {
                    this.remove(identifier, key);
                }
                item.map.push({"key": key, "value": value});
                break;
            }
        }
        this.#saveModified();
    }

    remove(identifier, key) {
        console.log("[Cache] Removing '" + key + "' from '" + identifier + "'");
        for(const item of this.#loadedCache.entries) {
            if(item.identifier === identifier) {
                item.map = this.#removeFromArray(item.map, key);
                break;
            }
        }
        this.#saveModified();
    }

    deleteEntry(identifier) {
        console.log("[Cache] Removing entry '" + identifier + "'");
        for(const item of this.#loadedCache.entries) {
            if(item.identifier === identifier) {
                for(const item2 in this.#loadedCache.entries) {
                    if(item.identifier === this.#loadedCache.entries[item2].identifier) {
                        delete this.#loadedCache.entries[item2];
                    }
                }
                break;
            }
        }
        this.#saveModified();
    }

    hasEntry(identifier) {
        for(const item of this.#loadedCache.entries) {
            if(item.identifier === identifier) {
                return true;
            }
        }
        return false;
    }

    hasKey(identifier, key) {
        for(const item of this.#loadedCache.entries) {
            if(item.identifier === identifier) {
                for(const entry of item.map) {
                    if(entry["key"] === key) return true;
                }
            }
        }
        return false;
    }

    addEntry(identifier) {
        console.log("[Cache] Adding entry '" + identifier + "'");
        const date = new Date();
        date.setDate(date.getDate() + parseInt(this.lifeTimeCacheEntry));
        this.#loadedCache.entries.push(new this.#CacheEntry([], date.getTime().toString(), identifier));
        this.#saveModified();
    }

    get(identifier, key) {
        console.log("[Cache] Getting '" + key + "' from '" + identifier + "'");
        for(const item of this.#loadedCache.entries) {
            if(item.identifier === identifier) {
                for(const entry of item.map) {
                    if(entry["key"] === key) return entry["value"];
                }
            }
        }
        return null;
    }

    #saveModified() {
        localStorage.setItem("cache", JSON.stringify(this.#loadedCache));
    }

    dumpObj() {
        return this.#loadedCache;
    }
}