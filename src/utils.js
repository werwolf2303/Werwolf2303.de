// 'Borrowed' from https://stackoverflow.com/questions/48969495/in-javascript-how-do-i-should-i-use-async-await-with-xmlhttprequest
export function makeRequest(method, url) {
    return new Promise(function (resolve, reject) {
        let xhr = new XMLHttpRequest();
        xhr.open(method, url);
        xhr.onload = function () {
            if (this.status >= 200 && this.status < 300) {
                resolve(xhr.response);
            } else {
                reject({
                    status: this.status,
                    statusText: xhr.statusText
                });
            }
        };
        xhr.onerror = function () {
            reject({
                status: this.status,
                statusText: xhr.statusText
            });
        };
        xhr.send();
    });
}

export function useState(defaultValue) {
    let internal_value = defaultValue;
    const listeners = [];
    const iSet = (value) => {
        for (const func in listeners) {
            listeners[func]["func"](value);
        }
        internal_value = value;
    };
    const iAddListener = (name, func) => {
        listeners.push({
            "name": name,
            "func": func
        })
    };
    const iRemoveListener = (funcName) => {
        for (const func in listeners) {
            if (listeners[func]["name"] === funcName) {
                delete listeners[func];
            }
        }
    }
    return new class OneParamSupport extends Array {
        constructor(...args) {
            super(...args);
        }

        get() {
            return internal_value;
        }

        set(value) {
            iSet(value);
        }

        addListener(name, func) {
            iAddListener(name, func);
        }

        removeListener(name) {
            iRemoveListener(name);
        }
    }(() => {
        return internal_value;
    }, iSet, iAddListener, iRemoveListener);
}

/**
 * Displays a spinner in the given element
 *
 * Width (Optional) - Width of spinner<br>
 * Height (Optional) - Height of spinner
 **/
export function displaySpinner(at, width, height) {
    if(width) at.style.width = width + "px";
    if(height) at.style.height = height + "px";
    at.classList.add("spinner-container");

    const spinner = document.createElement("div");
    spinner.className = "spinner";
    at.appendChild(spinner);
}