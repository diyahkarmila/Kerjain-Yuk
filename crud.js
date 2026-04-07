import { auth, db } from './firebase.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { ref, push, set, onValue, remove, update } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

const form = document.getElementById("taskForm");
const taskList = document.getElementById("taskList");
const searchInput = document.getElementById("searchInput");
const totalTugas = document.getElementById("totalTugas");
const totalSelesai = document.getElementById("totalSelesai");
const totalBelum = document.getElementById("totalBelum");
const saveBtn = document.getElementById("saveBtn");
const pageMessage = document.getElementById("pageMessage");

let allTasks = [];
let userTasksRef = null;
let currentUid = null;

function escapeHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function showPageMessage(message, type = "success") {
  if (!pageMessage) return;
  pageMessage.innerHTML = `<div class="alert alert-${type}">${escapeHTML(message)}</div>`;

  setTimeout(() => {
    if (pageMessage.textContent.includes(message)) {
      pageMessage.innerHTML = "";
    }
  }, 2500);
}

function updateStats(data) {
  const selesai = data.filter(item => item.status === "Selesai").length;
  const belum = data.filter(item => item.status === "Belum").length;

  totalTugas.textContent = String(data.length);
  totalSelesai.textContent = String(selesai);
  totalBelum.textContent = String(belum);
}

function resetFormToDefault() {
  form.reset();
  document.getElementById("taskId").value = "";
  saveBtn.disabled = false;
  saveBtn.textContent = "Simpan";
  saveBtn.classList.remove("btn-warning");
  saveBtn.classList.add("btn-primary");
}

function renderTable(data) {
  taskList.innerHTML = "";

  if (data.length === 0) {
    taskList.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center;">Belum ada data tugas</td>
      </tr>
    `;
    updateStats([]);
    return;
  }

  data.forEach((item, index) => {
    let statusClass = "status-proses";
    if (item.status === "Belum") statusClass = "status-belum";
    if (item.status === "Selesai") statusClass = "status-selesai";

    taskList.innerHTML += `
      <tr>
        <td>${index + 1}</td>
        <td>${escapeHTML(item.judulTugas)}</td>
        <td>${escapeHTML(item.kategori)}</td>
        <td>${escapeHTML(item.deadline)}</td>
        <td><span class="status ${statusClass}">${escapeHTML(item.status)}</span></td>
        <td>${escapeHTML(item.deskripsi)}</td>
        <td>
          <div class="actions">
            <button class="btn btn-warning" onclick="editTask('${item.id}')">Edit</button>
            <button class="btn btn-danger" onclick="deleteTask('${item.id}')">Delete</button>
          </div>
        </td>
      </tr>
    `;
  });

  updateStats(data);
}

function filterData(keyword) {
  const query = keyword.trim().toLowerCase();
  const hasilFilter = allTasks.filter(item =>
    item.judulTugas.toLowerCase().includes(query) ||
    item.kategori.toLowerCase().includes(query) ||
    item.status.toLowerCase().includes(query) ||
    item.deskripsi.toLowerCase().includes(query)
  );

  renderTable(hasilFilter);
}

function startTaskListener(uid) {
  if (currentUid === uid) return;

  currentUid = uid;
  userTasksRef = ref(db, `users/${uid}/tasks`);

  onValue(userTasksRef, (snapshot) => {
    allTasks = [];

    snapshot.forEach((child) => {
      allTasks.push({
        id: child.key,
        ...child.val()
      });
    });

    allTasks.sort((a, b) => (a.deadline || "").localeCompare(b.deadline || ""));

    renderTable(allTasks);
  });
}

form.addEventListener("submit", async function (e) {
  e.preventDefault();

  if (!userTasksRef) {
    showPageMessage("Sesi belum siap. Coba refresh halaman.", "danger");
    return;
  }

  const id = document.getElementById("taskId").value;
  const judulTugas = document.getElementById("judulTugas").value.trim();
  const kategori = document.getElementById("kategori").value.trim();
  const deadline = document.getElementById("deadline").value.trim();
  const status = document.getElementById("status").value.trim();
  const deskripsi = document.getElementById("deskripsi").value.trim();

  if (!judulTugas || !kategori || !deadline || !status || !deskripsi) {
    showPageMessage("Semua field harus diisi.", "danger");
    return;
  }

  saveBtn.disabled = true;
  saveBtn.textContent = id ? "Menyimpan perubahan..." : "Menyimpan...";

  try {
    if (!id) {
      const newTask = push(userTasksRef);

      await set(newTask, {
        judulTugas,
        kategori,
        deadline,
        status,
        deskripsi,
        createdAt: new Date().toISOString()
      });

      showPageMessage("Tugas berhasil ditambahkan.");
    } else {
      await update(ref(db, `users/${auth.currentUser.uid}/tasks/${id}`), {
        judulTugas,
        kategori,
        deadline,
        status,
        deskripsi,
        updatedAt: new Date().toISOString()
      });

      showPageMessage("Tugas berhasil diperbarui.");
    }

    resetFormToDefault();
  } catch (error) {
    showPageMessage("Terjadi kesalahan: " + error.message, "danger");
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = "Simpan";
  }
});

searchInput.addEventListener("input", function () {
  filterData(this.value);
});

window.deleteTask = async function (id) {
  if (!auth.currentUser) return;

  const konfirmasi = confirm("Yakin ingin menghapus tugas ini?");
  if (!konfirmasi) return;

  try {
    await remove(ref(db, `users/${auth.currentUser.uid}/tasks/${id}`));
    showPageMessage("Tugas berhasil dihapus.");
  } catch (error) {
    showPageMessage("Gagal menghapus tugas: " + error.message, "danger");
  }
};

window.editTask = function (id) {
  const task = allTasks.find(item => item.id === id);
  if (!task) return;

  document.getElementById("taskId").value = task.id;
  document.getElementById("judulTugas").value = task.judulTugas;
  document.getElementById("kategori").value = task.kategori;
  document.getElementById("deadline").value = task.deadline;
  document.getElementById("status").value = task.status;
  document.getElementById("deskripsi").value = task.deskripsi;

  saveBtn.textContent = "Update Tugas";
  saveBtn.classList.remove("btn-primary");
  saveBtn.classList.add("btn-warning");

  window.scrollTo({ top: 0, behavior: "smooth" });
};

form.addEventListener("reset", function () {
  setTimeout(() => {
    resetFormToDefault();
  }, 0);
});

onAuthStateChanged(auth, (user) => {
  if (!user || !user.emailVerified) return;
  startTaskListener(user.uid);
});
