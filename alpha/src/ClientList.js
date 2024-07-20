// src/ClientTable.js
import React, { useEffect, useState, useRef } from 'react';
import { Table, Button, Popconfirm, message, Typography, Divider, Input, Space, Avatar } from 'antd';
import { EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import axios from 'axios';
import ClientForm from './ClientForm';

const { Title, Text } = Typography;

const ClientList = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const response = await axios.get('https://localhost:7115/api/clients');
      setClients(response.data);
    } catch (error) {
      console.error("There was an error fetching the clients!", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (client) => {
    setSelectedClient(client);
    setDrawerVisible(true);
  };

  const handleDelete = async (clientId) => {
    setLoading(true);
    try {
      await axios.delete(`https://localhost:7115/api/clients/${clientId}`);
      message.success('Client deleted successfully');
      fetchClients(); // Refresh the list after deletion
    } catch (error) {
      console.error("There was an error deleting the client!", error);
      message.error('Failed to delete client');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    fetchClients(); // Refresh the list after save
  };

  const getColumnSearchProps = (dataIndex) => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
      <div style={{ padding: 8 }}>
        <Input
          ref={searchInputRef}
          placeholder={`Search ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
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
    filterIcon: (filtered) => <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />,
    onFilter: (value, record) => record[dataIndex].toString().toLowerCase().includes(value.toLowerCase()),
    onFilterDropdownVisibleChange: (visible) => {
      if (visible) {
        setTimeout(() => searchInputRef.current?.select(), 100);
      }
    },
  });

  const handleSearch = (selectedKeys, confirm, dataIndex) => {
    confirm();
  };

  const handleReset = (clearFilters) => {
    clearFilters();
    fetchClients(); // Reset to fetch all clients
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'clientName',
      key: 'clientName',
      ...getColumnSearchProps('clientName'),
      render: (text) => <><Avatar>{text[0]}</Avatar><Text strong style={{paddingLeft:8}}>{text}</Text></>,
    },
    {
      title: 'Contact Info',
      dataIndex: 'contactInfo',
      key: 'contactInfo',
      responsive: ['md'], // Hide on small screens
      ...getColumnSearchProps('contactInfo'),
    },
    {
      title: 'Address',
      dataIndex: 'address',
      key: 'address',
    },
    {
      title: 'Last Modified',
      dataIndex: 'lastModified',
      key: 'lastModified',
      responsive: ['md'], // Hide on small screens
      render: (text) => new Date(text).toLocaleString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (text, record) => (
        <>
          <Button type="primary" icon={<EditOutlined />} onClick={() => handleEdit(record)} style={{ marginRight: 8 }} />
          <Popconfirm
            title="Are you sure you want to delete this client?"
            onConfirm={() => handleDelete(record.clientId)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="danger" icon={<DeleteOutlined />} />
          </Popconfirm>
        </>
      ),
    },
  ];

  return (
    <>
      <Title level={2}>Client Management</Title>
      <Text>
        Use this page to manage the Clients. You can add, edit, and delete clients.
      </Text>
      <Divider />
      <Button type="primary" onClick={() => handleEdit(null)} style={{ marginBottom: 16 }}>
        Create Client
      </Button>
      <Table
        dataSource={clients}
        columns={columns}
        rowKey="clientId"
        loading={loading}
      />
      <ClientForm
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        client={selectedClient}
        onSave={handleSave}
      />
    </>
  );
};

export default ClientList;
