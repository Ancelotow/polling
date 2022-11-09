function mountNotif(notif) {
    const root = document.getElementById("root");
    const div = document.createElement('div');
    const text = document.createTextNode(`${notif.content} - ${notif.date}`);
    div.appendChild(text);
    root.appendChild(div);
}

document.querySelector('form').addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(e.target);

    const notif = {
        content: data.get('content'),
    };

    fetch("http://localhost:3000/notifs", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(notif),
    }).then((response) => {
        console.log(response.status);
        return response.json();
    }).then(data => {
        e.target.reset();
        console.log(data);
    });
});

let lastModified = null;

function grabRegularPollingV1() {
    setInterval(() => {
        const options = {};
        if (lastModified) {
            options.headers = {
                "if-modified-since": lastModified,
            }
        }
        fetch("http://localhost:3000/notifs", options)
            .then(response => {
                if (response.status === 304) return [];
                lastModified = response.headers.get("Last-Modified");
                return response.json();
            })
            .then(notifs => notifs.forEach(notif => mountNotif(notif)));
    }, 1000);
}

function grabRegularPollingV2() {
    setTimeout(() => {
        const options = {};
        if (lastModified) {
            options.headers = {
                "if-modified-since": lastModified,
            }
        }
        fetch("http://localhost:3000/notifs", options)
            .then(response => {
                if (response.status === 304) return [];
                lastModified = response.headers.get("Last-Modified");
                return response.json();
            })
            .then(notifs => notifs.forEach(notif => mountNotif(notif)))
            .then(() => grabRegularPollingV2());
    }, 1000);
}

async function asyncGrabLongPolling(init = false) {
    if (init) {
        const response = await fetch("http://localhost:3000/notifs");
        const notifs = await response.json();
        notifs.forEach(notif => mountNotif(notif));
    }
    const response = await fetch("http://localhost:3000/notifs/subscribe");
    const notif = await response.json();
    mountNotif(notif);
    grabLongPolling();
}

function grabLongPolling(init = false) {
    new Promise((resolve, reject) => {
        if (init) {
            fetch("http://localhost:3000/notifs")
                .then(response => response.json())
                .then(notifs => notifs.forEach(notif => mountNotif(notif)))
                .then(() => resolve());
        } else {
            resolve();
        }
    })
        .then(() => fetch("http://localhost:3000/notifs/subscribe"))
        .then(response => response.json())
        .then(notif => mountNotif(notif))
        .then(() => grabLongPolling());
}

asyncGrabLongPolling(true);
