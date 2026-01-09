const express = require('express');
const router = express.Router();
const mongoDB = require('../config/mongodb');
const { authenticateToken } = require('../middleware/auth');

// Save health metrics to MongoDB (for graph data)
router.post('/save-metrics-mongo', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { metrics } = req.body;

        if (!Array.isArray(metrics) || metrics.length === 0) {
            return res.status(400).json({ error: 'Metrics array is required' });
        }

        const HealthMetric = mongoDB.getHealthMetricsModel();

        // Transform and save metrics
        const mongoMetrics = metrics.map(metric => ({
            user_id: userId,
            timestamp: metric.timestamp || new Date(),
            data_type: metric.data_type,
            value: metric.value,
            unit: metric.unit || getUnitForDataType(metric.data_type),
            metadata: {
                device_id: metric.device_id || 'unknown',
                source: metric.source || 'ble_device'
            }
        }));

        const result = await HealthMetric.insertMany(mongoMetrics);

        // Trigger graph data calculation
        await calculateGraphData(userId);

        res.json({
            success: true,
            message: 'Metrics saved to MongoDB',
            count: result.length,
            metrics: result.map(r => ({
                id: r._id,
                data_type: r.data_type,
                value: r.value,
                timestamp: r.timestamp
            }))
        });

    } catch (error) {
        console.error('Error saving metrics to MongoDB:', error);
        res.status(500).json({ error: 'Failed to save metrics to MongoDB' });
    }
});

// Get graph data for specific graph type
router.get('/graph-data/:graphType', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { graphType } = req.params;
        const { days = 7, refresh = false } = req.query;

        const GraphData = mongoDB.getGraphsModel();

        // If not forced refresh, try to get cached data
        if (refresh !== 'true') {
            const cachedData = await GraphData.findOne({
                user_id: userId,
                graph_type: graphType,
                'period.end_date': { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
            }).sort({ calculated_at: -1 });

            if (cachedData) {
                return res.json({
                    success: true,
                    data: cachedData.data,
                    cached: true,
                    calculated_at: cachedData.calculated_at
                });
            }
        }

        // Calculate fresh data
        const graphData = await calculateSpecificGraph(userId, graphType, parseInt(days));

        // Cache the result
        const newGraphData = new GraphData({
            user_id: userId,
            graph_type: graphType,
            period: {
                start_date: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
                end_date: new Date()
            },
            data: graphData
        });

        await newGraphData.save();

        res.json({
            success: true,
            data: graphData,
            cached: false,
            calculated_at: newGraphData.calculated_at
        });

    } catch (error) {
        console.error('Error fetching graph data:', error);
        res.status(500).json({ error: 'Failed to fetch graph data' });
    }
});

// Get all graph types data
router.get('/all-graphs', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const graphTypes = ['weekly_calories', 'yearly_distance', 'hourly_steps'];

        const GraphData = mongoDB.getGraphsModel();
        const allGraphs = {};

        for (const graphType of graphTypes) {
            const graphData = await GraphData.findOne({
                user_id: userId,
                graph_type: graphType,
                'period.end_date': { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
            }).sort({ calculated_at: -1 });

            if (!graphData) {
                // Calculate if not cached
                allGraphs[graphType] = await calculateSpecificGraph(userId, graphType, 7);
            } else {
                allGraphs[graphType] = graphData.data;
            }
        }

        res.json({
            success: true,
            graphs: allGraphs
        });

    } catch (error) {
        console.error('Error fetching all graphs:', error);
        res.status(500).json({ error: 'Failed to fetch graphs' });
    }
});

// Get raw metrics for chart
router.get('/metrics/:dataType', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { dataType } = req.params;
        const { startDate, endDate, limit = 100 } = req.query;

        const HealthMetric = mongoDB.getHealthMetricsModel();

        const query = {
            user_id: userId,
            data_type: dataType
        };

        if (startDate || endDate) {
            query.timestamp = {};
            if (startDate) query.timestamp.$gte = new Date(startDate);
            if (endDate) query.timestamp.$lte = new Date(endDate);
        }

        const metrics = await HealthMetric
            .find(query)
            .sort({ timestamp: -1 })
            .limit(parseInt(limit))
            .select('timestamp value unit metadata');

        // Transform for chart
        const chartData = metrics.map(m => ({
            x: m.timestamp,
            y: m.value,
            unit: m.unit
        }));

        res.json({
            success: true,
            data_type: dataType,
            data: chartData,
            count: metrics.length
        });

    } catch (error) {
        console.error('Error fetching metrics:', error);
        res.status(500).json({ error: 'Failed to fetch metrics' });
    }
});

// Helper functions
function getUnitForDataType(dataType) {
    const units = {
        'heart_rate': 'bpm',
        'steps': 'count',
        'calories': 'kcal',
        'sleep': 'hours',
        'blood_pressure': 'mmHg',
        'temperature': '°C',
        'oxygen': '%'
    };
    return units[dataType] || 'unit';
}

async function calculateGraphData(userId) {
    try {
        const graphTypes = ['weekly_calories', 'yearly_distance', 'hourly_steps'];

        for (const graphType of graphTypes) {
            await calculateSpecificGraph(userId, graphType);
        }
    } catch (error) {
        console.error('Error calculating graph data:', error);
    }
}

async function calculateSpecificGraph(userId, graphType, days = 7) {
    const HealthMetric = mongoDB.getHealthMetricsModel();
    const now = new Date();

    switch (graphType) {
        case 'weekly_calories':
            return await calculateWeeklyCalories(userId, HealthMetric, now, days);
        case 'yearly_distance':
            return await calculateYearlyDistance(userId, HealthMetric, now);
        case 'hourly_steps':
            return await calculateHourlySteps(userId, HealthMetric, now, days);
        default:
            throw new Error(`Unknown graph type: ${graphType}`);
    }
}

async function calculateWeeklyCalories(userId, HealthMetric, now, days) {
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    const metrics = await HealthMetric.aggregate([
        {
            $match: {
                user_id: userId,
                data_type: 'calories',
                timestamp: { $gte: startDate }
            }
        },
        {
            $group: {
                _id: {
                    $dateToString: { format: "%Y-%m-%d", date: "$timestamp" }
                },
                total_calories: { $sum: "$value" },
                avg_calories: { $avg: "$value" }
            }
        },
        { $sort: { "_id": 1 } }
    ]);

    // Get day labels (F, S, S, M, T, W, T)
    const daysOfWeek = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const labels = [];
    const values = [];

    for (let i = 0; i < 7; i++) {
        const date = new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split('T')[0];
        const dayMetric = metrics.find(m => m._id === dateStr);

        labels.push(daysOfWeek[date.getDay()]);
        values.push(dayMetric ? Math.round(dayMetric.avg_calories) : 0);
    }

    // Calculate weekly average
    const weeklyAvg = values.length > 0
        ? values.reduce((a, b) => a + b, 0) / values.length
        : 0;

    return {
        labels,
        values,
        averages: {
            weekly: parseFloat(weeklyAvg.toFixed(1))
        },
        reference_lines: [
            {
                label: 'Weekly Average',
                value: weeklyAvg,
                color: '#FF5722'
            }
        ]
    };
}

async function calculateYearlyDistance(userId, HealthMetric, now) {
    const currentYear = now.getFullYear();
    const lastYear = currentYear - 1;

    const [currentYearData, lastYearData] = await Promise.all([
        HealthMetric.aggregate([
            {
                $match: {
                    user_id: userId,
                    data_type: 'steps',
                    timestamp: {
                        $gte: new Date(`${currentYear}-01-01`),
                        $lte: new Date(`${currentYear}-12-31`)
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    avg_daily_steps: { $avg: "$value" },
                    count: { $sum: 1 }
                }
            }
        ]),
        HealthMetric.aggregate([
            {
                $match: {
                    user_id: userId,
                    data_type: 'steps',
                    timestamp: {
                        $gte: new Date(`${lastYear}-01-01`),
                        $lte: new Date(`${lastYear}-12-31`)
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    avg_daily_steps: { $avg: "$value" },
                    count: { $sum: 1 }
                }
            }
        ])
    ]);

    // Convert steps to km (assuming 1300 steps = 1 km)
    const currentYearAvg = currentYearData[0]
        ? (currentYearData[0].avg_daily_steps / 1300).toFixed(1)
        : 1.3;
    const lastYearAvg = lastYearData[0]
        ? (lastYearData[0].avg_daily_steps / 1300).toFixed(1)
        : 1.7;

    return {
        labels: [`${currentYear} average`, `${lastYear} average`],
        values: [parseFloat(currentYearAvg), parseFloat(lastYearAvg)],
        comparisons: {
            previous_period: parseFloat(lastYearAvg),
            percentage_change: calculatePercentageChange(parseFloat(currentYearAvg), parseFloat(lastYearAvg))
        }
    };
}

async function calculateHourlySteps(userId, HealthMetric, now, days) {
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    const [todaySteps, historicalSteps] = await Promise.all([
        HealthMetric.find({
            user_id: userId,
            data_type: 'steps',
            timestamp: {
                $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
                $lte: now
            }
        }).sort({ timestamp: 1 }),
        HealthMetric.aggregate([
            {
                $match: {
                    user_id: userId,
                    data_type: 'steps',
                    timestamp: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: { $hour: "$timestamp" },
                    avg_steps: { $avg: "$value" }
                }
            },
            { $sort: { "_id": 1 } }
        ])
    ]);

    // Prepare hourly data (0-23)
    const hourlyLabels = Array.from({ length: 24 }, (_, i) => `${i}:00`);
    const todayData = Array(24).fill(0);
    const avgData = Array(24).fill(0);

    // Fill today's data
    todaySteps.forEach(metric => {
        const hour = metric.timestamp.getHours();
        todayData[hour] += metric.value;
    });

    // Fill average data
    historicalSteps.forEach(data => {
        const hour = data._id;
        avgData[hour] = Math.round(data.avg_steps);
    });

    // Current hour's steps
    const currentHour = now.getHours();
    const currentSteps = todayData.slice(0, currentHour + 1).reduce((a, b) => a + b, 0);

    return {
        labels: hourlyLabels,
        datasets: [
            {
                label: 'Today',
                values: todayData,
                color: '#2196F3'
            },
            {
                label: 'Average',
                values: avgData,
                color: '#FF9800'
            }
        ],
        current_value: {
            hour: currentHour,
            steps: currentSteps
        },
        reference_lines: []
    };
}

function calculatePercentageChange(current, previous) {
    if (previous === 0) return 100;
    return parseFloat(((current - previous) / previous * 100).toFixed(1));
}

module.exports = router;