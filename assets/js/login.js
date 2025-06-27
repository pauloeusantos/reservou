// login.js - VERSÃO CORRIGIDA

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const messageDiv = document.getElementById('message');
    const tipoContaToggle = document.getElementById('tipoContaToggle');

    if (!loginForm || !messageDiv || !tipoContaToggle) {
        console.error("Erro: Elementos essenciais do formulário não encontrados.");
        return;
    }

    // Lógica para o switch de labels (continua a mesma)
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
            // 1. A URL agora aponta para a nossa rota customizada e segura
            const response = await fetch('/api/login', {
                method: 'POST', // 2. O método agora é POST
                headers: {
                    'Content-Type': 'application/json',
                },
                // 3. Enviamos os dados no corpo da requisição
                body: JSON.stringify({ email, password, isRestaurante }),
            });

            const data = await response.json();

            // 4. Se a resposta não for OK (ex: erro 401), o backend já nos deu a mensagem de erro
            if (!response.ok) {
                throw new Error(data.message || 'Erro ao tentar fazer login.');
            }

            // 5. Se o login foi bem-sucedido, o 'data' já é o objeto do usuário logado
            handleSuccessfulLogin(data);

        } catch (error) {
            console.error('Erro de login:', error);
            showError(error.message);
        }
    });

    function handleSuccessfulLogin(accountData) {
        messageDiv.className = 'message success';
        messageDiv.textContent = 'Login realizado com sucesso! Redirecionando...';
        messageDiv.style.display = 'block';

        // Salva os dados recebidos do backend no localStorage
        localStorage.setItem('usuarioLogado', JSON.stringify(accountData));
        
        // Redireciona para a home
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