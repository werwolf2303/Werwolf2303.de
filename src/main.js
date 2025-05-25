import {Navigator} from "./navigator";
import {Home} from "./pages/home"
import {WebAmp} from "./pages/webamp";
import {useState} from "./utils";
import {Projects} from "./pages/projects";
import {COLOR_1, COLOR_6} from "./colors";
import {Cache} from "./cache";

// Hack for avoiding page init for webamp popout
if(!window.bypassInit) {
    window.DEBUG_MODE = false;

    window.onerror = function(msg, url, line, col, error) {
        const error_container = document.createElement("div");
        error_container.className = "error-container";
        const error_display = document.createElement("h2");
        error_display.textContent = "Exception! Message: " + msg;
        error_display.className = "error-display";
        error_display.style.backgroundColor = COLOR_6;
        document.body.style.backgroundColor = COLOR_1;
        error_container.appendChild(error_display);
        const error_info = document.createElement("h3");
        error_info.textContent = "This page heavily relies on JavaScript! Please use Supermium if you are on Windows XP";
        error_info.className = "error-display";
        error_info.style.backgroundColor = COLOR_6;
        error_info.style.color = "black";
        error_container.appendChild(error_info);
        document.body.appendChild(error_container);
        const page_name = document.createElement("a");
        page_name.style.textAlign = "center";
        page_name.textContent = "Werwolf2303.de";
        page_name.style.color = COLOR_6;
        page_name.style.width = "100vw";
        page_name.style.bottom = "0";
        page_name.style.position = "absolute";
        document.body.appendChild(page_name);
        localStorage.removeItem("currentView");
        localStorage.removeItem("cache");
        return false;
    }

    if(!window.DEBUG_MODE) {
        window.console.log = (data) => {
        };
        window.console.debug = (data) => {
        };
        window.console.info = (data) => {
        };
    }

    window.addEventListener('DOMContentLoaded', () => {
        renderPage()
    })

    // Changed by navigator
    window.isMobileStyle = useState(false);

    /**
     * @type {Cache}
     */
    window.CACHE = new Cache();

    window.TIMER_FUNCS = new class TIMER_FUNCS extends Array {
        constructor(...args) {
            super(...args);
            Object.defineProperty(this, 'remove', {
                value: function (funcName) {
                    for (const func in this) {
                        if (this[func]["name"] === funcName) {
                            delete this[func];
                        }
                    }
                },
                enumerable: false,
                writable: true,
                configurable: true
            });
        }
    }

    setInterval(function () {
        for (const func in window.TIMER_FUNCS) {
            try {
                window.TIMER_FUNCS[func]["func"]();
            } catch (e) {
                console.log("Invalid timer func");
                console.log(e);
            }
        }
    }, 1000)

    function renderPage() {
        const content = document.createElement("div");
        const navigator = new Navigator([new Home(), new Projects(), new WebAmp()]);
        navigator.render(content);
        document.body.appendChild(content);
        if(localStorage.getItem("currentView")) {
            navigator.switchView(localStorage.getItem("currentView"));
        }else navigator.switchView("Home");
        navigator.recalculateInternalSize();
    }
}