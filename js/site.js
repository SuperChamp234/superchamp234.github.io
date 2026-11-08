(() => {
    const doc = document.documentElement;

    /* ---------------------------------------------------------------- header */
    const header = document.querySelector("[data-site-header]");
    const navToggle = document.querySelector("[data-nav-toggle]");
    const primaryNav = document.querySelector("[data-primary-nav]");

    const syncHeader = () => {
        if (!header) return;
        header.classList.toggle("is-scrolled", window.scrollY > 8);
    };
    syncHeader();
    window.addEventListener("scroll", syncHeader, { passive: true });

    if (header && navToggle && primaryNav) {
        const setOpen = (open) => {
            header.dataset.open = String(open);
            navToggle.setAttribute("aria-expanded", String(open));
            document.body.classList.toggle("nav-open", open);
        };

        navToggle.addEventListener("click", () => {
            setOpen(header.dataset.open !== "true");
        });

        primaryNav.addEventListener("click", (event) => {
            if (event.target.closest("a")) setOpen(false);
        });

        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape") setOpen(false);
        });

        document.addEventListener("click", (event) => {
            if (header.dataset.open === "true" && !header.contains(event.target)) {
                setOpen(false);
            }
        });

        const desktop = window.matchMedia("(min-width: 761px)");
        desktop.addEventListener("change", (event) => {
            if (event.matches) setOpen(false);
        });
    }

    /* -------------------------------------------------------- theme preview */
    const themeButtons = Array.from(document.querySelectorAll("[data-set-theme]"));
    const themeSwitcher = document.querySelector("[data-theme-switcher]");
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    const themes = ["scrapbook", "weblog", "web20"];
    const themeColors = {
        scrapbook: "#f6efe1",
        weblog: "#dfe7f0",
        web20: "#eef3f8",
    };

    const applyTheme = (theme, persist = true) => {
        if (!themes.includes(theme)) theme = "scrapbook";
        doc.dataset.theme = theme;
        themeButtons.forEach((button) => {
            button.setAttribute(
                "aria-pressed",
                String(button.dataset.setTheme === theme),
            );
        });
        if (themeMeta) themeMeta.setAttribute("content", themeColors[theme]);
        if (persist) {
            try {
                localStorage.setItem("theme", theme);
            } catch (error) {}
        }
        const url = new URL(window.location.href);
        if (url.searchParams.has("theme")) {
            url.searchParams.set("theme", theme);
            history.replaceState(null, "", url);
        }
    };

    applyTheme(doc.dataset.theme || "scrapbook", false);
    themeButtons.forEach((button) => {
        button.addEventListener("click", () => {
            applyTheme(button.dataset.setTheme);
            if (themeSwitcher) themeSwitcher.open = false;
        });
    });

    /* ---------------------------------------------------------- giscus lazy */
    const giscus = document.querySelector("[data-giscus]");
    if (giscus) {
        const loadGiscus = () => {
            if (giscus.dataset.loaded) return;
            giscus.dataset.loaded = "true";

            const script = document.createElement("script");
            script.src = "https://giscus.app/client.js";
            script.async = true;
            script.crossOrigin = "anonymous";

            const attributes = {
                repo: "data-repo",
                repoId: "data-repo-id",
                category: "data-category",
                categoryId: "data-category-id",
                mapping: "data-mapping",
                strict: "data-strict",
                reactionsEnabled: "data-reactions-enabled",
                emitMetadata: "data-emit-metadata",
                inputPosition: "data-input-position",
                theme: "data-theme",
                lang: "data-lang",
                loading: "data-loading",
            };

            Object.entries(attributes).forEach(([key, attribute]) => {
                if (giscus.dataset[key] !== undefined) {
                    script.setAttribute(attribute, giscus.dataset[key]);
                }
            });

            giscus.appendChild(script);
        };

        if ("IntersectionObserver" in window) {
            const observer = new IntersectionObserver(
                (entries) => {
                    if (entries.some((entry) => entry.isIntersecting)) {
                        loadGiscus();
                        observer.disconnect();
                    }
                },
                { rootMargin: "600px 0px" },
            );
            observer.observe(giscus);
        } else {
            loadGiscus();
        }
    }

    /* ----------------------------------------------------- reading progress */
    const post = document.querySelector(".post");
    if (post) {
        const bar = document.createElement("div");
        bar.className = "reading-progress";
        document.body.appendChild(bar);

        const update = () => {
            const rect = post.getBoundingClientRect();
            const distance = rect.height - window.innerHeight;
            const progress =
                distance > 0
                    ? Math.min(1, Math.max(0, -rect.top / distance))
                    : 0;
            bar.style.setProperty("--progress", `${progress * 100}%`);
        };

        update();
        window.addEventListener("scroll", update, { passive: true });
        window.addEventListener("resize", update);
    }

    /* ------------------------------------------------------------ code copy */
    document.querySelectorAll(".prose pre").forEach((pre) => {
        const code = pre.querySelector("code");
        if (!code) return;

        pre.style.position = "relative";
        const button = document.createElement("button");
        button.type = "button";
        button.className = "code-copy";
        button.textContent = "Copy";

        button.addEventListener("click", async () => {
            try {
                await navigator.clipboard.writeText(code.innerText);
                button.textContent = "Copied";
                window.setTimeout(() => {
                    button.textContent = "Copy";
                }, 1600);
            } catch (error) {
                button.textContent = "Failed";
            }
        });

        pre.appendChild(button);
    });
})();
