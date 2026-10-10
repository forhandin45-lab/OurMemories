
/*
==
 RUANG KENANGAN — APP.JS
 Fitur:
 - Login dan pertanyaan kenangan acak
 - Sajak online dengan Supabase
 - Galeri foto/video online
 - Kalender online Supabase
 - Edit dan hapus tulisan serta jadwal
 - Floating calendar
==
*/


/* 
   1. KONFIGURASI SUPABASE
 */

const SUPABASE_URL = (
    window.SUPABASE_URL ||
    "https://uankgacgaabogcelqcss.supabase.co"
)
    .replace(/\/+$/, "")
    .replace(/\/rest\/v1\/?$/, "");

const SUPABASE_PUBLISHABLE_KEY =
    window.SUPABASE_PUBLISHABLE_KEY ||
    "sb_publishable_qmO8suGGLsWfyr70fabqzw_nDuikRSv";

const SUPABASE_TABLE = "memories";
const SUPABASE_BUCKET = "memories";
const SUPABASE_POEMS_TABLE = "poems";
const SUPABASE_CALENDAR_TABLE = "calendar_events";

const PASSWORD = "kenangan";


/* 
   2. HELPER
 */

function $(id) {
    return document.getElementById(id);
}

function today() {
    const d = new Date();

    return [
        d.getFullYear(),
        String(d.getMonth() + 1).padStart(2, "0"),
        String(d.getDate()).padStart(2, "0")
    ].join("-");
}

function uid() {
    return (
        Date.now().toString(36) +
        Math.random().toString(36).slice(2)
    );
}

function fmt(dateString) {
    if (!dateString) return "";

    const d = new Date(
        String(dateString).slice(0, 10) + "T00:00:00"
    );

    if (Number.isNaN(d.getTime())) {
        return dateString;
    }

    return d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric"
    });
}

function esc(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

async function supabaseRequest(path, options = {}) {
    const headers = {
        apikey: SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
        ...(options.body instanceof FormData
            ? {}
            : { "Content-Type": "application/json" }),
        ...(options.headers || {})
    };

    const response = await fetch(
        `${SUPABASE_URL}${path}`,
        {
            ...options,
            headers
        }
    );

    let data = null;

    const contentType =
        response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
        data = await response.json();
    } else {
        const responseText = await response.text();

        if (responseText) {
            try {
                data = JSON.parse(responseText);
            } catch {
                data = responseText;
            }
        }
    }

    if (!response.ok) {
        throw new Error(
            data?.message ||
            data?.error_description ||
            data?.hint ||
            data?.error ||
            `HTTP ${response.status}`
        );
    }

    return data;
}


/* 
   3. DATA APLIKASI
 */

let poems = [];
let events = [];
let media = [];

let currentCalendarDate = new Date();

let selectedMemoryQuestion = null;


/* 
   4. PERTANYAAN KENANGAN ACAK
 */

const MEMORY_QUESTIONS = [
    {
        question:
            "Kapan pertama kali kita bertemu setelah berpisah?",
        answers: [
            "27 maret 2026",
            "27/03/2026",
            "27-03-2026",
            "27.03.2026",
            "2026-03-27"
        ]
    },
    {
        question:
            "Di mana pertama kali kita bertemu?",
        answers: ["rumah"]
    },
    {
        question:
            "Apa makanan/minuman yang pertama kali kita makan bersama?",
        answers: [
            "seblak",
            "papeda",
            "pempek",
            "pisang",
            "bolu pisang"
        ]
    },
    {
        question:
            "Siapa yang pertama kali menghubungi?",
        answers: [
            "parhan",
            "kamu",
            "parhan/kamu"
        ]
    },
    {
        question:
            "Makan apa yang pernah kita buat bersama?",
        answers: [
            "seblak",
            "papeda",
            "pempek",
            "pisang",
            "bolu pisang"
        ]
    },
    {
        question:
            "Apa game yang pernah kita mainkan bersama?",
        answers: ["roblox"]
    }
];

function normalizeAnswer(value) {
    return String(value || "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");
}

function chooseRandomMemoryQuestion() {
    if (!MEMORY_QUESTIONS.length) return null;

    selectedMemoryQuestion =
        MEMORY_QUESTIONS[
            Math.floor(Math.random() * MEMORY_QUESTIONS.length)
        ];

    return selectedMemoryQuestion;
}

function showMemoryQuestion() {
    $("loginScreen")?.classList.add("hidden");
    $("app")?.classList.add("hidden");

    const screen = $("memoryQuestionScreen");
    const questionElement = $("memoryQuestion");
    const answerInput = $("memoryAnswer");
    const error = $("memoryQuestionError");

    if (!screen || !questionElement) {
        // Jika halaman lama belum memiliki layar pertanyaan,
        // langsung buka aplikasi setelah login.
        showApp();
        return;
    }

    const question = chooseRandomMemoryQuestion();

    if (!question) {
        showApp();
        return;
    }

    questionElement.textContent = question.question;

    if (answerInput) {
        answerInput.value = "";

        setTimeout(() => {
            answerInput.focus();
        }, 50);
    }

    if (error) error.textContent = "";

    screen.classList.remove("hidden");
}

function showLogin() {
    $("loginScreen")?.classList.remove("hidden");
    $("memoryQuestionScreen")?.classList.add("hidden");
    $("app")?.classList.add("hidden");
}

function showApp() {
    $("loginScreen")?.classList.add("hidden");
    $("memoryQuestionScreen")?.classList.add("hidden");
    $("app")?.classList.remove("hidden");

    // Sajak, foto/video, dan kalender dimuat dari Supabase.
    loadPoems();
    loadMedia();
    loadCalendarEvents();
}


/* 
   5. LOGIN
 */

if ($("loginForm")) {
    $("loginForm").addEventListener("submit", function (event) {
        event.preventDefault();

        const password = $("password")?.value || "";

        if (password === PASSWORD) {
            sessionStorage.setItem("rk_login", "yes");

            if ($("loginError")) {
                $("loginError").textContent = "";
            }

            if ($("password")) {
                $("password").value = "";
            }

            showMemoryQuestion();
        } else {
            if ($("loginError")) {
                $("loginError").textContent = "Password salah.";
            }
        }
    });
}

if ($("memoryQuestionForm")) {
    $("memoryQuestionForm").addEventListener(
        "submit",
        function (event) {
            event.preventDefault();

            if (!selectedMemoryQuestion) return;

            const input = $("memoryAnswer");
            const answer = normalizeAnswer(input?.value);

            const valid = selectedMemoryQuestion.answers.some(
                correctAnswer =>
                    normalizeAnswer(correctAnswer) === answer
            );

            if (valid) {
                if ($("memoryQuestionError")) {
                    $("memoryQuestionError").textContent = "";
                }

                showApp();
            } else {
                if ($("memoryQuestionError")) {
                    $("memoryQuestionError").textContent =
                        "Jawabannya belum tepat. Coba ingat lagi 🤍";
                }

                input?.select();
            }
        }
    );
}

if ($("changeQuestionBtn")) {
    $("changeQuestionBtn").addEventListener("click", function () {
        showMemoryQuestion();
    });
}

if ($("logoutBtn")) {
    $("logoutBtn").addEventListener("click", function () {
        sessionStorage.removeItem("rk_login");
        location.reload();
    });
}


/* 
   6. SAJAK ONLINE — SUPABASE
 */

/*
   Data sajak tidak lagi disimpan di localStorage.
   Sumber utama data adalah tabel Supabase "poems".
*/

async function loadPoems() {
    const list = $("poemList");

    if (list) {
        list.innerHTML = `
            <div class="empty-state">Memuat sajak...</div>
        `;
    }

    try {
        const data = await supabaseRequest(
            `/rest/v1/${SUPABASE_POEMS_TABLE}` +
            `?select=id,date,title,body,created_at,updated_at` +
            `&order=date.desc,created_at.desc`
        );

        poems = Array.isArray(data) ? data : [];

        renderPoems();
    } catch (error) {
        console.error("Gagal memuat sajak:", error);

        if (list) {
            list.innerHTML = `
                <div class="empty-state">
                    Gagal memuat tulisan online.
                    <br><br>
                    <small>${esc(error.message)}</small>
                    <br><br>
                    <button type="button" class="btn" id="retryPoemsBtn">
                        Coba Lagi
                    </button>
                </div>
            `;

            $("retryPoemsBtn")?.addEventListener(
                "click",
                loadPoems
            );
        }
    }
}

function renderPoems() {
    const list = $("poemList");

    if (!list) return;

    if (!poems.length) {
        list.innerHTML = `
            <div class="empty-state">
                Belum ada sajak. Tulis sajak pertamamu di sini.
            </div>
        `;
        return;
    }

    const sorted = [...poems].sort((a, b) => {
        const dateCompare = String(b.date || "")
            .localeCompare(String(a.date || ""));

        if (dateCompare !== 0) return dateCompare;

        return String(b.created_at || "")
            .localeCompare(String(a.created_at || ""));
    });

    list.innerHTML = sorted.map(item => `
        <article class="poem-card">
            <div class="poem-date">${esc(fmt(item.date))}</div>

            <h3>${esc(item.title || "Tanpa judul")}</h3>

            <div class="poem-body">
                ${esc(item.body || "").replace(/\n/g, "<br>")}
            </div>

            <div class="card-actions">
                <button
                    type="button"
                    class="btn edit-poem"
                    data-id="${esc(item.id)}"
                >Edit</button>

                <button
                    type="button"
                    class="btn danger delete-poem"
                    data-id="${esc(item.id)}"
                >Hapus</button>
            </div>
        </article>
    `).join("");

    list.querySelectorAll(".edit-poem").forEach(button => {
        button.addEventListener("click", function () {
            openPoemModal(this.dataset.id);
        });
    });

    list.querySelectorAll(".delete-poem").forEach(button => {
        button.addEventListener("click", function () {
            deletePoem(this.dataset.id);
        });
    });
}

function openPoemModal(id = null) {
    const modal = $("poemModal");
    const form = $("poemForm");

    if (!modal || !form) return;

    const item = id
        ? poems.find(poem => String(poem.id) === String(id))
        : null;

    if (id && !item) {
        alert("Tulisan tidak ditemukan. Muat ulang daftar sajak.");
        return;
    }

    if ($("poemModalTitle")) {
        $("poemModalTitle").textContent =
            item ? "Edit Sajak" : "Tambah Sajak";
    }

    if ($("poemId")) $("poemId").value = item?.id || "";
    if ($("poemDate")) $("poemDate").value = item?.date || today();
    if ($("poemTitle")) $("poemTitle").value = item?.title || "";
    if ($("poemBody")) $("poemBody").value = item?.body || "";

    modal.classList.remove("hidden");
}

function closePoemModal() {
    $("poemModal")?.classList.add("hidden");
}

if ($("addPoemBtn")) {
    $("addPoemBtn").addEventListener("click", function () {
        openPoemModal();
    });
}

if ($("poemForm")) {
    $("poemForm").addEventListener(
        "submit",
        async function (event) {
            event.preventDefault();

            const id = $("poemId")?.value || "";
            const date = $("poemDate")?.value || today();
            const title = $("poemTitle")?.value.trim() || "";
            const body = $("poemBody")?.value.trim() || "";

            if (!title && !body) {
                alert("Isi judul atau isi sajak terlebih dahulu.");
                return;
            }

            const submitButton = $("poemForm").querySelector(
                'button[type="submit"]'
            );

            if (submitButton) submitButton.disabled = true;

            try {
                const record = {
                    date,
                    title,
                    body,
                    updated_at: new Date().toISOString()
                };

                if (id) {
                    await supabaseRequest(
                        `/rest/v1/${SUPABASE_POEMS_TABLE}` +
                        `?id=eq.${encodeURIComponent(id)}`,
                        {
                            method: "PATCH",
                            headers: {
                                Prefer: "return=minimal"
                            },
                            body: JSON.stringify(record)
                        }
                    );
                } else {
                    await supabaseRequest(
                        `/rest/v1/${SUPABASE_POEMS_TABLE}`,
                        {
                            method: "POST",
                            headers: {
                                Prefer: "return=minimal"
                            },
                            body: JSON.stringify({
                                ...record,
                                created_at: new Date().toISOString()
                            })
                        }
                    );
                }

                closePoemModal();
                await loadPoems();

                alert(
                    id
                        ? "Tulisan berhasil diperbarui secara online."
                        : "Tulisan berhasil disimpan secara online."
                );
            } catch (error) {
                console.error("Gagal menyimpan sajak:", error);

                alert(
                    "Tulisan gagal disimpan.\n\n" +
                    error.message
                );
            } finally {
                if (submitButton) submitButton.disabled = false;
            }
        }
    );
}

async function deletePoem(id) {
    const item = poems.find(
        poem => String(poem.id) === String(id)
    );

    if (!item) return;

    const ok = confirm(
        `Hapus sajak "${item.title || "Tanpa judul"}"?`
    );

    if (!ok) return;

    try {
        await supabaseRequest(
            `/rest/v1/${SUPABASE_POEMS_TABLE}` +
            `?id=eq.${encodeURIComponent(id)}`,
            {
                method: "DELETE",
                headers: {
                    Prefer: "return=minimal"
                }
            }
        );

        await loadPoems();
        alert("Tulisan berhasil dihapus dari database online.");
    } catch (error) {
        console.error("Gagal menghapus sajak:", error);

        alert(
            "Tulisan gagal dihapus.\n\n" +
            error.message
        );
    }
}


/* 
   7. FOTO / VIDEO ONLINE
 */

async function loadMedia() {
    const list = $("mediaList");

    if (list) {
        list.innerHTML = `
            <div class="empty-state">Memuat kenangan...</div>
        `;
    }

    try {
        const data = await supabaseRequest(
            `/rest/v1/${SUPABASE_TABLE}` +
            `?select=id,title,caption,taken_at,media_type,file_path,created_at` +
            `&order=created_at.desc`
        );

        media = Array.isArray(data) ? data : [];

        renderMedia();
    } catch (error) {
        console.error("Gagal mengambil media:", error);

        if (list) {
            list.innerHTML = `
                <div class="empty-state">
                    Gagal memuat foto/video.
                    <br><br>
                    <small>${esc(error.message)}</small>
                </div>
            `;
        }
    }
}

function getMediaUrl(filePath) {
    if (!filePath) return "";

    return (
        `${SUPABASE_URL}/storage/v1/object/public/` +
        `${SUPABASE_BUCKET}/${String(filePath).split("/").map(encodeURIComponent).join("/")}`
    );
}

function renderMedia() {
    const list = $("mediaList");

    if (!list) return;

    if (!media.length) {
        list.innerHTML = `
            <div class="empty-state">Belum ada foto atau video.</div>
        `;
        return;
    }

    list.innerHTML = media.map(item => {
        const url = getMediaUrl(item.file_path);

        const isVideo =
            item.media_type === "video" ||
            String(item.media_type || "").startsWith("video/");

        return `
            <article class="media-card">
                <div class="media-preview">
                    ${
                        isVideo
                            ? `
                                <video
                                    src="${esc(url)}"
                                    controls
                                    preload="metadata"
                                ></video>
                            `
                            : `
                                <img
                                    src="${esc(url)}"
                                    alt="${esc(item.title || "Kenangan")}"
                                    loading="lazy"
                                    onerror="this.style.display='none';"
                                >
                            `
                    }
                </div>

                <div class="media-info">
                    <h3>${esc(item.title || "Kenangan")}</h3>

                    ${
                        item.caption
                            ? `<p>${esc(item.caption)}</p>`
                            : ""
                    }

                    ${
                        item.taken_at
                            ? `<small>${esc(fmt(item.taken_at))}</small>`
                            : ""
                    }

                    <div class="card-actions">
                        <button
                            type="button"
                            class="btn danger delete-media"
                            data-id="${esc(item.id)}"
                        >Hapus</button>
                    </div>
                </div>
            </article>
        `;
    }).join("");

    list.querySelectorAll(".delete-media").forEach(button => {
        button.addEventListener("click", function () {
            deleteMedia(this.dataset.id);
        });
    });
}

if ($("mediaInput")) {
    $("mediaInput").addEventListener(
        "change",
        async function () {
            const files = Array.from(this.files || []);

            if (!files.length) return;

            await uploadMedia(files);

            this.value = "";
        }
    );
}

async function uploadMedia(files) {
    const input = $("mediaInput");

    if (input) input.disabled = true;

    let successCount = 0;
    const errors = [];

    try {
        for (const file of files) {
            if (
                !file.type.startsWith("image/") &&
                !file.type.startsWith("video/")
            ) {
                errors.push(`${file.name}: format tidak didukung.`);
                continue;
            }

            const originalName = file.name || "media";
            const lastDot = originalName.lastIndexOf(".");

            const extension = lastDot > 0
                ? originalName.substring(lastDot).toLowerCase()
                : "";

            const baseName = lastDot > 0
                ? originalName.substring(0, lastDot)
                : originalName;

            const safeBaseName = baseName
                .replace(/\s+/g, "-")
                .replace(/[^a-zA-Z0-9_-]/g, "")
                .slice(0, 80);

            const fileName =
                `${Date.now()}-${Math.random().toString(36).slice(2)}-` +
                `${safeBaseName || "media"}${extension}`;

            const filePath = fileName;

            const uploadUrl =
                `${SUPABASE_URL}/storage/v1/object/` +
                `${SUPABASE_BUCKET}/${encodeURIComponent(filePath)}`;

            const uploadResponse = await fetch(uploadUrl, {
                method: "POST",
                headers: {
                    apikey: SUPABASE_PUBLISHABLE_KEY,
                    Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
                    "x-upsert": "false",
                    "Content-Type": file.type || "application/octet-stream"
                },
                body: file
            });

            let uploadData = null;

            try {
                uploadData = await uploadResponse.json();
            } catch {
                uploadData = null;
            }

            if (!uploadResponse.ok) {
                throw new Error(
                    uploadData?.message ||
                    uploadData?.error ||
                    `Upload ${file.name} gagal (${uploadResponse.status})`
                );
            }

            const record = {
                title: file.name,
                caption: "",
                taken_at: null,
                media_type: file.type.startsWith("video/")
                    ? "video"
                    : "image",
                file_path: filePath
            };

            try {
                await supabaseRequest(
                    `/rest/v1/${SUPABASE_TABLE}`,
                    {
                        method: "POST",
                        headers: {
                            Prefer: "return=minimal"
                        },
                        body: JSON.stringify(record)
                    }
                );
            } catch (databaseError) {
                // Jika pencatatan database gagal, coba hapus file yang baru diunggah.
                try {
                    await fetch(
                        `${SUPABASE_URL}/storage/v1/object/` +
                        `${SUPABASE_BUCKET}/${encodeURIComponent(filePath)}`,
                        {
                            method: "DELETE",
                            headers: {
                                apikey: SUPABASE_PUBLISHABLE_KEY,
                                Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`
                            }
                        }
                    );
                } catch {
                    // Tidak ada tindakan tambahan.
                }

                throw databaseError;
            }

            successCount++;
        }

        await loadMedia();

        if (successCount > 0) {
            alert(`${successCount} file berhasil diunggah.`);
        }

        if (errors.length) {
            alert("Beberapa file tidak berhasil diproses:\n\n" + errors.join("\n"));
        }
    } catch (error) {
        console.error("Upload media gagal:", error);

        alert(
            "Upload gagal.\n\n" +
            error.message +
            "\n\nPeriksa batas ukuran file dan pengaturan Supabase Storage."
        );

        await loadMedia();
    } finally {
        if (input) input.disabled = false;
    }
}

async function deleteMedia(id) {
    const item = media.find(
        mediaItem => String(mediaItem.id) === String(id)
    );

    if (!item) return;

    const ok = confirm(
        `Hapus "${item.title || "Kenangan"}"?\n\nFile juga akan dihapus dari Storage.`
    );

    if (!ok) return;

    try {
        // Hapus objek di Storage menggunakan endpoint penghapusan objek.
        const response = await fetch(
            `${SUPABASE_URL}/storage/v1/object/${SUPABASE_BUCKET}`,
            {
                method: "DELETE",
                headers: {
                    apikey: SUPABASE_PUBLISHABLE_KEY,
                    Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    prefixes: [item.file_path]
                })
            }
        );

        if (!response.ok) {
            const details = await response.text();

            throw new Error(
                `File gagal dihapus dari Storage: ${details || response.status}`
            );
        }

        await supabaseRequest(
            `/rest/v1/${SUPABASE_TABLE}?id=eq.${encodeURIComponent(id)}`,
            {
                method: "DELETE",
                headers: {
                    Prefer: "return=minimal"
                }
            }
        );

        await loadMedia();
        alert("Kenangan berhasil dihapus.");
    } catch (error) {
        console.error("Gagal menghapus media:", error);

        alert(
            "Gagal menghapus kenangan.\n\n" +
            error.message
        );
    }
}


/* 
   8. KALENDER ONLINE
 */

const EVENT_TYPES = {
    haid: "Haid",
    ketemu: "Pertemuan",
    ulangtahun: "Ulang Tahun",
    anniversary: "Anniversary",
    penting: "Penting",
    lainnya: "Lainnya"
};

function getEventTypeName(type) {
    return EVENT_TYPES[type] || "Lainnya";
}

async function loadCalendarEvents() {
    const list = $("eventList");

    if (list) {
        list.innerHTML = `
            <div class="empty-state">Memuat jadwal...</div>
        `;
    }

    try {
        const data = await supabaseRequest(
            `/rest/v1/${SUPABASE_CALENDAR_TABLE}` +
            `?select=id,date,type,title,note,created_at` +
            `&order=date.asc,created_at.asc`
        );

        events = Array.isArray(data) ? data : [];

        renderCalendar();
    } catch (error) {
        console.error("Gagal memuat kalender:", error);

        events = [];
        renderCalendar();

        if (list) {
            list.innerHTML = `
                <div class="empty-state">
                    Gagal memuat kalender.
                    <br><br>
                    <small>${esc(error.message)}</small>
                </div>
            `;
        }
    }
}

function renderCalendar() {
    const grid = $("calendarGrid");
    const title = $("monthTitle");

    if (!grid || !title) return;

    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();

    title.textContent = currentCalendarDate.toLocaleDateString(
        "id-ID",
        {
            month: "long",
            year: "numeric"
        }
    );

    const startDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    let html = "";

    for (let i = 0; i < startDay; i++) {
        html += `<div class="calendar-cell empty"></div>`;
    }

    const currentDateString = today();

    for (let day = 1; day <= totalDays; day++) {
        const dateString =
            `${year}-${String(month + 1).padStart(2, "0")}-` +
            `${String(day).padStart(2, "0")}`;

        const dayEvents = events.filter(
            event => String(event.date).slice(0, 10) === dateString
        );

        const isToday = dateString === currentDateString;

        const eventClasses = dayEvents
            .map(event => event.type)
            .filter(Boolean)
            .join(" ");

        html += `
            <div
                class="calendar-cell
                    ${isToday ? "today" : ""}
                    ${dayEvents.length ? "has-event" : ""}
                    ${esc(eventClasses)}"
                data-date="${dateString}"
            >
                <div class="calendar-number">${day}</div>

                <div class="calendar-events">
                    ${dayEvents.slice(0, 2).map(event => `
                        <div
                            class="calendar-event"
                            title="${esc(event.title || getEventTypeName(event.type))}"
                        >
                            ${esc(event.title || getEventTypeName(event.type))}
                        </div>
                    `).join("")}

                    ${
                        dayEvents.length > 2
                            ? `<small>+${dayEvents.length - 2} lainnya</small>`
                            : ""
                    }
                </div>
            </div>
        `;
    }

    grid.innerHTML = html;

    grid.querySelectorAll(".calendar-cell:not(.empty)").forEach(cell => {
        cell.addEventListener("click", function () {
            openEventModalForDate(this.dataset.date);
        });
    });

    renderEvents();
}

function renderEvents() {
    const list = $("eventList");

    if (!list) return;

    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();

    const monthEvents = events
        .filter(event => {
            if (!event.date) return false;

            const date = new Date(
                String(event.date).slice(0, 10) + "T00:00:00"
            );

            return (
                date.getFullYear() === year &&
                date.getMonth() === month
            );
        })
        .sort((a, b) =>
            String(a.date).localeCompare(String(b.date))
        );

    if (!monthEvents.length) {
        list.innerHTML = `
            <div class="empty-state">Belum ada event bulan ini.</div>
        `;
        return;
    }

    list.innerHTML = monthEvents.map(event => `
        <article class="event-card">
            <div class="event-info">
                <div class="event-date">
                    ${esc(fmt(String(event.date).slice(0, 10)))}
                </div>

                <strong>
                    ${esc(event.title || getEventTypeName(event.type))}
                </strong>

                <div class="event-type">
                    ${esc(getEventTypeName(event.type))}
                </div>

                ${
                    event.note
                        ? `<p>${esc(event.note)}</p>`
                        : ""
                }
            </div>

            <div class="event-actions">
                <button
                    type="button"
                    class="btn edit-event"
                    data-id="${esc(event.id)}"
                >Edit</button>

                <button
                    type="button"
                    class="btn danger delete-event"
                    data-id="${esc(event.id)}"
                >Hapus</button>
            </div>
        </article>
    `).join("");

    list.querySelectorAll(".edit-event").forEach(button => {
        button.addEventListener("click", function () {
            openEventModal(this.dataset.id);
        });
    });

    list.querySelectorAll(".delete-event").forEach(button => {
        button.addEventListener("click", function () {
            deleteEvent(this.dataset.id);
        });
    });
}


/* 
   9. NAVIGASI BULAN
 */

if ($("prevMonth")) {
    $("prevMonth").addEventListener("click", function () {
        currentCalendarDate = new Date(
            currentCalendarDate.getFullYear(),
            currentCalendarDate.getMonth() - 1,
            1
        );

        renderCalendar();
    });
}

if ($("nextMonth")) {
    $("nextMonth").addEventListener("click", function () {
        currentCalendarDate = new Date(
            currentCalendarDate.getFullYear(),
            currentCalendarDate.getMonth() + 1,
            1
        );

        renderCalendar();
    });
}


/* 
   10. FORM EVENT / JADWAL
 */

function openEventModal(id = null) {
    const modal = $("eventModal");

    if (!modal) return;

    const item = id
        ? events.find(event => String(event.id) === String(id))
        : null;

    if (id && !item) {
        alert("Jadwal tidak ditemukan. Muat ulang kalender.");
        return;
    }

    if ($("eventModalTitle")) {
        $("eventModalTitle").textContent =
            item ? "Edit Jadwal" : "Tambah Jadwal";
    }

    if ($("eventId")) $("eventId").value = item?.id || "";
    if ($("eventDate")) $("eventDate").value = item?.date
        ? String(item.date).slice(0, 10)
        : today();

    if ($("eventType")) $("eventType").value = item?.type || "lainnya";
    if ($("eventTitle")) $("eventTitle").value = item?.title || "";
    if ($("eventNote")) $("eventNote").value = item?.note || "";

    modal.classList.remove("hidden");
}

function openEventModalForDate(date) {
    const existing = events.find(
        event => String(event.date).slice(0, 10) === date
    );

    if (existing) {
        openEventModal(existing.id);
        return;
    }

    if (!$("eventModal")) return;

    if ($("eventModalTitle")) {
        $("eventModalTitle").textContent = "Tambah Jadwal";
    }

    if ($("eventId")) $("eventId").value = "";
    if ($("eventDate")) $("eventDate").value = date;
    if ($("eventType")) $("eventType").value = "lainnya";
    if ($("eventTitle")) $("eventTitle").value = "";
    if ($("eventNote")) $("eventNote").value = "";

    $("eventModal").classList.remove("hidden");
}

function closeEventModal() {
    $("eventModal")?.classList.add("hidden");
}

if ($("addEventBtn")) {
    $("addEventBtn").addEventListener("click", function () {
        openEventModal();
    });
}

if ($("eventForm")) {
    $("eventForm").addEventListener(
        "submit",
        async function (event) {
            event.preventDefault();

            const id = $("eventId")?.value || "";
            const date = $("eventDate")?.value || today();
            const type = $("eventType")?.value || "lainnya";
            const title = $("eventTitle")?.value.trim() || "";
            const note = $("eventNote")?.value.trim() || "";

            if (!date) {
                alert("Tanggal harus diisi.");
                return;
            }

            if (!title) {
                alert("Nama / Catatan harus diisi.");
                return;
            }

            const submitButton = $("eventForm").querySelector(
                'button[type="submit"]'
            );

            if (submitButton) submitButton.disabled = true;

            try {
                const record = { date, type, title, note };

                if (id) {
                    await supabaseRequest(
                        `/rest/v1/${SUPABASE_CALENDAR_TABLE}` +
                        `?id=eq.${encodeURIComponent(id)}`,
                        {
                            method: "PATCH",
                            headers: {
                                Prefer: "return=minimal"
                            },
                            body: JSON.stringify(record)
                        }
                    );
                } else {
                    await supabaseRequest(
                        `/rest/v1/${SUPABASE_CALENDAR_TABLE}`,
                        {
                            method: "POST",
                            headers: {
                                Prefer: "return=minimal"
                            },
                            body: JSON.stringify(record)
                        }
                    );
                }

                closeEventModal();
                await loadCalendarEvents();

                alert(
                    id
                        ? "Jadwal berhasil diperbarui."
                        : "Jadwal berhasil disimpan."
                );
            } catch (error) {
                console.error("Gagal menyimpan jadwal:", error);

                alert(
                    "Gagal menyimpan jadwal.\n\n" +
                    error.message
                );
            } finally {
                if (submitButton) submitButton.disabled = false;
            }
        }
    );
}

async function deleteEvent(id) {
    const item = events.find(
        event => String(event.id) === String(id)
    );

    if (!item) return;

    const ok = confirm(
        `Hapus event "${item.title || getEventTypeName(item.type)}"?`
    );

    if (!ok) return;

    try {
        await supabaseRequest(
            `/rest/v1/${SUPABASE_CALENDAR_TABLE}` +
            `?id=eq.${encodeURIComponent(id)}`,
            {
                method: "DELETE",
                headers: {
                    Prefer: "return=minimal"
                }
            }
        );

        await loadCalendarEvents();
        alert("Jadwal berhasil dihapus.");
    } catch (error) {
        console.error("Gagal menghapus jadwal:", error);

        alert(
            "Gagal menghapus jadwal.\n\n" +
            error.message
        );
    }
}


/* 
   11. MENUTUP MODAL
 */

document.querySelectorAll("[data-close-modal]").forEach(button => {
    button.addEventListener("click", function () {
        this.closest(".modal")?.classList.add("hidden");
    });
});

document.querySelectorAll(".modal").forEach(modal => {
    modal.addEventListener("click", function (event) {
        if (event.target === modal) {
            modal.classList.add("hidden");
        }
    });
});

document.addEventListener("keydown", function (event) {
    if (event.key !== "Escape") return;

    document.querySelectorAll(".modal").forEach(modal => {
        modal.classList.add("hidden");
    });
});


/* 
   12. FLOATING CALENDAR
 */

if ($("privateCalendarButton")) {
    $("privateCalendarButton").addEventListener("click", function () {
        const calendar = $("calendar");

        if (!calendar) return;

        calendar.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    });
}


/* 
   13. MULAI APLIKASI
 */

document.addEventListener("DOMContentLoaded", function () {
    if (sessionStorage.getItem("rk_login") === "yes") {
        showMemoryQuestion();
    } else {
        showLogin();
    }
});
