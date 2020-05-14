if ('serviceWorker' in navigator) {

    navigator.serviceWorker
        .register('./serviceWorker.js', { scope: './' })
        .then(function(registration) {
            console.log("Service Worker Registered. Scope is:"+registration.scope);
        })
        .catch(function(err) {
            console.log("Service Worker Failed to Register", err);
        })

}