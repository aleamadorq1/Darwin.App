// src/DistributionCenterManager.js
import React, { useEffect, useState, useRef } from 'react';
import { Table, Input, Button, Space, Popconfirm, message, Drawer, Form, Typography, Divider } from 'antd';
import axios from 'axios';
import { SearchOutlined, EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import DistributionCenterForm from './DistributionCenterForm';

const { Title, Text } = Typography;

const DistributionCenterManager = () => {
  const [distributionCenters, setDistributionCenters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCenter, setSelectedCenter] = useState(null);
  const [form] = Form.useForm();
  const searchInputRef = useRef(null);

  useEffect(() => {
    fetchDistributionCenters();
  }, []);

  const fetchDistributionCenters = async () => {
    setLoading(true);
    try {
      const response = await axios.get('https://localhost:7115/api/distributioncenters');
      setDistributionCenters(response.data);
    } catch (error) {
      console.error('There was an error fetching the distribution centers!', error);
    } finally {
      setLoading(false);
    }
  };

  const getColumnSearchProps = (dataIndex) => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
      <div style={{ padding: 8 }}>
        <Input
          ref={searchInputRef}
          placeholder={`Search ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
          style={{ marginBottom: 8, display: 'block' }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => handleSearch(selectedKeys, confirm, dataIndex)}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90 }}
          >
            Search
          </Button>
          <Button onClick={() => handleReset(clearFilters)} size="small" style={{ width: 90 }}>
            Reset
          </Button>
        </Space>
      </div>
    ),
    filterIcon: filtered => <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />,
    onFilter: (value, record) =>
      record[dataIndex]
        ? record[dataIndex].toString().toLowerCase().includes(value.toLowerCase())
        : '',
    onFilterDropdownOpenChange: visible => {
      if (visible) {
        setTimeout(() => searchInputRef.current.select(), 100);
      }
    },
  });

  const handleSearch = (selectedKeys, confirm, dataIndex) => {
    confirm();
  };

  const handleReset = (clearFilters) => {
    clearFilters();
  };

  const handleDelete = async (centerId) => {
    try {
      await axios.delete(`https://localhost:7115/api/distributioncenters/${centerId}`);
      message.success('Distribution center deleted successfully');
      fetchDistributionCenters();
    } catch (error) {
      console.error('There was an error deleting the distribution center!', error);
      message.error('Failed to delete distribution center');
    }
  };

  const handleEdit = (center) => {
    console.log('Editing center:', center); // Debugging log
    setIsEditing(true);
    setSelectedCenter(center);
    form.setFieldsValue(center);
    setDrawerVisible(true);
  };

  const handleAdd = () => {
    setIsEditing(false);
    setSelectedCenter(null);
    form.resetFields();
    setDrawerVisible(true);
  };

  const handleDrawerClose = () => {
    setDrawerVisible(false);
  };

  const handleFormSubmit = async (values) => {
    try {
      if (isEditing && selectedCenter) {
        await axios.put(`https://localhost:7115/api/distributioncenters/${selectedCenter.distributionCenterId}`, {
          ...values,
          distributionCenterId: selectedCenter.distributionCenterId,
        });
        message.success('Distribution center updated successfully');
      } else {
        await axios.post('https://localhost:7115/api/distributioncenters', values);
        message.success('Distribution center added successfully');
      }
      setDrawerVisible(false);
      fetchDistributionCenters();
    } catch (error) {
      console.error('There was an error saving the distribution center!', error);
      message.error('Failed to save distribution center');
    }
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      ...getColumnSearchProps('name'),
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
      ...getColumnSearchProps('location'),
    },
    {
      title: 'Address',
      dataIndex: 'locationAddress',
      key: 'locationAddress',
      responsive: ['md'],
      ...getColumnSearchProps('locationAddress'),
    },
    {
      title: 'Last Modified',
      dataIndex: 'lastModified',
      key: 'lastModified',
      responsive: ['md'],
      render: (text) => new Date(text).toLocaleString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (text, record) => (
        <Space size="middle">
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Popconfirm
            title="Are you sure you want to delete this distribution center?"
            onConfirm={() => handleDelete(record.distributionCenterId)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="link" icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={2}>Distribution Centers Management</Title>
      <Text>
        Use this page to manage the distribution centers. You can add, edit, and delete distribution centers.
      </Text>
      <Divider />
      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={handleAdd}
        style={{ marginBottom: 16 }}
      >
        Create Distribution Center
      </Button>
      <Table
        dataSource={distributionCenters}
        columns={columns}
        rowKey="distributionCenterId"
        loading={loading}
      />
      <Drawer
        title={isEditing ? 'Edit Distribution Center' : 'Add Distribution Center'}
        width={400}
        onClose={handleDrawerClose}
        open={drawerVisible}
      >
        <DistributionCenterForm
          form={form}
          onSubmit={handleFormSubmit}
          onCancel={handleDrawerClose}
          isEditing={isEditing}
          selectedCenter={selectedCenter}
        />
      </Drawer>
    </div>
  );
};

export default DistributionCenterManager;
