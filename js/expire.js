// USE ONLY IN SUBPAGES !
// for moving to main page when session expired in sub-pages
function checkIfExpiredSession() {
    if (sessionStorage.getItem('username') == null) {
        alert("Session Expired!");
        window.location = "../index.html";
    }
}

checkIfExpiredSession();
