// ===== CLASE PRINCIPAL DEL LIBRO INTERACTIVO =====
class InteractiveBook {
    constructor() {
        this.pages = [
            'portada', 'indice', 'introduccion', 'objetivos', 'que-es', 
            'importancia', 'beneficios', 'ensenanza', 'origenes', 'marco-historico',
            'territorio', 'lenguas', 'poetas', 'leyendas', 'musica', 
            'estudiantes', 'anexo'
        ];
        
        this.currentPageIndex = 0;
        this.isTurning = false;
        this.userProgress = this.loadProgress();
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.setupActivities();
        this.initImageLoading();
        this.updateNavigation();
        this.updateProgress();
        
        // Configurar navegación por teclado
        document.addEventListener('keydown', (e) => this.handleKeyboardNavigation(e));
    }
    
    setupEventListeners() {
        document.getElementById('prev-btn').addEventListener('click', () => this.prevPage());
        document.getElementById('next-btn').addEventListener('click', () => this.nextPage());
        document.getElementById('check-quiz').addEventListener('click', () => ActivityManager.checkQuiz());
    }
    
    setupActivities() {
        ActivityManager.initQuiz();
        ActivityManager.initDragDrop();
    }
    
    initImageLoading() {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.classList.add('loaded');
                    imageObserver.unobserve(img);
                }
            });
        });
        
        document.querySelectorAll('.team-photo, .gallery-item img').forEach(img => {
            imageObserver.observe(img);
        });
    }
    
    showPage(pageId) {
        if (this.isTurning || !this.isValidPage(pageId)) {
            console.warn(`No se puede navegar a la página: ${pageId}`);
            return;
        }
        
        this.isTurning = true;
        const targetIndex = this.pages.indexOf(pageId);
        const currentPage = document.getElementById(this.pages[this.currentPageIndex]);
        const targetPage = document.getElementById(pageId);
        
        // Animación de salida
        currentPage.classList.add('page-exit');
        
        setTimeout(() => {
            currentPage.classList.remove('active', 'page-exit');
            targetPage.classList.add('active');
            
            this.currentPageIndex = targetIndex;
            this.updateNavigation();
            this.updateProgress();
            this.saveProgress();
            this.isTurning = false;
            
            // Enfocar el contenido de la nueva página para accesibilidad
            const mainHeading = targetPage.querySelector('h2');
            if (mainHeading) {
                mainHeading.focus();
            }
        }, 300);
    }
    
    isValidPage(pageId) {
        const exists = this.pages.includes(pageId) && document.getElementById(pageId);
        if (!exists) {
            console.error(`Página ${pageId} no encontrada`);
            return false;
        }
        return true;
    }
    
    nextPage() {
        if (this.currentPageIndex < this.pages.length - 1 && !this.isTurning) {
            this.showPage(this.pages[this.currentPageIndex + 1]);
        }
    }
    
    prevPage() {
        if (this.currentPageIndex > 0 && !this.isTurning) {
            this.showPage(this.pages[this.currentPageIndex - 1]);
        }
    }
    
    updateNavigation() {
        document.getElementById('prev-btn').disabled = this.currentPageIndex === 0;
        document.getElementById('next-btn').disabled = this.currentPageIndex === this.pages.length - 1;
    }
    
    updateProgress() {
        const progress = (this.currentPageIndex / (this.pages.length - 1)) * 100;
        document.getElementById('progress-bar').style.width = `${progress}%`;
    }
    
    handleKeyboardNavigation(e) {
        if (e.key === 'ArrowRight' || e.key === ' ') {
            e.preventDefault();
            this.nextPage();
        } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            this.prevPage();
        } else if (e.key === 'Home') {
            e.preventDefault();
            this.showPage(this.pages[0]);
        } else if (e.key === 'End') {
            e.preventDefault();
            this.showPage(this.pages[this.pages.length - 1]);
        }
    }
    
    saveProgress() {
        const progress = {
            currentPage: this.currentPageIndex,
            timestamp: Date.now()
        };
        localStorage.setItem('bookProgress', JSON.stringify(progress));
    }
    
    loadProgress() {
        try {
            const saved = localStorage.getItem('bookProgress');
            return saved ? JSON.parse(saved) : { currentPage: 0, timestamp: Date.now() };
        } catch (e) {
            console.error('Error loading progress:', e);
            return { currentPage: 0, timestamp: Date.now() };
        }
    }
}

// ===== GESTOR DE ACTIVIDADES =====
class ActivityManager {
    static initQuiz() {
        document.querySelectorAll('.quiz-option').forEach(option => {
            option.addEventListener('click', (e) => this.handleQuizAnswer(e));
            
            // Permitir selección con teclado
            option.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.handleQuizAnswer(e);
                }
            });
        });
    }
    
    static handleQuizAnswer(e) {
        const option = e.target;
        const isCorrect = option.dataset.correct === "true";
        
        // Limpiar selecciones previas
        option.parentNode.querySelectorAll('.quiz-option').forEach(opt => {
            opt.classList.remove('correct', 'incorrect');
        });
        
        // Aplicar clase según respuesta
        option.classList.add(isCorrect ? 'correct' : 'incorrect');
        
        // Proporcionar retroalimentación
        this.showFeedback(isCorrect, option);
    }
    
    static showFeedback(isCorrect, element) {
        // Remover feedback anterior
        const existingFeedback = element.parentNode.querySelector('.feedback');
        if (existingFeedback) {
            existingFeedback.remove();
        }
        
        const feedback = document.createElement('div');
        feedback.className = `feedback ${isCorrect ? 'correct' : 'incorrect'}`;
        feedback.textContent = isCorrect ? '¡Correcto!' : 'Intenta nuevamente';
        feedback.setAttribute('role', 'alert');
        
        element.parentNode.appendChild(feedback);
        
        setTimeout(() => {
            feedback.style.opacity = '0';
            setTimeout(() => feedback.remove(), 500);
        }, 2000);
    }
    
    static checkQuiz() {
        let allCorrect = true;
        
        document.querySelectorAll('.quiz-option').forEach(option => {
            const isCorrect = option.dataset.correct === "true";
            const isSelected = option.classList.contains('correct') || option.classList.contains('incorrect');
            
            if (isSelected) {
                if (option.classList.contains('correct') && !isCorrect) {
                    allCorrect = false;
                }
            } else {
                allCorrect = false;
            }
        });
        
        const button = document.getElementById('check-quiz');
        if (allCorrect) {
            button.textContent = '¡Todas correctas!';
            button.style.backgroundColor = '#28a745';
        } else {
            button.textContent = 'Algunas respuestas son incorrectas';
            button.style.backgroundColor = '#dc3545';
        }
        
        setTimeout(() => {
            button.textContent = 'Verificar Respuestas';
            button.style.backgroundColor = '';
        }, 3000);
    }
    
    static initDragDrop() {
        document.querySelectorAll('.drag-item').forEach(item => {
            item.addEventListener('dragstart', this.handleDragStart);
            item.addEventListener('dragend', this.handleDragEnd);
            
            // Hacer elementos arrastrables accesibles por teclado
            item.setAttribute('tabindex', '0');
            item.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.handleKeyboardDrag(e.target);
                }
            });
        });
        
        document.querySelectorAll('.drop-zone').forEach(zone => {
            zone.addEventListener('dragover', this.handleDragOver);
            zone.addEventListener('dragleave', this.handleDragLeave);
            zone.addEventListener('drop', this.handleDrop);
        });
    }
    
    static handleDragStart(e) {
        e.dataTransfer.setData('text/plain', e.target.dataset.type);
        e.target.classList.add('dragging');
    }
    
    static handleDragEnd(e) {
        e.target.classList.remove('dragging');
    }
    
    static handleDragOver(e) {
        e.preventDefault();
        e.currentTarget.classList.add('active');
    }
    
    static handleDragLeave(e) {
        e.currentTarget.classList.remove('active');
    }
    
    static handleDrop(e) {
        e.preventDefault();
        const zone = e.currentTarget;
        zone.classList.remove('active');
        
        const data = e.dataTransfer.getData('text/plain');
        const acceptType = zone.dataset.accept;
        
        if (data === acceptType) {
            zone.classList.add('correct');
            setTimeout(() => zone.classList.remove('correct'), 2000);
        } else {
            zone.classList.add('incorrect');
            setTimeout(() => zone.classList.remove('incorrect'), 2000);
        }
    }
    
    static handleKeyboardDrag(element) {
        // Implementar lógica para arrastrar con teclado
        console.log('Arrastrando con teclado:', element.textContent);
    }
}

// ===== INICIALIZACIÓN =====
let book;

document.addEventListener('DOMContentLoaded', function() {
    book = new InteractiveBook();
});

// ===== MANEJO DE ERRORES GLOBALES =====
window.addEventListener('error', function(e) {
    console.error('Error en la aplicación:', e.error);
});

window.addEventListener('unhandledrejection', function(e) {
    console.error('Promesa rechazada no manejada:', e.reason);
});