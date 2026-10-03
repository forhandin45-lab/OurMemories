/*
   RUANG KENANGAN
   app.js

   Fitur:
   - Login
   - Pertanyaan kenangan acak
   - Supabase foto/video
   - Sajak
   - Kalender online Supabase
   - Floating calendar
*/


/* 
   SUPABASE CONFIG
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
const SUPABASE_CALENDAR_TABLE = "calendar_events";


/* 
   PASSWORD
    */

const PASSWORD = "kenangan";


/* 
   HELPER
    */

function $(id) {
    return document.getElementById(id);
}


function today() {
    const d = new Date();

    const year = d.getFullYear();

    const month =
        String(d.getMonth() + 1).padStart(2, "0");

    const day =
        String(d.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


function uid() {
    return (
        Date.now().toString(36) +
        Math.random().toString(36).slice(2)
    );
}


function load(key) {
    try {
        const value =
            JSON.parse(
                localStorage.getItem(key)
            );

        return Array.isArray(value)
            ? value
            : [];

    } catch {
        return [];
    }
}


function save(key, value) {
    localStorage.setItem(
        key,
        JSON.stringify(value)
    );
}


function fmt(dateString) {

    if (!dateString) {
        return "";
    }

    const d =
        new Date(
            dateString + "T00:00:00"
        );

    if (Number.isNaN(d.getTime())) {
        return dateString;
    }

    return d.toLocaleDateString(
        "id-ID",
        {
            day: "numeric",
            month: "long",
            year: "numeric"
        }
    );
}


function esc(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* 
   SUPABASE REQUEST
    */

async function supabaseRequest(
    path,
    options = {}
) {

    const response =
        await fetch(
            `${SUPABASE_URL}${path}`,
            {
                ...options,

                headers: {

                    apikey:
                        SUPABASE_PUBLISHABLE_KEY,

                    Authorization:
                        `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,

                    ...(options.body instanceof FormData
                        ? {}
                        : {
                            "Content-Type":
                                "application/json"
                        }),

                    ...(options.headers || {})
                }
            }
        );


    let data = null;

    const contentType =
        response.headers.get(
            "content-type"
        ) || "";


    if (
        contentType.includes(
            "application/json"
        )
    ) {

        data =
            await response.json();

    } else {

        const text =
            await response.text();

        if (text) {

            try {

                data =
                    JSON.parse(text);

            } catch {

                data = text;
            }
        }
    }


    if (!response.ok) {

        const message =
            data?.message ||
            data?.error_description ||
            data?.hint ||
            data?.error ||
            `HTTP ${response.status}`;

        throw new Error(message);
    }


    return data;
}


/* 
   GLOBAL DATA
    */

let poems =
    load("rk_poems");

let events = [];

let media = [];

let currentCalendarDate =
    new Date();


/* 
   PERTANYAAN KENANGAN
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

        answers: [
            "rumah"
        ]
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
            "makan apa yang pernah kita buat bersama ?",

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

        answers: [
            "roblox"
        ]
    }

];


let selectedMemoryQuestion = null;


function normalizeAnswer(value) {

    return String(value || "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");
}


function chooseRandomMemoryQuestion() {

    if (!MEMORY_QUESTIONS.length) {
        return null;
    }

    const index =
        Math.floor(
            Math.random() *
            MEMORY_QUESTIONS.length
        );

    selectedMemoryQuestion =
        MEMORY_QUESTIONS[index];

    return selectedMemoryQuestion;
}


function showMemoryQuestion() {
    const loginScreen = $("loginScreen");
    const screen = $("memoryQuestionScreen");
    const questionElement = $("memoryQuestion");
    const answerInput = $("memoryAnswer");
    const error = $("memoryQuestionError");

    // Sembunyikan layar password
    if (loginScreen) {
        loginScreen.classList.add("hidden");
    }

    // Sembunyikan aplikasi utama
    if ($("app")) {
        $("app").classList.add("hidden");
    }

    if (!screen || !questionElement) {
        return;
    }

    const question = chooseRandomMemoryQuestion();

    if (!question) {
        return;
    }

    questionElement.textContent = question.question;

    if (answerInput) {
        answerInput.value = "";

        setTimeout(() => {
            answerInput.focus();
        }, 50);
    }

    if (error) {
        error.textContent = "";
    }

    // Tampilkan pertanyaan kenangan
    screen.classList.remove("hidden");
}


function showLogin() {

    if ($("loginScreen")) {

        $("loginScreen")
            .classList
            .remove("hidden");
    }


    if ($("memoryQuestionScreen")) {

        $("memoryQuestionScreen")
            .classList
            .add("hidden");
    }


    if ($("app")) {

        $("app")
            .classList
            .add("hidden");
    }
}


function showApp() {

    if ($("loginScreen")) {

        $("loginScreen")
            .classList
            .add("hidden");
    }


    if ($("memoryQuestionScreen")) {

        $("memoryQuestionScreen")
            .classList
            .add("hidden");
    }


    if ($("app")) {

        $("app")
            .classList
            .remove("hidden");
    }


    renderPoems();

    loadMedia();

    loadCalendarEvents();
}


/* 
   LOGIN
    */

function checkLogin() {

    const loggedIn =
        sessionStorage.getItem(
            "rk_login"
        ) === "yes";


    if (loggedIn) {

        if ($("loginScreen")) {

            $("loginScreen")
                .classList
                .add("hidden");
        }

        showMemoryQuestion();

    } else {

        showLogin();
    }
}


if ($("loginForm")) {

    $("loginForm")
        .addEventListener(
            "submit",
            function (event) {

                event.preventDefault();


                const password =
                    $("password")?.value || "";


                if (password === PASSWORD) {

                    sessionStorage.setItem(
                        "rk_login",
                        "yes"
                    );


                    if ($("loginError")) {

                        $("loginError")
                            .textContent = "";
                    }


                    if ($("password")) {

                        $("password").value = "";
                    }


                    showMemoryQuestion();


                } else {

                    if ($("loginError")) {

                        $("loginError")
                            .textContent =
                            "Password salah.";
                    }
                }

            }
        );
}


/* 
   MEMORY QUESTION SUBMIT
    */

if ($("memoryQuestionForm")) {

    $("memoryQuestionForm")
        .addEventListener(
            "submit",
            function (event) {

                event.preventDefault();


                if (!selectedMemoryQuestion) {
                    return;
                }


                const input =
                    $("memoryAnswer");


                const answer =
                    normalizeAnswer(
                        input?.value
                    );


                const valid =
                    selectedMemoryQuestion
                        .answers
                        .some(
                            correctAnswer =>
                                normalizeAnswer(
                                    correctAnswer
                                ) === answer
                        );


                if (valid) {

                    if ($("memoryQuestionError")) {

                        $("memoryQuestionError")
                            .textContent = "";
                    }


                    showApp();


                } else {

                    if ($("memoryQuestionError")) {

                        $("memoryQuestionError")
                            .textContent =
                            "Jawabannya belum tepat. Coba ingat lagi 🤍";
                    }


                    if (input) {
                        input.select();
                    }
                }

            }
        );
}


/* 
   GANTI PERTANYAAN
    */

if ($("changeQuestionBtn")) {

    $("changeQuestionBtn")
        .addEventListener(
            "click",
            function () {

                showMemoryQuestion();

            }
        );
}


/* 
   LOGOUT
    */

if ($("logoutBtn")) {

    $("logoutBtn")
        .addEventListener(
            "click",
            function () {

                sessionStorage.removeItem(
                    "rk_login"
                );

                location.reload();

            }
        );
}


/* 
   PUISI / SAJAK
    */

function renderPoems() {

    const list =
        $("poemList");


    if (!list) {
        return;
    }


    if (!poems.length) {

        list.innerHTML = `
            <div class="empty-state">
                
            </div>
        `;

        return;
    }


    const sorted =
        [...poems].sort(
            (a, b) =>
                String(b.date || "")
                    .localeCompare(
                        String(a.date || "")
                    )
        );


    list.innerHTML =
        sorted
            .map(
                item => `

                <article class="poem-card">

                    <div class="poem-date">
                        ${esc(fmt(item.date))}
                    </div>

                    <h3>
                        ${esc(
                            item.title ||
                            "Tanpa judul"
                        )}
                    </h3>

                    <div class="poem-body">
                        ${esc(
                            item.body || ""
                        ).replace(
                            /\n/g,
                            "<br>"
                        )}
                    </div>

                    <div class="card-actions">

                        <button
                            type="button"
                            class="btn edit-poem"
                            data-id="${esc(item.id)}"
                        >
                            Edit
                        </button>

                        <button
                            type="button"
                            class="btn danger delete-poem"
                            data-id="${esc(item.id)}"
                        >
                            Hapus
                        </button>

                    </div>

                </article>
            `
            )
            .join("");


    list
        .querySelectorAll(".edit-poem")
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    function () {

                        openPoemModal(
                            this.dataset.id
                        );

                    }
                );
            }
        );


    list
        .querySelectorAll(".delete-poem")
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    function () {

                        deletePoem(
                            this.dataset.id
                        );

                    }
                );
            }
        );
}


function openPoemModal(id = null) {

    const modal =
        $("poemModal");

    const form =
        $("poemForm");


    if (!modal || !form) {
        return;
    }


    const item =
        id
            ? poems.find(
                poem =>
                    String(poem.id) ===
                    String(id)
            )
            : null;


    if ($("poemModalTitle")) {

        $("poemModalTitle")
            .textContent =
            item
                ? "Edit Sajak"
                : "Tambah Sajak";
    }


    if ($("poemId")) {

        $("poemId").value =
            item?.id || "";
    }


    if ($("poemDate")) {

        $("poemDate").value =
            item?.date || today();
    }


    if ($("poemTitle")) {

        $("poemTitle").value =
            item?.title || "";
    }


    if ($("poemBody")) {

        $("poemBody").value =
            item?.body || "";
    }


    modal
        .classList
        .remove("hidden");
}


function closePoemModal() {

    if ($("poemModal")) {

        $("poemModal")
            .classList
            .add("hidden");
    }
}


if ($("addPoemBtn")) {

    $("addPoemBtn")
        .addEventListener(
            "click",
            function () {

                openPoemModal();

            }
        );
}


if ($("poemForm")) {

    $("poemForm")
        .addEventListener(
            "submit",
            function (event) {

                event.preventDefault();


                const id =
                    $("poemId")?.value || "";


                const date =
                    $("poemDate")?.value ||
                    today();


                const title =
                    $("poemTitle")
                        ?.value
                        .trim() || "";


                const body =
                    $("poemBody")
                        ?.value
                        .trim() || "";


                if (!title && !body) {

                    alert(
                        "Isi judul atau isi sajak terlebih dahulu."
                    );

                    return;
                }


                if (id) {

                    const index =
                        poems.findIndex(
                            item =>
                                String(item.id) ===
                                String(id)
                        );


                    if (index !== -1) {

                        poems[index] = {

                            ...poems[index],

                            date,
                            title,
                            body

                        };
                    }

                } else {

                    poems.push({

                        id: uid(),

                        date,
                        title,
                        body

                    });
                }


                save(
                    "rk_poems",
                    poems
                );


                renderPoems();

                closePoemModal();

            }
        );
}


function deletePoem(id) {

    const item =
        poems.find(
            poem =>
                String(poem.id) ===
                String(id)
        );


    if (!item) {
        return;
    }


    const ok =
        confirm(
            `Hapus sajak "${item.title || "Tanpa judul"}"?`
        );


    if (!ok) {
        return;
    }


    poems =
        poems.filter(
            poem =>
                String(poem.id) !==
                String(id)
        );


    save(
        "rk_poems",
        poems
    );


    renderPoems();
}


/* 
   SUPABASE MEDIA
    */

async function loadMedia() {

    const list =
        $("mediaList");


    if (list) {

        list.innerHTML = `
            <div class="empty-state">
                Memuat kenangan...
            </div>
        `;
    }


    try {

        const query =
            `/rest/v1/${SUPABASE_TABLE}` +
            `?select=id,title,caption,taken_at,media_type,file_path,created_at` +
            `&order=created_at.desc`;


        media =
            await supabaseRequest(
                query
            );


        if (!Array.isArray(media)) {
            media = [];
        }


        renderMedia();


    } catch (error) {

        console.error(
            "Gagal mengambil media:",
            error
        );


        if (list) {

            list.innerHTML = `
                <div class="empty-state">
                    Gagal memuat foto/video.
                    <br><br>
                    <small>
                        ${esc(error.message)}
                    </small>
                </div>
            `;
        }
    }
}


/* 
   MEDIA URL
    */

function getMediaUrl(filePath) {

    if (!filePath) {
        return "";
    }


    return (
        `${SUPABASE_URL}` +
        `/storage/v1/object/public/` +
        `${SUPABASE_BUCKET}/` +
        encodeURI(filePath)
    );
}


/* 
   RENDER MEDIA
    */

function renderMedia() {

    const list =
        $("mediaList");


    if (!list) {
        return;
    }


    if (!media.length) {

        list.innerHTML = `
            <div class="empty-state">
                Belum ada foto atau video.
            </div>
        `;

        return;
    }


    list.innerHTML =
        media
            .map(
                item => {

                    const url =
                        getMediaUrl(
                            item.file_path
                        );


                    const isVideo =
                        item.media_type ===
                            "video" ||

                        String(
                            item.media_type ||
                            ""
                        ).startsWith(
                            "video/"
                        );


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
                                                alt="${esc(
                                                    item.title ||
                                                    "Kenangan"
                                                )}"
                                                loading="lazy"
                                                onerror="this.style.display='none';"
                                            >

                                        `
                                }

                            </div>


                            <div class="media-info">

                                <h3>
                                    ${esc(
                                        item.title ||
                                        "Kenangan"
                                    )}
                                </h3>


                                ${
                                    item.caption
                                        ? `

                                            <p>
                                                ${esc(
                                                    item.caption
                                                )}
                                            </p>

                                        `
                                        : ""
                                }


                                ${
                                    item.taken_at
                                        ? `

                                            <small>
                                                ${esc(
                                                    new Date(
                                                        item.taken_at
                                                    ).toLocaleDateString(
                                                        "id-ID",
                                                        {
                                                            day:
                                                                "numeric",
                                                            month:
                                                                "long",
                                                            year:
                                                                "numeric"
                                                        }
                                                    )
                                                )}
                                            </small>

                                        `
                                        : ""
                                }


                                <div class="card-actions">

                                    <button
                                        type="button"
                                        class="btn danger delete-media"
                                        data-id="${esc(item.id)}"
                                    >
                                        Hapus
                                    </button>

                                </div>

                            </div>

                        </article>

                    `;
                }
            )
            .join("");


    list
        .querySelectorAll(".delete-media")
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    function () {

                        deleteMedia(
                            this.dataset.id
                        );

                    }
                );
            }
        );
}


/* 
   UPLOAD MEDIA
    */

if ($("mediaInput")) {

    $("mediaInput")
        .addEventListener(
            "change",
            async function () {

                const files =
                    Array.from(
                        this.files || []
                    );


                if (!files.length) {
                    return;
                }


                await uploadMedia(
                    files
                );


                this.value = "";

            }
        );
}


async function uploadMedia(files) {

    const input =
        $("mediaInput");


    if (input) {
        input.disabled = true;
    }


    let successCount = 0;


    try {

        for (const file of files) {


            if (
                !file.type.startsWith(
                    "image/"
                ) &&

                !file.type.startsWith(
                    "video/"
                )
            ) {

                alert(
                    `${file.name} bukan file foto/video yang didukung.`
                );

                continue;
            }


            const maxSize =
                100 * 1024 * 1024;


            if (file.size > maxSize) {

                alert(
                    `${file.name} terlalu besar. Maksimal 100 MB per file.`
                );

                continue;
            }


            const originalName =
                file.name ||
                "media";


            const lastDot =
                originalName.lastIndexOf(
                    "."
                );


            const extension =
                lastDot > 0
                    ? originalName
                        .substring(
                            lastDot
                        )
                        .toLowerCase()
                    : "";


            const baseName =
                lastDot > 0
                    ? originalName
                        .substring(
                            0,
                            lastDot
                        )
                    : originalName;


            const safeBaseName =
                baseName
                    .replace(
                        /\s+/g,
                        "-"
                    )
                    .replace(
                        /[^a-zA-Z0-9_-]/g,
                        ""
                    );


            const fileName =
                `${Date.now()}-` +
                `${Math.random()
                    .toString(36)
                    .slice(2)}-` +
                `${safeBaseName || "media"}` +
                `${extension}`;


            const filePath =
                fileName;


            const uploadUrl =
                `${SUPABASE_URL}` +
                `/storage/v1/object/` +
                `${SUPABASE_BUCKET}/` +
                encodeURI(filePath);


            const uploadResponse =
                await fetch(
                    uploadUrl,
                    {
                        method: "POST",

                        headers: {

                            apikey:
                                SUPABASE_PUBLISHABLE_KEY,

                            Authorization:
                                `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,

                            "x-upsert":
                                "false",

                            "Content-Type":
                                file.type ||
                                "application/octet-stream"
                        },

                        body: file
                    }
                );


            let uploadData = null;


            try {

                uploadData =
                    await uploadResponse
                        .json();

            } catch {

                uploadData = null;
            }


            if (!uploadResponse.ok) {

                console.error(
                    "Upload Storage gagal:",
                    uploadData
                );


                throw new Error(
                    uploadData?.message ||
                    uploadData?.error ||
                    `Upload gagal (${uploadResponse.status})`
                );
            }


            const record = {

                title:
                    file.name,

                caption:
                    "",

                taken_at:
                    null,

                media_type:
                    file.type.startsWith(
                        "video/"
                    )
                        ? "video"
                        : "image",

                file_path:
                    filePath
            };


            try {

                await supabaseRequest(
                    `/rest/v1/${SUPABASE_TABLE}`,
                    {
                        method: "POST",

                        headers: {

                            Prefer:
                                "return=minimal"
                        },

                        body:
                            JSON.stringify(
                                record
                            )
                    }
                );


            } catch (databaseError) {

                try {

                    await fetch(
                        `${SUPABASE_URL}` +
                        `/storage/v1/object/` +
                        `${SUPABASE_BUCKET}/` +
                        encodeURI(filePath),

                        {
                            method: "DELETE",

                            headers: {

                                apikey:
                                    SUPABASE_PUBLISHABLE_KEY,

                                Authorization:
                                    `Bearer ${SUPABASE_PUBLISHABLE_KEY}`
                            }
                        }
                    );

                } catch {
                    // Abaikan error cleanup.
                }


                throw databaseError;
            }


            successCount++;
        }


        await loadMedia();


        if (successCount > 0) {

            alert(
                `${successCount} file berhasil diupload ke Supabase.`
            );
        }


    } catch (error) {

        console.error(
            "Upload media gagal:",
            error
        );


        alert(
            "Upload gagal.\n\n" +
            error.message
        );


        await loadMedia();


    } finally {

        if (input) {
            input.disabled = false;
        }
    }
}


/* 
   DELETE MEDIA
    */

async function deleteMedia(id) {

    const item =
        media.find(
            mediaItem =>
                String(
                    mediaItem.id
                ) ===
                String(id)
        );


    if (!item) {
        return;
    }


    const ok =
        confirm(
            `Hapus "${item.title || "Kenangan"}"?\n\n` +
            `File juga akan dihapus dari Storage.`
        );


    if (!ok) {
        return;
    }


    try {

        const deleteUrl =
            `${SUPABASE_URL}` +
            `/storage/v1/object/` +
            `${SUPABASE_BUCKET}`;


        const deleteResponse =
            await fetch(
                deleteUrl,
                {
                    method: "DELETE",

                    headers: {

                        apikey:
                            SUPABASE_PUBLISHABLE_KEY,

                        Authorization:
                            `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,

                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            prefixes: [
                                item.file_path
                            ]
                        })
                }
            );


        if (!deleteResponse.ok) {

            let errorData = null;


            try {

                errorData =
                    await deleteResponse
                        .json();

            } catch {

                errorData = null;
            }


            console.warn(
                "Penghapusan Storage gagal:",
                errorData
            );
        }


        await supabaseRequest(
            `/rest/v1/${SUPABASE_TABLE}` +
            `?id=eq.${encodeURIComponent(id)}`,

            {
                method: "DELETE",

                headers: {

                    Prefer:
                        "return=minimal"
                }
            }
        );


        await loadMedia();


        alert(
            "Kenangan berhasil dihapus."
        );


    } catch (error) {

        console.error(
            "Gagal menghapus media:",
            error
        );


        alert(
            "Gagal menghapus kenangan.\n\n" +
            error.message
        );
    }
}


/* 
   KALENDER
    */

const EVENT_TYPES = {

    haid:
        "Haid",

    ketemu:
        "Pertemuan",

    ulangtahun:
        "Ulang Tahun",

    anniversary:
        "Anniversary",

    penting:
        "Penting",

    lainnya:
        "Lainnya"
};


function getEventTypeName(type) {

    return (
        EVENT_TYPES[type] ||
        "Lainnya"
    );
}


/* 
   LOAD CALENDAR DARI SUPABASE
    */

async function loadCalendarEvents() {

    const list =
        $("eventList");


    if (list) {

        list.innerHTML = `
            <div class="empty-state">
                Memuat jadwal...
            </div>
        `;
    }


    try {

        const query =
            `/rest/v1/${SUPABASE_CALENDAR_TABLE}` +
            `?select=id,date,type,title,note,created_at` +
            `&order=date.asc,created_at.asc`;


        const data =
            await supabaseRequest(
                query
            );


        events =
            Array.isArray(data)
                ? data
                : [];


        renderCalendar();


    } catch (error) {

        console.error(
            "Gagal memuat kalender:",
            error
        );


        events = [];


        renderCalendar();


        if (list) {

            list.innerHTML = `
                <div class="empty-state">

                    Gagal memuat kalender.

                    <br><br>

                    <small>
                        ${esc(error.message)}
                    </small>

                </div>
            `;
        }
    }
}


/* 
   RENDER CALENDAR
    */

function renderCalendar() {

    const grid =
        $("calendarGrid");

    const title =
        $("monthTitle");


    if (!grid || !title) {
        return;
    }


    const year =
        currentCalendarDate
            .getFullYear();


    const month =
        currentCalendarDate
            .getMonth();


    title.textContent =
        currentCalendarDate
            .toLocaleDateString(
                "id-ID",
                {
                    month:
                        "long",

                    year:
                        "numeric"
                }
            );


    const firstDay =
        new Date(
            year,
            month,
            1
        );


    const lastDay =
        new Date(
            year,
            month + 1,
            0
        );


    const startDay =
        firstDay.getDay();


    const totalDays =
        lastDay.getDate();


    let html = "";


    for (
        let i = 0;
        i < startDay;
        i++
    ) {

        html += `
            <div class="calendar-cell empty"></div>
        `;
    }


    const currentDateString =
        today();


    for (
        let day = 1;
        day <= totalDays;
        day++
    ) {

        const dateString =
            `${year}-` +
            `${String(
                month + 1
            ).padStart(2, "0")}-` +
            `${String(
                day
            ).padStart(2, "0")}`;


        const dayEvents =
            events.filter(
                event =>
                    String(event.date)
                        .slice(0, 10) ===
                    dateString
            );


        const isToday =
            dateString ===
            currentDateString;


        const eventClasses =
            dayEvents
                .map(
                    event =>
                        event.type
                )
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

                <div class="calendar-number">
                    ${day}
                </div>


                <div class="calendar-events">

                    ${dayEvents
                        .map(
                            event => `

                                <div
                                    class="calendar-event"
                                    title="${esc(
                                        event.title ||
                                        getEventTypeName(
                                            event.type
                                        )
                                    )}"
                                >

                                    ${esc(
                                        event.title ||
                                        getEventTypeName(
                                            event.type
                                        )
                                    )}

                                </div>

                            `
                        )
                        .join("")}

                </div>

            </div>

        `;
    }


    grid.innerHTML =
        html;


    grid
        .querySelectorAll(
            ".calendar-cell:not(.empty)"
        )
        .forEach(
            cell => {

                cell.addEventListener(
                    "click",
                    function () {

                        openEventModalForDate(
                            this.dataset.date
                        );

                    }
                );
            }
        );


    renderEvents();
}


/* 
   RENDER EVENT LIST
    */

function renderEvents() {

    const list =
        $("eventList");


    if (!list) {
        return;
    }


    const year =
        currentCalendarDate
            .getFullYear();


    const month =
        currentCalendarDate
            .getMonth();


    const monthEvents =
        events
            .filter(
                event => {

                    if (!event.date) {
                        return false;
                    }


                    const date =
                        new Date(
                            String(event.date)
                                .slice(0, 10) +
                            "T00:00:00"
                        );


                    return (

                        date.getFullYear() ===
                            year &&

                        date.getMonth() ===
                            month

                    );
                }
            )
            .sort(
                (a, b) =>
                    String(a.date)
                        .localeCompare(
                            String(b.date)
                        )
            );


    if (!monthEvents.length) {

        list.innerHTML = `
            <div class="empty-state">
                Belum ada event bulan ini.
            </div>
        `;

        return;
    }


    list.innerHTML =
        monthEvents
            .map(
                event => `

                    <article class="event-card">

                        <div class="event-info">

                            <div class="event-date">

                                ${esc(
                                    fmt(
                                        String(event.date)
                                            .slice(0, 10)
                                    )
                                )}

                            </div>


                            <strong>

                                ${esc(
                                    event.title ||
                                    getEventTypeName(
                                        event.type
                                    )
                                )}

                            </strong>


                            <div class="event-type">

                                ${esc(
                                    getEventTypeName(
                                        event.type
                                    )
                                )}

                            </div>


                            ${
                                event.note
                                    ? `

                                        <p>
                                            ${esc(
                                                event.note
                                            )}
                                        </p>

                                    `
                                    : ""
                            }

                        </div>


                        <div class="event-actions">

                            <button
                                type="button"
                                class="btn edit-event"
                                data-id="${esc(event.id)}"
                            >
                                Edit
                            </button>


                            <button
                                type="button"
                                class="btn danger delete-event"
                                data-id="${esc(event.id)}"
                            >
                                Hapus
                            </button>

                        </div>

                    </article>

                `
            )
            .join("");


    list
        .querySelectorAll(
            ".edit-event"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    function () {

                        openEventModal(
                            this.dataset.id
                        );

                    }
                );
            }
        );


    list
        .querySelectorAll(
            ".delete-event"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    function () {

                        deleteEvent(
                            this.dataset.id
                        );

                    }
                );
            }
        );
}


/* 
   KALENDER NAVIGATION
    */

if ($("prevMonth")) {

    $("prevMonth")
        .addEventListener(
            "click",
            function () {

                currentCalendarDate
                    .setMonth(
                        currentCalendarDate
                            .getMonth() - 1
                    );


                renderCalendar();

            }
        );
}


if ($("nextMonth")) {

    $("nextMonth")
        .addEventListener(
            "click",
            function () {

                currentCalendarDate
                    .setMonth(
                        currentCalendarDate
                            .getMonth() + 1
                    );


                renderCalendar();

            }
        );
}


/* 
   EVENT MODAL
    */

function openEventModal(id = null) {

    const modal =
        $("eventModal");


    if (!modal) {
        return;
    }


    const item =
        id
            ? events.find(
                event =>
                    String(event.id) ===
                    String(id)
            )
            : null;


    if ($("eventModalTitle")) {

        $("eventModalTitle")
            .textContent =
            item
                ? "Edit Jadwal"
                : "Tambah Jadwal";
    }


    if ($("eventId")) {

        $("eventId").value =
            item?.id || "";
    }


    if ($("eventDate")) {

        $("eventDate").value =
            item?.date
                ? String(item.date).slice(0, 10)
                : today();
    }


    if ($("eventType")) {

        $("eventType").value =
            item?.type ||
            "lainnya";
    }


    if ($("eventTitle")) {

        $("eventTitle").value =
            item?.title ||
            "";
    }


    if ($("eventNote")) {

        $("eventNote").value =
            item?.note ||
            "";
    }


    modal
        .classList
        .remove("hidden");
}


/* 
   OPEN EVENT DARI TANGGAL KALENDER
    */

function openEventModalForDate(date) {

    const existing =
        events.find(
            event =>
                String(event.date)
                    .slice(0, 10) ===
                date
        );


    if (existing) {

        openEventModal(
            existing.id
        );

        return;
    }


    const modal =
        $("eventModal");


    if (!modal) {
        return;
    }


    if ($("eventModalTitle")) {

        $("eventModalTitle")
            .textContent =
            "Tambah Jadwal";
    }


    if ($("eventId")) {

        $("eventId").value = "";
    }


    if ($("eventDate")) {

        $("eventDate").value =
            date;
    }


    if ($("eventType")) {

        $("eventType").value =
            "lainnya";
    }


    if ($("eventTitle")) {

        $("eventTitle").value =
            "";
    }


    if ($("eventNote")) {

        $("eventNote").value =
            "";
    }


    modal
        .classList
        .remove("hidden");
}


function closeEventModal() {

    if ($("eventModal")) {

        $("eventModal")
            .classList
            .add("hidden");
    }
}


/* 
   ADD EVENT
    */

if ($("addEventBtn")) {

    $("addEventBtn")
        .addEventListener(
            "click",
            function () {

                openEventModal();

            }
        );
}


/* 
   EVENT FORM
    */

if ($("eventForm")) {

    $("eventForm")
        .addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();


                const id =
                    $("eventId")
                        ?.value || "";


                const date =
                    $("eventDate")
                        ?.value ||
                    today();


                const type =
                    $("eventType")
                        ?.value ||
                    "lainnya";


                const title =
                    $("eventTitle")
                        ?.value
                        .trim() ||
                    "";


                const note =
                    $("eventNote")
                        ?.value
                        .trim() ||
                    "";


                if (!date) {

                    alert(
                        "Tanggal harus diisi."
                    );

                    return;
                }


                if (!title) {

                    alert(
                        "Nama / Catatan harus diisi."
                    );

                    return;
                }


                const submitButton =
                    $("eventForm")
                        .querySelector(
                            'button[type="submit"]'
                        );


                if (submitButton) {
                    submitButton.disabled = true;
                }


                try {

                    const record = {

                        date,

                        type,

                        title,

                        note

                    };


                    /* -----------------------------------------
                       EDIT EVENT
                       ----------------------------------------- */

                    if (id) {

                        await supabaseRequest(

                            `/rest/v1/${SUPABASE_CALENDAR_TABLE}` +
                            `?id=eq.${encodeURIComponent(id)}`,

                            {

                                method:
                                    "PATCH",

                                headers: {

                                    Prefer:
                                        "return=minimal"

                                },

                                body:
                                    JSON.stringify(
                                        record
                                    )
                            }
                        );


                    }

                    /* -----------------------------------------
                       TAMBAH EVENT
                       ----------------------------------------- */

                    else {

                        await supabaseRequest(

                            `/rest/v1/${SUPABASE_CALENDAR_TABLE}`,

                            {

                                method:
                                    "POST",

                                headers: {

                                    Prefer:
                                        "return=representation"

                                },

                                body:
                                    JSON.stringify(
                                        record
                                    )
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

                    console.error(
                        "Gagal menyimpan event:",
                        error
                    );


                    alert(
                        "Gagal menyimpan jadwal.\n\n" +
                        error.message
                    );


                } finally {

                    if (submitButton) {
                        submitButton.disabled = false;
                    }
                }

            }
        );
}


/* 
   DELETE EVENT
    */

async function deleteEvent(id) {

    const item =
        events.find(
            event =>
                String(event.id) ===
                String(id)
        );


    if (!item) {
        return;
    }


    const ok =
        confirm(
            `Hapus event "${item.title || getEventTypeName(item.type)}"?`
        );


    if (!ok) {
        return;
    }


    try {

        await supabaseRequest(

            `/rest/v1/${SUPABASE_CALENDAR_TABLE}` +
            `?id=eq.${encodeURIComponent(id)}`,

            {

                method:
                    "DELETE",

                headers: {

                    Prefer:
                        "return=minimal"

                }
            }
        );


        await loadCalendarEvents();


        alert(
            "Jadwal berhasil dihapus."
        );


    } catch (error) {

        console.error(
            "Gagal menghapus event:",
            error
        );


        alert(
            "Gagal menghapus jadwal.\n\n" +
            error.message
        );
    }
}


/* 
   MODAL CLOSE BUTTON
    */

document
    .querySelectorAll(
        "[data-close-modal]"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                function () {

                    const modal =
                        this.closest(
                            ".modal"
                        );


                    if (modal) {

                        modal
                            .classList
                            .add("hidden");
                    }

                }
            );
        }
    );


/* 
   CLOSE MODAL BACKDROP
    */

document
    .querySelectorAll(".modal")
    .forEach(
        modal => {

            modal.addEventListener(
                "click",
                function (event) {

                    if (
                        event.target ===
                        modal
                    ) {

                        modal
                            .classList
                            .add("hidden");
                    }

                }
            );
        }
    );


/* 
   ESC CLOSE MODAL
    */

document.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key !==
            "Escape"
        ) {
            return;
        }


        document
            .querySelectorAll(
                ".modal"
            )
            .forEach(
                modal => {

                    modal
                        .classList
                        .add("hidden");

                }
            );

    }
);


/* 
   FLOATING CALENDAR
    */

if ($("privateCalendarButton")) {

    $("privateCalendarButton")
        .addEventListener(
            "click",
            function () {

                const calendar =
                    $("calendar");


                if (!calendar) {
                    return;
                }


                calendar.scrollIntoView({

                    behavior:
                        "smooth",

                    block:
                        "start"

                });

            }
        );
}


/* 
   START APPLICATION
    */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        checkLogin();

    }
);
