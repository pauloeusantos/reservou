// login.js
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const messageDiv = document.getElementById('message');
    const tipoContaToggle = document.getElementById('tipoContaToggle');

    const API_URL = 'https://reservou-api.vercel.app';

    if (!loginForm || !messageDiv || !tipoContaToggle) {
        console.error("Erro: Elementos essenciais do formulário não encontrados.");
        return;
    }

    const labels = document.querySelectorAll('.switch-label');
    function updateSwitchLabels() {
        const isRestaurante = tipoContaToggle.checked;
        labels.forEach(label => {
            if (label.hasAttribute('data-user')) {
                label.classList.toggle('active', !isRestaurante);
            } else if (label.hasAttribute('data-resto')) {
                label.classList.toggle('active', isRestaurante);
            }
        });
    }
    tipoContaToggle.addEventListener('change', updateSwitchLabels);
    updateSwitchLabels();

    loginForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value.trim();
        const isRestaurante = tipoContaToggle.checked;
        
        messageDiv.style.display = 'none';

        try {
            const response = await fetch(`${API_URL}/api/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password, isRestaurante }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Erro ao tentar fazer login.');
            }

            handleSuccessfulLogin(data);

        } catch (error) {
            console.error('Erro de login:', error);
            if (error instanceof SyntaxError) {
                showError('Ocorreu um erro inesperado no servidor. Tente novamente.');
            } else {
                showError(error.message);
            }
        }
    });

    function handleSuccessfulLogin(accountData) {
        messageDiv.className = 'message success';
        messageDiv.textContent = 'Login realizado com sucesso! Redirecionando...';
        messageDiv.style.display = 'block';

        localStorage.setItem('usuarioLogado', JSON.stringify(accountData));
        
        setTimeout(() => {
            window.location.href = "home.html";
        }, 1500);
    }

    function showError(message) {
        messageDiv.className = 'message error';
        messageDiv.textContent = message;
        messageDiv.style.display = 'block';
    }
});