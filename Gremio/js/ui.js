let statusChartInstance = null;

export function populateStationsMenu(alunos) {
    const stationsMenu = document.getElementById('stations-menu');
    if (!stationsMenu || !Array.isArray(alunos)) return;
    
    stationsMenu.innerHTML = alunos
        .sort((a, b) => a.nome.localeCompare(b.nome))
        .map(aluno => {
            const statusColor = aluno.status.toLowerCase() === 'ativo' ? 'normal' : 'critico';
            return `<li class="station-item" data-id="${aluno.matricula}">
                        <span class="status-dot ${statusColor}"></span> ${aluno.nome}
                    </li>`;
        }).join('');
}

// ==========================================
// TABELA DA ABA "CADASTRAR ALUNOS"
// ==========================================
export function populateAnaliseTable(alunos) {
    const analiseTbody = document.getElementById('analise-tbody');
    if (!analiseTbody) return;
    
    analiseTbody.innerHTML = '';
    
    if (!alunos || alunos.length === 0) {
        analiseTbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px;">Nenhum aluno encontrado.</td></tr>';
        return;
    }

    alunos.forEach(aluno => {
        // Verde para Ativos, Cinza para Inativos
        const statusColor = aluno.status.toLowerCase() === 'ativo' ? '#28a745' : '#6c757d';
        
        analiseTbody.innerHTML += `
            <tr data-id="${aluno.matricula}">
                <td>${aluno.matricula}</td>
                <td style="font-weight: 500;">
                    <a href="#" class="station-link" data-id="${aluno.matricula}" style="text-decoration:none; color:inherit;">${aluno.nome}</a>
                </td>
                <td>${aluno.turma}</td>
                <td><span style="color: ${statusColor}; font-weight: bold; background: ${statusColor}15; padding: 4px 8px; border-radius: 4px;">${aluno.status}</span></td>
                <td>
                    <button class="edit-btn" data-id="${aluno.matricula}" title="Editar" style="background:none; border:none; color:#0d6efd; cursor:pointer; font-size: 1.1em; padding: 5px;"><i class="fas fa-edit"></i></button>
                    <button class="delete-btn" data-id="${aluno.matricula}" title="Excluir" style="background:none; border:none; color:#343a40; cursor:pointer; margin-left:10px; font-size: 1.1em; padding: 5px;"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `;
    });
}

// ==========================================
// ATUALIZA OS KPIS DO DASHBOARD
// ==========================================
export function updateDashboardGeral(alertas, alunos) {
    const kpiTotalAlunos = document.getElementById('kpi-ebats');
    const kpiAlertas = document.getElementById('kpi-alertas');
    const kpiPresenca = document.getElementById('kpi-dados-percent');
    const kpiPresencaCard = document.getElementById('kpi-dados-card');

    // Total de Alunos
    if (kpiTotalAlunos) kpiTotalAlunos.textContent = alunos?.length ?? 0;
    
    // Alertas (Contando alunos inativos)
    const inativos = alunos?.filter(a => a?.status.toLowerCase() === 'inativo').length ?? 0;
    if (kpiAlertas) kpiAlertas.textContent = inativos;

    // Presença Geral (Valor estático até ter backend)
    if (kpiPresenca && kpiPresencaCard && alunos && alunos.length > 0) {
        const avgPresenca = 88.5; 
        kpiPresenca.textContent = `${avgPresenca.toFixed(1)}%`;
        
        kpiPresencaCard.classList.remove('success-kpi', 'warning-kpi', 'alert-kpi');
        if (avgPresenca > 90) kpiPresencaCard.classList.add('success-kpi');
        else if (avgPresenca >= 75) kpiPresencaCard.classList.add('warning-kpi');
        else kpiPresencaCard.classList.add('alert-kpi');
    }
}

// ==========================================
// ÍCONES DE ORDENAÇÃO DA TABELA
// ==========================================
export function updateSortIcons(sortKey, sortOrder) {
    const analiseThead = document.getElementById('analise-thead');
    if (!analiseThead) return;
    
    analiseThead.querySelectorAll('th').forEach(th => {
        th.classList.remove('sorted-asc', 'sorted-desc');
        const icon = th.querySelector('i');
        if (icon) icon.className = 'fas';
        
        if (th.dataset.sort === sortKey) {
            th.classList.add(sortOrder === 'asc' ? 'sorted-asc' : 'sorted-desc');
            if (icon) icon.classList.add(`fa-sort-${sortOrder === 'asc' ? 'up' : 'down'}`);
        }
    });
}