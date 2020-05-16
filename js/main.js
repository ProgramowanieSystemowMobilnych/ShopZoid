//Firebase Config
var firebaseConfig = {
    apiKey: "AIzaSyCxGBF4zfKt82HX-HzpqkfFgyUgWjF4R2o",
    authDomain: "psm-shopzoid.firebaseapp.com",
    databaseURL: "https://psm-shopzoid.firebaseio.com",
    projectId: "psm-shopzoid",
    storageBucket: "psm-shopzoid.appspot.com",
    messagingSenderId: "113138616776",
    appId: "1:113138616776:web:d6f0ea53cbec8b90fe98fd",
    measurementId: "G-GXH41HY3LD"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
firebase.analytics();
var db = firebase.firestore();


const loginSubmitButton = document.querySelector("#loginSubmitButton");
const registerSubmitButton = document.querySelector("#registerSubmitButton");

//function for AUTH
if (loginSubmitButton != null) {
    if (localStorage.getItem('username') != null && localStorage.getItem('password') != null) {
        $('#usernameLogin').val(localStorage.getItem('username'));
        $('#passwordLogin').val(localStorage.getItem('password'));
    }
    loginSubmitButton.addEventListener('click', e => {
        e.preventDefault();
        let username = document.getElementById("usernameLogin").value;
        let password = document.getElementById("passwordLogin").value;
        let userRef = db.collection("users").doc(username);

        userRef.get().then(doc => {
            if (doc.exists && doc.data().password == password) {
                sessionStorage.setItem('username', username);
                // remember user & password in local storage
                if (document.getElementById("check").checked == true) {
                    localStorage.setItem('username', username);
                    localStorage.setItem('password', password);
                }
                window.location = "webpages/NewList.html";
            } else {
                alert("Invalid username or password");
            }
        });
    });
};

if (registerSubmitButton != null) {
    registerSubmitButton.addEventListener('click', e => {
        e.preventDefault();
        let username = document.getElementById("usernameRegister").value;
        let email = document.getElementById("emailRegister").value;
        let password = document.getElementById("passwordRegister").value;

        db.collection("users").doc(username).set({
                username: username,
                email: email,
                password: password
            }).then(function() {
                console.log("Document successfully written!");
            })
            .catch(function(error) {
                console.error("Error writing document: ", error);
            });
        login();
        $('#usernameLogin').val(username);
        $('#passwordLogin').val(password);
    });
};

function storeList(list) {
    db.collection(sessionStorage.getItem('username') + "-lists").doc(list.id).set(list)
        .then(function() {
            console.log("List successfully created/updated!");
        }).catch(function(error) {
            console.error("Error adding document: ", error);
        });
}

function storeTask(task) {
    db.collection(sessionStorage.getItem('username') + "-tasks").doc(task.id).set(task)
        .then(function() {
            console.log("Task successfully created/updated!");
        }).catch(function(error) {
            console.error("Error adding document: ", error);
        });
}

function deleteListFromDB(list) {
    db.collection(sessionStorage.getItem('username') + "-lists").doc(list.id).delete()
        .then(function() {
            console.log("List successfully deleted!");
        }).catch(function(error) {
            console.error("Error removing document: ", error);
        });
}

function deleteTaskFromDB(task) {
    db.collection(sessionStorage.getItem('username') + "-tasks").doc(task.id).delete()
        .then(function() {
            console.log("Task successfully deleted!");
        }).catch(function(error) {
            console.error("Error removing document: ", error);
        });
}

const listsContainer = document.querySelector('[data-lists]')
const newListForm = document.querySelector('[data-new-list-form]')
const newListInput = document.querySelector('[data-new-list-input]')
const newListInputDate = document.querySelector('[data-new-list-input-date]')
const deleteListButton = document.querySelector('[data-delete-list-button]')
const listDisplayContainer = document.querySelector('[data-list-display-container]')
const listTitleElement = document.querySelector('[data-list-title]')
const listCountElement = document.querySelector('[data-list-count]')
const tasksContainer = document.querySelector('[data-tasks]')
const taskTemplate = document.getElementById('task-template')
const newTaskForm = document.querySelector('[data-new-task-form]')
const newTaskInput = document.querySelector('[data-new-task-input]')
const newTaskInputQuantity = document.querySelector('[data-new-task-input-quantity]')
const newTaskInputPrice = document.querySelector('[data-new-task-input-price]')
const clearCompleteTasksButton = document.querySelector('[data-delete-completed-tasks-button]')
const dataNewList = document.querySelector('[btn-calendar]')
//Save to local storage
const LOCAL_STORAGE_LIST_KEY = 'task.lists'
const LOCAL_STORAGE_SELECTED_LIST_ID_KEY = 'task.selectedListId'

// get lists from DB when loading once
const listsFromDB = [];
db.collection(sessionStorage.getItem('username') + "-lists")
    .get()
    .then((snapshot) => {
        snapshot.docs.forEach((doc) => {
            listsFromDB.push(doc.data());
        });
        // render when all data taken
        render();
    }).catch(err => console.log(err));

//GET AN LIST FROM LOCAL STORAGE OR IF NOT EXISTS MAKE EMPTY ONE
let lists = JSON.parse(sessionStorage.getItem(LOCAL_STORAGE_LIST_KEY)) || listsFromDB;
let selectedListId = sessionStorage.getItem(LOCAL_STORAGE_SELECTED_LIST_ID_KEY);

listsContainer.addEventListener('click', e => {
    if (e.target.tagName.toLowerCase() === 'li') {
        selectedListId = e.target.dataset.listId
        saveAndRender()
    }
})
tasksContainer.addEventListener('click', e => {
    if (e.target.tagName.toLowerCase() === 'input') {
        const selectedList = lists.find(list => list.id === selectedListId)
        const selectedTask = selectedList.tasks.find(task => task.id === e.target.id)
        selectedTask.complete = e.target.checked
        // store updated task and list
        storeTask(selectedTask);
        storeList(selectedList);
        save()
        renderTaskCount(selectedList)
    }
})
clearCompleteTasksButton.addEventListener('click', e => {
    const selectedList = lists.find(list => list.id === selectedListId)
    // removing all complete tasks from DB in this list
    for (const task of selectedList.tasks) {
        if (task.complete) {
            deleteTaskFromDB(task);
        }
    }
    selectedList.tasks = selectedList.tasks.filter(task => !task.complete)
    // updating list that contained those tasks
    storeList(selectedList);
    saveAndRender()
})
deleteListButton.addEventListener('click', e => {
    // removing from DB
    let listToDelete = lists.find(list => list.id == selectedListId)
    deleteListFromDB(listToDelete);

    lists = lists.filter(list => list.id !== selectedListId)
    selectedListId = null
    saveAndRender()
})
//ADD NEW LIST
newListForm.addEventListener('submit', e => {
    e.preventDefault()
    const listName = newListInput.value + ', Created: ' + newListInputDate.value
    if (listName == null || listName === '') return
    const list = createList(listName)
    // storage of new list to database
    storeList(list);

    newListInput.value = null
    lists.push(list)
    render()
    saveAndRender()
})

//Type new Item
newTaskForm.addEventListener('submit', e => {
    e.preventDefault()

    sumOfPrices = newTaskInputQuantity.value * newTaskInputPrice.value
    const taskName = newTaskInput.value + ', Quantity: ' + newTaskInputQuantity.value + ', Cost: ' + sumOfPrices + '$'

    if (taskName == null || taskName === '') return
    const task = createTask(taskName)

    // storage of new task to database
    storeTask(task);

    newTaskInput.value = null
    newTaskInputQuantity.value = null
    newTaskInputPrice.value = null
    const selectedList = lists.find(list => list.id === selectedListId)
    selectedList.tasks.push(task)

    // update list to contain added task
    storeList(selectedList);

    saveAndRender()
})

function createList(name) {
    return {
        id: Date.now().toString(),
        name: name,
        tasks: []
    }
}

function createTask(name) {
    return {
        id: Date.now().toString(),
        name: name,
        complete: false
    }
}

function saveAndRender() {
    // in expire.js
    checkIfExpiredSession();
    save()
    render()
}

function save() {
    sessionStorage.setItem(LOCAL_STORAGE_LIST_KEY, JSON.stringify(lists))
    sessionStorage.setItem(LOCAL_STORAGE_SELECTED_LIST_ID_KEY, selectedListId)
}

function render() {
    clearElement(listsContainer)
    renderLists()
    //NAME RIGHT COLUMN AS ITS LIST NAME
    const selectedList = lists.find(list => list.id === selectedListId)
    //NO RENDER RIGHT LIST IF ITS EMPTY OR NOT SELECTED
    if (selectedList === undefined) {
        listDisplayContainer.style.display = 'none'
    } else {
        listDisplayContainer.style.display = ''
        listTitleElement.innerText = selectedList.name;
        renderTaskCount(selectedList)
        clearElement(tasksContainer)
        renderTasks(selectedList)
    }
}
//RENDER TASKS RIGHT COLUMN
function renderTasks(selectedList) {
    selectedList.tasks.forEach(task => {
        const taskElement = document.importNode(taskTemplate.content, true)
        const checkbox = taskElement.querySelector('input')
        checkbox.id = task.id
        checkbox.checked = task.complete
        const label = taskElement.querySelector('label')
        label.htmlFor = task.id
        label.append(task.name)
        tasksContainer.appendChild(taskElement)
    })
}
//RENDER COUNTER ON THE RIGHT
function renderTaskCount(selectedList) {
    const incompleteTaskCount = selectedList.tasks.filter(task => !task.complete).length
    const taskString = incompleteTaskCount === 1 ? "item" : "items"
    listCountElement.innerText = `${incompleteTaskCount} ${taskString} remaining`
}

function renderLists() {
    lists.forEach(list => {
        const listElement = document.createElement('li')
        listElement.dataset.listId = list.id
        listElement.classList.add("list-name")
        listElement.innerText = list.name
        if (list.id === selectedListId) {
            listElement.classList.add('active-list')
        }
        listsContainer.appendChild(listElement)
    })
}

function clearElement(element) {
    while (element.firstChild) {
        element.removeChild(element.firstChild)
    }
}
render()

//Default today day for form
var field = document.querySelector('#today');
var date = new Date();

// Set the date
field.value = date.getFullYear().toString() + '-' + (date.getMonth() + 1).toString().padStart(2, 0) +
    '-' + date.getDate().toString().padStart(2, 0);
