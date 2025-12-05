// --- DATABASE LOKAL (LocalStorage) ---
let students = JSON.parse(localStorage.getItem('absensi_students')) || [];
let attendanceLogs = JSON.parse(localStorage.getItem('absensi_logs')) || [];

// Inisialisasi saat halaman dimuat
document.addEventListener('DOMContentLoaded', () => {
    renderStudentList();
    renderLogs();
});

// --- FUNGSI TAB NAVIGASI ---
function showSection(sectionId) {
    document.getElementById('register-section').classList.add('hidden');
    document.getElementById('scan-section').classList.add('hidden');
    document.getElementById('btn-reg').classList.remove('active-btn');
    document.getElementById('btn-scan').classList.remove('active-btn');

    if (sectionId === 'register') {
        document.getElementById('register-section').classList.remove('hidden');
        document.getElementById('btn-reg').classList.add('active-btn');
        stopScanner(); // Matikan kamera jika pindah tab
    } else {
        document.getElementById('scan-section').classList.remove('hidden');
        document.getElementById('btn-scan').classList.add('active-btn');
        startScanner(); // Nyalakan kamera
    }
}

// --- BAGIAN 1: REGISTRASI SISWA ---
function addStudent() {
    const nameInput = document.getElementById('studentName');
    const name = nameInput.value.trim();

    if (name === "") return alert("Nama tidak boleh kosong!");

    // Buat ID Unik (Format: SISWA-[timestamp])
    const id = "SISWA-" + Date.now().toString().slice(-6);

    const newStudent = { id, name };
    students.push(newStudent);
    
    // Simpan ke LocalStorage
    saveData();
    renderStudentList();
    nameInput.value = "";
}

function saveData() {
    localStorage.setItem('absensi_students', JSON.stringify(students));
    localStorage.setItem('absensi_logs', JSON.stringify(attendanceLogs));
}

function renderStudentList() {
    const list = document.getElementById('student-list');
    list.innerHTML = "";

    students.forEach(student => {
        const div = document.createElement('div');
        div.className = 'student-card';
        div.innerHTML = `
            <h4>${student.name}</h4>
            <svg id="barcode-${student.id}"></svg>
            <p><small>${student.id}</small></p>
            <button onclick="deleteStudent('${student.id}')" style="background:red; font-size:12px; padding:5px;">Hapus</button>
        `;
        list.appendChild(div);

        // Generate Barcode
        JsBarcode(`#barcode-${student.id}`, student.id, {
            format: "CODE128",
            width: 2,
            height: 40,
            displayValue: false
        });
    });
}

function deleteStudent(id) {
    if(confirm('Yakin ingin menghapus siswa ini?')) {
        students = students.filter(s => s.id !== id);
        saveData();
        renderStudentList();
    }
}

function clearData() {
    if(confirm('HAPUS SEMUA DATA? Ini tidak bisa dibatalkan.')) {
        localStorage.clear();
        location.reload();
    }
}

// --- BAGIAN 2: SCANNER & ABSENSI ---
let html5QrcodeScanner;

function startScanner() {
    // Mencegah double inisialisasi
    if(html5QrcodeScanner) return;

    html5QrcodeScanner = new Html5QrcodeScanner(
        "reader", 
        { fps: 10, qrbox: {width: 250, height: 150} }, // Kotak scan persegi panjang untuk barcode
        /* verbose= */ false
    );
    html5QrcodeScanner.render(onScanSuccess, onScanFailure);
}

function stopScanner() {
    if (html5QrcodeScanner) {
        html5QrcodeScanner.clear().then(() => {
            html5QrcodeScanner = null;
        }).catch(error => console.error("Failed to clear scanner", error));
    }
}

function onScanSuccess(decodedText, decodedResult) {
    // Cek apakah ID ada di database siswa
    const student = students.find(s => s.id === decodedText);

    if (student) {
        // Cek apakah sudah absen hari ini (opsional)
        // Disini kita ijinkan absen berkali-kali untuk demo
        
        const timestamp = new Date().toLocaleString();
        
        // Masukkan ke log (urutan paling atas = terbaru)
        attendanceLogs.unshift({
            name: student.name,
            id: student.id,
            time: timestamp
        });
        
        saveData();
        renderLogs();
        
        // Beri feedback audio/alert
        alert(`Berhasil: ${student.name} Hadir!`);
        
        // Jeda sebentar agar tidak menscan berulang-ulang dalam 1 detik
        html5QrcodeScanner.pause();
        setTimeout(() => html5QrcodeScanner.resume(), 2000);
    } else {
        alert("Barcode tidak dikenali!");
    }
}

function onScanFailure(error) {
    // Handle scan failure, usually better to ignore and keep scanning.
    // console.warn(`Code scan error = ${error}`);
}

function renderLogs() {
    const list = document.getElementById('attendance-list');
    list.innerHTML = "";
    
    // Ambil 50 log terakhir saja agar tidak berat
    attendanceLogs.slice(0, 50).forEach(log => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span><strong>${log.name}</strong></span>
            <span>${log.time}</span>
        `;
        list.appendChild(li);
    });
}
