document.addEventListener('DOMContentLoaded', () => {
    // --- DADOS FICTÍCIOS DE ALUNOS ---
    let allAlunos = [
        { matricula: '2026001', nome: 'João Silva', turma: '3º Ano A', status: 'Ativo' },          
        { matricula: '2026002', nome: 'Maria Oliveira', turma: '1º Ano B', status: 'Ativo' },
        { matricula: '2026003', nome: 'Carlos Santos', turma: '2º Ano C', status: 'Inativo' },
        { matricula: '2026004', nome: 'Ana Souza', turma: '1º Ano A', status: 'Ativo' },
        { matricula: '2026005', nome: 'Pedro Álvares', turma: '3º Ano B', status: 'Inativo' },
        { matricula: '2026006', nome: 'Lucas Mendes', turma: '2º Ano A', status: 'Ativo' },
        { matricula: '2026007', nome: 'Beatriz Costa', turma: '1º Ano C', status: 'Ativo' }
    ];

    const timestampEl = document.getElementById('timestamp');
    const searchInput = document.getElementById('search-input');
    const analiseThead = document.getElementById('analise-thead');
    const analiseTbody = document.getElementById('analise-tbody');
    const statusFilterButtons = document.getElementById('status-filter-buttons');
    const chamadaTbody = document.getElementById('chamada-tbody');
    const chamadaDataInput = document.getElementById('chamada-data');
    const btnSalvarChamada = document.getElementById('btn-salvar-chamada');

    let currentSort = { key: 'nome', order: 'asc' };

    // ==========================================
    // INICIALIZAÇÃO AUTOMÁTICA
    // ==========================================
    initializeApp();

    function initializeApp() {
    // 1. Coisas que rodam em todas as páginas
    try {
        updateTimestamp();
        setInterval(updateTimestamp, 1000);
    } catch (e) { console.error(e); }

    // 2. Lógica específica por página (Use o ID do container como teste)
    
    // Se estiver no Dashboard
    if (document.getElementById('calendar-container')) {
        renderCalendar();
        if (typeof ui.updateDashboardGeral === 'function') ui.updateDashboardGeral([], allAlunos);
        if (typeof ui.renderStatusChart === 'function') ui.renderStatusChart(allAlunos);
    }

    // Se estiver no Calendário Anual
    if (document.getElementById('calendario-anual-container')) {
        renderAnualCalendar();
    }

    // Se estiver na Lista de Alunos
    if (document.getElementById('analise-tbody')) {
        sortAndRenderTable();
    }

    // Se estiver na Chamada
    if (document.getElementById('chamada-tbody')) {
        carregarChamada();
    }
}

    // ==========================================
    // EVENTOS E TABELAS (Mantidos do anterior)
    // ==========================================
    if(statusFilterButtons) {
        statusFilterButtons.addEventListener('click', (e) => {
            const target = e.target.closest('.filter-btn');
            if (!target) return;
            statusFilterButtons.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
            target.classList.add('active');
            sortAndRenderTable();
        });
    }

    if(searchInput) searchInput.addEventListener('input', sortAndRenderTable);

    if(analiseThead) {
        analiseThead.addEventListener('click', (e) => {
            const header = e.target.closest('th');
            if (!header || !header.dataset.sort) return;
            const sortKey = header.dataset.sort;
            currentSort.order = (currentSort.key === sortKey && currentSort.order === 'asc') ? 'desc' : 'asc';
            currentSort.key = sortKey;
            sortAndRenderTable();
        });
    }

    if (analiseTbody) {
        analiseTbody.addEventListener('click', (e) => {
            const btnEdit = e.target.closest('.edit-btn');
            const btnDelete = e.target.closest('.delete-btn');
            if (btnEdit) alert(`Função de Editar ativada para a matrícula: ${btnEdit.dataset.id}`);
            if (btnDelete) {
                const matricula = btnDelete.dataset.id;
                const aluno = allAlunos.find(a => a.matricula === matricula);
                if (confirm(`Tem certeza que deseja excluir o aluno ${aluno.nome}?`)) {
                    allAlunos = allAlunos.filter(a => a.matricula !== matricula);
                    sortAndRenderTable();
                    if (typeof ui.populateStationsMenu === 'function') ui.populateStationsMenu(allAlunos); 
                }
            }
        });
    }

    if (btnSalvarChamada) {
        btnSalvarChamada.addEventListener('click', () => {
            const dataSelecionada = chamadaDataInput.value;
            alert(`A chamada do dia ${dataSelecionada.split('-').reverse().join('/')} foi salva com sucesso!`);
        });
    }

    function updateTimestamp() {
       if(timestampEl) timestampEl.textContent = new Date().toLocaleString('pt-BR', { dateStyle: 'full', timeStyle: 'medium' });
    }

    function getFilteredAlunos() {
        const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
        const activeFilter = statusFilterButtons ? statusFilterButtons.querySelector('.active') : null;
        if (!activeFilter) return allAlunos;
        const activeStatus = activeFilter.dataset.status; 
        return allAlunos.filter(aluno => {
            const searchMatch = aluno.nome.toLowerCase().includes(searchTerm) || String(aluno.matricula).includes(searchTerm);
            if (activeStatus === 'all') return searchMatch;
            return searchMatch && aluno.status.toLowerCase() === activeStatus;
        });
    }

    function sortAndRenderTable() {
        const alunosToRender = getFilteredAlunos(); 
        alunosToRender.sort((a, b) => {
            const valA = a[currentSort.key] || '';
            const valB = b[currentSort.key] || '';
            const order = currentSort.order === 'asc' ? 1 : -1;
            if (typeof valA === 'string' && typeof valB === 'string') return valA.localeCompare(valB) * order;
            return String(valA).localeCompare(String(valB)) * order;
        });
        if (typeof ui.populateAnaliseTable === 'function') {
            ui.populateAnaliseTable(alunosToRender);
            ui.updateSortIcons(currentSort.key, currentSort.order);
        }
    }

    function carregarChamada() {
        if (!chamadaTbody) return;
        chamadaTbody.innerHTML = '';
        if (chamadaDataInput && !chamadaDataInput.value) chamadaDataInput.value = new Date().toISOString().split('T')[0];
        
        const alunosAtivos = allAlunos.filter(a => a.status.toLowerCase() === 'ativo');
        if (alunosAtivos.length === 0) {
            chamadaTbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">Nenhum aluno ativo.</td></tr>';
            return;
        }

        alunosAtivos.forEach(aluno => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${aluno.matricula}</td>
                <td style="font-weight: 500;">${aluno.nome}</td>
                <td>${aluno.turma}</td>
                <td>
                    <div style="display: flex; gap: 15px; align-items: center;">
                        <label style="cursor: pointer; font-weight: 500;">
                            <input type="radio" name="presenca-${aluno.matricula}" value="P" checked> <span style="color: var(--success-color);">Presente</span>
                        </label>
                        <label style="cursor: pointer; font-weight: 500;">
                            <input type="radio" name="presenca-${aluno.matricula}" value="F"> <span style="color: #343a40;">Falta</span>
                        </label>
                    </div>
                </td>
            `;
            chamadaTbody.appendChild(tr);
        });
    }

    // ==========================================
    // CALENDÁRIO DO DASHBOARD (1 Mês Atual)
    // ==========================================
    function renderCalendar() {
        const container = document.getElementById('calendar-container');
        const monthYearLabel = document.getElementById('calendar-month-year');
        if (!container) return;

        container.innerHTML = '';
        const dataAtual = new Date();
        const mes = dataAtual.getMonth(); 
        const ano = dataAtual.getFullYear();

        const nomesMeses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
        if(monthYearLabel) monthYearLabel.textContent = `${nomesMeses[mes]} ${ano}`;

        const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        diasSemana.forEach(dia => {
            const divDia = document.createElement('div');
            divDia.className = 'calendar-day-header';
            divDia.textContent = dia;
            container.appendChild(divDia);
        });

        const primeiroDia = new Date(ano, mes, 1).getDay(); 
        const diasNoMes = new Date(ano, mes + 1, 0).getDate();

        // Eventos Mockados no Dashboard
        const eventosMes = [
            { dia: 12, tipo: 'jogo', titulo: 'Grêmio x Boca', msg: 'Fechado' },
            { dia: 21, tipo: 'jogo', titulo: 'Arena', msg: 'Sem Atend.' },
            { dia: 15, tipo: 'social', titulo: 'Cestas', msg: '14h - 17h' }
        ];

        for (let i = 0; i < primeiroDia; i++) {
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'calendar-day empty';
            container.appendChild(emptyDiv);
        }

        for (let dia = 1; dia <= diasNoMes; dia++) {
            const dayDiv = document.createElement('div');
            dayDiv.className = 'calendar-day';
            if (dia === dataAtual.getDate()) dayDiv.classList.add('today');

            dayDiv.innerHTML = `<span style="display: block; width: 100%; text-align: right; color: #888;">${dia}</span>`;

            const eventoHj = eventosMes.find(e => e.dia === dia);
            if (eventoHj) {
                const classCSS = eventoHj.tipo === 'jogo' ? 'event-jogo' : 'event-social';
                dayDiv.innerHTML += `
                    <div class="event-badge ${classCSS}">
                        ${eventoHj.titulo}
                        <br><small style="opacity: 0.8; display: block; margin-top: 2px;">${eventoHj.msg}</small>
                    </div>
                `;
            }
            container.appendChild(dayDiv);
        }
    }

    // ==========================================
    // NOVO: CALENDÁRIO ANUAL (12 Meses)
    // ==========================================
    function renderAnualCalendar() {
        const container = document.getElementById('calendario-anual-container');
        if (!container) return;
        
        container.innerHTML = '';
        const anoAtual = new Date().getFullYear();
        const dataAtual = new Date(); // Para destacar o dia de hoje
        const nomesMeses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
        const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        
        // Eventos globais (meses de 0 a 11)
        const eventosAno = [
            { mes: 5, dia: 12, tipo: 'jogo', titulo: 'Grêmio x Boca' },   // Junho
            { mes: 5, dia: 15, tipo: 'social', titulo: 'Cestas' },        // Junho
            { mes: 6, dia: 10, tipo: 'social', titulo: 'Ação Férias' },   // Julho
            { mes: 8, dia: 15, tipo: 'jogo', titulo: 'Grêmio Aniversário' } // Setembro
        ];

        // Loop para gerar os 12 meses
        for (let mes = 0; mes < 12; mes++) {
            const monthCard = document.createElement('div');
            monthCard.className = 'month-card';
            
            // Título do Mês
            monthCard.innerHTML = `<div class="month-title">${nomesMeses[mes]}</div>`;
            
            // Grid do Mês
            const gridDiv = document.createElement('div');
            gridDiv.className = 'calendar-grid';
            
            // Dias da semana (Dom, Seg...)
            diasSemana.forEach(dia => {
                const divDia = document.createElement('div');
                divDia.className = 'calendar-day-header';
                divDia.style.padding = '2px 0'; // Compacto
                divDia.textContent = dia;
                gridDiv.appendChild(divDia);
            });

            const primeiroDia = new Date(anoAtual, mes, 1).getDay(); 
            const diasNoMes = new Date(anoAtual, mes + 1, 0).getDate();

            // Espaços vazios antes do dia 1
            for (let i = 0; i < primeiroDia; i++) {
                const emptyDiv = document.createElement('div');
                emptyDiv.className = 'calendar-day empty';
                emptyDiv.style.minHeight = '40px'; // Mais compacto para o ano
                gridDiv.appendChild(emptyDiv);
            }

            // Dias do mês
            for (let dia = 1; dia <= diasNoMes; dia++) {
                const dayDiv = document.createElement('div');
                dayDiv.className = 'calendar-day';
                dayDiv.style.minHeight = '40px'; // Mais compacto
                
                // Destacar se for o dia exato de hoje
                if (dia === dataAtual.getDate() && mes === dataAtual.getMonth() && anoAtual === dataAtual.getFullYear()) {
                    dayDiv.classList.add('today');
                }

                dayDiv.innerHTML = `<span style="display: block; width: 100%; text-align: right; color: #555; font-weight: 500;">${dia}</span>`;

                // Adiciona a etiqueta do evento se existir
                const evento = eventosAno.find(e => e.mes === mes && e.dia === dia);
                if (evento) {
                    const classCSS = evento.tipo === 'jogo' ? 'event-jogo' : 'event-social';
                    dayDiv.innerHTML += `
                        <div class="event-badge ${classCSS}" style="font-size: 0.65em; padding: 2px; text-align: center; margin-top: 2px;">
                            ${evento.titulo}
                        </div>
                    `;
                }

                gridDiv.appendChild(dayDiv);
            }
            
            monthCard.appendChild(gridDiv);
            container.appendChild(monthCard);
        }
    }
});