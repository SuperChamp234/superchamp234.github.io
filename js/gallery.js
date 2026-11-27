(() => {
    const root = document.querySelector("[data-gallery]");
    if (!root) return;

    const doc = document.documentElement;
    const book = root.querySelector("[data-photobook]");
    const grid = root.querySelector("[data-gallery-grid]");
    const counter = root.querySelector("[data-gallery-counter]");
    const progress = root.querySelector("[data-book-progress]");
    const viewButtons = Array.from(root.querySelectorAll("[data-view]"));
    const pages = Array.from(root.querySelectorAll("[data-book-item]"));
    const total = pages.length;
    const mobile = window.matchMedia("(max-width: 760px)");

    const getStored = () => {
        try {
            return localStorage.getItem("galleryView");
        } catch (error) {
            return null;
        }
    };

    const params = new URLSearchParams(window.location.search);
    let mode = doc.dataset.galleryView || params.get("view") || getStored() ||
        (mobile.matches ? "book" : "grid");
    if (mode !== "book" && mode !== "grid") mode = "grid";

    let current = 0;

    const dialog = root.querySelector("[data-lightbox]");
    const media = dialog?.querySelector("[data-lightbox-media]");
    const caption = dialog?.querySelector("[data-lightbox-caption]");
    const meta = dialog?.querySelector("[data-lightbox-meta]");
    const lightboxCounter = dialog?.querySelector("[data-lightbox-counter]");
    const prevButton = dialog?.querySelector("[data-lightbox-prev]");
    const nextButton = dialog?.querySelector("[data-lightbox-next]");

    let items = [];
    let index = 0;
    let lastFocus = null;

    const updateCounter = () => {
        if (!counter || !total) return;
        counter.textContent = `${String(current + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;
        if (progress) {
            progress.style.setProperty(
                "--progress",
                `${((current + 1) / total) * 100}%`,
            );
        }
    };

    const setMode = (next, options = {}) => {
        const {
            persist = false,
            updateUrl = false,
            scroll = true,
        } = options;

        mode = next === "book" ? "book" : "grid";
        doc.dataset.galleryView = mode;
        viewButtons.forEach((button) => {
            button.setAttribute(
                "aria-pressed",
                String(button.dataset.view === mode),
            );
        });

        if (persist) {
            try {
                localStorage.setItem("galleryView", mode);
            } catch (error) {}
        }

        if (updateUrl) {
            const url = new URL(window.location.href);
            url.searchParams.set("view", mode);
            history.replaceState(null, "", url);
        }

        if (mode === "book") {
            if (dialog?.open) closeLightbox();
            window.scrollTo(0, 0);
            if (scroll && book) {
                if (window.location.hash) {
                    const target = document.getElementById(
                        window.location.hash.slice(1),
                    );
                    if (target) {
                        target.scrollIntoView({ block: "start" });
                    }
                } else {
                    book.scrollTop = 0;
                    current = 0;
                }
            }
            updateCounter();
        } else if (counter) {
            counter.textContent = `${total} frame${total === 1 ? "" : "s"}`;
            if (progress) progress.style.setProperty("--progress", "0%");
        }
    };

    viewButtons.forEach((button) => {
        button.addEventListener("click", () => {
            setMode(button.dataset.view, { persist: true, updateUrl: true });
        });
    });

    if (!book || !grid || !total) {
        doc.dataset.galleryView = "grid";
        return;
    }

    /* ---------------------------------------------------------- book scroll */
    let ticking = false;

    book.addEventListener(
        "scroll",
        () => {
            if (ticking) return;
            ticking = true;
            window.requestAnimationFrame(() => {
                const next = Math.round(book.scrollTop / book.clientHeight);
                if (next !== current) {
                    current = Math.max(0, Math.min(total - 1, next));
                    updateCounter();
                }
                ticking = false;
            });
        },
        { passive: true },
    );

    const goToPage = (delta) => {
        const next = Math.max(0, Math.min(total - 1, current + delta));
        pages[next]?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    document.addEventListener("keydown", (event) => {
        if (mode !== "book" || dialog?.open) return;
        const tag = document.activeElement?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") return;

        if (event.key === "ArrowDown" || event.key === "PageDown") {
            event.preventDefault();
            goToPage(1);
        } else if (event.key === "ArrowUp" || event.key === "PageUp") {
            event.preventDefault();
            goToPage(-1);
        } else if (event.key === "Home") {
            event.preventDefault();
            book.scrollTo({ top: 0, behavior: "smooth" });
        } else if (event.key === "End") {
            event.preventDefault();
            book.scrollTo({ top: book.scrollHeight, behavior: "smooth" });
        }
    });

    /* ------------------------------------------------------------ image fade */
    const markLoaded = (img) => {
        img.classList.add("is-loaded");
        const holder = img.closest(".media-button");
        if (holder) holder.classList.add("is-loaded");
    };

    root.querySelectorAll("img").forEach((img) => {
        if (img.complete && img.naturalWidth) {
            markLoaded(img);
        } else {
            img.addEventListener("load", () => markLoaded(img), { once: true });
            img.addEventListener("error", () => markLoaded(img), { once: true });
        }
    });

    /* --------------------------------------------------- book full-res loads */
    // Book pages use the original files, but only load a page's original when
    // that page actually enters the book viewport. This keeps the grid light
    // and avoids downloading several full-size photos when book mode opens.
    const loadBookImage = (page) => {
        const img = page.querySelector("img[data-src]");
        if (!img || img.dataset.loading === "true" || img.src) return;
        img.dataset.loading = "true";
        img.src = img.dataset.src;
    };

    if ("IntersectionObserver" in window && book) {
        const bookObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) loadBookImage(entry.target);
                });
            },
            { root: book, rootMargin: "-15% 0px -15% 0px" },
        );
        pages.forEach((page) => bookObserver.observe(page));
    } else {
        pages.forEach(loadBookImage);
    }

    /* -------------------------------------------------------------- lightbox */
    const collectItems = () => {
        const scope = mode === "book" ? book : grid;
        return Array.from(scope.querySelectorAll("[data-lightbox-open]")).map(
            (element) => ({
                element,
                type: element.dataset.type || "image",
                full: element.dataset.full,
                video: element.dataset.video,
                poster: element.dataset.poster,
                caption: element.dataset.caption,
                meta: element.dataset.meta,
                alt: element.dataset.alt,
            }),
        );
    };

    const renderLightbox = () => {
        const item = items[index];
        if (!item || !media) return;

        media.innerHTML = "";

        if (item.type === "video" && item.video) {
            const video = document.createElement("video");
            video.controls = true;
            video.autoplay = true;
            video.playsInline = true;
            video.preload = "metadata";
            if (item.poster) video.poster = item.poster;

            const source = document.createElement("source");
            source.src = item.video;
            source.type = "video/mp4";
            video.appendChild(source);
            media.appendChild(video);
        } else if (item.full) {
            const img = document.createElement("img");
            img.src = item.full;
            img.alt = item.alt || "";
            img.decoding = "async";
            media.appendChild(img);
        }

        if (caption) caption.textContent = item.caption || "";
        if (meta) meta.textContent = item.meta || "";
        if (lightboxCounter) {
            lightboxCounter.textContent = `${index + 1} / ${items.length}`;
        }
        if (prevButton) prevButton.disabled = items.length < 2;
        if (nextButton) nextButton.disabled = items.length < 2;
    };

    const openLightbox = (trigger) => {
        if (!dialog) return;

        items = collectItems();
        index = Math.max(
            0,
            items.findIndex((item) => item.element === trigger),
        );
        lastFocus = trigger;
        renderLightbox();

        if (typeof dialog.showModal === "function") {
            if (!dialog.open) dialog.showModal();
        } else {
            dialog.setAttribute("open", "");
        }

        document.body.classList.add("lightbox-open");
    };

    const closeLightbox = () => {
        if (!dialog) return;
        if (typeof dialog.close === "function") {
            dialog.close();
        } else {
            dialog.removeAttribute("open");
        }
    };

    const stepLightbox = (delta) => {
        if (!items.length) return;
        index = (index + delta + items.length) % items.length;
        renderLightbox();
    };

    root.addEventListener("click", (event) => {
        const trigger = event.target.closest("[data-lightbox-open]");
        if (!trigger) return;
        event.preventDefault();
        openLightbox(trigger);
    });

    dialog?.addEventListener("click", (event) => {
        if (event.target === dialog) closeLightbox();
    });

    dialog
        ?.querySelector("[data-lightbox-close]")
        ?.addEventListener("click", closeLightbox);

    prevButton?.addEventListener("click", () => stepLightbox(-1));
    nextButton?.addEventListener("click", () => stepLightbox(1));

    dialog?.addEventListener("close", () => {
        document.body.classList.remove("lightbox-open");
        if (media) media.innerHTML = "";
        lastFocus?.focus?.();
    });

    document.addEventListener("keydown", (event) => {
        if (!dialog?.open) return;
        if (event.key === "ArrowLeft") {
            event.preventDefault();
            stepLightbox(-1);
        } else if (event.key === "ArrowRight") {
            event.preventDefault();
            stepLightbox(1);
        }
    });

    let touchStartX = null;
    dialog?.addEventListener(
        "touchstart",
        (event) => {
            touchStartX = event.touches[0]?.clientX ?? null;
        },
        { passive: true },
    );
    dialog?.addEventListener(
        "touchend",
        (event) => {
            if (touchStartX === null) return;
            const endX = event.changedTouches[0]?.clientX ?? touchStartX;
            const delta = endX - touchStartX;
            if (Math.abs(delta) > 45) {
                stepLightbox(delta < 0 ? 1 : -1);
            }
            touchStartX = null;
        },
        { passive: true },
    );

    /* ---------------------------------------------------------------- boot */
    setMode(mode, { persist: false, updateUrl: false, scroll: false });

    if (mode === "book") {
        window.requestAnimationFrame(() => {
            if (window.location.hash) {
                const target = document.getElementById(
                    window.location.hash.slice(1),
                );
                if (target) target.scrollIntoView({ block: "start" });
            }
            updateCounter();
        });
    }

    // Respect "auto by device" until the visitor explicitly picks a view.
    mobile.addEventListener("change", (event) => {
        if (getStored()) return;
        setMode(event.matches ? "book" : "grid", {
            persist: false,
            updateUrl: false,
            scroll: false,
        });
    });
})();
