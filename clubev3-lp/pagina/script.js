// Data from PDFs
const proceduresData = {
    specialties: [
        "Alergia e imunologia", "Anestesiologia", "Angiologia", "Cardiologia", "Coloproctologia",
        "Clinico geral", "Cirurgião geral", "Cirurgião pediátrico", "Cirurgião vascular", "Dermatologia",
        "Endocrinologia", "Gastroenterologia", "Geriatria", "Ginecologia", "Hepatologia",
        "Medicina da família", "Nefrologia", "Neurocirurgia", "Neurologia", "Nutrologia",
        "Obstetrícia", "Oftalmologia", "Ortopedia e traumatologia", "Otorrinolaringologia",
        "Pediatra", "Psicologia", "Pneumologia", "Reumatologia", "Urologia"
    ],
    exams: [
        "Colonoscopia", "Endoscopia", "Eletrocardiograma", "Holter 24 horas", "Mapa 24 horas",
        "Eletroneuromiografia", "Paaf de tireoide", "Biopsia de mama", "Biopsia de próstata",
        "Ecocardiograma", "Ecocardiograma Strain", "Patch test", "Prick test", "Esperiometria",
        "Retossigmoidoscopia", "Endoscopia nasosinusal", "Videonasoscopia", "Fibronascopia",
        "Abdômen superior", "Endovaginal", "Abdome total", "Bolsa escrotal", "Mamas",
        "Pequenas partes / Parede abdominal", "Próstata", "Rastreamento de óvulo", "Região cervical",
        "Rins", "Vias urinarias", "Tireoide e estruturas superficiais",
        "Ultrassonografia gemelar", "Ultrassonografia obstétrica", "Ultrassonografia pélvica"
    ],
    procedures: [
        "Aplicação de varizes com espuma", "Aplicação de varizes convencional", "Aplicação de medicamento",
        "Inserção de diu", "Retirada de diu", "Inserção de implanon", "Lavagem de ouvido",
        "Mielograma", "Passagem de sonda nasogástrica", "Polipectomia", "Retirada de corpo estranho",
        "Bota gessada + redução", "Gesso axilo-palmar + redução", "Luva gessada + redução",
        "Drenagem abscesso e desbridamento", "Infiltração articular", "Liberação percutânea dedo em gatilho",
        "Pé torto congênito", "Redução articular ombro"
    ],
    surgeries: [
        "Cirurgia geral", "Cirurgia ginecológica", "Cirurgia pediátrica", "Cirurgia ortopédica",
        "Cirurgia de otorrinolaringologia", "Cirurgia vascular", "Cirurgia urológica",
        "Cirurgia plástica", "Cirurgia Proctológica"
    ]
};

// Make functions globally available
window.openPlanDetails = function (planType) {
    const modal = document.getElementById('planModal');
    const title = document.getElementById('modalTitle');
    const body = document.getElementById('modalBody');

    if (!modal || !title || !body) {
        console.error("Modal elements not found!");
        return;
    }

    title.textContent = planType === 'premium' ? 'Cobertura Premium' : 'Cobertura Plus';

    // Icons
    const iconStethoscope = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.3.3 0 1 0 .2.3V4a1 1 0 0 1 1 1v5a4 4 0 0 1-4 4 4 4 0 0 1-4-4V5a1 1 0 0 1 1-1Z"/><path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/></svg>`;
    const iconMicroscope = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 18h8"/><path d="M3 22h18"/><path d="M14 22a7 7 0 1 0 0-14h-1"/><path d="M9 14h2"/><path d="M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2Z"/><path d="M12 6V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3"/></svg>`;

    let content = `
        <div class="procedure-category">
            <h4>${iconStethoscope} Especialidades Médicas</h4>
            <ul class="procedure-list">
                ${proceduresData.specialties.map(item => `<li>${item}</li>`).join('')}
            </ul>
        </div>
        <div class="procedure-category">
            <h4>${iconMicroscope} Exames e Diagnósticos</h4>
            <ul class="procedure-list">
                ${proceduresData.exams.map(item => `<li>${item}</li>`).join('')}
            </ul>
        </div>
        <div class="procedure-category">
            <h4>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg>
                Procedimentos Ambulatoriais
            </h4>
            <ul class="procedure-list">
                ${proceduresData.procedures.map(item => `<li>${item}</li>`).join('')}
            </ul>
        </div>
    `;

    if (planType === 'premium') {
        content += `
            <div class="procedure-category">
                <h4>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> 
                    Cirurgias (Exclusivo Premium)
                </h4>
                <ul class="procedure-list">
                    ${proceduresData.surgeries.map(item => `<li>${item}</li>`).join('')}
                </ul>
            </div>
        `;
    }

    body.innerHTML = content;
    modal.classList.add('active');
}

window.closePlanDetails = function () {
    const modal = document.getElementById('planModal');
    if (modal) modal.classList.remove('active');
}

// Close on background click
const planModal = document.getElementById('planModal');
if (planModal) {
    planModal.addEventListener('click', function (e) {
        if (e.target === this) {
            closePlanDetails();
        }
    });
}

// FAQ Functionality
document.querySelectorAll('.faq-question').forEach(button => {
    button.addEventListener('click', () => {
        const item = button.parentElement;
        item.classList.toggle('active');
    });
});

document.addEventListener('DOMContentLoaded', () => {
    const loader = document.getElementById('page-loader');

    if (loader) {
        setTimeout(() => {
            loader.classList.add('hidden');
            setTimeout(() => loader.remove(), 500);
        }, 500);
    }

    // Mobile Menu Close Logic
    const navToggle = document.getElementById('nav-toggle');
    const navLinks = document.querySelectorAll('.nav-links a');

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (navToggle) navToggle.checked = false;
        });
    });

    // Smooth scroll e URLs limpas (sem #)
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);

            if (targetElement) {
                e.preventDefault();

                // Rola suavemente até a seção
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });

                // Pega o nome do ID (ex: 'pricing')
                let pathName = targetId.replace('#', '');

                // Traduz os IDs do inglês para português na URL
                const tradutorUrls = {
                    'pricing': 'planos',
                    'features': 'recursos',
                    'benefits': 'vantagens',
                    'about': 'sobre',
                    'contact': 'contato'
                };

                // Cria a nova URL limpa
                let novaUrl = '/' + (tradutorUrls[pathName] || pathName);

                // Atualiza o navegador (muda o link lá em cima) sem recarregar a página
                window.history.pushState(null, '', novaUrl);
            }
        });
    });

    // Pricing Carousel Logic
    initPricingCarousel();
});

function initPricingCarousel() {
    const grid = document.getElementById('pricingGrid');
    const cards = document.querySelectorAll('.pricing-card');
    const dots = document.querySelectorAll('.pricing-dot');
    const prevBtn = document.getElementById('prevPlan');
    const nextBtn = document.getElementById('nextPlan');

    if (!grid || cards.length === 0) return;

    let currentIndex = 0;
    const totalPlans = cards.length;

    function updateCarousel(index) {
        // Loop logic
        if (index >= totalPlans) currentIndex = 0;
        else if (index < 0) currentIndex = totalPlans - 1;
        else currentIndex = index;

        // Scroll to card
        const cardWidth = cards[0].offsetWidth;
        grid.scrollTo({
            left: cardWidth * currentIndex,
            behavior: 'smooth'
        });

        // Update classes
        cards.forEach((card, i) => {
            card.classList.toggle('active-slide', i === currentIndex);
        });

        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === currentIndex);
        });
    }

    // Initial state
    if (window.innerWidth <= 768) {
        updateCarousel(0);
    }

    // Button Listeners
    if (nextBtn) {
        nextBtn.addEventListener('click', () => updateCarousel(currentIndex + 1));
    }
    if (prevBtn) {
        prevBtn.addEventListener('click', () => updateCarousel(currentIndex - 1));
    }

    // Dot Listeners
    dots.forEach((dot, i) => {
        dot.addEventListener('click', () => updateCarousel(i));
    });

    // Handle resize
    window.addEventListener('resize', () => {
        if (window.innerWidth <= 768) {
            updateCarousel(currentIndex);
        } else {
            // Reset for desktop
            cards.forEach(card => card.classList.remove('active-slide'));
            grid.scrollTo({ left: 0 });
        }
    });

    // Touch support (Optional but good)
    let touchStartX = 0;
    grid.addEventListener('touchstart', e => touchStartX = e.touches[0].clientX, { passive: true });
    grid.addEventListener('touchend', e => {
        const touchEndX = e.changedTouches[0].clientX;
        const diff = touchStartX - touchEndX;
        if (Math.abs(diff) > 50) {
            if (diff > 0) updateCarousel(currentIndex + 1);
            else updateCarousel(currentIndex - 1);
        }
    }, { passive: true });
}

function applyConfig(data) {

    // Aplicar Textos e URLs
    for (const [key, value] of Object.entries(data)) {
        // Tenta encontrar elemento por ID direto
        const element = document.getElementById(key);

        if (element) {

            // Se for input (não deve ter inputs aqui, mas por segurança)
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                element.value = value;
            }

            else {
                // Se for cor, pula (tratado depois)
                if (key.startsWith('color_')) continue;

                // Conteúdo de texto
                element.textContent = value;
            }
        }

        // Tratamento especial para URLs de links (nav_link1_url -> href do #nav_link1_link)
        if (key.endsWith('_url')) {
            // Ex: nav_link1_url -> nav_link1_link (convencao criada agora)
            const linkId = key.replace('_url', '_link');
            const linkEl = document.getElementById(linkId);
            if (linkEl) linkEl.href = value;

            else {

                // Tenta pelo ID direto se existir (ex: cta_url -> cta_button_link precisa mapear)
                if (key === 'cta_url') {
                    const btn = document.getElementById('cta_button_link');
                    if (btn) btn.href = value;
                }
            }
        }

        // Redes sociais
        if (key.startsWith('social_')) {
            const socialId = key + 'Link';
            const linkEl = document.getElementById(socialId);
            if (linkEl) linkEl.href = value;
        }

        // Cores (CSS Variables)
        if (key === 'color_primary') document.documentElement.style.setProperty('--primary', value);
        if (key === 'color_accent') document.documentElement.style.setProperty('--accent', value);
        if (key === 'color_bg') document.documentElement.style.setProperty('--bg-dark', value);
        if (key === 'color_card') document.documentElement.style.setProperty('--bg-card', value);
    }

    // SEO Metadata
    if (data.seo_title) document.title = data.seo_title;

    if (data.seo_description) {
        document.querySelector('meta[name="description"]').setAttribute('content', data.seo_description);
    }
}

// Mobile Plans Carousel Logic (Simple)
window.scrollPlans = function (direction) {
    const container = document.getElementById('pricingGrid');
    if (container) {
        // Card width (280) + gap (15) = 295
        // Or getting dynamically
        const card = container.querySelector('.pricing-card');
        const scrollAmount = card ? card.offsetWidth + 15 : 295;

        container.scrollBy({
            left: scrollAmount * direction,
            behavior: 'smooth'
        });
    } else {
        console.error("Pricing Grid not found!");
    }
}
