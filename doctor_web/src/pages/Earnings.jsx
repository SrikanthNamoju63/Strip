import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Statistic, Row, Col, Typography, Spin, Alert, Descriptions } from 'antd';
import { DollarOutlined, ClockCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { getDoctorSettlements } from '../services/api';
import useRealTime from '../hooks/useRealTime';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const { Title } = Typography;

const Earnings = () => {
    const { user } = useAuth();

    if (user?.role === 'RECEPTIONIST' || user?.role === 'NURSE') {
        return <Navigate to="/" replace />;
    }

    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalSettled: 0,
        pendingAmount: 0,
        totalCommissionDeducted: 0
    });
    const [settlements, setSettlements] = useState([]);
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

    const fetchEarnings = async (page = 1) => {
        try {
            setLoading(true);
            const response = await getDoctorSettlements(page);

            if (response.success) {
                // Backend returns { settlements, totals, pagination }
                setStats({
                    totalSettled: response.data.totals?.totalSettled || 0,
                    pendingAmount: response.data.totals?.pendingSettlement || 0,
                    totalCommissionDeducted: 0 // Not currently tracked in doctor model summary, maybe calculate or ignore
                });
                setSettlements(response.data.settlements);
                setPagination({
                    ...pagination,
                    current: response.data.pagination.currentPage,
                    total: response.data.pagination.totalSettlements
                });
            }
        } catch (error) {
            console.error('Error fetching earnings:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEarnings();
    }, []);

    // Real-time: auto-refresh earnings when payment/appointment updates arrive
    useRealTime({
        events: ['payment_update', 'appointment_update'],
        refetch: () => fetchEarnings(pagination.current),
    });

    const columns = [
        {
            title: 'Date',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (text) => new Date(text).toLocaleDateString(),
        },
        {
            title: 'Period',
            key: 'period',
            render: (_, record) => (
                <span>
                    {new Date(record.settlementPeriod.startDate).toLocaleDateString()} -
                    {new Date(record.settlementPeriod.endDate).toLocaleDateString()}
                </span>
            )
        },
        {
            title: 'Amount',
            dataIndex: 'netAmount',
            key: 'netAmount',
            render: (amount) => `₹${amount.toFixed(2)}`,
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => {
                let color = 'geekblue';
                if (status === 'COMPLETED') color = 'green';
                if (status === 'PENDING') color = 'gold';
                if (status === 'FAILED') color = 'red';
                return <Tag color={color}>{status}</Tag>;
            },
        },
        {
            title: 'Transaction ID',
            dataIndex: 'transactionId',
            key: 'transactionId',
            render: (text) => text || '-',
        },
    ];

    return (
        <div style={{ padding: '24px' }}>
            <Title level={2}>Earnings & Settlements</Title>

            <Row gutter={16} style={{ marginBottom: '24px' }}>
                <Col span={8}>
                    <Card>
                        <Statistic
                            title="Total Settled"
                            value={stats.totalSettled}
                            precision={2}
                            prefix={<DollarOutlined />}
                            suffix="INR"
                            valueStyle={{ color: '#3f8600' }}
                        />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card>
                        <Statistic
                            title="Pending Settlement"
                            value={stats.pendingAmount}
                            precision={2}
                            prefix={<ClockCircleOutlined />}
                            suffix="INR"
                            valueStyle={{ color: '#faad14' }}
                        />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card>
                        <Statistic
                            title="Commission Deducted"
                            value={stats.totalCommissionDeducted}
                            precision={2}
                            prefix={<DollarOutlined />}
                            suffix="INR"
                        />
                    </Card>
                </Col>
            </Row>

            <Card title="Settlement History">
                <Table
                    dataSource={settlements}
                    columns={columns}
                    rowKey="_id"
                    loading={loading}
                    pagination={{
                        ...pagination,
                        onChange: (page) => fetchEarnings(page)
                    }}
                />
            </Card>
        </div>
    );
};

export default Earnings;
