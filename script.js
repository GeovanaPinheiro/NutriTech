document.addEventListener("DOMContentLoaded", () => {
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('navLinks');
    const themeToggle = document.getElementById('themeToggle');

    const applyTheme = (theme) => {
        const isLight = theme === 'light';
        document.body.classList.toggle('light-mode', isLight);
        document.documentElement.style.colorScheme = isLight ? 'light' : 'dark';
        localStorage.setItem('nutritech-theme', theme);

        if (themeToggle) {
            themeToggle.textContent = isLight ? '☀️' : '🌙';
            themeToggle.setAttribute('aria-label', isLight ? 'Ativar modo escuro' : 'Ativar modo claro');
        }
    };

    const savedTheme = localStorage.getItem('nutritech-theme') || 'dark';
    applyTheme(savedTheme);

    if(themeToggle) {
        themeToggle.addEventListener('click', () => {
            const nextTheme = document.body.classList.contains('light-mode') ? 'dark' : 'light';
            applyTheme(nextTheme);
        });
    }

    if(hamburger) {
        hamburger.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }

    const locationBtn = document.getElementById('locationBtn');
    if(locationBtn) {
        locationBtn.addEventListener('click', () => {
            if (navigator.geolocation) {
                locationBtn.innerHTML = 'Buscando...';
                navigator.geolocation.getCurrentPosition(
                    async (position) => {
                        try {
                            const lat = position.coords.latitude;
                            const lon = position.coords.longitude;
                            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
                            const data = await response.json();
                            const city = data.address.city || data.address.town || data.address.village || 'Sua Região';
                            locationBtn.innerHTML = city;
                        } catch (error) {
                            locationBtn.innerHTML = 'Indisponível';
                        }
                    },
                    () => {
                        locationBtn.innerHTML = 'Negado';
                    }
                );
            } else {
                locationBtn.innerHTML = 'Não suportado';
            }
        });
    }

    const contactForm = document.getElementById('contactForm');
    if(contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('Mensagem enviada com sucesso!');
            contactForm.reset();
        });
    }
});