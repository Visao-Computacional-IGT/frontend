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

    // --- FERIADOS NACIONAIS FIXOS ---
    const feriadosFixos = [
        { mes: 0, dia: 1, titulo: 'Ano Novo' },
        { mes: 3, dia: 21, titulo: 'Tiradentes' },
        { mes: 4, dia: 1, titulo: 'Dia do Trabalhador' },
        { mes: 8, dia: 7, titulo: 'Independência do Brasil' },
        { mes: 9, dia: 12, titulo: 'Nossa Sra. Aparecida' },
        { mes: 10, dia: 2, titulo: 'Finados' },
        { mes: 10, dia: 15, titulo: 'Proclamação da República' },
        { mes: 11, dia: 25, titulo: 'Natal' }
    ];

    // --- BANCO DE DADOS LOCAL ---
    let eventosAno = [];
    try {
        const salvos = localStorage.getItem('eventosGremio');
        if (salvos) {
            eventosAno = JSON.parse(salvos);
        } else {
            eventosAno = [
                { ano: new Date().getFullYear(), mes: 5, dia: 12, tipo: 'jogo', titulo: 'Grêmio x Boca', hora: '16:00' },
                { ano: new Date().getFullYear(), mes: 5, dia: 15, tipo: 'social', titulo: 'Cestas Básicas', hora: '' },
                { ano: new Date().getFullYear(), mes: 8, dia: 20, tipo: 'reuniao', titulo: 'Reunião Diretoria', hora: '14:30' } 
            ];
        }

        eventosAno = eventosAno.map(ev => ({
            ...ev, 
            id: ev.id || Math.random().toString(36).substr(2, 9),
            ano: ev.ano || new Date().getFullYear() 
        }));

    } catch (error) {
        console.error("Erro ao ler cache. Resetando...", error);
        localStorage.removeItem('eventosGremio'); 
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

    function salvarEAtualizarTelas() {
        localStorage.setItem('eventosGremio', JSON.stringify(eventosAno));
        
        if (document.getElementById('calendario-anual-container')) renderAnualCalendar();
        
        if (document.getElementById('calendar-container')) {
            const selectM = document.getElementById('select-month');
            const selectY = document.getElementById('select-year');
            const m = selectM ? parseInt(selectM.value) : new Date().getMonth();
            const y = selectY ? parseInt(selectY.value) : new Date().getFullYear();
            renderCalendar(m, y);
        }
    }

    try {
        updateTimestamp();
        setInterval(updateTimestamp, 1000);
    } catch (e) {}

    if (document.getElementById('calendar-container')) renderCalendar();
    if (document.getElementById('calendario-anual-container')) renderAnualCalendar();
    if (document.getElementById('analise-tbody')) sortAndRenderTable();
    if (document.getElementById('chamada-tbody')) carregarChamada();

    function solicitarNovoEvento(dataPredefinida = null) {
        const titulo = prompt("1. Qual o nome do evento?");
        if (!titulo) return;

        let dataStr = dataPredefinida;
        if (!dataStr) {
            dataStr = prompt("2. Qual a data? (Formato DD/MM/AAAA. Ex: 15/06/2026)");
        } else {
            const confirmaData = prompt("2. Qual a data? (Formato DD/MM/AAAA)", dataStr);
            if (!confirmaData) return;
            dataStr = confirmaData;
        }
        
        if (!dataStr || !dataStr.includes('/')) return alert("Data inválida. Use o formato DD/MM/AAAA.");

        const tipoStr = prompt("3. Qual o tipo do evento?\n[ 1 ] Jogos\n[ 2 ] Social\n[ 3 ] Reunião");
        let tipo = 'jogo';
        if (tipoStr === '2') tipo = 'social';
        if (tipoStr === '3') tipo = 'reuniao';

        const horaStr = prompt("4. Qual o horário? (Ex: 14:30. Deixe vazio se não houver)");

        const partesData = dataStr.split('/');
        const dia = parseInt(partesData[0]);
        const mes = parseInt(partesData[1]);
        const ano = partesData[2] ? parseInt(partesData[2]) : new Date().getFullYear();
        
        eventosAno.push({
            id: Date.now().toString(),
            ano: ano,
            mes: mes - 1,
            dia: dia,
            hora: horaStr || '',
            tipo: tipo,
            titulo: titulo
        });

        salvarEAtualizarTelas(); 
        alert("Evento adicionado com sucesso!");
    }

    if (btnNovoEvento) btnNovoEvento.addEventListener('click', () => solicitarNovoEvento());

    // ==========================================
    // CALENDÁRIO ANUAL
    // ==========================================
    function renderAnualCalendar() {
        const container = document.getElementById('calendario-anual-container');
        if (!container) return;
        
        container.innerHTML = '';
        const anoAtual = new Date().getFullYear(); // Agora dinâmico!
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
                emptyDiv.style.minHeight = '80px'; 
                gridDiv.appendChild(emptyDiv);
            }

            for (let dia = 1; dia <= diasNoMes; dia++) {
                const dayDiv = document.createElement('div');
                dayDiv.className = 'calendar-day';
                dayDiv.style.minHeight = '80px'; 
                
                dayDiv.dataset.dia = dia;
                dayDiv.dataset.mes = mes;
                dayDiv.dataset.ano = anoAtual;
                
                if (dia === dataAtual.getDate() && mes === dataAtual.getMonth() && dataAtual.getFullYear() === anoAtual) {
                    dayDiv.classList.add('today');
                }

                dayDiv.innerHTML = `<span style="display: block; width: 100%; text-align: right; color: #555; font-weight: 500;">${dia}</span>`;

                // Junta Feriados e Eventos do Dia
                const feriadosDoDia = feriadosFixos.filter(f => f.mes === mes && f.dia === dia).map(f => ({...f, tipo: 'feriado', id: `feriado-${mes}-${dia}`}));
                const eventosDoDia = eventosAno.filter(e => e.ano === anoAtual && e.mes === mes && e.dia === dia);
                const todosEventosDia = [...feriadosDoDia, ...eventosDoDia];
                
                todosEventosDia.forEach(evento => {
                    let classesCSS = '';
                    if (evento.tipo === 'jogo') classesCSS = 'bg-primary text-white border-bottom border-dark';
                    else if (evento.tipo === 'social') classesCSS = 'bg-success text-white';
                    else if (evento.tipo === 'reuniao') classesCSS = 'bg-warning text-dark';
                    else if (evento.tipo === 'feriado') classesCSS = 'bg-danger text-white'; // Feriados em vermelho!

                    const exibeHora = evento.hora ? `<b>${evento.hora}</b> ` : '';

                   dayDiv.innerHTML += `
                        <div class="event-badge border-rounded-sm ${classesCSS}" data-event-id="${evento.id}" style="font-size: 0.85em; padding: 6px; text-align: center; margin-top: 4px; cursor: pointer; font-weight: bold;" title="Clique para editar/remover">
                            ${exibeHora}${evento.titulo}
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
    // MINI CALENDÁRIO (Dashboard)
    // ==========================================
    function renderCalendar(mesEscolhido = new Date().getMonth(), anoEscolhido = new Date().getFullYear()) {
        const container = document.getElementById('calendar-container');
        const monthYearLabel = document.getElementById('calendar-month-year');
        if (!container) return;

        container.innerHTML = '';
        const dataAtual = new Date();
        const mes = mesEscolhido; 
        const ano = anoEscolhido;

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
        
        const eventosDoMes = (typeof eventosAno !== 'undefined' ? eventosAno : []).filter(e => e.ano === ano && e.mes === mes);
        const feriadosDoMes = feriadosFixos.filter(f => f.mes === mes).map(f => ({...f, tipo: 'feriado', id: `feriado-${mes}-${f.dia}`}));

        for (let i = 0; i < primeiroDia; i++) {
            const empty = document.createElement('div');
            empty.className = 'calendar-day empty';
            empty.style.minHeight = '80px'; 
            container.appendChild(empty);
        }

        for (let dia = 1; dia <= diasNoMes; dia++) {
            const dayDiv = document.createElement('div');
            dayDiv.className = 'calendar-day';
            dayDiv.style.minHeight = '80px'; 
            
            dayDiv.dataset.dia = dia;
            dayDiv.dataset.mes = mes;
            dayDiv.dataset.ano = ano;
            
            if (dia === dataAtual.getDate() && mes === dataAtual.getMonth() && ano === dataAtual.getFullYear()) {
                dayDiv.classList.add('today');
            }

            dayDiv.innerHTML = `<span style="display: block; width: 100%; text-align: right; color: #888;">${dia}</span>`;

            // Filtra e junta os eventos para aquele dia específico
            const eventosHoje = eventosDoMes.filter(e => e.dia === dia);
            const feriadosHoje = feriadosDoMes.filter(f => f.dia === dia);
            const todosEventos = [...feriadosHoje, ...eventosHoje];

            todosEventos.forEach(eventoHj => {
                let classCSS = '';
                if (eventoHj.tipo === 'jogo') classCSS = 'bg-primary text-white';
                else if (eventoHj.tipo === 'social') classCSS = 'bg-success text-white';
                else if (eventoHj.tipo === 'reuniao') classCSS = 'bg-warning text-dark';
                else if (eventoHj.tipo === 'feriado') classCSS = 'bg-danger text-white';

                const exibeHora = eventoHj.hora ? `<b>${eventoHj.hora}</b> ` : '';
                
                dayDiv.innerHTML += `
                    <div class="event-badge border-rounded-sm ${classCSS} mt-1 p-2" data-event-id="${eventoHj.id}" style="cursor: pointer; font-size: 0.85em; font-weight: bold;" title="Clique para editar/remover">
                        ${exibeHora}${eventoHj.titulo}
                    </div>
                `;
            });

            container.appendChild(dayDiv);
        }
    }

    // ==========================================
    // CONTROLES DO CALENDÁRIO (Anos Inteligentes)
    // ==========================================
    const selectMonth = document.getElementById('select-month');
    const selectYear = document.getElementById('select-year');
    const btnPrev = document.getElementById('btn-prev-month');
    const btnNext = document.getElementById('btn-next-month');

    if (selectMonth && selectYear) {
        const dataAtual = new Date();
        const anoAtual = dataAtual.getFullYear();
        const nomesMeses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
        
        nomesMeses.forEach((nome, index) => {
            const opcaoMes = document.createElement('option');
            opcaoMes.value = index;
            opcaoMes.textContent = nome;
            selectMonth.appendChild(opcaoMes);
        });
        
        // NOVO: Vai de 2020 até AnoAtual + 10!
        for (let i = 2020; i <= anoAtual + 10; i++) {
            const opcaoAno = document.createElement('option');
            opcaoAno.value = i;
            opcaoAno.textContent = i;
            if (i === anoAtual) opcaoAno.selected = true;
            selectYear.appendChild(opcaoAno);
        }
        
        selectMonth.value = dataAtual.getMonth();

        const atualizarTela = () => {
            renderCalendar(parseInt(selectMonth.value), parseInt(selectYear.value));
        };

        btnPrev.addEventListener('click', () => {
            let m = parseInt(selectMonth.value) - 1;
            let a = parseInt(selectYear.value);
            if (m < 0) { m = 11; a--; }
            
            selectMonth.value = m;
            if (selectYear.querySelector(`option[value="${a}"]`)) selectYear.value = a;
            atualizarTela();
        });

        btnNext.addEventListener('click', () => {
            let m = parseInt(selectMonth.value) + 1;
            let a = parseInt(selectYear.value);
            if (m > 11) { m = 0; a++; }
            
            selectMonth.value = m;
            if (selectYear.querySelector(`option[value="${a}"]`)) selectYear.value = a;
            atualizarTela();
        });

        selectMonth.addEventListener('change', atualizarTela);
        selectYear.addEventListener('change', atualizarTela);

        atualizarTela();
    }
        
    // ==========================================
    // LÓGICA DA TABELA E CHAMADA
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

    // ==========================================
    // DELEGAÇÃO DE EVENTOS: CRIAR, EDITAR E REMOVER
    // ==========================================
    document.addEventListener('click', (e) => {
        
        const badge = e.target.closest('.event-badge');
        if (badge && badge.dataset.eventId) {
            e.stopPropagation(); 
            
            const id = badge.dataset.eventId;

            // Proteção para não editar feriados
            if (id.startsWith('feriado')) {
                alert("Feriados nacionais são fixos e não podem ser editados ou removidos.");
                return;
            }

            const index = eventosAno.findIndex(ev => String(ev.id) === String(id));
            if (index === -1) return;

            const evento = eventosAno[index];
            const acao = prompt(`Gerenciar Evento: ${evento.titulo}\n\nO que deseja fazer?\n[ 1 ] Editar\n[ 2 ] Remover\n[ 3 ] Cancelar`);

            if (acao === '1') {
                const novoTitulo = prompt("1. Novo nome do evento:", evento.titulo);
                if (!novoTitulo) return;

                const mesAtual = String(evento.mes + 1).padStart(2, '0');
                const diaAtual = String(evento.dia).padStart(2, '0');
                const anoAtual = evento.ano || new Date().getFullYear(); 
                
                const novaDataStr = prompt("2. Nova data (DD/MM/AAAA):", `${diaAtual}/${mesAtual}/${anoAtual}`);
                if (!novaDataStr || !novaDataStr.includes('/')) return alert("Data inválida.");

                let tipoSugerido = '1';
                if (evento.tipo === 'social') tipoSugerido = '2';
                if (evento.tipo === 'reuniao') tipoSugerido = '3';

                const novoTipoStr = prompt("3. Qual o novo tipo?\n[ 1 ] Jogos\n[ 2 ] Social\n[ 3 ] Reunião", tipoSugerido);
                let novoTipo = 'jogo';
                if (novoTipoStr === '2') novoTipo = 'social';
                if (novoTipoStr === '3') novoTipo = 'reuniao';

                const novaHoraStr = prompt("4. Qual o novo horário? (Deixe em branco se não houver)", evento.hora || "");

                const partesNovaData = novaDataStr.split('/');
                const diaNovo = parseInt(partesNovaData[0]);
                const mesNovo = parseInt(partesNovaData[1]);
                const anoNovo = partesNovaData[2] ? parseInt(partesNovaData[2]) : anoAtual; 

                eventosAno[index] = {
                    ...evento,
                    titulo: novoTitulo,
                    dia: diaNovo,
                    mes: mesNovo - 1,
                    ano: anoNovo,
                    hora: novaHoraStr || '', 
                    tipo: novoTipo
                };

                salvarEAtualizarTelas();
                alert("Evento atualizado com sucesso!");

            } else if (acao === '2') {
                if (confirm(`Tem certeza que deseja remover o evento "${evento.titulo}"?`)) {
                    eventosAno.splice(index, 1);
                    salvarEAtualizarTelas();
                    alert("Evento removido.");
                }
            }
            return; 
        }

        const dayCell = e.target.closest('.calendar-day');
        if (dayCell && !dayCell.classList.contains('empty') && dayCell.dataset.dia && dayCell.dataset.mes && dayCell.dataset.ano) {
            const diaFormatado = String(dayCell.dataset.dia).padStart(2, '0');
            const mesFormatado = String(parseInt(dayCell.dataset.mes) + 1).padStart(2, '0');
            const anoFormatado = dayCell.dataset.ano; 
            
            solicitarNovoEvento(`${diaFormatado}/${mesFormatado}/${anoFormatado}`);
        }
    });

});