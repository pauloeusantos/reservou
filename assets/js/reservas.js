// reservas.js - VERSÃO FINAL COM SIMULAÇÃO DE SUCESSO

document.addEventListener('DOMContentLoaded', () => {
    const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));
    let restauranteId = null;

    // ***** CORREÇÃO 1: URL COMPLETA DA API *****
    const API_URL = 'https://reservou-api.vercel.app';

    // Variáveis globais para armazenar os dados em memória e simular o BD
    let todasAsReservas = [];
    let mapaDeUsuarios = new Map();

    if (!usuarioLogado || usuarioLogado.type !== 'restaurante') {
        bloquearAcesso('Acesso restrito. Por favor, faça login como um restaurante.');
        return;
    } else {
        restauranteId = usuarioLogado.id;
        configurarLinksLaterais(restauranteId);
    }

    const listaReservasFuturas = document.getElementById('listaReservasFuturas');
    const listaReservasAntigas = document.getElementById('listaReservasAntigas');
    const loadingSpinner = document.querySelector('.loading-spinner');
    const limparAntigasBtn = document.getElementById('limparAntigasBtn');
    
    const modalEditar = new bootstrap.Modal(document.getElementById('modalEditar'));
    const salvarBtn = document.getElementById('salvarEdicao');
    
    const alertModal = new bootstrap.Modal(document.getElementById('alertModal'));
    const alertModalBody = document.getElementById('alertModalBody');
    const confirmModal = new bootstrap.Modal(document.getElementById('confirmModal'));
    const confirmModalBody = document.getElementById('confirmModalBody');
    const confirmOkBtn = document.getElementById('confirmOkBtn');

    function configurarLinksLaterais(id) {
        document.getElementById('profileLink').href = `pagina-admin.html?id=${id}`;
        document.getElementById('reservasLink').href = `reservas.html?id=${id}`;
        document.getElementById('editMenuLink').href = `editor-cardapio.html?id=${id}`;
        document.getElementById('viewFeedbacksLink').href = `ver-fb.html?id=${id}`;
    }

    async function carregarDadosIniciais() {
        if(loadingSpinner) loadingSpinner.style.display = 'block';
        try {
            const [reservasResponse, usuariosResponse] = await Promise.all([
                fetch(`${API_URL}/reservas?idRestaurante=${restauranteId}`),
                fetch(`${API_URL}/usuarios`)
            ]);

            if (!reservasResponse.ok || !usuariosResponse.ok) {
                throw new Error('Falha ao buscar dados do servidor.');
            }

            todasAsReservas = await reservasResponse.json();
            const usuarios = await usuariosResponse.json();
            mapaDeUsuarios = new Map(usuarios.map(user => [String(user.id), user.nome]));
            
            renderizarListasCompletas();

        } catch (error) {
            showCustomAlert(error.message);
        } finally {
            if(loadingSpinner) loadingSpinner.style.display = 'none';
        }
    }

    function renderizarListasCompletas() {
        listaReservasFuturas.innerHTML = '';
        listaReservasAntigas.innerHTML = '';

        if (todasAsReservas.length === 0) {
            listaReservasFuturas.innerHTML = '<li class="list-group-item text-center p-4">Nenhuma reserva futura encontrada.</li>';
            listaReservasAntigas.innerHTML = '<li class="list-group-item text-center p-4">Nenhum histórico de reservas.</li>';
            return;
        }

        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        const reservasFuturas = todasAsReservas.filter(r => new Date(r.data.replace(/-/g, '\/')) >= hoje);
        const reservasAntigas = todasAsReservas.filter(r => new Date(r.data.replace(/-/g, '\/')) < hoje);

        if (reservasFuturas.length > 0) {
            reservasFuturas
                .sort((a, b) => new Date(`${a.data}T${a.horario}`) - new Date(`${b.data}T${b.horario}`))
                .forEach(reserva => renderizarItemDeReserva(reserva, listaReservasFuturas));
        } else {
            listaReservasFuturas.innerHTML = '<li class="list-group-item text-center p-4">Nenhuma reserva futura encontrada.</li>';
        }

        if (reservasAntigas.length > 0) {
            reservasAntigas
                .sort((a, b) => new Date(`${b.data}T${b.horario}`) - new Date(`${a.data}T${a.horario}`))
                .forEach(reserva => renderizarItemDeReserva(reserva, listaReservasAntigas, true));
        } else {
            listaReservasAntigas.innerHTML = '<li class="list-group-item text-center p-4">Nenhum histórico de reservas.</li>';
        }
    }

    function renderizarItemDeReserva(reserva, lista, isAntiga = false) {
        const nomeUsuario = mapaDeUsuarios.get(String(reserva.idUsuario)) || 'Usuário não encontrado';
        const li = document.createElement('li');
        const statusClass = reserva.status ? reserva.status.toLowerCase() : 'pendente';
        li.className = `list-group-item d-flex justify-content-between align-items-center flex-wrap status-${statusClass}`;
        if(isAntiga) li.classList.add('reserva-antiga');
        
        li.innerHTML = `
          <div class="reserva-info me-3 mb-2 mb-md-0">
            <strong>Mesa ${reserva.numeroMesa}</strong> - 
            <span class="reserva-status ${statusClass}">${reserva.status || 'Pendente'}</span>
            <br>
            <small class="text-muted">
                <i class="bi bi-person-circle me-1"></i>${nomeUsuario} | 
                ${new Date(reserva.data.replace(/-/g, '\/')).toLocaleDateString()} às ${reserva.horario} | 
                ${reserva.qtdPessoas} pessoa(s)
            </small>
          </div>
          <div class="reserva-actions">
            <button class="btn btn-sm btn-edit" onclick="window.abrirModalEditar('${reserva.id}')">Editar</button>
            <button class="btn btn-sm btn-delete ms-2" onclick="window.excluirReserva('${reserva.id}')">Excluir</button>
          </div>
        `;
        lista.appendChild(li);
    }
    
    window.abrirModalEditar = (id) => {
        const reserva = todasAsReservas.find(r => r.id == id);
        if (reserva) {
            document.getElementById('editId').value = reserva.id;
            document.getElementById('editStatus').value = reserva.status || 'Pendente';
            document.getElementById('editNumeroMesa').value = reserva.numeroMesa;
            document.getElementById('editQtdPessoas').value = reserva.qtdPessoas;
            document.getElementById('editData').value = reserva.data;
            document.getElementById('editHorario').value = reserva.horario;
            document.getElementById('editEstacionamento').value = reserva.estacionamento || 'Não';
            modalEditar.show();
        } else {
            showCustomAlert('Erro: Reserva não encontrada localmente.');
        }
    };

    // ***** CORREÇÃO 2: LÓGICA DE SIMULAÇÃO PARA SALVAR/EDITAR *****
    salvarBtn.addEventListener('click', async () => {
        const id = document.getElementById('editId').value;
        const dadosAtualizados = {
            status: document.getElementById('editStatus').value,
            numeroMesa: parseInt(document.getElementById('editNumeroMesa').value, 10),
            qtdPessoas: parseInt(document.getElementById('editQtdPessoas').value, 10),
            data: document.getElementById('editData').value,
            horario: document.getElementById('editHorario').value,
            estacionamento: document.getElementById('editEstacionamento').value,
        };

        // 1. ATUALIZA LOCALMENTE
        const index = todasAsReservas.findIndex(r => r.id == id);
        if (index !== -1) {
            todasAsReservas[index] = { ...todasAsReservas[index], ...dadosAtualizados };
        }
        
        // 2. ATUALIZA A TELA E DÁ FEEDBACK DE SUCESSO
        modalEditar.hide();
        renderizarListasCompletas();
        showCustomAlert('Reserva atualizada com sucesso! (A alteração é apenas visual)');

        // 3. TENTA SALVAR NO SERVIDOR (VAI FALHAR, MAS SILENCIOSAMENTE)
        try {
            await fetch(`${API_URL}/reservas/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dadosAtualizados)
            });
        } catch(error) {
            console.warn(`Aviso: A API é somente leitura. A edição da reserva ${id} foi salva apenas na visualização atual.`, error);
        }
    });

    // ***** CORREÇÃO 3: LÓGICA DE SIMULAÇÃO PARA EXCLUIR *****
    window.excluirReserva = async (id) => {
        const confirmed = await showCustomConfirm('Deseja realmente excluir esta reserva?');
        if (confirmed) {
            // 1. ATUALIZA LOCALMENTE
            const index = todasAsReservas.findIndex(r => r.id == id);
            if (index !== -1) {
                todasAsReservas.splice(index, 1);
            }

            // 2. ATUALIZA A TELA E DÁ FEEDBACK DE SUCESSO
            renderizarListasCompletas();
            showCustomAlert('Reserva excluída com sucesso! (A alteração é apenas visual)');

            // 3. TENTA EXCLUIR NO SERVIDOR (VAI FALHAR, MAS SILENCIOSAMENTE)
            try {
                await fetch(`${API_URL}/reservas/${id}`, { method: 'DELETE' });
            } catch(error) {
                console.warn(`Aviso: A API é somente leitura. A exclusão da reserva ${id} foi feita apenas na visualização atual.`, error);
            }
        }
    };

    async function limparReservasAntigas() {
        const confirmed = await showCustomConfirm('Isso excluirá permanentemente todas as reservas do histórico. Deseja continuar?');
        if (!confirmed) return;

        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const reservasAntigasIds = todasAsReservas
            .filter(r => new Date(r.data.replace(/-/g, '\/')) < hoje)
            .map(r => r.id);

        if (reservasAntigasIds.length === 0) {
            showCustomAlert('Não há reservas antigas para limpar.');
            return;
        }

        // 1. ATUALIZA LOCALMENTE
        todasAsReservas = todasAsReservas.filter(r => new Date(r.data.replace(/-/g, '\/')) >= hoje);
        
        // 2. ATUALIZA A TELA E DÁ FEEDBACK DE SUCESSO
        renderizarListasCompletas();
        showCustomAlert(`${reservasAntigasIds.length} reserva(s) do histórico foram excluídas com sucesso! (A alteração é apenas visual)`);

        // 3. TENTA EXCLUIR NO SERVIDOR (VAI FALHAR, MAS SILENCIOSAMENTE)
        try {
            await Promise.all(
                reservasAntigasIds.map(id => fetch(`${API_URL}/reservas/${id}`, { method: 'DELETE' }))
            );
        } catch (error) {
            console.warn(`Aviso: A API é somente leitura. A limpeza do histórico foi feita apenas na visualização atual.`, error);
        }
    }

    limparAntigasBtn.addEventListener('click', limparReservasAntigas);

    function bloquearAcesso(message) {
        document.body.innerHTML = `<div style="text-align: center; padding: 50px; font-family: sans-serif; color: #333;"><h1 style="color: #8B0000;">Acesso Negado</h1><p style="font-size: 1.2rem;">${message}</p><a href="/home.html" style="display: inline-block; padding: 12px 25px; background-color: #8B0000; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; font-weight: bold;">Voltar para a Home</a></div>`;
    }

    function showCustomAlert(message) {
        alertModalBody.textContent = message;
        alertModal.show();
    }

    function showCustomConfirm(message) {
        return new Promise((resolve) => {
            confirmModalBody.textContent = message;
            confirmModal.show();
            const onConfirm = () => { confirmModal.hide(); resolve(true); };
            const onHide = () => { confirmOkBtn.removeEventListener('click', onConfirm); resolve(false); };
            confirmOkBtn.addEventListener('click', onConfirm, { once: true });
            confirmModal._element.addEventListener('hidden.bs.modal', onHide, { once: true });
        });
    }

    carregarDadosIniciais();
});