/* =========================================
   NELE
   Główny moduł inteligentnej nauczycielki
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

    recognition: null,
    isListening: false,

    sessionId: null,


    /* =========================================
       START
    ========================================= */

    init() {

        console.log("Nele ist bereit.");

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
            document.getElementById("messages");

        this.inputElement =
            document.getElementById("message-input");

        this.sendButton =
            document.getElementById("send-btn");

        this.micButton =
            document.getElementById("mic-btn");


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

                    if (event.key === "Enter") {

                        event.preventDefault();

                        this.sendMessage();

                    }

                }
            );

        }


        /* =========================
           SZYBKIE PRZYCISKI
        ========================= */

        const quickActions =
            document.querySelectorAll(
                ".quick-action"
            );

        quickActions.forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const text =
                        button.dataset.text;

                    if (!text) return;

                    this.inputElement.value =
                        text;

                    this.inputElement.focus();

                }
            );

        });


        /* =========================
           MIKROFON
        ========================= */

        this.setupMicrophone();

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
            && crypto.randomUUID
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

            this.micButton.disabled = true;

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

        this.recognition.onstart = () => {

            this.isListening = true;

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
                    event.results[0][0]
                        .transcript
                        .trim();


                console.log(
                    "Rozpoznano:",
                    transcript
                );


                if (
                    this.inputElement
                    && transcript
                ) {

                    this.inputElement.value =
                        transcript;

                }

            };


        /* -------------------------
           KONIEC NASŁUCHIWANIA
        ------------------------- */

        this.recognition.onend = () => {

            this.isListening = false;

            this.micButton.textContent =
                "🎤";

            this.micButton.title =
                "Sprechen";


            if (
                this.inputElement
                && this.inputElement.value.trim()
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


                this.isListening = false;

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
                    "speechSynthesis" in window
                ) {

                    window.speechSynthesis.cancel();

                }


                try {

                    this.recognition.start();

                } catch (error) {

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

        if (!this.inputElement) {
            return;
        }


        const text =
            this.inputElement.value.trim();


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

        this.inputElement.value = "";


        /* zablokuj przycisk */

        if (this.sendButton) {

            this.sendButton.disabled = true;

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

                        /*
                          TERAZ wysyłamy:
                          - wiadomość
                          - identyfikator użytkownika
                        */

                        body: JSON.stringify({
                            message: text,
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


        } catch (error) {

            console.error(
                "Nele Backend Fehler:",
                error
            );


            this.addMessage(
                "Nele",
                "Entschuldigung. Ich kann den Server gerade nicht erreichen.",
                "nele"
            );

        } finally {

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
            !("speechSynthesis" in window)
        ) {

            console.warn(
                "SpeechSynthesis nie jest obsługiwany przez tę przeglądarkę."
            );

            return;

        }


        window.speechSynthesis.cancel();


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
            window.speechSynthesis.getVoices();


        const germanVoices =
            voices.filter(
                voice =>
                    voice.lang &&
                    voice.lang
                        .toLowerCase()
                        .startsWith("de")
            );


        const preferredVoice =
            germanVoices.find(
                voice =>
                    voice.name
                        .toLowerCase()
                        .includes("google")
            )
            ||
            germanVoices.find(
                voice =>
                    voice.lang === "de-DE"
            )
            ||
            germanVoices[0];


        if (preferredVoice) {

            utterance.voice =
                preferredVoice;

        }


        window.speechSynthesis.speak(
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


        if (type === "user") {

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
            this.messagesElement.scrollHeight;

    }

};


/* =========================================
   START NELE
========================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => Nele.init()
);
