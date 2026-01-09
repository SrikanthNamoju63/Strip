const mongoose = require('mongoose');
require('dotenv').config();

class MongoDB {
    constructor() {
        this.connected = false;
        this.healthMetricsModel = null;
        this.graphsModel = null;
    }

    async connect() {
        try {
            // MongoDB connection string
            const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/health_monitor';

            console.log(`Connecting to MongoDB at: ${mongoURI}`);

            // Remove deprecated options for newer MongoDB driver
            const options = {
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
                connectTimeoutMS: 10000,
            };

            await mongoose.connect(mongoURI, options);

            this.connected = true;
            console.log('MongoDB connected successfully');

            // Initialize schemas
            this.initializeSchemas();

        } catch (error) {
            console.error('MongoDB connection error:', error.message);
            throw error;
        }
    }

    initializeSchemas() {
        // Health Metrics Schema for time-series data
        const healthMetricsSchema = new mongoose.Schema({
            user_id: { type: Number, required: true, index: true },
            timestamp: { type: Date, required: true, index: true },
            data_type: {
                type: String,
                required: true,
                enum: ['heart_rate', 'steps', 'calories', 'sleep', 'blood_pressure', 'temperature', 'oxygen']
            },
            value: { type: Number, required: true },
            unit: { type: String, required: true },
            metadata: {
                device_id: String,
                source: { type: String, default: 'ble_device' }
            }
        }, {
            timeseries: {
                timeField: 'timestamp',
                metaField: 'user_id',
                granularity: 'hours'
            },
            timestamps: true
        });

        // Graphs Schema for storing pre-calculated graph data
        const graphsSchema = new mongoose.Schema({
            user_id: { type: Number, required: true, index: true },
            graph_type: {
                type: String,
                required: true,
                enum: ['weekly_calories', 'yearly_distance', 'hourly_steps', 'vertical_bar', 'horizontal_bar', 'line_chart']
            },
            period: {
                start_date: { type: Date, required: true },
                end_date: { type: Date, required: true }
            },
            data: {
                labels: [String],
                values: [Number],
                averages: {
                    weekly: Number,
                    monthly: Number,
                    yearly: Number
                },
                comparisons: {
                    previous_period: Number,
                    percentage_change: Number
                },
                reference_lines: [{
                    label: String,
                    value: Number,
                    color: String
                }]
            },
            calculated_at: { type: Date, default: Date.now },
            expires_at: { type: Date, index: true, expires: 86400 } // Auto-delete after 24 hours
        }, {
            timestamps: true
        });

        // Create compound indexes for better query performance
        healthMetricsSchema.index({ user_id: 1, data_type: 1, timestamp: -1 });
        graphsSchema.index({ user_id: 1, graph_type: 1, 'period.end_date': -1 });

        // Create models
        this.healthMetricsModel = mongoose.model('HealthMetric', healthMetricsSchema);
        this.graphsModel = mongoose.model('GraphData', graphsSchema);

        console.log('MongoDB schemas initialized');
    }

    async isConnected() {
        try {
            await mongoose.connection.db.admin().ping();
            return true;
        } catch (error) {
            return false;
        }
    }

    async disconnect() {
        if (this.connected) {
            await mongoose.disconnect();
            this.connected = false;
            console.log('MongoDB disconnected');
        }
    }

    // Get MongoDB models
    getHealthMetricsModel() {
        if (!this.healthMetricsModel) {
            throw new Error('MongoDB not initialized. Call connect() first.');
        }
        return this.healthMetricsModel;
    }

    getGraphsModel() {
        if (!this.graphsModel) {
            throw new Error('MongoDB not initialized. Call connect() first.');
        }
        return this.graphsModel;
    }
}

module.exports = new MongoDB();