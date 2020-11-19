const socket = io();

// socket.on("countUpdated", (count) => {
//     console.log("The count has been updated", count);
// });

// document.querySelector("#increment").addEventListener("click", () => {
//     console.log("Clicked");
//     socket.emit("increment");
// });

// elements
const $messageForm = document.querySelector("#message-form");
const $messageFormInput = $messageForm.querySelector("input");
const $messageFormButton = $messageForm.querySelector("button");
const $sendLocationButton = document.querySelector("#send-location");
const $messages = document.querySelector("#messages");

// Templates
const messageTemplate = document.querySelector("#message-template").innerHTML;
const locationTemplate = document.querySelector("#location-template").innerHTML;
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML;

//Options
const { username, room } = Qs.parse(location.search, {
    ignoreQueryPrefix: true,
});

const autoscroll = () => {
    // New message element
    const $nowMessage = $messages.lastElementChild;

    // Height of the new message
    const newMessageStyles = getComputedStyle($nowMessage);
    const newMessageMargin = parseInt(newMessageStyles.marginBottom);
    const newMessageHeight = $nowMessage.offsetHeight + newMessageMargin;

    // Visiable height
    const visiableHeight = $messages.offsetHeight;

    // Height of messages container
    const containerHeight = $messages.scrollHeight;

    // How far have i scrolled?
    const scrollOffset = $messages.scrollTop + visiableHeight;

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight;
    }
};

socket.on("message", (message) => {
    console.log(message);
    const html = Mustache.render(messageTemplate, {
        createAt: moment(message.createAt).format("hh:mm:ss a"),
        message: message.text,
        username: message.username,
    });
    $messages.insertAdjacentHTML("beforeend", html);
    autoscroll();
});

$messageForm.addEventListener("submit", (e) => {
    e.preventDefault();

    $messageFormButton.setAttribute("disabled", "disabled");

    const message = e.target.elements.message.value;
    socket.emit("sendMessage", message, (error) => {
        $messageFormButton.removeAttribute("disabled");
        $messageFormInput.value = "";
        $messageFormInput.focus();

        if (error) {
            return console.log(error);
        }
        console.log("Message Delivered!");
    });
});

socket.on("locationMessage", (locationURL) => {
    const html = Mustache.render(locationTemplate, {
        createAt: moment(locationURL.createAt).format("hh:mm:ss a"),
        locationURL: locationURL.url,
        username: locationURL.username,
    });
    $messages.insertAdjacentHTML("beforeend", html);
    autoscroll();
});

socket.on("roomData", ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users,
    });
    document.querySelector("#sidebar").innerHTML = html;
});

$sendLocationButton.addEventListener("click", () => {
    if (!navigator.geolocation) {
        return alert("Geolocation is not supported by your browser.");
    }

    $sendLocationButton.setAttribute("disabled", "disabled");

    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit(
            "sendLocation",
            {
                lon: position.coords.longitude,
                lat: position.coords.latitude,
            },
            () => {
                $sendLocationButton.removeAttribute("disabled");
                console.log("Location shared!");
            }
        );
    });
});

socket.emit("join", { username, room }, (error) => {
    if (error) {
        alert(error);
        location.href = "/";
    }
});
