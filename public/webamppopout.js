const container = document.createElement("div");
container.innerHTML = "<h2>Loading...</h2><br>";
container.style.position = "absolute";
container.style.left = "50%";
container.style.top = "50%";
container.style.transform = "translate(-50%, -50%)";
container.style.color = "white";
document.body.appendChild(container);

const message = document.createElement("a");
message.style.color = "white";
container.appendChild(message);

const intervalId = setInterval(() => {
    message.textContent = "Waiting for Webamp class";
    if (Webamp) {
        clearInterval(intervalId);
        try {
            message.textContent = "Creating Webamp instance";
            window.webamp = new Webamp();
            window.webamp.renderWhenReady(document.getElementsByTagName("div")[0]);
            if (window.skin) window.webamp.setSkinFromUrl(window.skin);
            const webampHere = setInterval(() => {
                message.textContent = "Waiting for Webamp instance";
                if (document.getElementById("webamp") != null) {
                    clearInterval(webampHere);
                    let main_window = document.getElementById("main-window");
                    window.resizeTo(main_window.clientWidth, main_window.clientHeight * 3 + 30);
                    message.textContent = "Done";
                }
            });
        }catch (e) {
            container.innerHTML = "<h2 style='color:red'>Exception! toString(): " + e + "</h2>";
        }
    }
}, 500);