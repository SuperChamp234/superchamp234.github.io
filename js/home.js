document.addEventListener("DOMContentLoaded", () => {
    const target = document.getElementById("typed");
    if (!target) return;

    let strings = [];
    try {
        strings = JSON.parse(target.dataset.strings || "[]");
    } catch (error) {
        strings = [];
    }

    if (!strings.length) return;

    const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reducedMotion || typeof window.Typed === "undefined") {
        target.textContent = strings[0];
        return;
    }

    new window.Typed("#typed", {
        strings,
        typeSpeed: 55,
        backSpeed: 35,
        backDelay: 1900,
        startDelay: 500,
        loop: true,
        showCursor: true,
        cursorChar: "|",
        smartBackspace: true,
    });
});
