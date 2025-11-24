/* ==========================================================
   LIBRARY SYSTEM — LOCALSTORAGE DATABASE
   ========================================================== */

const STORAGE_KEYS = {
    BOOKS: "school_library_books",
    LOANS: "school_library_loans"
};

function load(key) {
    return JSON.parse(localStorage.getItem(key) || "[]");
}

function save(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

/* ==========================================================
   PAGE NAVIGATION
   ========================================================== */

function showPage(id) {
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
    document.getElementById(id).classList.add("active");
}

/* Default home page */
showPage("homePage");

/* ==========================================================
   HOME PAGE — SHOW RECENTLY REGISTERED BOOKS
   ========================================================== */

function refreshHomePage() {
    const list = document.getElementById("homeList");
    list.innerHTML = "";

    const books = load(STORAGE_KEYS.BOOKS);

    if (books.length === 0) {
        list.innerHTML = `<p>No books registered yet.</p>`;
        return;
    }

    books.slice(-10).reverse().forEach(book => {
        const item = document.createElement("div");
        item.className = "list-item";
        item.innerHTML = `
            <strong>${book.title || "(Unknown title)"} - ${book.isbn}</strong>
            <br>
            Registered on: ${new Date(book.registeredAt).toLocaleString()}
        `;
        list.appendChild(item);
    });
}
refreshHomePage();

/* ==========================================================
   ADMIN BUTTON + PIN LOGIN
   ========================================================== */

const adminButton = document.getElementById("adminBtn");
const adminLoginPage = document.getElementById("adminLoginPage");

adminButton.onclick = () => {
    showPage("adminLoginPage");
};

let enteredPIN = "";
const correctPIN = "1234";

function updatePinDisplay() {
    document.getElementById("pinDisplay").innerText = enteredPIN.replace(/./g, "*");
}

function pressKey(num) {
    if (enteredPIN.length < 4) {
        enteredPIN += num;
        updatePinDisplay();
    }
}

function pressClear() {
    enteredPIN = "";
    updatePinDisplay();
}

function pressEnter() {
    if (enteredPIN === correctPIN) {
        enteredPIN = "";
        updatePinDisplay();
        showPage("adminPanel");
    } else {
        alert("Incorrect password.");
        pressClear();
    }
}

/* ==========================================================
   ADMIN PANEL — REGISTER BOOKS
   ========================================================== */

document.getElementById("registerBookBtn").onclick = registerBook;

function registerBook() {
    const isbnInput = document.getElementById("adminIsbnInput");
    const titleInput = document.getElementById("adminTitleInput");

    const isbn = isbnInput.value.trim();
    const title = titleInput.value.trim();

    if (isbn === "") return alert("Please enter an ISBN.");

    const books = load(STORAGE_KEYS.BOOKS);
    books.push({
        isbn,
        title,
        registeredAt: new Date().toISOString()
    });

    save(STORAGE_KEYS.BOOKS, books);

    isbnInput.value = "";
    titleInput.value = "";

    alert("Book registered!");

    refreshHomePage();
}

/* ==========================================================
   LEND BOOK PAGE
   ========================================================== */

document.getElementById("lendBtn").onclick = lendBook;

function lendBook() {
    const isbnInput = document.getElementById("lendIsbnInput");
    const studentInput = document.getElementById("lendStudentInput");

    const isbn = isbnInput.value.trim();
    const student = studentInput.value.trim();

    if (!isbn || !student)
        return alert("Scan ISBN and student ID.");

    const loans = load(STORAGE_KEYS.LOANS);

    loans.push({
        isbn,
        student,
        lentAt: new Date().toISOString(),
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
    });

    save(STORAGE_KEYS.LOANS, loans);

    isbnInput.value = "";
    studentInput.value = "";

    alert("Loan registered!");
}

/* ==========================================================
   SHOW WANTED / OVERDUE LOANS
   ========================================================== */

function refreshWantedPage() {
    const list = document.getElementById("wantedList");
    list.innerHTML = "";

    const loans = load(STORAGE_KEYS.LOANS);
    const books = load(STORAGE_KEYS.BOOKS);

    const now = Date.now();
    const overdue = loans.filter(l => new Date(l.dueDate).getTime() < now);

    if (overdue.length === 0) {
        list.innerHTML = `<p>No overdue books.</p>`;
        return;
    }

    overdue.forEach(loan => {
        const book = books.find(b => b.isbn === loan.isbn);

        const item = document.createElement("div");
        item.className = "list-item";

        item.innerHTML = `
            <strong>Student: ${loan.student}</strong><br>
            Book: ${book ? book.title : "(Unknown title)"} — ${loan.isbn}<br>
            Due date: ${new Date(loan.dueDate).toLocaleDateString()}
        `;

        list.appendChild(item);
    });
}

/* Refresh wanted page whenever opened */
document.getElementById("wantedBtn").onclick = () => {
    refreshWantedPage();
    showPage("wantedPage");
};

/* ==========================================================
   NAVIGATION BUTTONS
   ========================================================== */

document.getElementById("toHomeFromAdmin").onclick = () => showPage("homePage");
document.getElementById("toHomeFromWanted").onclick = () => showPage("homePage");
document.getElementById("toLendPageBtn").onclick = () => showPage("lendPage");

/* Initial render */
refreshHomePage();
