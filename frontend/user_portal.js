document.addEventListener('DOMContentLoaded', () => {
    
    // --- ELEMENT SELECTORS ---
    const analysisMenu = document.querySelector('.analysis-menu');
    const portalSections = document.querySelectorAll('.portal-section');
    const analysisTitle = document.getElementById('analysis-title');
    const barChartCanvas = document.getElementById('bar-chart');
    const pieChartCanvas = document.getElementById('pie-chart');
    const premiumModalOverlay = document.getElementById('premium-modal-overlay');
    const premiumModal = document.getElementById('premium-modal');
    const closePremiumModal = document.getElementById('close-premium-modal');
    const expertReportLink = document.getElementById('expert-report-link');
    const predictionElements = {
        day1: { date: document.getElementById('day1-date'), prediction: document.getElementById('day1-prediction'), alert: document.getElementById('day1-alert'), alertText: document.getElementById('day1-alert-text') },
        day2: { date: document.getElementById('day2-date'), prediction: document.getElementById('day2-prediction'), alert: document.getElementById('day2-alert'), alertText: document.getElementById('day2-alert-text') },
        day3: { date: document.getElementById('day3-date'), prediction: document.getElementById('day3-prediction'), alert: document.getElementById('day3-alert'), alertText: document.getElementById('day3-alert-text') }
    };

    let barChartInstance, pieChartInstance;
    let map, mapLayers = [];

    // --- PROFESSIONAL MAP LOGIC ---
    const riverSegments = [
        { name: 'Assi Ghat', coords: [[25.2852, 82.9922], [25.2890, 82.9950]] },
        { name: 'Tulsi Ghat', coords: [[25.2890, 82.9950], [25.2930, 82.9980]] },
        { name: 'Harishchandra Ghat', coords: [[25.2930, 82.9980], [25.2960, 83.0006]] },
        { name: 'Kedar Ghat', coords: [[25.2960, 83.0006], [25.3000, 83.0040]] },
        { name: 'Dashashwamedh Ghat', coords: [[25.3000, 83.0040], [25.3072, 83.0088]] },
        { name: 'Manikarnika Ghat', coords: [[25.3072, 83.0088], [25.3110, 83.0120]] },
        { name: 'Raj Ghat', coords: [[25.3110, 83.0120], [25.3215, 83.0250]] }
    ];

    function initializeMap() {
        if (map) return; // Prevents re-initializing the map
        map = L.map('map').setView([25.30, 83.00], 13);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        const legend = L.control({ position: 'bottomright' });
        legend.onAdd = function (map) {
            const div = L.DomUtil.create('div', 'info legend');
            const grades = [
                { status: 'safe', color: '#2ECC40', label: 'Safe' },
                { status: 'warning', color: '#FFDC00', label: 'Medium Alert' },
                { status: 'danger', color: '#FF4136', label: 'Heavy Alert' }
            ];
            div.innerHTML += '<h4>River Status</h4>';
            for (let i = 0; i < grades.length; i++) {
                div.innerHTML += `<i style="background:${grades[i].color}"></i> ${grades[i].label}<br>`;
            }
            return div;
        };
        legend.addTo(map);
    }
    
    function getStatusColor(status) { return status === 'danger' ? '#FF4136' : status === 'warning' ? '#FFDC00' : '#2ECC40'; }

    function updateMapFromHistory(historicalData, analysisType) {
        mapLayers.forEach(layer => map.removeLayer(layer));
        mapLayers = [];
        const latestValue = historicalData[historicalData.length - 1];
        const thresholds = {
            fecal_coliform: { warning: 500, danger: 1000 }, bod: { warning: 5.0, danger: 8.0 },
            nitrate: { warning: 7.0, danger: 10.0 }, flow: { warning: 1000, danger: 500 } 
        };
        const currentThresholds = thresholds[analysisType];
        let overallStatus = 'safe';
        if (currentThresholds) {
            if (analysisType === 'flow' ? latestValue < currentThresholds.danger : latestValue > currentThresholds.danger) overallStatus = 'danger';
            else if (analysisType === 'flow' ? latestValue < currentThresholds.warning : latestValue > currentThresholds.warning) overallStatus = 'warning';
        }
        const statusPool = {
            safe: ['safe', 'safe', 'safe', 'safe', 'warning', 'safe', 'safe'],
            warning: ['warning', 'safe', 'warning', 'danger', 'warning', 'safe', 'warning'],
            danger: ['danger', 'warning', 'danger', 'danger', 'warning', 'danger', 'danger']
        };
        const segmentStatuses = statusPool[overallStatus].sort(() => 0.5 - Math.random());
        riverSegments.forEach((segment, index) => {
            const status = segmentStatuses[index];
            const color = getStatusColor(status);
            const polyline = L.polyline(segment.coords, { color, weight: 8, opacity: 0.9 });
            polyline.bindPopup(`<b>${segment.name}</b><br>Status: <span style="color:${color}; font-weight:bold;">${status.toUpperCase()}</span>`);
            polyline.addTo(map);
            mapLayers.push(polyline);
        });
    }

    async function fetchApiData() {
        try {
            const response = await fetch('http://localhost:5000/api/user-analysis-data');
            if (!response.ok) throw new Error('Network error');
            return await response.json();
        } catch (error) {
            console.error("API fetch error:", error);
            analysisTitle.textContent = "Error: Could not connect to the server.";
            return null;
        }
    }

    function showSection(sectionId) {
        portalSections.forEach(section => section.classList.add('hidden'));
        const sectionToShow = document.getElementById(sectionId + '-section');
        if (sectionToShow) sectionToShow.classList.remove('hidden');
    }

    analysisMenu.addEventListener('click', (e) => {
        const targetLi = e.target.closest('li');
        if (!targetLi) return;
        analysisMenu.querySelector('li.active')?.classList.remove('active');
        targetLi.classList.add('active');
        if (targetLi.dataset.analysis) {
            showSection('analysis-results');
            fetchAndDisplayChartData(targetLi.dataset.analysis);
        } else if (targetLi.dataset.section) {
            showSection(targetLi.dataset.section);
        }
    });

    async function fetchAndDisplayChartData(analysisType) {
        // FIXED: The map is now initialized here, only when it's needed
        initializeMap();

        const data = await fetchApiData();
        if (!data || !data[analysisType]) {
            analysisTitle.textContent = "Data not available";
            if(barChartInstance) barChartInstance.destroy();
            if(pieChartInstance) pieChartInstance.destroy();
            return;
        }
        const analysisData = data[analysisType];
        analysisTitle.textContent = analysisData.title;
        createOrUpdateBarChart(analysisData.chartData.bar);
        createOrUpdatePieChart(analysisData.chartData.pie);
        updatePredictions(analysisData.predictions, analysisType);
        updateMapFromHistory(analysisData.chartData.bar.data, analysisType);
    }
    
    function createOrUpdateBarChart({ labels, data, label }) {
        if (barChartInstance) barChartInstance.destroy();
        barChartInstance = new Chart(barChartCanvas, { type: 'bar', data: { labels, datasets: [{ label, data, backgroundColor: 'rgba(0, 95, 153, 0.6)' }] }, options: { scales: { y: { beginAtZero: true } }, responsive: true, maintainAspectRatio: false } });
    }
    function createOrUpdatePieChart({ labels, data }) {
        if (pieChartInstance) pieChartInstance.destroy();
        pieChartInstance = new Chart(pieChartCanvas, { type: 'pie', data: { labels, datasets: [{ data, backgroundColor: ['#2ECC40', '#FFDC00', '#FF4136'] }] }, options: { responsive: true, maintainAspectRatio: false } });
    }

    function updatePredictions(predictions, analysisType) {
        const predictionTextMap = {
            fecal_coliform: 'Fecal coliform levels are predicted to be',
            bod: 'Biochemical Oxygen Demand is predicted to be',
            nitrate: 'Nitrate levels are predicted to be',
            flow: 'River flow is predicted to be',
            level: 'Water levels are predicted to be'
        };
        const metricDetailsMap = {
            fecal_coliform: { key: 'fecal', unit: 'MPN' },
            bod: { key: 'bod', unit: 'mg/L' },
            nitrate: { key: 'nitrate', unit: 'mg/L' },
            flow: { key: 'flow', unit: 'm³/s' },
            level: { key: 'level', unit: 'M' }
        };

        ['day1', 'day2', 'day3'].forEach((day, index) => {
            try {
                const pred = predictions[index];
                const elements = predictionElements[day];
                if (!pred || !elements.prediction || !pred.triggeredAlerts) {
                    throw new Error(`Prediction data for ${day} is missing or malformed.`);
                }
                
                const date = new Date();
                date.setDate(date.getDate() + index + 1);
                elements.date.textContent = date.toLocaleDateString('en-US', { weekday: 'long' });

                const relevantAlert = pred.triggeredAlerts.find(a => a.metric === analysisType);
                const baseText = predictionTextMap[analysisType] || 'Overall water quality is predicted to be';
                
                const metricDetails = metricDetailsMap[analysisType];
                let predictedValueText = '';
                if (metricDetails && pred.predictedValues) {
                    const value = pred.predictedValues[metricDetails.key];
                    if (value !== undefined) {
                        predictedValueText = ` (Predicted: ${value} ${metricDetails.unit})`;
                    }
                }
                
                elements.alert.className = 'alert';

                if (relevantAlert) {
                    const statusText = relevantAlert.type === 'danger' ? 'at DANGEROUS levels.' : 'at ELEVATED levels.';
                    elements.prediction.textContent = `${baseText} ${statusText}${predictedValueText}`;
                    elements.alert.classList.add(relevantAlert.type);
                    elements.alertText.textContent = relevantAlert.text;
                } else {
                    elements.prediction.textContent = `${baseText} within safe limits.${predictedValueText}`;
                    elements.alert.classList.add('safe');
                    elements.alertText.textContent = "Levels for this metric appear to be normal.";
                }
            } catch (error) {
                console.error(`Failed to generate prediction for day ${index + 1}:`, error);
                const elements = predictionElements[day];
                if (elements && elements.prediction) {
                    elements.prediction.textContent = "Prediction data unavailable.";
                    elements.alert.className = 'alert hidden';
                }
            }
        });
    }

    function togglePremiumModal(show) {
        if (show) { premiumModalOverlay.classList.remove('hidden'); premiumModal.classList.remove('hidden'); } 
        else { premiumModalOverlay.classList.add('hidden'); premiumModal.classList.add('hidden'); }
    }

    expertReportLink.addEventListener('click', () => togglePremiumModal(true));
    closePremiumModal.addEventListener('click', () => togglePremiumModal(false));
    premiumModalOverlay.addEventListener('click', () => togglePremiumModal(false));

    // FIXED: Map initialization is moved from here to where it's needed
    fetchAndDisplayChartData('fecal_coliform');
});