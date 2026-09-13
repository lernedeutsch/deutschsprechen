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
       AUDIO Z NORMALNEJ ROZMOWY
    ========================================= */

    voiceRecorder: null,
    voiceStream: null,

    voiceChunks: [],
    voiceBlob: null,
    voiceMimeType: null,

    isVoiceRecording: false,

    recognitionProducedText: false,
    recognitionHadError: false,


    /* =========================================
       START
    ========================================= */

    async init() {

        console.log(
            "Nele ist bereit."
        );


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
                ".quick-action[data-text]"
            );


        quickActions.forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const text =
                            button.dataset.text;

                        if (
                            !text
                            ||
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


        let sessionId =
            localStorage.getItem(
                storageKey
            );


        if (sessionId) {

            return sessionId;

        }


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


            this.addMessage(
                "Nele",
                reply,
                "nele"
            );


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


        if (
            this.inputElement
        ) {

            this.inputElement.value =
                "";

        }


        /* =============================
           ZATRZYMANIE SPEECH RECOGNITION
        ============================= */

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


        /* =============================
           ZATRZYMANIE AUDIO
        ============================= */

        this.cancelVoiceCapture();


        /* =============================
           ZATRZYMANIE GŁOSU NELE
        ============================= */

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


            if (
                this.messagesElement
            ) {

                this.messagesElement.innerHTML =
                    "";

            }


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
       CZY MOŻEMY NAGRYWAĆ AUDIO
    ========================================= */

    canRecordVoiceAudio() {

        return Boolean(
            window.MediaRecorder
            &&
            navigator.mediaDevices
            &&
            navigator.mediaDevices.getUserMedia
        );

    },


    /* =========================================
       FORMAT AUDIO
    ========================================= */

    getVoiceMimeType() {

        if (
            !window.MediaRecorder
        ) {

            return "";

        }


        const types = [

            "audio/webm;codecs=opus",

            "audio/webm",

            "audio/mp4",

            "audio/ogg;codecs=opus"

        ];


        for (
            const type
            of types
        ) {

            try {

                if (
                    typeof MediaRecorder
                        .isTypeSupported
                    === "function"
                    &&
                    MediaRecorder
                        .isTypeSupported(
                            type
                        )
                ) {

                    return type;

                }

            } catch (error) {

                console.warn(
                    "Audio MIME check error:",
                    error
                );

            }

        }


        return "";

    },


    /* =========================================
       ROZPOCZĘCIE NAGRYWANIA AUDIO

       To jest prawdziwe audio użytkownika,
       niezależne od tekstu zwracanego
       przez SpeechRecognition.
    ========================================= */

    async startVoiceCapture() {

        this.voiceChunks =
            [];

        this.voiceBlob =
            null;

        this.voiceMimeType =
            null;


        if (
            !this.canRecordVoiceAudio()
        ) {

            console.warn(
                "MediaRecorder nicht verfügbar. "
                + "Nele arbeitet nur mit dem Text."
            );

            return false;

        }


        this.releaseVoiceStream();


        try {

            const stream =
                await navigator
                    .mediaDevices
                    .getUserMedia({

                        audio: {
                            echoCancellation:
                                true,

                            noiseSuppression:
                                true,

                            autoGainControl:
                                true
                        }

                    });


            this.voiceStream =
                stream;


            const mimeType =
                this.getVoiceMimeType();


            let recorder;


            if (
                mimeType
            ) {

                recorder =
                    new MediaRecorder(
                        stream,
                        {
                            mimeType:
                                mimeType
                        }
                    );

            } else {

                recorder =
                    new MediaRecorder(
                        stream
                    );

            }


            this.voiceRecorder =
                recorder;


            this.voiceMimeType =
                recorder.mimeType
                ||
                mimeType
                ||
                "";


            recorder.ondataavailable =
                (event) => {

                    if (
                        event.data
                        &&
                        event.data.size > 0
                    ) {

                        this.voiceChunks.push(
                            event.data
                        );

                    }

                };


            recorder.onerror =
                (event) => {

                    console.error(
                        "Voice MediaRecorder error:",
                        event.error
                        ||
                        event
                    );

                };


            recorder.start();


            this.isVoiceRecording =
                true;


            console.log(
                "Nele audio recording started:",
                this.voiceMimeType
            );


            return true;


        } catch (error) {

            console.warn(
                "Prawdziwe nagranie audio "
                + "nie mogło zostać uruchomione. "
                + "SpeechRecognition nadal działa.",
                error
            );


            this.voiceRecorder =
                null;

            this.isVoiceRecording =
                false;


            this.releaseVoiceStream();


            return false;

        }

    },


    /* =========================================
       ZATRZYMANIE NAGRYWANIA AUDIO
    ========================================= */

    async stopVoiceCapture() {

        const recorder =
            this.voiceRecorder;


        if (
            !recorder
        ) {

            this.isVoiceRecording =
                false;

            this.releaseVoiceStream();

            return null;

        }


        if (
            recorder.state ===
            "inactive"
        ) {

            this.voiceRecorder =
                null;

            this.isVoiceRecording =
                false;

            this.releaseVoiceStream();

            return this.voiceBlob;

        }


        return new Promise(
            resolve => {

                recorder.addEventListener(
                    "stop",
                    () => {

                        const mimeType =
                            recorder.mimeType
                            ||
                            this.voiceMimeType
                            ||
                            "audio/webm";


                        if (
                            this.voiceChunks.length
                            > 0
                        ) {

                            this.voiceBlob =
                                new Blob(
                                    this.voiceChunks,
                                    {
                                        type:
                                            mimeType
                                    }
                                );


                            console.log(
                                "Nele audio recording ready:",
                                {
                                    size:
                                        this.voiceBlob.size,

                                    type:
                                        this.voiceBlob.type
                                }
                            );

                        } else {

                            this.voiceBlob =
                                null;


                            console.warn(
                                "Audio recording contains "
                                + "no data."
                            );

                        }


                        this.voiceChunks =
                            [];

                        this.voiceRecorder =
                            null;

                        this.isVoiceRecording =
                            false;


                        this.releaseVoiceStream();


                        resolve(
                            this.voiceBlob
                        );

                    },
                    {
                        once: true
                    }
                );


                try {

                    recorder.stop();

                } catch (error) {

                    console.error(
                        "Voice recorder stop error:",
                        error
                    );


                    this.voiceRecorder =
                        null;

                    this.isVoiceRecording =
                        false;


                    this.releaseVoiceStream();


                    resolve(
                        null
                    );

                }

            }
        );

    },


    /* =========================================
       ANULOWANIE NAGRYWANIA
    ========================================= */

    cancelVoiceCapture() {

        if (
            this.voiceRecorder
            &&
            this.voiceRecorder.state
            !== "inactive"
        ) {

            try {

                this.voiceRecorder.stop();

            } catch (error) {

                console.warn(
                    "Voice recorder cancel error:",
                    error
                );

            }

        }


        this.voiceRecorder =
            null;

        this.isVoiceRecording =
            false;

        this.voiceChunks =
            [];

        this.voiceBlob =
            null;

        this.voiceMimeType =
            null;


        this.releaseVoiceStream();

    },


    /* =========================================
       ZWOLNIENIE MIKROFONU MEDIARECORDERA
    ========================================= */

    releaseVoiceStream() {

        if (
            !this.voiceStream
        ) {

            return;

        }


        try {

            this.voiceStream
                .getTracks()
                .forEach(
                    track => {

                        track.stop();

                    }
                );

        } catch (error) {

            console.warn(
                "Voice stream release error:",
                error
            );

        }


        this.voiceStream =
            null;

    },


    /* =========================================
       ROZSZERZENIE PLIKU AUDIO
    ========================================= */

    getVoiceFileExtension(
        blob
    ) {

        const type =
            String(
                blob?.type
                ||
                ""
            ).toLowerCase();


        if (
            type.includes(
                "mp4"
            )
        ) {

            return "m4a";

        }


        if (
            type.includes(
                "ogg"
            )
        ) {

            return "ogg";

        }


        if (
            type.includes(
                "wav"
            )
        ) {

            return "wav";

        }


        return "webm";

    },


    /* =========================================
       KONFIGURACJA MIKROFONU
    ========================================= */

    setupMicrophone() {

        if (!this.micButton) {
            return;
        }


        const SpeechRecognition =
            window.SpeechRecognition
            ||
            window.webkitSpeechRecognition;


        if (!SpeechRecognition) {

            console.warn(
                "Rozpoznawanie mowy nie jest "
                + "obsługiwane przez tę przeglądarkę."
            );

            this.micButton.disabled =
                true;

            this.micButton.title =
                (
                    "Spracherkennung wird von "
                    + "diesem Browser nicht unterstützt."
                );

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

                this.recognitionProducedText =
                    false;

                this.recognitionHadError =
                    false;


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


                    this.recognitionProducedText =
                        true;

                }

            };


        /* -------------------------
           KONIEC NASŁUCHIWANIA
        ------------------------- */

        this.recognition.onend =
            async () => {

                this.isListening =
                    false;


                if (
                    this.micButton
                ) {

                    this.micButton.textContent =
                        "🎤";

                    this.micButton.title =
                        "Sprechen";

                }


                /*
                  Jeżeli trwa reset,
                  nie wysyłamy wiadomości.
                */

                if (
                    this.isResetting
                ) {

                    this.cancelVoiceCapture();

                    return;

                }


                /*
                  Kończymy prawdziwe
                  nagranie tej samej wypowiedzi.
                */

                let audioBlob =
                    null;


                try {

                    audioBlob =
                        await this.stopVoiceCapture();

                } catch (error) {

                    console.warn(
                        "Audio stop failed. "
                        + "Text will still be sent.",
                        error
                    );

                }


                /*
                  Automatycznie wysyłamy tylko
                  wtedy, gdy SpeechRecognition
                  rzeczywiście zwróciło tekst.
                */

                if (
                    this.recognitionProducedText
                    &&
                    !this.recognitionHadError
                    &&
                    this.inputElement
                    &&
                    this.inputElement
                        .value
                        .trim()
                ) {

                    await this.sendMessage(
                        audioBlob
                    );

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


                this.recognitionHadError =
                    true;

                this.isListening =
                    false;


                if (
                    this.micButton
                ) {

                    this.micButton.textContent =
                        "🎤";

                }


                if (
                    event.error ===
                    "not-allowed"
                ) {

                    this.addMessage(
                        "Nele",
                        (
                            "Bitte erlaube den Zugriff "
                            + "auf das Mikrofon."
                        ),
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

                else if (
                    event.error !==
                    "aborted"
                ) {

                    this.addMessage(
                        "Nele",
                        (
                            "Ich konnte dich leider "
                            + "nicht verstehen. "
                            + "Versuch es bitte noch einmal."
                        ),
                        "nele"
                    );

                }

            };


        /* -------------------------
           KLIKNIĘCIE MIKROFONU
        ------------------------- */

        this.micButton.addEventListener(
            "click",
            async () => {

                if (!this.recognition) {
                    return;
                }


                /*
                  Drugie kliknięcie kończy
                  aktualną wypowiedź.
                */

                if (
                    this.isListening
                ) {

                    try {

                        this.recognition.stop();

                    } catch (error) {

                        console.warn(
                            "Recognition stop error:",
                            error
                        );

                    }


                    return;

                }


                /*
                  Nie nagrywamy głosu Nele.
                */

                if (
                    "speechSynthesis"
                    in window
                ) {

                    window
                        .speechSynthesis
                        .cancel();

                }


                /*
                  Czyścimy poprzednie audio.
                */

                this.voiceBlob =
                    null;

                this.voiceChunks =
                    [];


                /*
                  Najpierw próbujemy uruchomić
                  prawdziwe nagrywanie audio.

                  Jeżeli się nie uda,
                  stary SpeechRecognition
                  i tak będzie działał.
                */

                try {

                    await this.startVoiceCapture();

                } catch (error) {

                    console.warn(
                        "Audio capture unavailable:",
                        error
                    );

                }


                /*
                  Następnie uruchamiamy
                  zwykłe rozpoznawanie mowy.
                */

                try {

                    this.recognition.start();

                }

                catch (error) {

                    console.error(
                        "Nie można uruchomić mikrofonu:",
                        error
                    );


                    this.cancelVoiceCapture();

                }

            }
        );

    },


    /* =========================================
       WYSYŁANIE WIADOMOŚCI
    ========================================= */

    async sendMessage(
        audioBlob = null
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


        this.addMessage(
            "Du",
            text,
            "user"
        );


        this.inputElement.value =
            "";


        if (
            this.sendButton
        ) {

            this.sendButton.disabled =
                true;

            this.sendButton.textContent =
                "...";

        }


        try {

            let response;


            /* =================================
               GŁOS:
               TEKST + AUDIO
            ================================= */

            if (
                audioBlob
                &&
                audioBlob.size > 0
            ) {

                const formData =
                    new FormData();


                formData.append(
                    "message",
                    text
                );


                formData.append(
                    "session_id",
                    this.sessionId
                );


                const extension =
                    this.getVoiceFileExtension(
                        audioBlob
                    );


                formData.append(
                    "audio",
                    audioBlob,
                    (
                        "nele-voice-"
                        + Date.now()
                        + "."
                        + extension
                    )
                );


                console.log(
                    "Sending text + audio:",
                    {
                        text:
                            text,

                        size:
                            audioBlob.size,

                        type:
                            audioBlob.type
                    }
                );


                /*
                  WAŻNE:

                  Nie ustawiamy tutaj ręcznie
                  Content-Type.

                  Przeglądarka sama doda:
                  multipart/form-data
                  wraz z poprawnym boundary.
                */

                response =
                    await fetch(
                        `${this.backendUrl}/chat`,
                        {
                            method:
                                "POST",

                            body:
                                formData
                        }
                    );

            }


            /* =================================
               TEKST:
               STARY SPOSÓB
            ================================= */

            else {

                response =
                    await fetch(
                        `${this.backendUrl}/chat`,
                        {
                            method:
                                "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify({

                                    message:
                                        text,

                                    session_id:
                                        this.sessionId

                                })
                        }
                    );

            }


            if (
                !response.ok
            ) {

                throw new Error(
                    `Backend error: ${response.status}`
                );

            }


            const data =
                await response.json();


            /*
              Backend może już powiedzieć,
              czy dostał nagranie.
            */

            if (
                audioBlob
            ) {

                console.log(
                    "Backend audio_received:",
                    data.audio_received
                );

            }


            const reply =
                data.reply
                ||
                (
                    "Ich weiß gerade nicht, "
                    + "was ich antworten soll."
                );


            this.addMessage(
                "Nele",
                reply,
                "nele"
            );


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
                (
                    "Entschuldigung. "
                    + "Ich kann den Server "
                    + "gerade nicht erreichen."
                ),
                "nele"
            );

        }

        finally {

            /*
              Audio tej wypowiedzi
              nie jest już potrzebne
              po wysłaniu.
            */

            this.voiceBlob =
                null;


            if (
                this.sendButton
            ) {

                this.sendButton.disabled =
                    false;

                this.sendButton.textContent =
                    "Senden";

            }


            if (
                this.inputElement
            ) {

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
                "SpeechSynthesis nie jest "
                + "obsługiwany przez tę przeglądarkę."
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


        if (
            preferredVoice
        ) {

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

        if (
            !this.messagesElement
        ) {
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
