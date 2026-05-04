'use strict';

const providerList = document.getElementById('providerList');
    const searchInput = document.getElementById('searchInput');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const matrix = document.getElementById('matrix');
    const dashboard = document.getElementById('dashboard');
    const welcomeMessage = document.getElementById('welcomeMessage');
    const headerRiskBadge = document.getElementById('headerRiskBadge');

    let currentFilter = 'Todos';
    let currentSearch = '';
    let radarChartInstance = null; // Variable global para el gráfico

    // Inicializar Matriz Vacía
    function initMatrix() {
        matrix.innerHTML = '';
        
        for (let y = 5; y >= 1; y--) {
            // Label Y
            const labelY = document.createElement('div');
            labelY.className = 'flex items-center justify-end pr-3 text-sm font-bold text-slate-400';
            labelY.innerText = y;
            matrix.appendChild(labelY);

            for (let x = 1; x <= 5; x++) {
                const cell = document.createElement('div');
                cell.id = `c-${x}-${y}`;
                const score = x * y;
                let colorClass = 'r-low';
                if (score > 14) colorClass = 'r-crit';
                else if (score > 9) colorClass = 'r-high';
                else if (score > 4) colorClass = 'r-med';
                
                cell.className = `cell ${colorClass}`;
                matrix.appendChild(cell);
            }
        }
        // Label X
        matrix.appendChild(document.createElement('div')); // Empty corner
        for (let x = 1; x <= 5; x++) {
            const labelX = document.createElement('div');
            labelX.className = 'flex items-center justify-center pt-3 text-sm font-bold text-slate-400';
            labelX.innerText = x;
            matrix.appendChild(labelX);
        }
    }

    // Calcula el nivel de riesgo general para un proveedor basado en el peor escenario
    function getRiskLevelInfo(points) {
        let maxScore = 0;
        points.forEach(pt => {
            const score = pt.p * pt.i;
            if (score > maxScore) maxScore = score;
        });

        if (maxScore > 14) return { label: 'Crítico', bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' };
        if (maxScore > 9)  return { label: 'Alto', bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-200' };
        if (maxScore > 4)  return { label: 'Medio', bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' };
        return { label: 'Bajo', bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' };
    }

    // Renderizar Listado lateral con Filtros Duales (Búsqueda + Nivel de Riesgo)
    function renderList() {
        providerList.innerHTML = '';
        const query = currentSearch.toLowerCase();
        
        const filtered = RISK_PROVIDERS.filter(p => {
            const matchSearch = p.n.toLowerCase().includes(query) || p.s.toLowerCase().includes(query);
            const riskInfo = getRiskLevelInfo(p.p);
            const matchFilter = currentFilter === 'Todos' || riskInfo.label === currentFilter;
            return matchSearch && matchFilter;
        });
        
        document.getElementById('counterLabel').innerText = `${filtered.length} resultados`;

        filtered.forEach(p => {
            const riskInfo = getRiskLevelInfo(p.p);
            
            const btn = document.createElement('button');
            btn.className = "w-full text-left p-3 rounded-lg border border-transparent transition-all hover:bg-white hover:border-slate-200 hover:shadow-sm focus:outline-none focus:bg-indigo-50 focus:border-indigo-200 group";
            btn.onclick = () => selectProvider(p, riskInfo);
            
            // Estructura del botón con la etiqueta de riesgo
            btn.innerHTML = `
                <div class="flex justify-between items-start">
                    <div class="font-bold text-[13px] text-slate-700 group-hover:text-indigo-700 transition-colors truncate pr-2" title="${p.n}">${p.n}</div>
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded border ${riskInfo.bg} ${riskInfo.text} ${riskInfo.border} whitespace-nowrap mt-0.5">${riskInfo.label}</span>
                </div>
                <div class="text-[11px] font-medium text-slate-400 uppercase tracking-wide mt-1 truncate">${p.s}</div>
            `;
            providerList.appendChild(btn);
        });
    }

    // Renderiza o Actualiza el Gráfico de Radar
    function updateRadarChart(providerData) {
        const ctx = document.getElementById('radarChart').getContext('2d');
        
        // Extraer los "Scores" (Probabilidad x Impacto) exactos por Eje
        const getScore = (type, dim) => {
            const pt = providerData.find(p => p.t === type && p.d === dim);
            return pt ? (pt.p * pt.i) : 0;
        };

        const gerenciaScores = [
            getScore('G', 'Usuario'),
            getScore('G', 'Información'),
            getScore('G', 'Operación')
        ];

        const tecnicoScores = [
            getScore('T', 'Usuario'),
            getScore('T', 'Información'),
            getScore('T', 'Operación')
        ];

        if (radarChartInstance) {
            radarChartInstance.destroy(); // Limpiar gráfico anterior
        }

        radarChartInstance = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['Usuario', 'Información', 'Operación'],
                datasets: [
                    {
                        label: 'Perspectiva Gerencia',
                        data: gerenciaScores,
                        backgroundColor: 'rgba(79, 70, 229, 0.2)', // Indigo 600 con opacidad
                        borderColor: 'rgba(79, 70, 229, 1)',
                        pointBackgroundColor: 'rgba(79, 70, 229, 1)',
                        borderWidth: 2,
                        pointRadius: 4
                    },
                    {
                        label: 'Perspectiva Riesgos Tecnológicos',
                        data: tecnicoScores,
                        backgroundColor: 'rgba(6, 182, 212, 0.2)', // Cyan 500 con opacidad
                        borderColor: 'rgba(6, 182, 212, 1)',
                        pointBackgroundColor: 'rgba(6, 182, 212, 1)',
                        borderWidth: 2,
                        pointRadius: 4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 25, // Score máximo posible (5 x 5)
                        ticks: { stepSize: 5 },
                        pointLabels: {
                            font: { size: 12, weight: 'bold', family: "'Inter', sans-serif" }
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { font: { family: "'Inter', sans-serif" } }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return ` Nivel de Riesgo (P x I): ${context.raw}`;
                            }
                        }
                    }
                }
            }
        });
    }

    // Seleccionar y Mostrar
    function selectProvider(p, riskInfo) {
        welcomeMessage.classList.add('hidden');
        dashboard.classList.remove('hidden');
        
        document.getElementById('selectedProviderTitle').innerText = p.n;
        document.getElementById('serviceTag').innerText = p.s;

        // Actualizar la etiqueta grande en la cabecera
        headerRiskBadge.innerText = `Riesgo Global: ${riskInfo.label}`;
        headerRiskBadge.className = `px-4 py-2 rounded-lg border font-bold text-sm ${riskInfo.bg} ${riskInfo.text} ${riskInfo.border}`;

        initMatrix(); // Limpiar markers previos

        // Procesar Puntos (6 dimensiones) para la Matriz
        p.p.forEach((pt, index) => {
            const cell = document.getElementById(`c-${pt.i}-${pt.p}`);
            if (cell) {
                const marker = document.createElement('div');
                const colorClass = pt.t === 'G' ? 'bg-gerencia' : 'bg-tecnico';
                const dimensionName = pt.t === 'G' ? 'Gerencia' : 'Técnico';
                
                // Extraer la primera letra de la dimensión (U, I, O)
                const labelLetter = pt.d.charAt(0).toUpperCase();
                
                marker.className = `dot-marker ${colorClass}`;
                marker.style.animationDelay = `${index * 0.05}s`;
                marker.innerText = labelLetter; // Añadir el identificador U/I/O
                
                // Tooltip
                marker.title = `${dimensionName} - Eje: ${pt.d}\n(Probabilidad: ${pt.p}, Impacto: ${pt.i})`;
                
                cell.appendChild(marker);
            }
        });

        // Actualizar Gráfico Radar
        updateRadarChart(p.p);

        // Calcular Máximos (Peor Escenario) para Detalle Numérico
        const gPoints = p.p.filter(pt => pt.t === 'G');
        const tPoints = p.p.filter(pt => pt.t === 'T');
        
        const maxGp = Math.max(...gPoints.map(pt => pt.p));
        const maxGi = Math.max(...gPoints.map(pt => pt.i));
        
        const maxTp = Math.max(...tPoints.map(pt => pt.p));
        const maxTi = Math.max(...tPoints.map(pt => pt.i));

        // Detalles de texto
        const details = document.getElementById('detailsList');
        details.innerHTML = `
            <div class="p-3 bg-indigo-50 rounded-xl border border-indigo-100 flex items-center justify-between">
                <div>
                    <div class="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">Máxima Exposición (Gerencia)</div>
                    <div class="text-sm font-semibold text-indigo-900 mt-1">Probabilidad: ${maxGp} / Impacto: ${maxGi}</div>
                </div>
                <div class="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center font-black text-indigo-600 text-sm border border-white shadow-sm">
                    ${maxGp * maxGi}
                </div>
            </div>

            <div class="p-3 bg-cyan-50 rounded-xl border border-cyan-100 flex items-center justify-between mt-3">
                <div>
                    <div class="text-[11px] font-bold text-cyan-500 uppercase tracking-wider">Máxima Exposición (Técnico)</div>
                    <div class="text-sm font-semibold text-cyan-900 mt-1">Probabilidad: ${maxTp} / Impacto: ${maxTi}</div>
                </div>
                <div class="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center font-black text-cyan-600 text-sm border border-white shadow-sm">
                    ${maxTp * maxTi}
                </div>
            </div>
        `;
    }

    // Eventos de Búsqueda
    searchInput.oninput = (e) => {
        currentSearch = e.target.value;
        renderList();
    };

    // Eventos de Botones de Filtro
    filterButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Quitar clase active a todos
            filterButtons.forEach(b => {
                b.classList.remove('active', 'bg-indigo-600', 'text-white', 'border-indigo-600');
                // Restaurar estilos base según el tipo de botón
                if(b.dataset.filter === 'Todos') b.className = 'filter-btn px-2.5 py-1 rounded text-[10px] font-bold border border-slate-200 text-slate-600 bg-white';
                if(b.dataset.filter === 'Bajo') b.className = 'filter-btn px-2.5 py-1 rounded text-[10px] font-bold border border-green-200 text-green-700 bg-green-50';
                if(b.dataset.filter === 'Medio') b.className = 'filter-btn px-2.5 py-1 rounded text-[10px] font-bold border border-yellow-200 text-yellow-700 bg-yellow-50';
                if(b.dataset.filter === 'Alto') b.className = 'filter-btn px-2.5 py-1 rounded text-[10px] font-bold border border-orange-200 text-orange-700 bg-orange-50';
                if(b.dataset.filter === 'Crítico') b.className = 'filter-btn px-2.5 py-1 rounded text-[10px] font-bold border border-red-200 text-red-700 bg-red-50';
            });
            
            // Poner activo al seleccionado
            const clicked = e.target;
            clicked.className = `filter-btn active px-2.5 py-1 rounded text-[10px] font-bold border border-[#4f46e5] text-white bg-[#4f46e5]`;
            
            currentFilter = clicked.dataset.filter;
            renderList();
        });
    });

    // Init
    renderList();
    initMatrix();
