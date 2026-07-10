// ==========================================================================
// 1. FIREBASE CONFIGURATION & INITIALIZATION
// ==========================================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, push, onValue } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyC_ZNGHIIIzgGP7uT6qfMiufXX_tqO21hU",
    authDomain: "expo-komoditasholtikultura.firebaseapp.com",
    databaseURL: "https://expo-komoditasholtikultura-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "expo-komoditasholtikultura",
    storageBucket: "expo-komoditasholtikultura.firebasestorage.app",
    messagingSenderId: "834410046634",
    appId: "1:834410046634:web:6585cfa58544db85b05cd3"
};

// Inisialisasi koneksi ke Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const dbRefPenjualan = ref(db, "penjualan_springrolls");

// ==========================================================================
// 2. DATA AWAL & GLOBAL UTILITIES BY GREYSEN
// ==========================================================================
let bahanList = [
    { nama: "Rice paper 50 lbr", harga: 18000 },
    { nama: "Dada ayam fillet 500gr", harga: 35000 },
    { nama: "Wortel 3 buah", harga: 9000 },
    { nama: "Selada 1 ikat", harga: 5000 },
    { nama: "Kol ungu", harga: 7000 },
    { nama: "Timun 3 buah", harga: 6000 },
    { nama: "Mayonaise Kewpie", harga: 22000 },
    { nama: "Saus sambal", harga: 8000 },
];

function fmt(n) {
    return "Rp " + Math.round(n).toLocaleString("id-ID");
}
function pct(n) {
    return Math.round(n) + "%";
}

function getHargaJualTerupdate() {
    const inputHargaJual = document.getElementById("harga-jual");
    return inputHargaJual ? parseFloat(inputHargaJual.value) || 0 : 0;
}

// ==========================================================================
// 3. UI RENDERING & CORE CALCULATION (KALKULATOR)
// ==========================================================================
window.renderBahan = function() {
    const tabelContainer = document.getElementById("bahan-list");
    if (!tabelContainer) return;
    
    tabelContainer.innerHTML = bahanList.map((b, i) => `
        <tr>
            <td>
                <input type="text" style="border:none; padding:4px 0; background:transparent;" value="${b.nama}" oninput="bahanList[${i}].nama=this.value;">
            </td>
            <td>
                <input type="number" value="${b.harga}" min="0" step="500" oninput="bahanList[${i}].harga=+this.value; calc();">
            </td>
            <td class="table-action-col">
                <button class="del-btn" onclick="delBahan(${i})">×</button>
            </td>
        </tr>
    `).join("");
}

window.addBahan = function() {
    bahanList.push({ nama: "Bahan baru", harga: 0 });
    window.renderBahan();
    window.calc();
}

window.delBahan = function(i) {
    bahanList.splice(i, 1);
    window.renderBahan();
    window.calc();
}

window.calc = function() {
    const totalPcs = +document.getElementById("total-pcs").value || 1;
    const isiPorsi = +document.getElementById("isi-porsi").value || 1;
    const hargaJual = +document.getElementById("harga-jual").value || 0;
    const biayaKemasan = +document.getElementById("biaya-kemasan").value || 0;
    const biayaOps = +document.getElementById("biaya-ops").value || 0;
    const biayaExtra = +document.getElementById("biaya-extra").value || 0;

    const totalBahan = bahanList.reduce((s, b) => s + b.harga, 0);
    const totalNonBahan = biayaKemasan + biayaOps + biayaExtra;
    const totalPengeluaran = totalBahan + totalNonBahan;

    const hppPerPcs = totalPengeluaran / totalPcs;
    const hppPerPorsi = hppPerPcs * isiPorsi;
    const untungPerPorsi = hargaJual - hppPerPorsi;

    const totalPorsi = Math.floor(totalPcs / isiPorsi) || 1;
    const totalRevenue = totalPorsi * hargaJual;
    const totalUntung = totalRevenue - totalPengeluaran;
    const margin = totalRevenue > 0 ? (totalUntung / totalRevenue) * 100 : 0;
    const bep = hargaJual > 0 ? Math.ceil(totalPengeluaran / hargaJual) : 0;

    const uc = totalUntung >= 0 ? "green" : "red";
    const mc = margin >= 50 ? "green" : margin >= 30 ? "amber" : "red";

    const metricsOut = document.getElementById("metrics-out");
    if (metricsOut) {
        metricsOut.innerHTML = `
            <div class="metric"><div class="metric-label">Total Pengeluaran</div><div class="metric-value">${fmt(totalPengeluaran)}</div><div class="metric-sub">Bahan & Operasional</div></div>
            <div class="metric"><div class="metric-label">HPP per Pcs</div><div class="metric-value">${fmt(hppPerPcs)}</div><div class="metric-sub">Modal 1 Spring Roll</div></div>
            <div class="metric"><div class="metric-label">HPP per Porsi</div><div class="metric-value">${fmt(hppPerPorsi)}</div><div class="metric-sub">${isiPorsi} pcs × HPP</div></div>
            <div class="metric"><div class="metric-label">Untung / Porsi</div><div class="metric-value ${uc}">${fmt(untungPerPorsi)}</div><div class="metric-sub">Jual − HPP Porsi</div></div>
            <div class="metric"><div class="metric-label">Total Revenue</div><div class="metric-value">${fmt(totalRevenue)}</div><div class="metric-sub">Jika ${totalPorsi} porsi habis</div></div>
            <div class="metric"><div class="metric-label">Untung Bersih</div><div class="metric-value ${uc}">${fmt(totalUntung)}</div><div class="metric-sub">Margin: ${pct(margin)}</div></div>
        `;
    }

    const bepPct = Math.min((bep / totalPorsi) * 100, 100) || 0;
    const barColor = margin >= 50 ? "#16a34a" : margin >= 30 ? "#d97706" : "#dc2626";

    const detailOut = document.getElementById("detail-out");
    if (detailOut) {
        detailOut.innerHTML = `
            <h2 class="section-title">Rincian Komponen Biaya</h2>
            <div class="row-item"><span class="row-label">Biaya Bahan Baku</span><span class="row-value">${fmt(totalBahan)}</span></div>
            <div class="row-item"><span class="row-label">Biaya Kemasan</span><span class="row-value">${fmt(biayaKemasan)}</span></div>
            <div class="row-item"><span class="row-label">Biaya Operasional</span><span class="row-value">${fmt(biayaOps)}</span></div>
            <div class="row-item"><span class="row-label">Dana Cadangan</span><span class="row-value">${fmt(biayaExtra)}</span></div>
            <div class="row-item row-item-total">
                <span class="row-label" style="font-weight:700;">Total Modal Keseluruhan</span>
                <span class="row-value row-value-total">${fmt(totalPengeluaran)}</span>
            </div>
            <div class="verdict-space-helper"></div>
            <h2 class="section-title">Break Even Point (BEP) / Titik Impas</h2>
            <div class="row-item"><span class="row-label">Target Minimal Penjualan</span><span class="row-value">${bep} Porsi <span style="font-weight:400; color:var(--text-sub);">dari ${totalPorsi} porsi</span></span></div>
            <div class="progress-bar"><div class="progress-fill" style="width:${pct(bepPct)}; background:${barColor};"></div></div>
            <p class="bep-info-text">Minimal <strong>${pct(bepPct)}</strong> dari total stok harus terjual habis untuk balik modal.</p>
        `;
    }

    let verdict = "", vclass = "", vstatus = "";
    if (margin >= 50) {
        verdict = `Sangat Sehat! Margin keuntungan mencapai ${pct(margin)}. Jika semua porsi habis terjual, kami mengantongi untung bersih sebesar ${fmt(totalUntung)}.`;
        vclass = "verdict-green";
        vstatus = "Untung Besar";
    } else if (margin >= 30) {
        verdict = `Cukup Sehat. Margin ${pct(margin)} sudah aman untuk skala bisnis kuliner kecil, namun lakukan efisiensi bahan jika ingin hasil maksimal.`;
        vclass = "verdict-amber";
        vstatus = "Cukup Sehat";
    } else if (margin >= 0) {
        verdict = `Margin Tipis (${pct(margin)}). Keuntungan terlalu rentan terhadap fluktuasi harga pasar. Pertimbangkan untuk menaikkan harga jual sedikit atau mengurangi porsi/biaya operasional.`;
        vclass = "verdict-amber";
        vstatus = "Tipis / Rawan";
    } else {
        verdict = `Mengalami Kerugian! Harga jual di bawah HPP produk. Anda akan rugi sebesar ${fmt(Math.abs(totalUntung))} meskipun semua dagangan laku keras.`;
        vclass = "verdict-red";
        vstatus = "Rugi / Bahaya";
    }

    const verdictOut = document.getElementById("verdict-out");
    if (verdictOut) {
        verdictOut.innerHTML = `
            <div class="verdict-box ${vclass}">
                <h2 class="section-title" style="color:inherit; margin-bottom:4px;">Kesimpulan Analisis Bisnis</h2>
                <p>${verdict}</p>
                <div class="verdict-footer">
                    <span class="badge badge-${mc}">${vstatus}</span>
                    <span class="verdict-bep-label">BEP: ${bep}/${totalPorsi} Porsi</span>
                </div>
            </div>
        `;
    }
}

// ==========================================================================
// 4. REALTIME DATABASE LOGIC (FEEDBACK & TRANSAKSI)
// ==========================================================================
window.tambahFeedback = function(event) {
    event.preventDefault();

    const inputNama = document.getElementById("customer-name");
    const inputPorsi = document.getElementById("portions-bought");
    const inputReview = document.getElementById("customer-review");

    const porsiDibeli = parseInt(inputPorsi.value) || 1;
    const hargaJualSatuan = getHargaJualTerupdate();
    const omsetTransaksi = porsiDibeli * hargaJualSatuan;

    const dataBaru = {
        nama: inputNama.value.trim() || "Anonim",
        porsi: porsiDibeli,
        review: inputReview.value.trim(),
        omset: omsetTransaksi,
        waktu: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        timestamp: Date.now()
    };

    push(dbRefPenjualan, dataBaru)
        .then(() => {
            alert("Terima kasih! Ulasan Anda berhasil dikirim."); // Ditambahkan notifikasi berhasil
            event.target.reset();
        })
        .catch((error) => {
            console.error("Firebase Database Error: ", error);
            alert("Gagal mengirim ulasan: " + error.message);
        });
}

// Sinkronisasi data cloud ke UI dashboard secara Live-Time
onValue(dbRefPenjualan, (snapshot) => {
    let totalPelanggan = 0;
    let totalPorsiTerjual = 0;
    let totalOmset = 0;
    let listFeedbackHTML = [];

    if (snapshot.exists()) {
        const dataMentah = snapshot.val();
        const arrayData = Object.values(dataMentah).sort((a, b) => b.timestamp - a.timestamp);

        arrayData.forEach(item => {
            totalPelanggan += 1;
            totalPorsiTerjual += item.porsi;
            totalOmset += (item.omset || 0);

            listFeedbackHTML.push(`
                <div class="review-item-card" style="background: rgba(148, 163, 184, 0.04); border: 1px solid rgba(148, 163, 184, 0.1); padding: 10px; border-radius: 6px; margin-bottom: 8px;">
                    <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 4px;">
                        <strong style="color: #10b981;">${item.nama} <span style="font-weight:400; color:var(--text-sub);">(${item.porsi} Porsi)</span></strong>
                        <span style="color: var(--text-sub);">${item.waktu || ''}</span>
                    </div>
                    <p style="font-size: 12px; color: var(--text-title); margin: 0; font-style: italic;">"${item.review}"</p>
                </div>
            `);
        });
    }

    const statPelanggan = document.getElementById("stat-pelanggan");
    const statTerjual = document.getElementById("stat-terjual");
    const statOmset = document.getElementById("stat-omset");
    const container = document.getElementById("feedback-list-container");

    if (statPelanggan) statPelanggan.innerText = totalPelanggan;
    if (statTerjual) statTerjual.innerText = totalPorsiTerjual + " Porsi";
    if (statOmset) statOmset.innerText = "Rp " + totalOmset.toLocaleString('id-ID');

    if (container) {
        if (listFeedbackHTML.length === 0) {
            container.innerHTML = `<p style="font-size: 12px; color: var(--text-sub); text-align: center; padding: 20px 0;">Belum ada feedback masuk.</p>`;
        } else {
            container.innerHTML = listFeedbackHTML.join('');
        }
    }
});

// ==========================================================================
// 5. NAV CONTROLLER & CORE APPLICATION LOADERS
// ==========================================================================
window.switchTab = function(tabName) {
    const tabKalkulatorBtn = document.getElementById("tab-kalkulator-btn");
    const tabDashboardBtn = document.getElementById("tab-dashboard-btn");
    const contentKalkulator = document.getElementById("content-kalkulator");
    const contentDashboard = document.getElementById("content-dashboard");

    if(tabKalkulatorBtn) tabKalkulatorBtn.classList.remove("active");
    if(tabDashboardBtn) tabDashboardBtn.classList.remove("active");
    if(contentKalkulator) contentKalkulator.classList.remove("active-content");
    if(contentDashboard) contentDashboard.classList.remove("active-content");

    if (tabName === 'kalkulator' && contentKalkulator && tabKalkulatorBtn) {
        tabKalkulatorBtn.classList.add("active");
        contentKalkulator.classList.add("active-content");
    } else if (tabName === 'dashboard' && contentDashboard && tabDashboardBtn) {
        tabDashboardBtn.classList.add("active");
        contentDashboard.classList.add("active-content");
    }
}

window.toggleRumus = function() {
    const content = document.getElementById("rumus-content");
    const arrow = document.getElementById("rumus-arrow-icon");
    if (content && arrow) {
        content.classList.toggle("show");
        arrow.classList.toggle("rotate-arrow");
    }
}

window.addEventListener("DOMContentLoaded", () => {
    window.renderBahan();
    window.calc();

    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');

    if (mode === 'pembeli') {
        window.switchTab('dashboard');
        
        // Sembunyikan navigasi tab atas
        const tabNav = document.querySelector(".tab-navigation");
        if (tabNav) tabNav.style.display = "none";

        // Sembunyikan statistik admin di sisi kanan secara spesifik agar layout grid aman
        const dashboardGrid = document.getElementById("content-dashboard").querySelector(".grid-container");
        if (dashboardGrid) {
            dashboardGrid.style.gridTemplateColumns = "1fr"; // Paksa kolom tunggal penuh
            const rightColumnAdmin = dashboardGrid.querySelector(".right-column");
            if (rightColumnAdmin) rightColumnAdmin.style.display = "none";
        }

        // Ubah judul form input ulasan pembeli
        const title = document.getElementById("content-dashboard").querySelector(".section-title");
        if (title) title.innerText = "✍️ Silakan Isi Kritik & Saran Spring Rolls Kami";
    }

    const themeToggleBtn = document.getElementById("theme-toggle");
    const currentTheme = localStorage.getItem("theme");
    
    if (currentTheme === "dark") {
        document.documentElement.setAttribute("data-theme", "dark");
        if (themeToggleBtn) themeToggleBtn.innerHTML = "☀️ Mode Terang";
    }

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener("click", function () {
            let theme = document.documentElement.getAttribute("data-theme");
            if (theme === "dark") {
                document.documentElement.removeAttribute("data-theme");
                themeToggleBtn.innerHTML = "🌙 Mode Gelap";
                localStorage.setItem("theme", "light");
            } else {
                document.documentElement.setAttribute("data-theme", "dark");
                themeToggleBtn.innerHTML = "☀️ Mode Terang";
                localStorage.setItem("theme", "dark");
            }
        });
    }
}); 