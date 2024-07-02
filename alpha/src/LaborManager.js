// src/LaborManager.js
import React, { useEffect, useState, useRef } from 'react';
import { Table, Input, Button, Space, Popconfirm, message, Drawer, Form, Typography, Divider } from 'antd';
import axios from 'axios';
import { SearchOutlined, EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import LaborForm from './LaborForm';

const { Title, Text } = Typography;

const LaborManager = () => {
  const [laborRecords, setLaborRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [searchedColumn, setSearchedColumn] = useState('');
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedLabor, setSelectedLabor] = useState(null);
  const [form] = Form.useForm();
  const searchInputRef = useRef(null);

  useEffect(() => {
    fetchLaborRecords();
  }, []);

  const fetchLaborRecords = async () => {
    setLoading(true);
    try {
      const response = await axios.get('https://localhost:7115/api/labor');
      setLaborRecords(response.data);
    } catch (error) {
      console.error('There was an error fetching the labor records!', error);
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
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex);
  };

  const handleReset = (clearFilters) => {
    clearFilters();
    setSearchText('');
  };

  const handleDelete = async (laborId) => {
    try {
      await axios.delete(`https://localhost:7115/api/labor/${laborId}`);
      message.success('Labor record deleted successfully');
      fetchLaborRecords(); // Refresh the labor records list
    } catch (error) {
      console.error('There was an error deleting the labor record!', error);
      message.error('Failed to delete labor record');
    }
  };

  const handleEdit = (labor) => {
    setIsEditing(true);
    setSelectedLabor(labor);
    form.setFieldsValue(labor);
    setDrawerVisible(true);
  };

  const handleAdd = () => {
    setIsEditing(false);
    setSelectedLabor(null);
    form.resetFields();
    setDrawerVisible(true);
  };

  const handleDrawerClose = () => {
    setDrawerVisible(false);
  };

  const handleFormSubmit = async (values) => {
    try {
      if (isEditing && selectedLabor) {
        await axios.put(`https://localhost:7115/api/labor/${selectedLabor.laborId}`, {
          ...values,
          laborId: selectedLabor.laborId,
        });
        message.success('Labor record updated successfully');
      } else {
        await axios.post('https://localhost:7115/api/labor', values);
        message.success('Labor record added successfully');
      }
      setDrawerVisible(false);
      fetchLaborRecords();
    } catch (error) {
      console.error('There was an error saving the labor record!', error);
      message.error('Failed to save labor record');
    }
  };

  const columns = [
    {
      title: 'Labor Type',
      dataIndex: 'laborType',
      key: 'laborType',
      ...getColumnSearchProps('laborType'),
    },
    {
      title: 'Hourly Rate',
      dataIndex: 'hourlyRate',
      key: 'hourlyRate',
      render: (text) => `$${text.toFixed(2)}`,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      responsive: ['md'],
      ...getColumnSearchProps('description'),
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
            title="Are you sure you want to delete this labor record?"
            onConfirm={() => handleDelete(record.laborId)}
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
      <Title level={2}>Labor Management</Title>
      <Text>
        Use this page to manage the Labor. You can add, edit, and delete labor roles to be used in Modules.
      </Text>
      <Divider />
      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={handleAdd}
        style={{ marginBottom: 16 }}
      >
        Create Labor
      </Button>
      <Table
        dataSource={laborRecords}
        columns={columns}
        rowKey="laborId"
        loading={loading}
      />
      <Drawer
        title={isEditing ? 'Edit Labor' : 'Add Labor'}
        width={400}
        onClose={handleDrawerClose}
        open={drawerVisible}
      >
        <LaborForm
          form={form}
          onSubmit={handleFormSubmit}
          onCancel={handleDrawerClose}
          isEditing={isEditing}
        />
      </Drawer>
    </div>
  );
};

export default LaborManager;
