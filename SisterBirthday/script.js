function createStars() {
    const starsContainer = document.getElementById("starsContainer");
    if (!starsContainer) {
        return;
    }

    starsContainer.innerHTML = "";

    for (let i = 0; i < 70; i += 1) {
        const star = document.createElement("div");
        const size = Math.random() * 2.8 + 1;

        star.className = "star";
        star.style.left = `${Math.random() * 100}%`;
        star.style.top = `${Math.random() * 100}%`;
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;
        star.style.opacity = `${Math.random() * 0.6 + 0.15}`;
        star.style.animationDelay = `${Math.random() * 4}s`;
        star.style.animationDuration = `${Math.random() * 3 + 3}s`;

        starsContainer.appendChild(star);
    }
}

class Confetti {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.particles = [];
        this.animationFrame = null;
        this.colors = ["#ef7ea4", "#ffd6e4", "#ffe39f", "#f8bfd1", "#d85e84", "#fff1c6"];

        this.resize();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    createConfetti(count = 100) {
        for (let i = 0; i < count; i += 1) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height - this.canvas.height,
                size: Math.random() * 5 + 2,
                speedX: Math.random() * 4 - 2,
                speedY: Math.random() * 4 + 2.5,
                rotation: Math.random() * 360,
                rotationSpeed: Math.random() * 10 - 5,
                color: this.colors[Math.floor(Math.random() * this.colors.length)],
                opacity: 1
            });
        }

        this.start();
    }

    start() {
        if (this.animationFrame !== null) {
            return;
        }

        const animate = () => {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            for (let i = this.particles.length - 1; i >= 0; i -= 1) {
                const particle = this.particles[i];

                particle.x += particle.speedX;
                particle.y += particle.speedY;
                particle.rotation += particle.rotationSpeed;
                particle.speedY += 0.08;
                particle.opacity -= 0.008;

                this.ctx.save();
                this.ctx.globalAlpha = Math.max(particle.opacity, 0);
                this.ctx.fillStyle = particle.color;
                this.ctx.translate(particle.x, particle.y);
                this.ctx.rotate((particle.rotation * Math.PI) / 180);
                this.ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
                this.ctx.restore();

                if (particle.y > this.canvas.height + 40 || particle.opacity <= 0) {
                    this.particles.splice(i, 1);
                }
            }

            if (this.particles.length > 0) {
                this.animationFrame = requestAnimationFrame(animate);
            } else {
                this.animationFrame = null;
            }
        };

        animate();
    }

    burst(x, y, count = 60) {
        for (let i = 0; i < count; i += 1) {
            const angle = (i / count) * Math.PI * 2;
            const velocity = 4 + Math.random() * 5;

            this.particles.push({
                x,
                y,
                size: Math.random() * 6 + 2,
                speedX: Math.cos(angle) * velocity,
                speedY: Math.sin(angle) * velocity,
                rotation: Math.random() * 360,
                rotationSpeed: Math.random() * 10 - 5,
                color: this.colors[Math.floor(Math.random() * this.colors.length)],
                opacity: 1
            });
        }

        this.start();
    }
}

const MEMORY_STORAGE_KEY = "sisterBirthdayMemories";
const MAX_SAVED_MEMORIES = 6;
const MAX_IMAGE_DIMENSION = 960;

function loadSavedMemories() {
    try {
        const storedMemories = localStorage.getItem(MEMORY_STORAGE_KEY);
        const parsedMemories = JSON.parse(storedMemories ?? "[]");

        if (!Array.isArray(parsedMemories)) {
            return [];
        }

        return parsedMemories.filter((memory) => typeof memory === "string" && memory.startsWith("data:image/"));
    } catch (error) {
        console.log("Saved memories could not be loaded.");
        return [];
    }
}

function saveMemories(memories) {
    try {
        localStorage.setItem(MEMORY_STORAGE_KEY, JSON.stringify(memories.slice(0, MAX_SAVED_MEMORIES)));
        return true;
    } catch (error) {
        console.log("Saved memories could not be stored.");
        return false;
    }
}

function createPhotoDataUrl(source, width, height) {
    const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(width, height));
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));

    context.drawImage(source, 0, 0, canvas.width, canvas.height);

    return canvas.toDataURL("image/jpeg", 0.86);
}

function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("File could not be read."));
        reader.readAsDataURL(file);
    });
}

function loadImageFromDataUrl(dataUrl) {
    return new Promise((resolve, reject) => {
        const image = new Image();

        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error("Image could not be loaded."));
        image.src = dataUrl;
    });
}

function describeCameraError(error) {
    const shouldUseServer = !window.isSecureContext || window.location.protocol === "file:";

    switch (error?.name) {
        case "NotAllowedError":
        case "PermissionDeniedError":
            return "Camera access was denied. Allow permission in the browser and try again.";
        case "NotFoundError":
        case "DevicesNotFoundError":
            return "No camera was found on this device.";
        case "NotReadableError":
        case "TrackStartError":
            return "The camera is busy in another app. Close the other app and try again.";
        case "SecurityError":
            return shouldUseServer
                ? "Camera access needs `localhost`, HTTPS, or Live Server in most browsers."
                : "Browser security settings blocked camera access.";
        default:
            return shouldUseServer
                ? "The camera could not start here. Open the page with Live Server or `localhost` and try again."
                : "The camera could not start right now. Try again in a moment.";
    }
}

function setupCandleBlowing() {
    const blowButton = document.getElementById("blowButton");
    const skipButton = document.getElementById("skipButton");
    const flame = document.getElementById("flame");
    const candleIntro = document.getElementById("candleIntro");
    const mainContent = document.getElementById("mainContent");
    let hasBlown = false;

    const revealMainContent = (burstCount) => {
        candleIntro.style.display = "none";
        mainContent.style.display = "block";

        if (confetti) {
            confetti.burst(window.innerWidth / 2, window.innerHeight * 0.35, burstCount);
        }

        revealObserverTargets();
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const blowCandle = () => {
        if (hasBlown) {
            return;
        }

        hasBlown = true;
        flame.classList.add("blow-out");
        blowButton.disabled = true;
        skipButton.disabled = true;
        blowButton.style.opacity = "0.65";
        skipButton.style.opacity = "0.65";

        setTimeout(() => {
            revealMainContent(180);
        }, 900);
    };

    const skipIntro = () => {
        if (hasBlown) {
            return;
        }

        hasBlown = true;
        revealMainContent(140);
    };

    blowButton.addEventListener("click", blowCandle);
    skipButton.addEventListener("click", skipIntro);

    setTimeout(() => {
        if (!hasBlown) {
            blowCandle();
        }
    }, 2400);

    try {
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then((stream) => {
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const analyser = audioContext.createAnalyser();
                const microphone = audioContext.createMediaStreamSource(stream);
                const dataArray = new Uint8Array(analyser.frequencyBinCount);
                let lowFrequencyHits = 0;

                microphone.connect(analyser);

                const checkForBlow = () => {
                    if (hasBlown) {
                        stream.getTracks().forEach((track) => track.stop());
                        audioContext.close();
                        return;
                    }

                    analyser.getByteFrequencyData(dataArray);

                    let sum = 0;
                    for (let i = 0; i < 10; i += 1) {
                        sum += dataArray[i];
                    }

                    const average = sum / 10;

                    if (average > 150) {
                        lowFrequencyHits += 1;
                        if (lowFrequencyHits > 5) {
                            blowCandle();
                            return;
                        }
                    } else {
                        lowFrequencyHits = 0;
                    }

                    requestAnimationFrame(checkForBlow);
                };

                checkForBlow();
            })
            .catch(() => {
                console.log("Microphone access denied or unavailable.");
            });
    } catch (error) {
        console.log("Microphone input is not supported in this browser.");
    }
}

function handleResize() {
    if (confetti) {
        confetti.resize();
    }
}

function setupCameraGallery() {
    const openCameraBtn = document.getElementById("openCameraBtn");
    const uploadPhotosBtn = document.getElementById("uploadPhotosBtn");
    const photoUploadInput = document.getElementById("photoUploadInput");
    const galleryStatus = document.getElementById("galleryStatus");
    const memoryGallery = document.getElementById("memoryGallery");
    const emptyGallery = document.getElementById("emptyGallery");
    const cameraModal = document.getElementById("cameraModal");
    const cameraPreview = document.getElementById("cameraPreview");
    const cameraPlaceholder = document.getElementById("cameraPlaceholder");
    const cameraHelpText = document.getElementById("cameraHelpText");
    const capturePhotoBtn = document.getElementById("capturePhotoBtn");
    const switchCameraBtn = document.getElementById("switchCameraBtn");
    const cameraUploadBtn = document.getElementById("cameraUploadBtn");
    const closeCameraBtn = document.getElementById("closeCameraBtn");
    const previewFrame = cameraPreview?.closest(".camera-preview-frame");

    if (
        !openCameraBtn ||
        !uploadPhotosBtn ||
        !photoUploadInput ||
        !galleryStatus ||
        !memoryGallery ||
        !emptyGallery ||
        !cameraModal ||
        !cameraPreview ||
        !cameraPlaceholder ||
        !cameraHelpText ||
        !capturePhotoBtn ||
        !switchCameraBtn ||
        !cameraUploadBtn ||
        !closeCameraBtn ||
        !previewFrame
    ) {
        return;
    }

    const cameraPlaceholderTitle = cameraPlaceholder.querySelector(".camera-placeholder-title");
    const cameraPlaceholderCopy = cameraPlaceholder.querySelector(".camera-placeholder-copy");
    let activeStream = null;
    let activeFacingMode = "user";
    let memories = loadSavedMemories().slice(0, MAX_SAVED_MEMORIES);

    const setGalleryStatus = (message) => {
        if (message) {
            galleryStatus.textContent = message;
            return;
        }

        if (memories.length === 0) {
            galleryStatus.textContent = "No memories saved yet. Take a photo to start the gallery.";
            return;
        }

        galleryStatus.textContent = memories.length === 1
            ? "1 memory saved on this device."
            : `${memories.length} memories saved on this device.`;
    };

    const setCameraHelp = (message, isError = false) => {
        cameraHelpText.textContent = message;
        cameraHelpText.classList.toggle("is-error", isError);
    };

    const setCameraPlaceholder = (title, copy) => {
        if (cameraPlaceholderTitle) {
            cameraPlaceholderTitle.textContent = title;
        }

        if (cameraPlaceholderCopy) {
            cameraPlaceholderCopy.textContent = copy;
        }
    };

    const updateCameraButtons = () => {
        const hasLiveCamera = Boolean(activeStream);
        capturePhotoBtn.disabled = !hasLiveCamera;
        switchCameraBtn.disabled = !navigator.mediaDevices?.getUserMedia;
    };

    const persistMemories = () => {
        const wasStored = saveMemories(memories);

        if (!wasStored) {
            setGalleryStatus("The photo was added for now, but the browser could not save it permanently.");
        }
    };

    const renderGallery = () => {
        memoryGallery.querySelectorAll(".memory-card").forEach((memoryCard) => {
            memoryCard.remove();
        });

        emptyGallery.hidden = memories.length > 0;

        memories.forEach((memory, index) => {
            const memoryCard = document.createElement("article");
            const memoryPhoto = document.createElement("img");
            const deleteButton = document.createElement("button");

            memoryCard.className = "memory-card";

            memoryPhoto.className = "memory-photo";
            memoryPhoto.src = memory;
            memoryPhoto.alt = `Birthday memory ${index + 1}`;
            memoryPhoto.loading = "lazy";

            deleteButton.className = "memory-delete-button";
            deleteButton.type = "button";
            deleteButton.dataset.index = String(index);
            deleteButton.setAttribute("aria-label", `Remove birthday memory ${index + 1}`);
            deleteButton.textContent = "x";

            memoryCard.appendChild(memoryPhoto);
            memoryCard.appendChild(deleteButton);
            memoryGallery.appendChild(memoryCard);
        });

        setGalleryStatus();
    };

    const addMemories = (newMemories, sourceLabel) => {
        if (!newMemories.length) {
            return;
        }

        memories = [...newMemories.reverse(), ...memories].slice(0, MAX_SAVED_MEMORIES);
        persistMemories();
        renderGallery();

        const savedCount = newMemories.length;
        const label = savedCount === 1 ? "memory" : "memories";
        setGalleryStatus(`${savedCount} ${label} added from ${sourceLabel}.`);

        if (confetti) {
            confetti.burst(window.innerWidth / 2, window.innerHeight * 0.45, 70);
        }
    };

    const stopCamera = () => {
        if (activeStream) {
            activeStream.getTracks().forEach((track) => track.stop());
        }

        activeStream = null;
        cameraPreview.srcObject = null;
        previewFrame.classList.remove("is-live", "is-mirrored");
        updateCameraButtons();
    };

    const closeCameraModal = () => {
        stopCamera();
        cameraModal.hidden = true;
        document.body.classList.remove("modal-open");
    };

    const startCamera = async () => {
        if (!navigator.mediaDevices?.getUserMedia) {
            setCameraPlaceholder(
                "Camera access is not supported here.",
                "Use a newer browser, or add photos from your device instead."
            );
            setCameraHelp("This browser does not support `getUserMedia()`.", true);
            updateCameraButtons();
            return false;
        }

        stopCamera();
        setCameraPlaceholder("Starting camera...", "Allow access when your browser asks for permission.");
        setCameraHelp("Connecting to the camera...", false);

        const tryStart = async (constraints) => navigator.mediaDevices.getUserMedia(constraints);
        const preferredConstraints = {
            video: {
                facingMode: { ideal: activeFacingMode },
                width: { ideal: 1280 },
                height: { ideal: 720 }
            },
            audio: false
        };

        try {
            activeStream = await tryStart(preferredConstraints);
        } catch (error) {
            try {
                activeStream = await tryStart({ video: true, audio: false });
            } catch (fallbackError) {
                const errorMessage = describeCameraError(fallbackError);

                setCameraPlaceholder("Camera unavailable", errorMessage);
                setCameraHelp(errorMessage, true);
                updateCameraButtons();
                return false;
            }
        }

        cameraPreview.srcObject = activeStream;

        const cameraTrack = activeStream.getVideoTracks()[0];
        const streamFacingMode = cameraTrack?.getSettings?.().facingMode;

        previewFrame.classList.toggle(
            "is-mirrored",
            streamFacingMode ? streamFacingMode === "user" : activeFacingMode === "user"
        );

        try {
            await cameraPreview.play();
        } catch (error) {
            console.log("Camera preview could not autoplay.");
        }

        previewFrame.classList.add("is-live");
        setCameraHelp("Camera ready. Take a photo when the frame looks right.", false);
        updateCameraButtons();
        return true;
    };

    const openCameraModal = async () => {
        cameraModal.hidden = false;
        document.body.classList.add("modal-open");

        setCameraPlaceholder(
            "Camera preview will appear here.",
            "Allow access when your browser asks for permission."
        );

        setCameraHelp(
            window.location.protocol === "file:"
                ? "Use Live Server or `localhost` if your browser blocks camera access on local files."
                : "Allow camera access when your browser asks for permission.",
            false
        );

        updateCameraButtons();
        await startCamera();
    };

    const capturePhoto = () => {
        if (!activeStream || cameraPreview.readyState < 2) {
            setCameraHelp("Wait for the camera preview to finish loading, then try again.", true);
            return;
        }

        const { videoWidth, videoHeight } = cameraPreview;

        if (!videoWidth || !videoHeight) {
            setCameraHelp("The camera preview is still warming up. Try again in a second.", true);
            return;
        }

        const memory = createPhotoDataUrl(cameraPreview, videoWidth, videoHeight);
        addMemories([memory], "your camera");
        setCameraHelp("Photo captured. Take another one or close the camera.", false);
    };

    const processUploadedFiles = async (fileList, sourceLabel = "your device") => {
        const files = Array.from(fileList).filter((file) => file.type.startsWith("image/")).slice(0, MAX_SAVED_MEMORIES);

        if (!files.length) {
            setGalleryStatus("Choose image files to add them to the gallery.");
            return;
        }

        const uploadedMemories = [];

        for (const file of files) {
            try {
                const dataUrl = await readFileAsDataUrl(file);
                const image = await loadImageFromDataUrl(dataUrl);
                uploadedMemories.push(createPhotoDataUrl(image, image.width, image.height));
            } catch (error) {
                console.log("An uploaded image could not be added.");
            }
        }

        addMemories(uploadedMemories, sourceLabel);
    };

    openCameraBtn.addEventListener("click", openCameraModal);

    uploadPhotosBtn.addEventListener("click", () => {
        photoUploadInput.click();
    });

    cameraUploadBtn.addEventListener("click", () => {
        photoUploadInput.click();
    });

    capturePhotoBtn.addEventListener("click", capturePhoto);

    switchCameraBtn.addEventListener("click", async () => {
        activeFacingMode = activeFacingMode === "user" ? "environment" : "user";
        await startCamera();
    });

    closeCameraBtn.addEventListener("click", closeCameraModal);

    photoUploadInput.addEventListener("change", async (event) => {
        const { files } = event.target;

        if (!files?.length) {
            return;
        }

        await processUploadedFiles(files);
        photoUploadInput.value = "";
    });

    memoryGallery.addEventListener("click", (event) => {
        const deleteButton = event.target.closest(".memory-delete-button");

        if (!deleteButton) {
            return;
        }

        const memoryIndex = Number(deleteButton.dataset.index);

        memories = memories.filter((_, index) => index !== memoryIndex);
        persistMemories();
        renderGallery();
        setGalleryStatus("Memory removed from the gallery.");
    });

    cameraModal.addEventListener("click", (event) => {
        if (event.target === cameraModal) {
            closeCameraModal();
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && !cameraModal.hidden) {
            closeCameraModal();
        }
    });

    window.addEventListener("beforeunload", stopCamera);

    renderGallery();
    updateCameraButtons();
}

function setupAudioControls() {
    const birthdaySong = document.getElementById("birthdaySong");
    const muteButton = document.getElementById("muteButton");

    if (!birthdaySong || !muteButton) {
        return;
    }

    const updateMuteButton = (isAutoplayBlocked = false) => {
        if (isAutoplayBlocked && birthdaySong.paused) {
            muteButton.textContent = "Play Music";
            muteButton.classList.remove("muted");
            return;
        }

        if (birthdaySong.muted) {
            muteButton.textContent = "Sound Off";
            muteButton.classList.add("muted");
        } else {
            muteButton.textContent = "Sound On";
            muteButton.classList.remove("muted");
        }
    };

    birthdaySong.volume = 0.32;
    updateMuteButton();

    birthdaySong.play()
        .then(() => {
            updateMuteButton();
        })
        .catch(() => {
            updateMuteButton(true);
        });

    muteButton.addEventListener("click", async () => {
        if (birthdaySong.paused) {
            birthdaySong.muted = false;
            await birthdaySong.play().catch(() => {});
            updateMuteButton(true);
            return;
        }

        birthdaySong.muted = !birthdaySong.muted;
        updateMuteButton();
    });
}

let observer;

function revealObserverTargets() {
    const revealElements = document.querySelectorAll(".reveal");

    revealElements.forEach((element) => {
        if (!observer) {
            element.classList.add("in-view");
            return;
        }

        observer.observe(element);
    });
}

let confetti;

window.addEventListener("load", () => {
    createStars();
    setupCandleBlowing();
    setupCameraGallery();
    setupAudioControls();

    const canvas = document.getElementById("confetti");
    if (canvas) {
        confetti = new Confetti(canvas);
        confetti.createConfetti(90);

        document.addEventListener("click", (event) => {
            if (event.target.closest("button")) {
                return;
            }

            confetti.burst(event.clientX, event.clientY, 36);
        });
    }

    window.addEventListener("resize", handleResize);
});

document.addEventListener("DOMContentLoaded", () => {
    observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) {
                return;
            }

            entry.target.classList.add("in-view");
            observer.unobserve(entry.target);
        });
    }, {
        threshold: 0.18,
        rootMargin: "0px 0px -40px 0px"
    });

    if (document.getElementById("mainContent")?.style.display !== "none") {
        revealObserverTargets();
    }
});
