/* =========================================
   NELE
   Główny moduł inteligentnej trenerki
========================================= */

const Nele = {

    name: "Nele",
    language: "de-DE",

    backendUrl:
        (
            window.NELE_BACKEND_URL
            ||
            "https://nele-backend-3.onrender.com"
        ),

    messagesElement: null,
    inputElement: null,
    sendButton: null,
    micButton: null,
    resetButton: null,
    newUserButton: null,

    recognition: null,
    isListening: false,
    isResetting: false,
    voiceTranscriptReady: false,

    sessionId: null,
    conversationSessionId: null,


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

        this.newUserButton =
            document.getElementById(
                "new-user-btn"
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
                () => this.startNewConversation()
            );

        }


        /* =========================
           NOWY UŻYTKOWNIK
        ========================= */

        if (this.newUserButton) {

            this.newUserButton.addEventListener(
                "click",
                () => this.startAsNewUser()
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

    async loadWelcome(
        newConversation = false
    ) {

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
                            student_id:
                                this.sessionId,

                            new_conversation:
                                Boolean(
                                    newConversation
                                )
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


            this.conversationSessionId =
                data.session_id || null;


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
       NOWA ROZMOWA — TEN SAM UCZEŃ
    ========================================= */

    async startNewConversation() {

        if (this.isResetting) {
            return;
        }

        this.isResetting = true;

        this.conversationSessionId = null;

        /*
          WAŻNE:
          nie zmieniamy nele_session_id
          i nie wywołujemy /reset.
          Cała pamięć ucznia zostaje.
        */

        if (this.inputElement) {
            this.inputElement.value = "";
        }

        if (
            this.isListening
            &&
            this.recognition
        ) {
            try {
                this.recognition.stop();
            } catch (error) {
                console.warn(
                    "Mikrofon stop error:",
                    error
                );
            }
        }

        if (
            "speechSynthesis"
            in window
        ) {
            window
                .speechSynthesis
                .cancel();
        }

        if (this.messagesElement) {
            this.messagesElement.innerHTML = "";
        }

        window.dispatchEvent(
            new CustomEvent("nele:new-conversation")
        );

        try {

            await this.loadWelcome(
                true
            );

        } finally {

            this.isResetting = false;

            if (this.inputElement) {
                this.inputElement.focus();
            }

        }

    },


    /* =========================================
       NOWY UŻYTKOWNIK NA TYM URZĄDZENIU
    ========================================= */

    async startAsNewUser() {

        if (this.isResetting) {
            return;
        }

        const confirmed =
            window.confirm(
                "Als neuer Benutzer starten?\n\n"
                + "Eine neue Person beginnt auf diesem Gerät "
                + "mit Nele von vorne. "
                + "Die Lerndaten des bisherigen Benutzers "
                + "werden nicht gelöscht."
            );

        if (!confirmed) {
            return;
        }

        this.isResetting = true;

        if (this.inputElement) {
            this.inputElement.value = "";
        }

        if (
            this.isListening
            &&
            this.recognition
        ) {
            try {
                this.recognition.stop();
            } catch (error) {
                console.warn(
                    "Mikrofon stop error:",
                    error
                );
            }
        }

        if (
            "speechSynthesis"
            in window
        ) {
            window
                .speechSynthesis
                .cancel();
        }

        /*
          Usuwamy tylko lokalny identyfikator
          z tego urządzenia.

          Stary rekord ucznia w PostgreSQL
          NIE jest kasowany.
        */

        localStorage.removeItem(
            "nele_session_id"
        );

        this.sessionId =
            this.getSessionId();

        this.conversationSessionId = null;

        if (this.messagesElement) {
            this.messagesElement.innerHTML = "";
        }

        window.dispatchEvent(
            new CustomEvent("nele:new-conversation")
        );

        try {

            await this.loadWelcome();

        } finally {

            this.isResetting = false;

            if (this.inputElement) {
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

                this.voiceTranscriptReady =
                    false;

                console.log(
                    "Nele hört zu..."
                );

                this.micButton.classList.remove(
                    "mic-ready"
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

                    this.voiceTranscriptReady =
                        true;

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
                    this.voiceTranscriptReady
                    &&
                    this.inputElement
                    &&
                    this.inputElement
                        .value
                        .trim()
                ) {

                    this.voiceTranscriptReady =
                        false;

                    this.sendMessage(
                        "voice"
                    );

                } else {

                    this.voiceTranscriptReady =
                        false;

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

                this.micButton.classList.remove(
                    "mic-ready"
                );


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

    async sendMessage(
        inputMode = "keyboard"
    ) {

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

                            student_id:
                                this.sessionId,

                            session_id:
                                this.conversationSessionId,

                            input_mode:
                                inputMode
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


            this.conversationSessionId =
                data.session_id ||
                this.conversationSessionId;


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


        if (this.micButton) {
            this.micButton.classList.remove(
                "mic-ready"
            );
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


        utterance.onstart =
            () => {

                const avatar =
                    document.getElementById(
                        "nele-avatar"
                    );

                if (avatar) {
                    avatar.classList.add(
                        "speaking"
                    );
                }

            };


        utterance.onend =
            () => {

                const avatar =
                    document.getElementById(
                        "nele-avatar"
                    );

                if (avatar) {
                    avatar.classList.remove(
                        "speaking"
                    );
                }

                if (this.micButton) {

                    this.micButton.classList.add(
                        "mic-ready"
                    );

                    this.micButton.title =
                        "Jetzt sprechen – Mikrofon anklicken";

                }

            };


        utterance.onerror =
            () => {

                const avatar =
                    document.getElementById(
                        "nele-avatar"
                    );

                if (avatar) {
                    avatar.classList.remove(
                        "speaking"
                    );
                }

                if (
                    this.micButton
                    &&
                    !this.isListening
                ) {

                    this.micButton.classList.add(
                        "mic-ready"
                    );

                }

            };


        window.setTimeout(
            () => {

                const warmup =
                    new SpeechSynthesisUtterance(
                        "\u00A0"
                    );

                warmup.lang =
                    this.language;

                warmup.rate =
                    1.0;

                warmup.pitch =
                    1.0;

                warmup.volume =
                    0;

                if (preferredVoice) {
                    warmup.voice =
                        preferredVoice;
                }

                const startUtterance =
                    () => {

                        window.setTimeout(
                            () => {

                                window
                                    .speechSynthesis
                                    .speak(
                                        utterance
                                    );

                            },
                            120
                        );

                    };

                warmup.onend =
                    startUtterance;

                warmup.onerror =
                    startUtterance;

                window
                    .speechSynthesis
                    .speak(
                        warmup
                    );

            },
            420
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
