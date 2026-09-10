/* =========================================
   NELE
   Główny moduł inteligentnej trenerki
========================================= */

const Nele = {

    name: "Nele",
    language: "de-DE",

    backendUrl:
        "https://nele-backend.onrender.com",

    messagesElement: null,
    inputElement: null,
    sendButton: null,
    micButton: null,
    resetButton: null,

    recognition: null,
    isListening: false,
    isResetting: false,

    sessionId: null,


    /* =========================================
       START
    ========================================= */

    async init() {

        console.log(
            "Nele ist bereit."
        );


        /*
          Pobieramy lub tworzymy
          identyfikator użytkownika.
        */

        this.sessionId =
            this.getSessionId();


        console.log(
            "Nele session:",
            this.sessionId
        );


        this.messagesElement =
            document.getElementById(
                "messages"
            );

        this.inputElement =
            document.getElementById(
                "message-input"
            );

        this.sendButton =
            document.getElementById(
                "send-btn"
            );

        this.micButton =
            document.getElementById(
                "mic-btn"
            );

        this.resetButton =
            document.getElementById(
                "reset-btn"
            );


        /* =========================
           SENDEN
        ========================= */

        if (this.sendButton) {

            this.sendButton.addEventListener(
                "click",
                () => this.sendMessage()
            );

        }


        /* =========================
           ENTER
        ========================= */

        if (this.inputElement) {

            this.inputElement.addEventListener(
                "keydown",
                (event) => {

                    if (
                        event.key ===
                        "Enter"
                    ) {

                        event.preventDefault();

                        this.sendMessage();

                    }

                }
            );

        }


        /* =========================
           NEU ANFANGEN
        ========================= */

        if (this.resetButton) {

            this.resetButton.addEventListener(
                "click",
                () => this.showResetConfirmation()
            );

        }


        /* =========================
           SZYBKIE PRZYCISKI
        ========================= */

        const quickActions =
            document.querySelectorAll(
                ".quick-action"
            );


        quickActions.forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const text =
                            button.dataset.text;

                        if (!text) {
                            return;
                        }

                        if (
                            !this.inputElement
                        ) {
                            return;
                        }

                        this.inputElement.value =
                            text;

                        this.inputElement.focus();

                    }
                );

            }
        );


        /* =========================
           MIKROFON
        ========================= */

        this.setupMicrophone();


        /* =========================
           AUTOMATYCZNE POWITANIE
        ========================= */

        await this.loadWelcome();

    },


    /* =========================================
       IDENTYFIKATOR UŻYTKOWNIKA
    ========================================= */

    getSessionId() {

        const storageKey =
            "nele_session_id";


        /*
          Sprawdzamy, czy użytkownik
          ma już swój identyfikator.
        */

        let sessionId =
            localStorage.getItem(
                storageKey
            );


        if (sessionId) {

            return sessionId;

        }


        /*
          Jeżeli nie ma identyfikatora,
          tworzymy nowy.
        */

        if (
            window.crypto
            &&
            crypto.randomUUID
        ) {

            sessionId =
                crypto.randomUUID();

        } else {

            sessionId =
                "nele-"
                + Date.now()
                + "-"
                + Math.random()
                    .toString(36)
                    .substring(2, 12);

        }


        /*
          Zapisujemy ID w przeglądarce.
        */

        localStorage.setItem(
            storageKey,
            sessionId
        );


        return sessionId;

    },


    /* =========================================
       AUTOMATYCZNE POWITANIE
    ========================================= */

    async loadWelcome() {

        if (!this.sessionId) {
            return;
        }


        try {

            const response =
                await fetch(
                    `${this.backendUrl}/welcome`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            session_id:
                                this.sessionId
                        })
                    }
                );


            if (!response.ok) {

                throw new Error(
                    `Welcome backend error: ${response.status}`
                );

            }


            const data =
                await response.json();


            const reply =
                data.reply;


            if (!reply) {
                return;
            }


            /*
              Nele jako pierwsza
              pokazuje wiadomość.
            */

            this.addMessage(
                "Nele",
                reply,
                "nele"
            );


            /*
              Nele wypowiada powitanie.
            */

            this.speak(
                reply
            );


        } catch (error) {

            console.error(
                "Nele Welcome Fehler:",
                error
            );

        }

    },


    /* =========================================
       OKNO POTWIERDZENIA RESETU
    ========================================= */

    showResetConfirmation() {

        if (
            this.isResetting
        ) {
            return;
        }


        if (
            document.getElementById(
                "nele-reset-overlay"
            )
        ) {
            return;
        }


        const overlay =
            document.createElement(
                "div"
            );


        overlay.id =
            "nele-reset-overlay";


        Object.assign(
            overlay.style,
            {
                position: "fixed",
                inset: "0",
                zIndex: "99999",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "20px",
                background:
                    "rgba(0, 0, 0, 0.70)"
            }
        );


        const dialog =
            document.createElement(
                "div"
            );


        Object.assign(
            dialog.style,
            {
                width: "100%",
                maxWidth: "430px",
                padding: "24px",
                borderRadius: "22px",
                border:
                    "1px solid rgba(255,255,255,.15)",
                background:
                    "#102d4d",
                color:
                    "#f5f8fc",
                boxShadow:
                    "0 20px 60px rgba(0,0,0,.45)",
                fontFamily:
                    "Arial, sans-serif"
            }
        );


        const title =
            document.createElement(
                "h2"
            );


        title.textContent =
            "Wirklich neu anfangen?";


        Object.assign(
            title.style,
            {
                margin:
                    "0 0 12px",
                fontSize:
                    "1.35rem"
            }
        );


        const text =
            document.createElement(
                "p"
            );


        text.textContent =
            (
                "Alle deine gespeicherten "
                + "Lerndaten und Fortschritte "
                + "bei Nele werden gelöscht. "
                + "Das kann nicht rückgängig "
                + "gemacht werden."
            );


        Object.assign(
            text.style,
            {
                margin:
                    "0 0 22px",
                lineHeight:
                    "1.55",
                color:
                    "#c7d5e4"
            }
        );


        const buttons =
            document.createElement(
                "div"
            );


        Object.assign(
            buttons.style,
            {
                display:
                    "flex",
                justifyContent:
                    "flex-end",
                gap:
                    "10px",
                flexWrap:
                    "wrap"
            }
        );


        const cancelButton =
            document.createElement(
                "button"
            );


        cancelButton.type =
            "button";

        cancelButton.textContent =
            "Abbrechen";


        Object.assign(
            cancelButton.style,
            {
                padding:
                    "11px 16px",
                borderRadius:
                    "13px",
                border:
                    "1px solid rgba(255,255,255,.18)",
                background:
                    "rgba(255,255,255,.08)",
                color:
                    "#ffffff",
                fontWeight:
                    "700",
                cursor:
                    "pointer"
            }
        );


        const deleteButton =
            document.createElement(
                "button"
            );


        deleteButton.type =
            "button";

        deleteButton.textContent =
            "Alles löschen";


        Object.assign(
            deleteButton.style,
            {
                padding:
                    "11px 16px",
                borderRadius:
                    "13px",
                border:
                    "none",
                background:
                    "#f4c95d",
                color:
                    "#172235",
                fontWeight:
                    "800",
                cursor:
                    "pointer"
            }
        );


        cancelButton.addEventListener(
            "click",
            () => {

                overlay.remove();

            }
        );


        overlay.addEventListener(
            "click",
            (event) => {

                if (
                    event.target ===
                    overlay
                ) {

                    overlay.remove();

                }

            }
        );


        deleteButton.addEventListener(
            "click",
            async () => {

                cancelButton.disabled =
                    true;

                deleteButton.disabled =
                    true;

                deleteButton.textContent =
                    "Wird gelöscht...";


                const success =
                    await this.resetLearningData();


                if (success) {

                    overlay.remove();

                    return;

                }


                cancelButton.disabled =
                    false;

                deleteButton.disabled =
                    false;

                deleteButton.textContent =
                    "Alles löschen";

            }
        );


        buttons.appendChild(
            cancelButton
        );

        buttons.appendChild(
            deleteButton
        );


        dialog.appendChild(
            title
        );

        dialog.appendChild(
            text
        );

        dialog.appendChild(
            buttons
        );


        overlay.appendChild(
            dialog
        );


        document.body.appendChild(
            overlay
        );


        cancelButton.focus();

    },


    /* =========================================
       CAŁKOWITY RESET NAUKI
    ========================================= */

    async resetLearningData() {

        if (
            this.isResetting
        ) {
            return false;
        }


        if (
            !this.sessionId
        ) {
            return false;
        }


        this.isResetting =
            true;


        /*
          Czyścimy pole przed zatrzymaniem
          mikrofonu, aby jego onend
          nie wysłał starej wiadomości.
        */

        if (
            this.inputElement
        ) {

            this.inputElement.value =
                "";

        }


        /*
          Zatrzymujemy mikrofon.
        */

        if (
            this.isListening
            &&
            this.recognition
        ) {

            try {

                this.recognition.stop();

            } catch (error) {

                console.error(
                    "Mikrofon stop error:",
                    error
                );

            }

        }


        /*
          Zatrzymujemy głos Nele.
        */

        if (
            "speechSynthesis"
            in window
        ) {

            window
                .speechSynthesis
                .cancel();

        }


        if (
            this.resetButton
        ) {

            this.resetButton.disabled =
                true;

        }


        if (
            this.sendButton
        ) {

            this.sendButton.disabled =
                true;

        }


        if (
            this.micButton
        ) {

            this.micButton.disabled =
                true;

        }


        try {

            const response =
                await fetch(
                    `${this.backendUrl}/reset`,
                    {
                        method:
                            "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify({
                                session_id:
                                    this.sessionId
                            })
                    }
                );


            const data =
                await response.json();


            if (
                !response.ok
                ||
                !data.ok
            ) {

                throw new Error(
                    data.error
                    ||
                    `Reset backend error: ${response.status}`
                );

            }


            const reply =
                data.reply;


            if (
                !reply
            ) {

                throw new Error(
                    "Reset reply missing."
                );

            }


            /*
              Dopiero gdy backend potwierdzi
              poprawne usunięcie pamięci,
              czyścimy widoczny czat.
            */

            if (
                this.messagesElement
            ) {

                this.messagesElement.innerHTML =
                    "";

            }


            /*
              Pokazujemy Nele jak podczas
              pierwszego spotkania.
            */

            this.addMessage(
                "Nele",
                reply,
                "nele"
            );


            this.speak(
                reply
            );


            return true;


        } catch (error) {

            console.error(
                "Nele Reset Fehler:",
                error
            );


            this.addMessage(
                "Nele",
                (
                    "Entschuldigung. "
                    + "Deine Lerndaten konnten "
                    + "nicht gelöscht werden. "
                    + "Versuch es bitte noch einmal."
                ),
                "nele"
            );


            return false;

        } finally {

            this.isResetting =
                false;


            if (
                this.resetButton
            ) {

                this.resetButton.disabled =
                    false;

            }


            if (
                this.sendButton
            ) {

                this.sendButton.disabled =
                    false;

            }


            if (
                this.micButton
                &&
                this.recognition
            ) {

                this.micButton.disabled =
                    false;

            }


            if (
                this.inputElement
            ) {

                this.inputElement.focus();

            }

        }

    },


    /* =========================================
       KONFIGURACJA MIKROFONU
    ========================================= */

    setupMicrophone() {

        if (!this.micButton) {
            return;
        }


        const SpeechRecognition =
            window.SpeechRecognition ||
            window.webkitSpeechRecognition;


        if (!SpeechRecognition) {

            console.warn(
                "Rozpoznawanie mowy nie jest obsługiwane przez tę przeglądarkę."
            );

            this.micButton.disabled =
                true;

            this.micButton.title =
                "Spracherkennung wird von diesem Browser nicht unterstützt.";

            return;
        }


        this.recognition =
            new SpeechRecognition();


        this.recognition.lang =
            this.language;

        this.recognition.continuous =
            false;

        this.recognition.interimResults =
            false;

        this.recognition.maxAlternatives =
            1;


        /* -------------------------
           START NASŁUCHIWANIA
        ------------------------- */

        this.recognition.onstart =
            () => {

                this.isListening =
                    true;

                console.log(
                    "Nele hört zu..."
                );

                this.micButton.textContent =
                    "🔴";

                this.micButton.title =
                    "Ich höre zu...";

            };


        /* -------------------------
           ROZPOZNANY TEKST
        ------------------------- */

        this.recognition.onresult =
            (event) => {

                const transcript =
                    event
                        .results[0][0]
                        .transcript
                        .trim();


                console.log(
                    "Rozpoznano:",
                    transcript
                );


                if (
                    this.inputElement
                    &&
                    transcript
                ) {

                    this.inputElement.value =
                        transcript;

                }

            };


        /* -------------------------
           KONIEC NASŁUCHIWANIA
        ------------------------- */

        this.recognition.onend =
            () => {

                this.isListening =
                    false;

                this.micButton.textContent =
                    "🎤";

                this.micButton.title =
                    "Sprechen";


                if (
                    this.inputElement
                    &&
                    this.inputElement
                        .value
                        .trim()
                ) {

                    this.sendMessage();

                }

            };


        /* -------------------------
           BŁĘDY MIKROFONU
        ------------------------- */

        this.recognition.onerror =
            (event) => {

                console.error(
                    "Mikrofon Fehler:",
                    event.error
                );


                this.isListening =
                    false;

                this.micButton.textContent =
                    "🎤";


                if (
                    event.error ===
                    "not-allowed"
                ) {

                    this.addMessage(
                        "Nele",
                        "Bitte erlaube den Zugriff auf das Mikrofon.",
                        "nele"
                    );

                }

                else if (
                    event.error ===
                    "no-speech"
                ) {

                    console.log(
                        "Keine Sprache erkannt."
                    );

                }

                else {

                    this.addMessage(
                        "Nele",
                        "Ich konnte dich leider nicht verstehen. Versuch es bitte noch einmal.",
                        "nele"
                    );

                }

            };


        /* -------------------------
           KLIKNIĘCIE MIKROFONU
        ------------------------- */

        this.micButton.addEventListener(
            "click",
            () => {

                if (!this.recognition) {
                    return;
                }


                if (this.isListening) {

                    this.recognition.stop();

                    return;

                }


                /*
                  Zatrzymujemy głos Nele,
                  żeby mikrofon nie słuchał
                  odpowiedzi Nele.
                */

                if (
                    "speechSynthesis"
                    in window
                ) {

                    window
                        .speechSynthesis
                        .cancel();

                }


                try {

                    this.recognition.start();

                }

                catch (error) {

                    console.error(
                        "Nie można uruchomić mikrofonu:",
                        error
                    );

                }

            }
        );

    },


    /* =========================================
       WYSYŁANIE WIADOMOŚCI
    ========================================= */

    async sendMessage() {

        if (
            this.isResetting
        ) {
            return;
        }


        if (!this.inputElement) {
            return;
        }


        const text =
            this.inputElement
                .value
                .trim();


        if (!text) {
            return;
        }


        /* pokaż wiadomość użytkownika */

        this.addMessage(
            "Du",
            text,
            "user"
        );


        /* wyczyść pole */

        this.inputElement.value =
            "";


        /* zablokuj przycisk */

        if (this.sendButton) {

            this.sendButton.disabled =
                true;

            this.sendButton.textContent =
                "...";

        }


        try {

            const response =
                await fetch(
                    `${this.backendUrl}/chat`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            message:
                                text,

                            session_id:
                                this.sessionId
                        })
                    }
                );


            if (!response.ok) {

                throw new Error(
                    `Backend error: ${response.status}`
                );

            }


            const data =
                await response.json();


            const reply =
                data.reply ||
                "Ich weiß gerade nicht, was ich antworten soll.";


            /* pokaż odpowiedź */

            this.addMessage(
                "Nele",
                reply,
                "nele"
            );


            /* przeczytaj odpowiedź */

            this.speak(
                reply
            );


        }

        catch (error) {

            console.error(
                "Nele Backend Fehler:",
                error
            );


            this.addMessage(
                "Nele",
                "Entschuldigung. Ich kann den Server gerade nicht erreichen.",
                "nele"
            );

        }

        finally {

            if (this.sendButton) {

                this.sendButton.disabled =
                    false;

                this.sendButton.textContent =
                    "Senden";

            }


            if (this.inputElement) {

                this.inputElement.focus();

            }

        }

    },


    /* =========================================
       GŁOS NELE
    ========================================= */

    speak(text) {

        if (
            !(
                "speechSynthesis"
                in window
            )
        ) {

            console.warn(
                "SpeechSynthesis nie jest obsługiwany przez tę przeglądarkę."
            );

            return;
        }


        window
            .speechSynthesis
            .cancel();


        const utterance =
            new SpeechSynthesisUtterance(
                text
            );


        utterance.lang =
            this.language;

        utterance.rate =
            0.95;

        utterance.pitch =
            1.0;

        utterance.volume =
            1.0;


        const voices =
            window
                .speechSynthesis
                .getVoices();


        const germanVoices =
            voices.filter(
                voice =>
                    voice.lang
                    &&
                    voice.lang
                        .toLowerCase()
                        .startsWith(
                            "de"
                        )
            );


        const preferredVoice =
            germanVoices.find(
                voice =>
                    voice.name
                        .toLowerCase()
                        .includes(
                            "google"
                        )
            )
            ||
            germanVoices.find(
                voice =>
                    voice.lang ===
                    "de-DE"
            )
            ||
            germanVoices[0];


        if (preferredVoice) {

            utterance.voice =
                preferredVoice;

        }


        window
            .speechSynthesis
            .speak(
                utterance
            );

    },


    /* =========================================
       DODAWANIE WIADOMOŚCI DO CZATU
    ========================================= */

    addMessage(
        speaker,
        text,
        type
    ) {

        if (!this.messagesElement) {
            return;
        }


        const message =
            document.createElement(
                "div"
            );


        message.classList.add(
            "message"
        );


        if (
            type ===
            "user"
        ) {

            message.classList.add(
                "message-user"
            );

        } else {

            message.classList.add(
                "message-nele"
            );

        }


        const speakerElement =
            document.createElement(
                "span"
            );


        speakerElement.className =
            "speaker";


        speakerElement.textContent =
            speaker;


        const textNode =
            document.createTextNode(
                text
            );


        message.appendChild(
            speakerElement
        );


        message.appendChild(
            textNode
        );


        this.messagesElement.appendChild(
            message
        );


        this.messagesElement.scrollTop =
            this.messagesElement
                .scrollHeight;

    }

};


/* =========================================
   START NELE
========================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => Nele.init()
);
