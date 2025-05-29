document.addEventListener('DOMContentLoaded', function() {
    var options = {
        strings: [
            'Zain Siddavatam',
            'an engineer',
            'a passionate developer',
            'a f1 fan, cat lover, mountains enjoyer',
        ],
        typeSpeed: 60,
        backSpeed: 40,
        backDelay: 1800,
        startDelay: 600,
        loop: true,
        showCursor: true,
        cursorChar: '|',
        smartBackspace: true
    };
    
    var typed = new Typed('#typed', options);
});
