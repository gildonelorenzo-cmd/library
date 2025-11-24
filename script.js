// ===== LocalStorage Keys =====
const STORAGE_KEYS = { BOOKS:'books', STUDENTS:'students', LOANS:'loans' };

// ===== Sample Data =====
let students = {
  "001": { name: "Alice Romano" },
  "002": { name: "Marco Bianchi" },
  "065": { name: "Luca Rossi" }
};
let books = JSON.parse(localStorage.getItem(STORAGE_KEYS.BOOKS) || "[]");
let loans = JSON.parse(localStorage.getItem(STORAGE_KEYS.LOANS) || "[]");

// ===== Save/Load =====
function save(key,value){ localStorage.setItem(key, JSON.stringify(value)); }
function load(key){ return JSON.parse(localStorage.getItem(key)||"[]"); }

// ===== Page Navigation =====
function showPage(id){
  document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

// ===== Admin PIN =====
let pin = "";
function pressKey(d){ pin+=d; updatePinDisplay(); }
function pressClear(){ pin=""; updatePinDisplay(); }
function pressEnter(){
  if(pin==="1234"){ showPage("adminPanel"); pin=""; updatePinDisplay(); }
  else{ alert("Wrong PIN"); pin=""; updatePinDisplay(); }
}
function updatePinDisplay(){ document.getElementById("pinDisplay").textContent = "*".repeat(pin.length); }

// ===== Register Book =====
async function fetchBookInfo(isbn){
  try{
    const res = await fetch(`https://openlibrary.org/isbn/${isbn}.json`);
    if(!res.ok) return null;
    const data = await res.json();
    return { title:data.title||"", author:data.authors?data.authors.map(a=>a.name).join(", "):"" };
  }catch(e){ return null; }
}
document.getElementById("registerBookBtn").addEventListener("click", async ()=>{
  const isbn = document.getElementById("adminIsbnInput").value.trim();
  let title = document.getElementById("adminTitleInput").value.trim();
  if(!isbn) return alert("Enter ISBN");
  if(!title){
    const info = await fetchBookInfo(isbn);
    if(info) title = info.title || "";
  }
  books.push({ isbn, title, registeredAt: new Date().toISOString() });
  save(STORAGE_KEYS.BOOKS, books);
  document.getElementById("adminIsbnInput").value=""; document.getElementById("adminTitleInput").value="";
  alert("Book registered!");
  refreshHomePage();
});

// ===== Lend Book =====
document.getElementById("lendBtn").addEventListener("click", ()=>{
  const isbn = document.getElementById("lendIsbnInput").value.trim();
  const studentId = document.getElementById("lendStudentInput").value.trim();
  if(!isbn || !studentId) return alert("Provide ISBN and student ID");
  const book = books.find(b=>b.isbn===isbn);
  if(!book) return alert("Book not registered");
  const activeLoan = loans.find(l=>l.isbn===isbn && !l.returned);
  if(activeLoan) return alert("Book already lent");
  loans.push({ isbn, student:studentId, lentAt:new Date().toISOString(), dueAt:new Date(Date.now()+14*24*60*60*1000).toISOString(), returned:false });
  save(STORAGE_KEYS.LOANS, loans);
  alert(`Book lent to ${students[studentId]?students[studentId].name:studentId}`);
  document.getElementById("lendIsbnInput").value=""; document.getElementById("lendStudentInput").value="";
  refreshHomePage();
});

// ===== Show Overdue =====
function refreshWantedList(){
  const list = document.getElementById("wantedList"); list.innerHTML="";
  const now = new Date();
  const overdue = loans.filter(l=>!l.returned && new Date(l.dueAt)<now);
  if(overdue.length===0){ list.textContent="No overdue books"; return; }
  overdue.forEach(l=>{
    const div = document.createElement("div"); div.className="list-item";
    div.innerHTML = `<span>${students[l.student]?students[l.student].name:l.student}</span> <span>${l.isbn}</span>`;
    list.appendChild(div);
  });
}

// ===== Home Page =====
function refreshHomePage(){
  const list = document.getElementById("homeList"); list.innerHTML="";
  if(books.length===0){ list.textContent="No books registered"; return; }
  books.slice().reverse().forEach(b=>{
    const div = document.createElement("div"); div.className="list-item";
    const loan = loans.find(l=>l.isbn===b.isbn && !l.returned);
    div.innerHTML = `<span>${b.title||b.isbn}</span> <span>${loan?"Lent":"Available"}</span>`;
    list.appendChild(div);
  });
}

// ===== Event Buttons =====
document.getElementById("adminBtn").addEventListener("click", ()=>showPage("adminLoginPage"));
document.getElementById("toHomeFromAdminLogin").addEventListener("click", ()=>showPage("homePage"));
document.getElementById("toHomeFromAdminPanel").addEventListener("click", ()=>showPage("homePage"));
document.getElementById("toLendPageBtn").addEventListener("click", ()=>showPage("lendPage"));
document.getElementById("toWantedPageBtn").addEventListener("click", ()=>{
  refreshWantedList(); showPage("wantedPage");
});
document.getElementById("toHomeFromLend").addEventListener("click", ()=>showPage("homePage"));
document.getElementById("toHomeFromWanted").addEventListener("click", ()=>showPage("homePage"));

// ===== Auto-fill student name alert =====
document.getElementById("lendStudentInput").addEventListener("change", function(){
  const studentId = this.value.trim();
  if(students[studentId]) alert(`Student recognized: ${students[studentId].name}`);
});

// ===== Auto-fill ISBN info when scanned on lend page =====
document.getElementById("lendIsbnInput").addEventListener("change", async function(){
  const isbn = this.value.trim();
  if(!isbn) return;
  const book = books.find(b=>b.isbn===isbn);
  if(!book){
    const info = await fetchBookInfo(isbn);
    if(info){
      const register = confirm(`Book not registered. Auto-register as "${info.title}"?`);
      if(register){
        books.push({ isbn, title:info.title, registeredAt:new Date().toISOString() });
        save(STORAGE_KEYS.BOOKS, books);
        alert("Book auto-registered!");
        refreshHomePage();
      }
    }
  }
});

// ===== Initial Load =====
refreshHomePage();
