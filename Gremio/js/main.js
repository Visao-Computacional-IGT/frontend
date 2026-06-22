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

    // --- BANCO DE DADOS LOCAL (COM PROTEÇÃO CONTRA ERROS) ---
    let eventosAno = [];
    try {
        const salvos = localStorage.getItem('eventosGremio');
        if (salvos) {
            eventosAno = JSON.parse(salvos);
        } else {
            // Se não tiver nada salvo, carrega estes eventos como teste
            eventosAno = [
                { mes: 5, dia: 12, tipo: 'jogo', titulo: 'Grêmio x Boca' },
                { mes: 5, dia: 15, tipo: 'social', titulo: 'Cestas Básicas' },
                { mes: 6, dia: 10, tipo: 'social', titulo: 'Ação Férias' },   
                { mes: 8, dia: 15, tipo: 'jogo', titulo: 'Aniv. Grêmio' },
                { mes: 8, dia: 20, tipo: 'reuniao', titulo: 'Reunião Diretoria' } 
            ];
        }
    } catch (error) {
        console.error("Erro ao ler o cache do calendário. Resetando...", error);
        localStorage.removeItem('eventosGremio'); // Limpa o erro
        eventosAno = [];
    }

    const timestampEl = document.getElementById('timestamp');
    const searchInput = document.getElementById('search-input');
    const analiseThead = document.getElementById('analise-thead');
    const analiseTbody = document.getElementById('analise-tbody');
    const statusFilterButtons = document.getElementById('status-filter-buttons');
    const chamadaTbody = document.getElementById('chamada-tbody');
    const chamadaDataInput = document.getElementById('chamada-data');
    const btnSalvarChamada = document.getElementById('btn-salvar-chamada');
    const btnNovoEvento = document.getElementById('btn-novo-evento');

    let currentSort = { key: 'nome', order: 'asc' };

    // ==========================================
    // INICIALIZAÇÃO
    // ==========================================
    try {
        updateTimestamp();
        setInterval(updateTimestamp, 1000);
    } catch (e) {}

    // Roda a função certa dependendo de qual página está aberta
    if (document.getElementById('calendar-container')) renderCalendar();
    if (document.getElementById('calendario-anual-container')) renderAnualCalendar();
    if (document.getElementById('analise-tbody')) sortAndRenderTable();
    if (document.getElementById('chamada-tbody')) carregarChamada();

    // ==========================================
    // BOTÃO: NOVO EVENTO
    // ==========================================
    if (btnNovoEvento) {
        btnNovoEvento.addEventListener('click', () => {
            const titulo = prompt("1. Qual o nome do evento?");
            if (!titulo) return;

            const dataStr = prompt("2. Qual a data? (Formato DD/MM. Ex: 15/06)");
            if (!dataStr || !dataStr.includes('/')) {
                alert("Data inválida. Use o formato DD/MM.");
                return;
            }

            const tipoStr = prompt("3. Qual o tipo do evento?\n[ 1 ] Jogos\n[ 2 ] Social\n[ 3 ] Reunião");
            let tipo = 'jogo';
            if (tipoStr === '2') tipo = 'social';
            if (tipoStr === '3') tipo = 'reuniao';

            const [dia, mes] = dataStr.split('/');
            
            eventosAno.push({
                mes: parseInt(mes) - 1,
                dia: parseInt(dia),
                tipo: tipo,
                titulo: titulo
            });

            localStorage.setItem('eventosGremio', JSON.stringify(eventosAno));
            renderAnualCalendar();
            alert("Evento adicionado com sucesso!");
        });
    }

    // ==========================================
    // CALENDÁRIO ANUAL (Página de Calendário)
    // ==========================================
    function renderAnualCalendar() {
        const container = document.getElementById('calendario-anual-container');
        if (!container) return;
        
        container.innerHTML = '';
        const anoAtual = 2026; 
        const dataAtual = new Date(); 
        const nomesMeses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
        const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        
        for (let mes = 0; mes < 12; mes++) {
            const monthCard = document.createElement('div');
            monthCard.className = 'month-card';
            monthCard.innerHTML = `<div class="month-title">${nomesMeses[mes]}</div>`;
            
            const gridDiv = document.createElement('div');
            gridDiv.className = 'calendar-grid';
            
            diasSemana.forEach(dia => {
                const divDia = document.createElement('div');
                divDia.className = 'calendar-day-header';
                divDia.style.padding = '2px 0';
                divDia.textContent = dia;
                gridDiv.appendChild(divDia);
            });

            const primeiroDia = new Date(anoAtual, mes, 1).getDay(); 
            const diasNoMes = new Date(anoAtual, mes + 1, 0).getDate();

            for (let i = 0; i < primeiroDia; i++) {
                const emptyDiv = document.createElement('div');
                emptyDiv.className = 'calendar-day empty';
                emptyDiv.style.minHeight = '40px'; 
                gridDiv.appendChild(emptyDiv);
            }

            for (let dia = 1; dia <= diasNoMes; dia++) {
                const dayDiv = document.createElement('div');
                dayDiv.className = 'calendar-day';
                dayDiv.style.minHeight = '40px';
                
                if (dia === dataAtual.getDate() && mes === dataAtual.getMonth() && dataAtual.getFullYear() === anoAtual) {
                    dayDiv.classList.add('today');
                }

                dayDiv.innerHTML = `<span style="display: block; width: 100%; text-align: right; color: #555; font-weight: 500;">${dia}</span>`;

                const eventosDoDia = eventosAno.filter(e => e.mes === mes && e.dia === dia);
                
                eventosDoDia.forEach(evento => {
                    let classesCSS = '';
                    if (evento.tipo === 'jogo') classesCSS = 'bg-primary text-white border-bottom border-dark';
                    else if (evento.tipo === 'social') classesCSS = 'bg-success text-white';
                    else if (evento.tipo === 'reuniao') classesCSS = 'bg-warning text-dark';

                    dayDiv.innerHTML += `
                        <div class="event-badge border-rounded-sm ${classesCSS}" style="font-size: 0.65em; padding: 3px; text-align: center; margin-top: 2px;">
                            ${evento.titulo}
                        </div>
                    `;
                });

                gridDiv.appendChild(dayDiv);
            }
            monthCard.appendChild(gridDiv);
            container.appendChild(monthCard);
        }
    }

    // ==========================================
    // MINI CALENDÁRIO (Página de Dashboard)
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
        const eventosHoje = eventosAno.filter(e => e.mes === mes);

        for (let i = 0; i < primeiroDia; i++) {
            const empty = document.createElement('div');
            empty.className = 'calendar-day empty';
            container.appendChild(empty);
        }

        for (let dia = 1; dia <= diasNoMes; dia++) {
            const dayDiv = document.createElement('div');
            dayDiv.className = 'calendar-day';
            if (dia === dataAtual.getDate()) dayDiv.classList.add('today');

            dayDiv.innerHTML = `<span style="display: block; width: 100%; text-align: right; color: #888;">${dia}</span>`;

            const eventoHj = eventosHoje.find(e => e.dia === dia);
            if (eventoHj) {
                const classCSS = eventoHj.tipo === 'jogo' ? 'bg-primary text-white' : 'bg-success text-white';
                dayDiv.innerHTML += `
                    <div class="event-badge border-rounded-sm ${classCSS} mt-1 p-1">
                        ${eventoHj.titulo}
                    </div>
                `;
            }
            container.appendChild(dayDiv);
        }
    }

    // ==========================================
    // RESTANTE DO CÓDIGO (Tabelas e Chamada)
    // ==========================================
    if(statusFilterButtons) {
        statusFilterButtons.addEventListener('click', (e) => {
            const target = e.target.closest('.btn-filter');
            if (!target) return;
            statusFilterButtons.querySelectorAll('.btn-filter').forEach(btn => btn.classList.remove('active'));
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
        if (!analiseTbody) return;
        const alunosToRender = getFilteredAlunos(); 
        
        alunosToRender.sort((a, b) => {
            const valA = a[currentSort.key] || '';
            const valB = b[currentSort.key] || '';
            const order = currentSort.order === 'asc' ? 1 : -1;
            if (typeof valA === 'string' && typeof valB === 'string') return valA.localeCompare(valB) * order;
            return String(valA).localeCompare(String(valB)) * order;
        });

        analiseTbody.innerHTML = '';
        
        alunosToRender.forEach(aluno => {
            const tr = document.createElement('tr');
            const statusColor = aluno.status === 'Ativo' ? 'text-success' : 'text-error';

            tr.innerHTML = `
                <td class="font-weight-bold">${aluno.matricula}</td>
                <td>${aluno.nome}</td>
                <td>${aluno.turma}</td>
                <td>Aluno</td>
                <td class="${statusColor} font-weight-bold">${aluno.status}</td>
                <td>
                    <button class="btn btn-link text-muted p-1" title="Editar"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-link text-error p-1" title="Excluir"><i class="fas fa-trash"></i></button>
                </td>
            `;
            analiseTbody.appendChild(tr);
        });

        const totalLabel = document.getElementById('total-alunos-lista');
        if(totalLabel) totalLabel.textContent = `Mostrando ${alunosToRender.length} alunos cadastrados.`;
    }

    function carregarChamada() {
        if (!chamadaTbody) return;
        chamadaTbody.innerHTML = '';
        if (chamadaDataInput && !chamadaDataInput.value) chamadaDataInput.value = new Date().toISOString().split('T')[0];
        
        const alunosAtivos = allAlunos.filter(a => a.status.toLowerCase() === 'ativo');
        
        document.getElementById('total-alunos-chamada').textContent = alunosAtivos.length;
        document.getElementById('total-presentes').textContent = alunosAtivos.length; 
        document.getElementById('total-ausentes').textContent = '0';

        if (alunosAtivos.length === 0) {
            chamadaTbody.innerHTML = '<tr><td colspan="5" class="text-center p-4">Nenhum aluno ativo.</td></tr>';
            return;
        }

        alunosAtivos.forEach(aluno => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${aluno.matricula}</td>
                <td style="font-weight: 500;">${aluno.nome}</td>
                <td>${aluno.turma}</td>
                <td>
                    <div class="d-flex gap-15 align-center">
                        <label class="cursor-pointer font-weight-bold d-flex align-center gap-5">
                            <input type="radio" name="presenca-${aluno.matricula}" value="P" checked> <span class="text-success">Presente</span>
                        </label>
                        <label class="cursor-pointer font-weight-bold d-flex align-center gap-5">
                            <input type="radio" name="presenca-${aluno.matricula}" value="F"> <span class="text-error">Falta</span>
                        </label>
                    </div>
                </td>
                <td><input type="text" class="form-control p-1" placeholder="Ex: Atestado"></td>
            `;
            chamadaTbody.appendChild(tr);
        });
    }
});