// Data Awal Bahan Baku
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

// Helper Format Mata Uang & Persentase
function fmt(n) {
    return "Rp " + Math.round(n).toLocaleString("id-ID");
}
function pct(n) {
    return Math.round(n) + "%";
}

// Render data tabel bahan baku ke HTML
function renderBahan() {
    document.getElementById("bahan-list").innerHTML = bahanList.map((b, i) => `
        <tr>
            <td>
                <input type="text" style="border:none; padding:4px 0; background:transparent;" value="${b.nama}" oninput="bahanList[${i}].nama=this.value;">
            </td>
            <td>
                <input type="number" value="${b.harga}" min="0" step="500" oninput="bahanList[${i}].harga=+this.value; calc();">
            </td>
            <td style="text-align:center;">
                <button class="del-btn" onclick="delBahan(${i})">×</button>
            </td>
        </tr>
    `).join("");
}

function addBahan() {
    bahanList.push({ nama: "Bahan baru", harga: 0 });
    renderBahan();
    calc();
}

function delBahan(i) {
    bahanList.splice(i, 1);
    renderBahan();
    calc();
}

// Fungsi Inti Kalkulasi HPP & Keuntungan
function calc() {
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

    const totalPorsi = Math.floor(totalPcs / isiPorsi);
    const totalRevenue = totalPorsi * hargaJual;
    const totalUntung = totalRevenue - totalPengeluaran;
    const margin = totalRevenue > 0 ? (totalUntung / totalRevenue) * 100 : 0;
    const bep = hargaJual > 0 ? Math.ceil(totalPengeluaran / hargaJual) : 0;

    // Logika pewarnaan status teks keuntungan
    const uc = totalUntung >= 0 ? "green" : "red";
    const mc = margin >= 50 ? "green" : margin >= 30 ? "amber" : "red";

    // 1. Update Grid Metrik Atas
    document.getElementById("metrics-out").innerHTML = `
        <div class="metric"><div class="metric-label">Total Pengeluaran</div><div class="metric-value">${fmt(totalPengeluaran)}</div><div class="metric-sub">Bahan & Operasional</div></div>
        <div class="metric"><div class="metric-label">HPP per Pcs</div><div class="metric-value">${fmt(hppPerPcs)}</div><div class="metric-sub">Modal 1 Spring Roll</div></div>
        <div class="metric"><div class="metric-label">HPP per Porsi</div><div class="metric-value">${fmt(hppPerPorsi)}</div><div class="metric-sub">${isiPorsi} pcs × HPP</div></div>
        <div class="metric"><div class="metric-label">Untung / Porsi</div><div class="metric-value ${uc}">${fmt(untungPerPorsi)}</div><div class="metric-sub">Jual − HPP Porsi</div></div>
        <div class="metric"><div class="metric-label">Total Revenue</div><div class="metric-value">${fmt(totalRevenue)}</div><div class="metric-sub">Jika ${totalPorsi} porsi habis</div></div>
        <div class="metric"><div class="metric-label">Untung Bersih</div><div class="metric-value ${uc}">${fmt(totalUntung)}</div><div class="metric-sub">Margin: ${pct(margin)}</div></div>
    `;

    // 2. Update Rincian & Progress Bar BEP
    const bepPct = Math.min((bep / totalPorsi) * 100, 100);
    const barColor = margin >= 50 ? "#16a34a" : margin >= 30 ? "#d97706" : "#dc2626";

    document.getElementById("detail-out").innerHTML = `
        <h2 class="section-title">Rincian Komponen Biaya</h2>
        <div class="row-item"><span class="row-label">Biaya Bahan Baku</span><span class="row-value">${fmt(totalBahan)}</span></div>
        <div class="row-item"><span class="row-label">Biaya Kemasan</span><span class="row-value">${fmt(biayaKemasan)}</span></div>
        <div class="row-item"><span class="row-label">Biaya Operasional</span><span class="row-value">${fmt(biayaOps)}</span></div>
        <div class="row-item"><span class="row-label">Dana Cadangan</span><span class="row-value">${fmt(biayaExtra)}</span></div>
        <div class="row-item" style="border-top:2px solid #f1f5f9; margin-top:4px; padding-top:12px;">
            <span class="row-label" style="font-weight:700; color:#0f172a;">Total Modal Keseluruhan</span>
            <span class="row-value" style="font-size:16px; color:#4f46e5;">${fmt(totalPengeluaran)}</span>
        </div>
        <div style="height:1.5rem;"></div>
        <h2 class="section-title">Break Even Point (BEP) / Titik Impas</h2>
        <div class="row-item"><span class="row-label">Target Minimal Penjualan</span><span class="row-value">${bep} Porsi <span style="font-weight:400; color:#64748b;">dari ${totalPorsi} porsi</span></span></div>
        <div class="progress-bar"><div class="progress-fill" style="width:${pct(bepPct)}; background:${barColor};"></div></div>
        <p style="font-size:12px; color:#64748b; margin-top:6px;">Minimal <strong>${pct(bepPct)}</strong> dari total stok harus terjual habis untuk balik modal.</p>
    `;

    // 3. Update Kesimpulan / Verdict Box
    let verdict = "", vclass = "", vstatus = "";
    if (margin >= 50) {
        verdict = `Sangat Sehat! Margin keuntungan mencapai ${pct(margin)}. Jika semua porsi habis terjual, Anda mengantongi untung bersih sebesar ${fmt(totalUntung)}.`;
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
        verdict = `Mengalami Kerugian! Harga jual Anda di bawah HPP produk. Anda akan rugi sebesar ${fmt(Math.abs(totalUntung))} meskipun semua dagangan laku keras.`;
        vclass = "verdict-red";
        vstatus = "Rugi / Bahaya";
    }

    document.getElementById("verdict-out").innerHTML = `
        <div class="verdict-box ${vclass}">
            <h2 class="section-title" style="color:inherit; margin-bottom:4px;">Kesimpulan Analisis Bisnis</h2>
            <p>${verdict}</p>
            <div style="margin-top:12px; display:flex; align-items:center; gap:8px;">
                <span class="badge badge-${mc}">${vstatus}</span>
                <span style="font-size:12px; color:#475569;">BEP: ${bep}/${totalPorsi} Porsi</span>
            </div>
        </div>
    `;
}

// Jalankan saat pertama kali dibuka
renderBahan();
calc(); 