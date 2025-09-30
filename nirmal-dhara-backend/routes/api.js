const express = require('express');
const router = express.Router();
const WaterData = require('../models/waterData');

// This function is now updated to simulate ALL metrics, including Rainfall and Temperature
const simulatePrediction = (baselineData) => {
    const predictions = [];
    
    for (let i = 1; i <= 3; i++) {
        const randomness = (Math.random() - 0.5); 
        const predictedValues = {
            level: parseFloat((baselineData.water_level + randomness * (i * 1.5)).toFixed(1)),
            fecal: parseFloat((baselineData.fecal_coliform + (Math.random() - 0.4) * (i * 250)).toFixed(0)),
            nitrate: parseFloat((baselineData.nitrate + randomness * (i * 2.0)).toFixed(1)),
            flow: parseFloat((baselineData.flow + randomness * (i * 150)).toFixed(0)),
            bod: parseFloat((baselineData.bod + (Math.random() - 0.4) * (i * 1.5)).toFixed(1)),
            // FIXED: Added simulation for rainfall and temperature
            rainfall: parseFloat(Math.max(0, baselineData.rainfall + (Math.random() - 0.6) * (i * 5)).toFixed(1)),
            temperature: parseFloat((baselineData.temperature + randomness * (i * 0.5)).toFixed(1))
        };
        
        const triggeredAlerts = [];
        if (predictedValues.bod > 8.0) triggeredAlerts.push({ metric: 'bod', type: 'danger', text: `High BOD (${predictedValues.bod} mg/L): Severe organic pollution.` });
        if (predictedValues.fecal > 1000) triggeredAlerts.push({ metric: 'fecal_coliform', type: 'danger', text: `Very High Fecal Coliform (${predictedValues.fecal} MPN): Unsafe for bathing.` });
        if (predictedValues.level < 65) triggeredAlerts.push({ metric: 'level', type: 'warning', text: `Low Water Level (${predictedValues.level} M): Monitor flow.` });
        if (predictedValues.fecal > 500 && predictedValues.fecal <= 1000) triggeredAlerts.push({ metric: 'fecal_coliform', type: 'warning', text: `Elevated Fecal Coliform (${predictedValues.fecal} MPN).` });
        if (predictedValues.nitrate > 10.0) triggeredAlerts.push({ metric: 'nitrate', type: 'danger', text: `High Nitrate (${predictedValues.nitrate} mg/L): Risk of contamination.` });
        if (predictedValues.bod > 5.0 && predictedValues.bod <= 8.0) triggeredAlerts.push({ metric: 'bod', type: 'warning', text: `Moderate BOD (${predictedValues.bod} mg/L): Requires monitoring.` });
        
        const date = new Date();
        date.setDate(date.getDate() + i);

        predictions.push({
            date: date.toISOString().split('T')[0],
            predictedValues: predictedValues,
            triggeredAlerts: triggeredAlerts
        });
    }
    return predictions;
};

router.get('/user-analysis-data', async (req, res) => {
    try {
        let baselineData = await WaterData.findOne({ location: 'Varanasi' });
        if (!baselineData) {
            baselineData = new WaterData({ location: 'Varanasi' });
            await baselineData.save();
        }

        const responseData = {};
        const metrics = ['fecal_coliform', 'flow', 'nitrate', 'rainfall', 'temperature', 'level', 'bod'];
        const titles = {
            fecal_coliform: 'Fecal Coliform Analysis (MPN/100ml)', 
            flow: 'Ganga Flow Analysis (m³/s)',
            nitrate: 'Nitrate Presence Analysis (mg/L)', 
            rainfall: 'Rainfall Analysis (mm)',
            temperature: 'Water Temperature Analysis (°C)', 
            level: 'Water Level Analysis (Meters)',
            bod: 'Biochemical Oxygen Demand (mg/L)'
        };
        
        const predictions = simulatePrediction(baselineData);

        for (const metric of metrics) {
            const dataKey = metric === 'level' ? 'water_level' : metric;
            
            const historicalData = Array.from({ length: 10 }, () => 
                baselineData[dataKey] * (1 + (Math.random() - 0.5) * 0.2)
            ).map(val => parseFloat(val.toFixed(1)));

            responseData[metric] = {
                title: titles[metric],
                chartData: {
                    bar: { 
                        labels: Array.from({ length: 10 }, (_, i) => `Day ${i - 9}`),
                        label: titles[metric].split('(')[1].replace(')',''), 
                        data: historicalData 
                    },
                    pie: { 
                        labels: ['Safe', 'Warning', 'Danger'], 
                        data: [Math.random() * 5 + 5, Math.random() * 3 + 1, Math.random() * 2] 
                    }
                },
                predictions: predictions
            }
        }
        res.json(responseData);
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ msg: 'Server Error' });
    }
});

router.get('/expert-analysis-data', (req, res) => {
    res.redirect('/api/user-analysis-data');
});

module.exports = router;