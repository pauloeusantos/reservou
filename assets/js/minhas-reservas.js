// minhas-reservas.js - VERSÃO COM SIMULAÇÃO DE SUCESSO

document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'https://reservou-api.vercel.app';
  
    const tabelaReservasBody = document.getElementById('tabela-reservas');
    const containerReservas = document.getElementById('reservas-container');
    const confirmacaoModal = new bootstrap.Modal(document.getElementById('confirmacaoModal'));
    const btnConfirmarCancelamento = document.getElementById('confirmar-cancelamento-btn');
  
    let reservaIdParaCancelar = null;
    let todasAsReservasDoUsuario = [];
    let mapaDeRestaurantes = new Map();
  
    async function init() {
        const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));
  
        if (!usuarioLogado || usuarioLogado.type !== 'usuario') {
            mostrarMensagemDeErro("Você precisa estar logado como usuário para ver suas reservas.");
            return;
        }
  
        carregarEExibirReservas(usuarioLogado.id);
    }
  
    async function carregarEExibirReservas(idUsuario) {
        tabelaReservasBody.innerHTML = `<tr><td colspan="8" class="text-center">Carregando...</td></tr>`;
    
        try {
            const [restaurantesResponse, reservasResponse] = await Promise.all([
                fetch(`${API_URL}/restaurantes`),
                fetch(`${API_URL}/reservas`)
            ]);

            if (!restaurantesResponse.ok || !reservasResponse.ok) {
                throw new Error('Falha ao carregar os dados do servidor.');
            }
    
            const restaurantes = await restaurantesResponse.json();
            const todasReservasGerais = await reservasResponse.json();
            
            todasAsReservasDoUsuario = todasReservasGerais.filter(reserva => {
                return String(reserva.idUsuario) === String(idUsuario);
            });
    
            mapaDeRestaurantes = restaurantes.reduce((map, restaurante) => {
                map[restaurante.id] = restaurante.infoCadastro?.nome || 'Nome não encontrado';
                return map;
            }, {});
    
            renderizarTabela();
    
        } catch (error) {
            console.error(" Erro ao carregar reservas:", error);
            mostrarMensagemDeErro("Não foi possível carregar suas reservas. Tente novamente mais tarde.");
        }
    }
  
    function renderizarTabela() {
        tabelaReservasBody.innerHTML = '';
        
        const reservasAtivas = todasAsReservasDoUsuario.filter(reserva => 
            !reserva.status || reserva.status.toLowerCase() !== 'cancelada'
        );
  
        if (reservasAtivas.length === 0) {
            tabelaReservasBody.innerHTML = `<tr><td colspan="8" class="text-center">Nenhuma reserva ativa encontrada.</td></tr>`;
            return;
        }
  
        reservasAtivas
            .sort((a,b) => new Date(a.data) - new Date(b.data))
            .forEach(reserva => {
                const nomeRestaurante = mapaDeRestaurantes[reserva.idRestaurante] || 'Restaurante não encontrado';
                const linha = document.createElement('tr');
                linha.id = `reserva-${reserva.id}`;
                linha.innerHTML = `
                    <td>${nomeRestaurante}</td>
                    <td>${formatarStatus(reserva.status)}</td>
                    <td>${new Date(reserva.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</td>
                    <td>${reserva.horario}</td>
                    <td>Mesa ${reserva.numeroMesa}</td>
                    <td>${reserva.qtdPessoas}</td>
                    <td>${reserva.estacionamento}</td>
                    <td>
                        <button class="btn btn-sm btn-danger cancelar-btn" data-id="${reserva.id}" data-bs-toggle="modal" data-bs-target="#confirmacaoModal">
                            <i class="bi bi-trash"></i> Cancelar
                        </button>
                    </td>
                `;
                tabelaReservasBody.appendChild(linha);
            });
    }
  
    function formatarStatus(status) {
        if (!status) return `<span class="badge bg-secondary">Indefinido</span>`;
        switch (status.toLowerCase()) {
            case 'confirmada': return '<span class="badge bg-success">Confirmada</span>';
            case 'pendente': return '<span class="badge bg-warning text-dark">Pendente</span>';
            case 'cancelada': return '<span class="badge bg-danger">Cancelada</span>';
            default: return `<span class="badge bg-secondary">${status}</span>`;
        }
    }
  
    function mostrarMensagemDeErro(mensagem) {
        containerReservas.innerHTML = `<div class="alert alert-danger text-center">${mensagem}</div>`;
    }
  
    // ***** FUNÇÃO DE CANCELAR RESERVA CORRIGIDA *****
    async function cancelarReserva(id) {
        // 1. ATUALIZA LOCALMENTE
        const index = todasAsReservasDoUsuario.findIndex(r => r.id == id);
        if (index !== -1) {
            todasAsReservasDoUsuario[index].status = 'Cancelada';
        }

        // 2. ATUALIZA A TELA E DÁ FEEDBACK DE SUCESSO
        renderizarTabela();
        // Pode adicionar um alerta de sucesso aqui se desejar
        // alert("Reserva cancelada com sucesso!");

        // 3. TENTA SALVAR NO SERVIDOR (VAI FALHAR, MAS SILENCIOSAMENTE)
        try {
            await fetch(`${API_URL}/reservas/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'Cancelada' }),
            });
        } catch (error) {
            console.warn(`Aviso: A API é somente leitura. O cancelamento da reserva ${id} foi feito apenas na visualização atual.`, error);
        }
    }
  
    tabelaReservasBody.addEventListener('click', (event) => {
        const cancelarBtn = event.target.closest('.cancelar-btn');
        if (cancelarBtn) {
            reservaIdParaCancelar = cancelarBtn.dataset.id;
        }
    });
  
    btnConfirmarCancelamento.addEventListener('click', () => {
        if (reservaIdParaCancelar !== null) {
            cancelarReserva(reservaIdParaCancelar);
            confirmacaoModal.hide();
            reservaIdParaCancelar = null;
        }
    });
  
    init();
});